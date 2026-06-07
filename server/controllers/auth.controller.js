import { AuthService } from "../services/AuthService.js"

export const googleAuth = async (req, res) => {
    try {
        const { name, email } = req.body
        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required" })
        }

        const user = await AuthService.findOrCreateUser({ name, email })
        await AuthService.generateTokenCookie(res, user._id)

        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ message: `Google auth error: ${error.message}` })
    }
}

export const logOut = async (req, res) => {
    try {
        AuthService.clearTokenCookie(res)
        return res.status(200).json({ message: "Logged out successfully" })
    } catch (error) {
        return res.status(500).json({ message: `Logout error: ${error.message}` })
    }
}
