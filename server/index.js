import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser"
import expressWs from "express-ws"
import connectDB from "./config/connectDB.js"
import authRouter from "./routes/auth.route.js"
import userRouter from "./routes/user.route.js"
import interviewRouter from "./routes/interview.route.js"
import paymentRouter from "./routes/payment.route.js"
<<<<<<< HEAD
import { handleDeepgramWebSocket } from "./controllers/deepgram.controller.js"
import expressWs from "express-ws"
=======
import { authLimiter } from "./middlewares/rateLimiter.js"
import { handleDeepgramWebSocket } from "./controllers/deepgram.controller.js"

>>>>>>> 60456f7 (refactor: overhaul report component with collapsible answers and implement backend services for authentication, AI, and interview management)
dotenv.config()

const app = express()
expressWs(app)

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map(o => o.trim())
    : ["http://localhost:5173"]

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use(cookieParser())
<<<<<<< HEAD
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/interview", interviewRouter)
app.ws("/api/deepgram/live", (ws) => handleDeepgramWebSocket(ws))

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})
=======
>>>>>>> 60456f7 (refactor: overhaul report component with collapsible answers and implement backend services for authentication, AI, and interview management)

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }))

app.ws("/api/deepgram/live", handleDeepgramWebSocket)

app.use("/api/auth",      authLimiter, authRouter)
app.use("/api/user",      userRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/payment",   paymentRouter)

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    connectDB()
})
