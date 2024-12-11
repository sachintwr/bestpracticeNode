import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const secretKey = crypto.randomBytes(16).toString('hex');

const authenticate = async (req, res, next) => {

  console.log("im here in authentication=====>", req.headers.authorization);
  // console.log("im here in authentication=====>function res===>", res);
  let authorization;
  console.log("secretKey:===> while authentication===>", secretKey);

  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    console.log("im here with bearer");
    authorization = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    authorization = req.query.token;
  }

  console.log("authorization ===>", authorization);

  if (!authorization || authorization === "undefined") {
    return res.status(401).json({ error: 'Token not provided' });
  }

  const decoder = jwt.decode(authorization, { complete: true });
  console.log("decoder====>", decoder);

  jwt.verify(authorization, secretKey, { algorithms: ['HS256'] }, async (err, decoded) => {
    if (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired' });
      }
      if (err instanceof jwt.JsonWebTokenError) {
        console.log("JsonWebTokenError====>", err);
        return res.status(402).json({ error: 'Invalid token' });
      }
      console.error("Error verifying token:", err.message);
      return res.status(403).json({ error: 'Token verification failed' });
    }

    try {
      console.log("decoded token: ===> ", decoded);

      req.currentUser = decoded;
      next();
    } catch (err) {
      console.log("error while authentication", err);
      res.status(500).json({ error: 'Internal server error' });
      next(err);
    }
  });
};




export { authenticate, secretKey };
