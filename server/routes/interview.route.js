import express from "express"
import isLoggedIn from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.js"
import { analyzeResume, finishInterview, generateQuestions, getInterviewReport, getMyInterviews, submitAnswer } from "../controllers/interview.controller.js"

const interviewRouter = express.Router()

interviewRouter.post("/resume", isLoggedIn, upload.single("resume"), analyzeResume)
interviewRouter.post("/generate-questions", isLoggedIn, generateQuestions)
interviewRouter.post("/submit-answer", isLoggedIn, submitAnswer)
interviewRouter.post("/finish", isLoggedIn, finishInterview)
interviewRouter.get("/get-interviews", isLoggedIn, getMyInterviews)
interviewRouter.get("/report/:id", isLoggedIn, getInterviewReport)

export default interviewRouter