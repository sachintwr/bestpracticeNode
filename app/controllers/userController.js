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

}

export default new UserController();