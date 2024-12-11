import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { secretKey } from '../middlewares/authenticate'; // Ensure correct path

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 3,
        maxlength: 50
    },
    username: {
        type: String,
        minlength: 3,
        maxlength: 50,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        maxlength: 50,
        unique: true
    },
    password: {
        type: String,
        minlength: 6,
        default: ''
    },
    phoneNumbers: {
        type: Object,
        default: {}
    },
    profilePicture: {
        type: String,
        default: ""
    },
    customProfilePicture: {
        type: Object,
        default: {},
    },
    coverPicture: {
        type: String,
        default: ""
    },
    appBranding: {
        type: Boolean,
        default: true
    },
    brandLogos: {
        type: Array,
        default: []
    },
    contacts: {
        type: Array,
        default: []
    },
    people: {
        type: Object,
        default: {}
    },
    calendarConnections: {
        type: Object,
        default: {}
    },
    billing: {
        type: Object,
        default: {}
    },
    events: {
        type: Array,
        default: []
    },
    refreshTokens: {
        type: Object,
        default: {}
    },
    integrated: {
        type: Object,
        default: {}
    },
    userSchedules: {
        required: true,
        type: Object,
        default: {
            "Working Hours": {
                "identifier": "68af7ff0-5c80-40ac-8ce0-a9c8bab90b5a",
                "default": true,
                "inUse": true,
                "dateOverrides": {},
                "timezone": {
                    "label": "Asia/Kolkata",
                    "value": {
                        "aliasOf": null,
                        "countries": ['IN'],
                        "dstOffset": 330,
                        "dstOffsetStr": "+05:30",
                        "name": "Asia/Kolkata",
                        "utcOffset": 330,
                        "utcOffsetStr": "+05:30"
                    }
                },
                "days": {
                    "sunday": { "active": false, "times": [] },
                    "monday": { "active": true, "times": ["9:00am-5:00pm"] },
                    "tuesday": { "active": true, "times": ["9:00am-5:00pm"] },
                    "wednesday": { "active": true, "times": ["9:00am-5:00pm"] },
                    "thursday": { "active": true, "times": ["9:00am-5:00pm"] },
                    "friday": { "active": true, "times": ["9:00am-5:00pm"] },
                    "saturday": { "active": false, "times": [] },
                }
            }
        }
    },
    meetings: {
        type: Array,
        default: []
    },
    settings: {
        type: Object,
        default: {
            "welcome": "Welcome to my scheduling page. Please follow the instructions to add an event to my calendar.",
            "email": "",
            "timeFormat": {
                "label": "12 Hours AM/PM",
                "value": "12 Hours"
            },
            "country": {
                "value": "IN",
                "label": "India"
            },
            "selectedTimezone": {
                "label": "Asia/Kolkata",
                "value": {
                    "aliasOf": null,
                    "countries": ['IN'],
                    "dstOffset": 330,
                    "dstOffsetStr": "+05:30",
                    "name": "Asia/Kolkata",
                    "utcOffset": 330,
                    "utcOffsetStr": "+05:30"
                }
            }
        }
    },
    accountSetup: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

UserSchema.methods = {
    /**
     * Authenticate - check if the passwords are the same
     * @public
     * @param {String} password
     * @return {Boolean} passwords match
     */
    async authenticate(password) {
        return bcrypt.compare(password, this.password);
    },

    /**
     * Generates a JSON Web token used for route authentication
     * @public
     * @return {String} signed JSON web token
     */
    generateToken() {
        const payload = {
            _id: this._id,
            email: this.email,
            userLogin: true,
            loginTime: Date.now()
        };

        const options = {
            algorithm: 'HS256',
            expiresIn: '1d' // Token expires in 1 day
        };
        console.log("secrete key genrating===>", secretKey);
        return jwt.sign(payload, secretKey, options);
    },

    /**
     * Create password hash
     * @private
     * @param {String} password
     * @param {Number} saltRounds
     * @param {Function} callback
     * @return {Boolean} passwords match
     */
    _hashPassword(password, saltRounds = 10, callback) {
        return bcrypt.hash(password, saltRounds, callback);
    },
};

const User = mongoose.model('User', UserSchema);
export default User;
