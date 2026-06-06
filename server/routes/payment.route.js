import express from "express"
import isLoggedIn from "../middlewares/auth.middleware.js"
import { createOrder, verifyPayment } from "../controllers/payment.controller.js"

const paymentRouter = express.Router()


paymentRouter.post("/order", isLoggedIn, createOrder)
paymentRouter.post("/verify", isLoggedIn, verifyPayment)

export default paymentRouter