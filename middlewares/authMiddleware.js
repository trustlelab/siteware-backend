const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key';

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;  // Attach decoded user to the request
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;
