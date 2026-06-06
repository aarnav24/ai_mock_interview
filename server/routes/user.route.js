import express from "express"
import isLoggedIn from "../middlewares/auth.middleware.js"
import { getCurrentUser } from "../controllers/user.controller.js"

const userRouter = express.Router()

userRouter.get("/current-user", isLoggedIn, getCurrentUser)

export default userRouter