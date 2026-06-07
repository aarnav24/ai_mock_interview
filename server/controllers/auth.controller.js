import { AuthService } from "../services/AuthService.js"

export const googleAuth = async (req, res) => {
    try {
        const { idToken } = req.body
        if (!idToken) {
            return res.status(400).json({ message: "Firebase ID token is required" })
        }

        const { name, email } = await AuthService.verifyFirebaseToken(idToken)
        const user = await AuthService.findOrCreateUser({ name, email })
        await AuthService.generateTokenCookie(res, user._id)

        return res.status(200).json(user)
    } catch (error) {
        if (error.code?.startsWith("auth/")) {
            return res.status(401).json({ message: "Invalid or expired Google token" })
        }
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
