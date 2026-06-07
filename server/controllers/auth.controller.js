import User from "../models/user.model.js"
import genToken from "../config/token.js"

export class AuthService {

    static async findOrCreateUser({ name, email }) {
        let user = await User.findOne({ email })
        if (!user) {
            user = await User.create({ name, email })
        }
        return user
    }

    static async generateTokenCookie(res, userId) {
        const token = await genToken(userId)
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return token
    }

    static clearTokenCookie(res) {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
        })
    }
}