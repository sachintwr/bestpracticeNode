import BaseController from './base.controller';
import User from '../models/User';
import MainIds from '../models/MainIds';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser'
require('dotenv').config();
//import AdminUser from '../models/adminUser';
//import LogsController from './logs.controller';
//import randomize from 'randomatic';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000'
)

const checkUsernameAvailable = async (username, email) => {
    try {
        const idData = await MainIds.findOne({ username });
        if (idData && idData.email !== email) {
            return { status: 201, message: "username exist" };
        }

        const restrictedUsernames = [
            "individuals", "enterprise", "pricing", "support", "solutions", "about",
            "termsandconditions", "privacypolicy", "refundandcancellation", "zoomintegration",
            "webexdocs", "calendar", "login", "integration", "edit", "success", "editing",
            "education", "banking", "transport", "aerospace-and-defence", "consumer-goods",
            "healthcare-industry", "insurance", "retail", "science-pharma", "capital-markets",
            "media-services", "public-sector", "natural-resources", "professional-services",
            "engineering-constructions", "oil-and-gas", "industrial-manufacture", "utilities",
            "network-edge-provider", "consumer-electronics", "platform-and-software",
            "semiconductors", "non-profit", "telecommunication", "automotive", "thank-you"
        ];

        const isRestricted = restrictedUsernames.includes(username);
        if (isRestricted) {
            return { status: 201, message: "username is restricted" };
        }

        return { status: 200, message: "available" };
    } catch (error) {
        return { status: 500, message: "Server error." };
    }
};


const sendSubscriptionMail = (fullName, email, image) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_PASSWORD
        }
    });

    const html = `<center>
      <img src="https://${process.env.domainName}/ScheduleAILogo.png" style="max-width: 120px;padding-bottom: 20px;filter:drop-shadow(0 0 10px skyblue)" alt="Schedule AI">
      <div style="padding:10px;box-sizing:border-box;max-width: 600px;width:100%;font-size:16px;">
      <hr style="width: 100%;height:1px;border:none;background-image: linear-gradient(to left,transparent,chocolate,transparent);" />
      <p style="color: black;text-align: left;width: 100%;text-transform:capitalize;">Hello there,</p>
      <p style="color: black;text-align: left;width: 100%;">Schedule AI just got subscribed by a new user.</p>
      <h4 style="color:black;text-align: left;width: 100%;margin-bottom: 0;">Subscribed By:</h4>
      <p style="color:black; text-align: left;width: 100%;margin-top: 10px;border-left:2px solid silver;padding-left:30px;box-sizing:border-box;">
      <span>Name: ${fullName}</span><br>
      <span>Email: ${email}</span></p></center>`;

    const mailOptions = {
        from: 'Schedule AI <developer@scheduleai.co>',
        to: 'developer@scheduleai.co, info@scheduleai.co',
        subject: `${fullName} Just Subscribed Schedule AI.`,
        html: html
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error(error);
        } else {
            console.log(info.response);
        }
    });
};

class AuthController extends BaseController {
    whitelist = [
        'name',
        'phoneNumbers',
        'username',
        'email',
        'password',
        'profilePicture',
        'calendarConnections'
    ];


