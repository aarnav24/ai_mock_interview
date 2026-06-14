import express from "express"
import isLoggedIn from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.js"
import {
    analyzeResume,
    generateQuestions,
    submitAnswer,
    generateFollowUp,
    finishInterview,
    getMyInterviews,
    getInterviewReport,
    getProgress,
    resumeInterview,
    shareReport,
    getPublicReport,
    getLastResume,
    getAllResumes
} from "../controllers/interview.controller.js"

const interviewRouter = express.Router()

interviewRouter.get("/last-resume",          isLoggedIn, getLastResume)
interviewRouter.get("/all-resumes",           isLoggedIn, getAllResumes)
interviewRouter.post("/resume",             isLoggedIn, upload.single("resume"), analyzeResume)
interviewRouter.post("/generate-questions", isLoggedIn, generateQuestions)
interviewRouter.post("/submit-answer",      isLoggedIn, submitAnswer)
interviewRouter.post("/follow-up",          isLoggedIn, generateFollowUp)
interviewRouter.post("/finish",             isLoggedIn, finishInterview)
interviewRouter.post("/share/:id",          isLoggedIn, shareReport)
interviewRouter.get("/get-interviews",      isLoggedIn, getMyInterviews)
interviewRouter.get("/progress",            isLoggedIn, getProgress)
interviewRouter.get("/resume/:id",          isLoggedIn, resumeInterview)
interviewRouter.get("/report/:id",          isLoggedIn, getInterviewReport)
interviewRouter.get("/public/:id",          getPublicReport)

export default interviewRouter
