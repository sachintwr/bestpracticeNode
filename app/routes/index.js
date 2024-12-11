import AuthRoutes from './auth.routes'
import UserRoutes from './user.routes'
import MainIdRoutes from './mainId.routes'
import { authenticate } from '../middlewares/authenticate';
import { Router } from 'express';

const routes = new Router();

routes.get('/', (req, res) => {
    res.send('Hello, secure world!');
});

// Authentication
routes.use('/auth', AuthRoutes);
routes.use('/users', UserRoutes);
routes.use('/mainIds', MainIdRoutes);



routes.get("/getCookieUser", authenticate, (req, res) => {
    const user = req.currentUser;
    //console.log('reqest cookies====> in get cookies==>', user)
    res.status(200).send(user);
});



export default routes;
