import "dotenv/config"
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import expressWs from "express-ws"
import connectDB from "./config/connectDB.js"
import authRouter from "./routes/auth.route.js"
import userRouter from "./routes/user.route.js"
import interviewRouter from "./routes/interview.route.js"
import paymentRouter from "./routes/payment.route.js"
import { handleDeepgramWebSocket } from "./controllers/deepgram.controller.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import swaggerUi from "swagger-ui-express"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const swaggerDocument = JSON.parse(fs.readFileSync(path.join(__dirname, "./swagger.json"), "utf8"))

const app = express()
expressWs(app)

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map(o => o.trim())
    : ["http://localhost:5173"]

app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }))

app.ws("/api/deepgram/live", handleDeepgramWebSocket)

app.use("/api/auth",      authRouter)
app.use("/api/user",      userRouter)
app.use("/api/interview", interviewRouter)
app.use("/api/payment",   paymentRouter)

// Serve interactive Swagger documentation dashboard
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Fallback 404 handler for API routes
app.use((req, res) => {
    res.status(404).json({ message: "API endpoint not found" })
})

const PORT = process.env.PORT || 8000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    connectDB()
})
