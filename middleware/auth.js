import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: 'No token provided. Please login first.' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            error: 'Invalid or expired token' 
        });
    }
};

// Alias for verifyToken
export const authenticate = verifyToken;

// Middleware to check if user is admin
export const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: 'No token provided. Please login first.' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Access denied. Admin privileges required.' 
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            error: 'Invalid or expired token' 
        });
    }
};
