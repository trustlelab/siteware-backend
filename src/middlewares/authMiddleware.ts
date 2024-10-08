import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ status: 0, message: 'No token provided.' });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(403).json({ status: 0, message: 'Failed to authenticate token.' });
        }
        req.userId = (decoded as { userId: number }).userId; // Adjust according to your JWT payload structure
        next();
    });
};
