import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import MainIdController from '../controllers/mainIdController.js';

const routes = new Router();

routes.route('/get').get(authenticate, MainIdController.MainIduserdata);




export default routes;