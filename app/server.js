require('dotenv').config();
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { routes, middlewares, config } from './index'; // Importing from app/index.js
import connectDB from './db';
import upload from './config/multerConfig'; // Import multer configuration
import initializeSocket from './config/socketConfig'; // Import socket.io configuration

const app = express();

connectDB();
// Basic security configurations
app.use(config.helmetConfig()); // Initialize Helmet
app.use(config.corsConfig()); // Initialize CORS

// Parsing incoming requests
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Middleware configurations
app.use(middlewares.cookieParser());
app.use(middlewares.hpp());
app.use(morgan('dev'));

// Rate limiting
app.use(middlewares.limiter);// by IP
app.use(middlewares.userAgentLimiter);// Rate limiting by User-Agent



// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 3600000, // Adjust this to your needs
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true
    }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());


// Helmet policies configurations
config.helmetPolicies().forEach(policy => app.use(policy)); // Apply Helmet policies

app.use("/images", express.static(path.join(__dirname, "public/images")));



app.post("/upload", upload.single("file"), (req, res) => {
    try {
        return res.status(200).json("file uploaded");
    } catch (err) {
        console.log(err);
    }
});

app.get("/download", (req, res) => {
    // console.log(req.query.path);
    try {
        const filePath = path.join(__dirname, "public/images", path.basename(req.query.path));
        res.download(filePath);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Failed to download file' });
    }
});


// Data sanitization route
app.post('/submit', middlewares.dataSanitization, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    res.send('Data is valid and sanitized');
});

// Basic route
app.use('/', routes);

app.use(express.static("client/deploy/"));
app.use(express.static('public'));

app.get('/meeting/:meetingId', (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`);
});


// Error handling middleware
app.use(middlewares.errorHandler);

const privateKeyPath = "/etc/letsencrypt/live/" + process.env.domainName + "/privkey.pem";
const certificatePath = "/etc/letsencrypt/live/" + process.env.domainName + "/cert.pem";
const caPath = "/etc/letsencrypt/live/" + process.env.domainName + "/chain.pem";

let credentials;
if (fs.existsSync(privateKeyPath) && fs.existsSync(certificatePath) && fs.existsSync(caPath)) {
    const privateKey = fs.readFileSync(privateKeyPath, "utf8");
    const certificate = fs.readFileSync(certificatePath, "utf8");
    const ca = fs.readFileSync(caPath, "utf8");

    credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };
}
const allowedOrigins = [
    "https://scheduleaisandobox.in",
    "http://localhost:3000",
    "https://scheduleai.co",
    "https://divssfdc.com",
    "http://divssfdc.com",
    "https://www.divssfdc.com",
    "http://www.divssfdc.com"
];

const http_server = http.createServer(app);
const https_server = https.createServer(credentials, app);

const PORT = process.env.PORT || 8443; // or any other port you prefer


if (process.env.NODE_ENV === 'production') {
    https_server.listen(PORT, () => console.log(`Server is running on HTTPS on port ${PORT}`));
} else {
    http_server.listen(PORT, () => console.log(`Server is running on HTTP on port ${PORT}`));
}

// Socket IO

initializeSocket(http_server, https_server, allowedOrigins, process.env.NODE_ENV);