    Googlelogin = async (req, res, nex) => {
        try {
            const code = req.body.code;

            const { tokens } = await oauth2Client.getToken(code);

            const id_token = tokens.id_token;
            const verified = await oauth2Client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const email = verified.payload.email;
            const image = verified.payload.picture;
            const fullName = verified.payload.name;

            let user = await User.findOne({ email });

            if (!user) {
                let username = email.split("@")[0].split(".").join("-");
                const existingAccount = await MainIds.findOne({ email });

                let usernameAvailable = await checkUsernameAvailable(username, email);
                if (usernameAvailable.status !== 200) {
                    for (let attempt = 0; attempt < 5; attempt++) {
                        username = `${username}${Math.floor(Math.random() * 1000)}`;
                        usernameAvailable = await checkUsernameAvailable(username, email);
                        if (usernameAvailable.status === 200) break;
                    }
                }

                if (usernameAvailable.status !== 200) {
                    res.status(400).json({ error: "Unable to find a unique username." });
                    return;
                }

                // const password = await bcrypt.hash("SayMynameAgain123!@#", 10);
                const password = await bcrypt.hash("123456", 10);

                if (existingAccount) {
                    username = existingAccount.username;
                    user = new User({
                        username,
                        name: fullName,
                        email,
                        password,
                        profilePicture: image,
                        calendarConnections: {
                            [email]: {
                                refreshToken: tokens.refresh_token,
                                accessToken: tokens.access_token,
                                idToken: tokens.id_token,
                                expiryDate: tokens.expiry_date,
                                email,
                                image,
                                accountType: verified.payload.iss,
                                active: true
                            }
                        }
                    });
                } else {
                    const newMainId = new MainIds({ username, email, profilePicture: image });
                    await newMainId.save();

                    user = new User({
                        username,
                        name: fullName,
                        email,
                        password,
                        profilePicture: image,
                        calendarConnections: {
                            [email]: {
                                refreshToken: tokens.refresh_token,
                                accessToken: tokens.access_token,
                                idToken: tokens.id_token,
                                expiryDate: tokens.expiry_date,
                                email,
                                image,
                                accountType: verified.payload.iss,
                                active: true
                            }
                        }
                    });
                }

                await user.save();
                sendSubscriptionMail(fullName, email, image);
            }

            const accessToken = user.generateToken();



            res.status(200).json({
                accessToken: accessToken,
                "type": "success",
                "message": "Logged in Successfully.",
                "email": user.email
            });


        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
    // checkCredentials = async (req, res, next) => {
    //     try {
    //         let isAvailable = false;
    //         const idData = await MainIds.findOne({ username: req.body.username });
    //         if (idData) {
    //             if (idData.email === req.body.email) {
    //                 isAvailable = true;
    //             }
    //         } else {
    //             isAvailable = true;
    //         }

    //         const restrictedUsernames = [
    //             "individuals",
    //             "enterprise",
    //             "pricing",
    //             "support",
    //             "solutions",
    //             "about",
    //             "termsandconditions",
    //             "privacypolicy",
    //             "refundandcancellation",
    //             "zoomintegration",
    //             "webexdocs",
    //             "calendar",
    //             "login",
    //             "integration",
    //             "edit",
    //             "success",
    //             "editing",
    //             "education",
    //             "banking",
    //             "transport",
    //             "aerospace-and-defence",
    //             "consumer-goods",
    //             "healthcare-industry",
    //             "insurance",
    //             "retail",
    //             "science-pharma",
    //             "capital-markets",
    //             "media-services",
    //             "public-sector",
    //             "natural-resources",
    //             "professional-services",
    //             "engineering-constructions",
    //             "oil-and-gas",
    //             "industrial-manufacture",
    //             "utilities",
    //             "network-edge-provider",
    //             "consumer-electronics",
    //             "platform-and-software",
    //             "semiconductors",
    //             "non-profit",
    //             "telecommunication",
    //             "automotive",
    //             "thank-you",

    //         ];

    //         var isRestricted = restrictedUsernames.includes(req.body.username);
    //         if (isAvailable === false || isRestricted) {
    //             res.status(201).json("username exist")
    //         }
    //         else {
    //             res.status(200).json("available")
    //         }
    //     } catch (error) {
    //         res.status(201).json("Server error.");
    //     }
    // }

    login = async (req, res, next) => {

        const { userEmail, password } = req.body;
        // console.log("im here user", userEmail);
        console.log("im here pass=====>", password);

        try {
            let user;
            if (userEmail.includes("@")) {
                user = await User.findOne({ email: userEmail }).exec();
            } else {
                console.log("im here user===>", userEmail);
                user = await User.findOne({ username: userEmail }).exec();
            }

            if (!user) {
                return res.status(400).json({
                    type: "warning",
                    message: "Given email/username doesn't belong to any account."
                });
            }

            const isMatch = await user.authenticate(password);
            console.log("user===>", isMatch);
            if (!isMatch) {
                return res.status(401).json({
                    type: "danger",
                    message: "Wrong password. Please try again."
                });
            }

            const accessToken = user.generateToken();

            res.cookie('jwtToken', accessToken, {
                httpOnly: true, // This helps prevent XSS attacks
                secure: process.env.NODE_ENV === 'production', // Set to true if using HTTPS
                sameSite: 'strict', // Helps prevent CSRF attacks
            });

            res.status(200).json({
                accessToken: accessToken,
                type: "success",
                message: "Logged in Successfully.",
                email: user.email
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ type: "error", message: "Internal Server Error." });
            next(err);
        }
    };



    register = async (req, res, next) => {
        const filter = req.body;

        if (!filter.type) {
            filter.type = 'user';
        }

        if (!filter.password) {
            filter.password = "123456"
        }
        const refToken = randomize('Aa0', 10); // referral token
        filter.referralToken = refToken;

        const existingUser = await User.findOne({ 'mobile': req.body.mobile });

        if (existingUser) {
            const err = new Error('Mobile number already exist.');
            err.status = 401;
            return next(err);
        } else {
            const params = this.filterParams(filter, this.whitelist);
            let newUser = new User({
                ...params,
                password: filter.password,
                provider: 'local'
            });
            const user = await newUser.save();
            const accessToken = user.generateToken();
            const isSuccess = true;
            try {
                //res.status(201).json(await newUser.save());
                return res.status(200).json({
                    accessToken,
                    isSuccess,
                    user,
                });
            } catch (err) {
                if (err)
                    err.status = 400;
                next(err);
            }
        }
    }



    otpLogin = async (req, res, next) => {
        const {
            email
        } = req.body;

        try {
            const user = await User.findOne({
                email: email,
            }).populate({
                path: 'roles',
                populate: {
                    path: 'permissions',
                },
            }).exec();

            if (!user) {
                // LogsController.write({
                //     eventName: 'LOGIN',
                //     ip: LogsController.extractIp(req),
                //     message: `failed login attempt for ${mobile}`,
                //     level: 3,
                // });

                const err = new Error('Please verify your credentials.');
                err.status = 401;
                return next(err);
            }

            if (user.isBlocked) {
                const err = new Error('The IDS has detected an abnormality with your access and has blocked it as a precaution. Please contact the Helpdesk.');
                err.status = 403;
                return next(err);
            }

            const accessToken = user.generateToken();
            // LogsController.write({
            //     eventName: 'LOGIN',
            //     ip: LogsController.extractIp(req),
            //     message: `Successful login attempt for ${mobile}`,
            //     level: 3,
            //     user: user._id,
            // });
            console.log('Log in Successful')
            const isSuccess = true;
            return res.status(200).json({
                isSuccess,
                accessToken,
                user,
            });

        } catch (err) {
            console.log(err);
            next(err);
        }
    }

    changePassword = async (req, res, next) => {
        const {
            mobile,
            password,
        } = req.body;

        try {
            const user = await User.findOne({
                mobile: mobile,
            }).populate({
                path: 'roles',
                populate: {
                    path: 'permissions',
                },
            }).exec();

            if (!user) {
                const err = new Error('Please verify your credentials.');
                err.status = 401;
                return next(err);
            }

            if (user.isBlocked) {
                const err = new Error('The IDS has detected an abnormality with your access and has blocked it as a precaution. Please contact the Helpdesk.');
                err.status = 403;
                return next(err);
            }
            let jsonData = {
                "password": password
            }
            let updatedUser = Object.assign(user, jsonData);
            const savedUser = await updatedUser.save();

            return res.status(200).json({
                isSuccess: true
            });

        } catch (err) {
            console.log(err);
            next(err);
        }
    }

    adminLogin = async (req, res, next) => {
        const {
            username,
            password,
        } = req.body;

        try {
            const admin = await AdminUser.findOne({
                username: username,
            }).populate({
                path: 'roles',
                populate: {
                    path: 'permissions',
                },
            }).exec();

            if (!admin || !admin.authenticate(password)) {
                // LogsController.write({
                //     eventName: 'ADMIN LOGIN',
                //     ip: LogsController.extractIp(req),
                //     message: `failed login attempt for ${username}`,
                //     level: 3,
                // });

                const err = new Error('Please verify your credentials.');
                err.status = 401;
                return next(err);
            }

            if (admin.isBlocked) {
                const err = new Error('The IDS has detected an abnormality with your access and has blocked it as a precaution. Please contact the Helpdesk.');
                err.status = 403;
                return next(err);
            }

            const accessToken = admin.generateToken();
            // LogsController.write({
            //     eventName: 'ADMIN LOGIN',
            //     ip: LogsController.extractIp(req),
            //     message: `Successful login attempt for ${username}`,
            //     level: 3,
            //     admin: admin._id,
            // });
            console.log('Admin Log in Successful')
            const isSuccess = true;
            return res.status(200).json({
                isSuccess,
                accessToken,
                admin,
            });

        } catch (err) {
            console.log(err);
            next(err);
        }
    }

    logout = async (req, res, next) => {
        req.logout();
        res.clearCookie('loginUserCalendar');
        res.clearCookie("jwtToken").status(200).send("cookie deleted");
    }
}

export default new AuthController();
