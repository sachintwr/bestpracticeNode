import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import { body, validationResult } from 'express-validator';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
});

const userAgentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each User-Agent to 100 requests per windowMs
    keyGenerator: (req) => req.headers['user-agent'],
    message: 'Too many requests from this User-Agent, please try again later.',
});

const secureCookies = (req, res, next) => {
    res.cookie('session', '1', { httpOnly: true, secure: false, sameSite: 'strict' });
    next();
};

const dataSanitization = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 5 }).trim().escape(),
];

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
};

export {
    limiter,
    userAgentLimiter,
    cookieParser,
    hpp,
    secureCookies,
    dataSanitization,
    errorHandler,
};
