import BaseController from './base.controller';
import User from '../models/User';

class UserController extends BaseController {
    whitelist = [
        'name',
        'phoneNumbers',
        'username',
        'email',
        'password',
        'profilePicture',
        'calendarConnections'
    ];

    userdata = async (req, res, next) => {
        try {
            const email = req.currentUser.email
            console.log("email===>", email);
            const user = await User.findOne({ email: email });

            if (user) {
                res.status(200).json(user)

            } else {
                res.status(201).json("user not found")
            }

        } catch (error) {
            console.log("error grtting user data:", error)
            next(error)
        }
    }
     
    handle = (result) => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            // Optional: Add more context to the error
            throw new Error(result.reason || 'Unknown Error');
        }
    }
    
    optimizedCode = async (req, res, next) => {
        try {
            const results = await Promise.allSettled([
                userdata(),
                mainIdData()
            ]);
    
            // Process results separately for `fulfilled` and `rejected`
            const user = this.handle(results[0]); // Handle first promise result
            const mainId = this.handle(results[1]); // Handle second promise result
    
            // Use user and mainId as needed
            res.json({ user, mainId });
        } catch (error) {
            // Handle any errors
            next(error); // Pass error to the next middleware
        }
    }

    optimizedCode2 = async (req, res, next) => {
        const results = await Promise.allSettled([userdata(), mainIdData()]);
    
        const fulfilledResults = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
    
        if (fulfilledResults.length < results.length) {
            console.warn('Some promises were rejected:', results);
        }
    
        res.json({ user: fulfilledResults[0], mainId: fulfilledResults[1] });
    }
    

}

export default new UserController();