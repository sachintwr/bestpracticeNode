// app/config/index.js
import helmet from 'helmet';
import cors from 'cors';

const helmetConfig = () => helmet();

const corsConfig = () => cors({
    origin: ["https://scheduleaisandobox.in", "http://localhost:3000", "https://scheduleai.co", "https://divssfdc.com", "http://divssfdc.com", "https://www.divssfdc.com", "http://www.divssfdc.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
});

const helmetPolicies = () => [
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'trusted-scripts.com'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    }),
    helmet.hsts({
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
    }),
    helmet.frameguard({ action: 'deny' }),
    helmet.referrerPolicy({ policy: 'no-referrer' }),
    helmet.xssFilter(),
    helmet.hidePoweredBy(),
];

export {
    helmetConfig,
    corsConfig,
    helmetPolicies,
};
