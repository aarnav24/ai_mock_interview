import rateLimit from "express-rate-limit"

const createLimiter = (windowMinutes, max, message) =>
    rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message }
    })

export const aiLimiter = createLimiter(
    15, 20,
    "Too many requests. Please wait 15 minutes before trying again."
)

export const authLimiter = createLimiter(
    15, 20,
    "Too many auth attempts. Please wait 15 minutes."
)
