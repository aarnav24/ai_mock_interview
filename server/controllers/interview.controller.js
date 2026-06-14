import { InterviewService } from "../services/InterviewService.js"

const sendError = (res, error) => {
    const status = error?.status || 500
    const message = error?.message || "Internal server error"
    return res.status(status).json({ message })
}

export const getLastResume = async (req, res) => {
    try {
        const result = await InterviewService.getLastResume(req.userId)
        return res.json(result)
    } catch (error) {
        return sendError(res, error)
    }
}

export const getAllResumes = async (req, res) => {
    try {
        const result = await InterviewService.getAllResumes(req.userId)
        return res.json(result)
    } catch (error) {
        return sendError(res, error)
    }
}

export const analyzeResume = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Resume file is required" })
        const result = await InterviewService.analyzeResume(req.file, req.userId)
        return res.json(result)
    } catch (error) {
        return sendError(res, error)
    }
}

export const generateQuestions = async (req, res) => {
    try {
        const { role, experience, mode, resumeText, projects, skills, count } = req.body

        if (!role?.trim() || !experience?.trim() || !mode?.trim()) {
            return res.status(400).json({ message: "Role, experience, and mode are required" })
        }

        const result = await InterviewService.generateQuestions(req.userId, {
            role, experience, mode, resumeText, projects, skills, count
        })

        return res.json(result)
    } catch (error) {
        return sendError(res, error)
    }
}

export const submitAnswer = async (req, res) => {
    try {
        const { interviewId, questionIndex, answer, timeTaken } = req.body
        const result = await InterviewService.submitAnswer(req.userId, {
            interviewId, questionIndex, answer, timeTaken
        })
        return res.json(result)
    } catch (error) {
        return sendError(res, error)
    }
}

export const generateFollowUp = async (req, res) => {
    try {
        const { interviewId, questionIndex, answer, score, trigger } = req.body
        const result = await InterviewService.generateFollowUp({
            interviewId, questionIndex, answer, score, trigger
        })
        return res.json(result)
    } catch (error) {
        return sendError(res, error)
    }
}

export const finishInterview = async (req, res) => {
    try {
        const { interviewId } = req.body
        const result = await InterviewService.finishInterview(interviewId)
        return res.json(result)
    } catch (error) {
        return sendError(res, error)
    }
}

export const resumeInterview = async (req, res) => {
    try {
        const result = await InterviewService.resumeInterview(req.params.id, req.userId)
        return res.json(result)
    } catch (error) {
        return sendError(res, error)
    }
}

export const shareReport = async (req, res) => {
    try {
        const result = await InterviewService.makePublic(req.params.id, req.userId)
        return res.json(result)
    } catch (error) {
        return sendError(res, error)
    }
}

export const getPublicReport = async (req, res) => {
    try {
        const report = await InterviewService.getPublicReport(req.params.id)
        return res.json(report)
    } catch (error) {
        return sendError(res, error)
    }
}

export const getMyInterviews = async (req, res) => {
    try {
        const interviews = await InterviewService.getMyInterviews(req.userId)
        return res.json(interviews)
    } catch (error) {
        return sendError(res, error)
    }
}

export const getInterviewReport = async (req, res) => {
    try {
        const report = await InterviewService.getInterviewReport(req.params.id)
        return res.json(report)
    } catch (error) {
        return sendError(res, error)
    }
}

export const getProgress = async (req, res) => {
    try {
        const { role, mode } = req.query
        const progress = await InterviewService.getProgress(req.userId, { role, mode })
        return res.json(progress)
    } catch (error) {
        return sendError(res, error)
    }
}
