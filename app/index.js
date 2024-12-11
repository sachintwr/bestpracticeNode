// app/index.js
import routes from './routes';
import controllers from './controllers/authController';
import * as middlewares from './middlewares';
import * as config from './config';

export {
    routes,
    controllers,
    middlewares,
    config,
};
