import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./config/connectDB.js"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.route.js"
import userRouter from "./routes/user.route.js"
import interviewRouter from "./routes/interview.route.js"
// import deepgramRouter from "./routes/deepgram.route.js"
import expressWs from "express-ws"         
import paymentRouter from "./routes/payment.route.js"
dotenv.config()

const app = express()
expressWs(app)                         

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/interview", interviewRouter)  
// app.use("/api/deepgram", deepgramRouter)
app.use("/api/payment", paymentRouter)

const PORT = process.env.PORT

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
    connectDB()
})
