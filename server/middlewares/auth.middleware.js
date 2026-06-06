import jwt from "jsonwebtoken"

const isLoggedIn = async (req, res, next) => {
    try {
        let { token } = req.cookies
        if (!token) return res.status(401).json({message: "Unauthorized: No token provided"})

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if(!decoded) return res.status(401).json({message: "User does not have a valid token"})

        req.userId = decoded.userId

        next()
    } catch (error) {
        return res.status(500).json({message: `Authentication errpor ${error}`})
    }

}

export default isLoggedIn