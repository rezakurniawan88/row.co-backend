import jwt from "jsonwebtoken";

export const authMiddleware = (roles) => async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(403).json({ message: "Forbidden" });

    try {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if(err) return res.status(401).json({ message: err });
            if(roles.includes(decoded.role)) {
                req.email = decoded.email;
                next();
            } else {
                res.status(403).json({ message: "Forbidden" });
            }
        });
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}