import BaseController from './base.controller';
import MainIds from '../models/MainIds';

class MainIdController extends BaseController {
    whitelist = [
        'name',
        'phoneNumbers',
        'username',
        'email',
        'password',
        'profilePicture',
        'calendarConnections'
    ];

    MainIduserdata = async (req, res, next) => {
        try {
            const email = req.currentUser.email
            console.log("main id email==>", email);

            const user = await MainIds.findOne({ email: email });

            if (user) {
                res.status(200).json(user)

            } else {
                res.status(201).json("user not found")
            }

        } catch (error) {
            console.log("error grtting main id user data:", error)
            next(error)
        }
    }

}

export default new MainIdController();