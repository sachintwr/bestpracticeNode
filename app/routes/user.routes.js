import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import UserController from '../controllers/userController.js'

const routes = new Router();

routes.route('/getLoginUserNow').get(authenticate, UserController.userdata);




export default routes;