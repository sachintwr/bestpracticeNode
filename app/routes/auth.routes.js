import { Router } from 'express';
import AuthController from '../controllers/authController.js'

const routes = new Router();

routes.route('/loginWithReact').post(AuthController.Googlelogin);
routes.route('/getDirectLogin').post(AuthController.login);
routes.route('/logout').post(AuthController.logout);


export default routes;