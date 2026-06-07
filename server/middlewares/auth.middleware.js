import jwt from "jsonwebtoken"

const isLoggedIn = async (req, res, next) => {
    try {
        const { token } = req.cookies
        if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = decoded.userId
        next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please log in again." })
        }
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token" })
        }
        return res.status(500).json({ message: `Authentication error: ${error.message}` })
    }
}

export default isLoggedIn
