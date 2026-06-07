import express from "express"
import isLoggedIn from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.js"
import { aiLimiter } from "../middlewares/rateLimiter.js"
import {
    analyzeResume,
    generateQuestions,
    submitAnswer,
    generateFollowUp,
    finishInterview,
    getMyInterviews,
    getInterviewReport,
    getProgress
} from "../controllers/interview.controller.js"

const interviewRouter = express.Router()

interviewRouter.post("/resume",             isLoggedIn, upload.single("resume"), analyzeResume)
interviewRouter.post("/generate-questions", isLoggedIn, aiLimiter, generateQuestions)
interviewRouter.post("/submit-answer",      isLoggedIn, aiLimiter, submitAnswer)
interviewRouter.post("/follow-up",          isLoggedIn, aiLimiter, generateFollowUp)
interviewRouter.post("/finish",             isLoggedIn, finishInterview)
interviewRouter.get("/get-interviews",      isLoggedIn, getMyInterviews)
interviewRouter.get("/progress",            isLoggedIn, getProgress)
interviewRouter.get("/report/:id",          isLoggedIn, getInterviewReport)

export default interviewRouter
