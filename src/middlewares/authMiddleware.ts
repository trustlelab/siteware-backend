import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Define the secret key. This should be stored securely, such as in environment variables.
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

// Extend the Request interface to include the `user` property
interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Attach the decoded user to the request
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;
