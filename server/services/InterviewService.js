import { gzip, gunzip } from "zlib"
import { promisify } from "util"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)
import User from "../models/user.model.js"
import Interview from "../models/interview.model.js"
import Resume from "../models/resume.model.js"
import { AIService } from "./AIService.js"

const DIFFICULTY_MAP = ["Easy", "Easy", "Medium", "Medium", "Hard"]
const TIME_LIMIT_MAP = [90, 90, 120, 120, 150]
const CREDITS_PER_QUESTION = 10
const MAX_FOLLOW_UPS_PER_QUESTION = 2

const makeDifficultyMap = (count) => {
    const full = ["Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Hard", "Hard", "Hard", "Hard"]
    if (count <= 5) return DIFFICULTY_MAP.slice(0, count)
    return full.slice(0, count)
}

const makeTimeLimitMap = (count) => {
    if (count <= 5) return TIME_LIMIT_MAP.slice(0, count)
    return Array.from({ length: count }, (_, i) => {
        if (i < Math.floor(count / 3)) return 90
        if (i < count - 2) return 120
        return 150
    })
}

export class InterviewService {

    static async getLastResume(userId) {
        const resume = await Resume.findOne({ userId }).sort({ createdAt: -1 })
        if (!resume) return null
        return {
            resumeId: resume._id,
            originalName: resume.originalName,
            role: resume.role || "",
            experience: resume.experience || "",
            projects: resume.projects || [],
            skills: resume.skills || [],
            resumeText: resume.resumeText || ""
        }
    }

    static async getAllResumes(userId) {
        const resumes = await Resume.find({ userId }).sort({ createdAt: -1 })
        return resumes.map(resume => ({
            resumeId: resume._id,
            originalName: resume.originalName,
            role: resume.role || "",
            experience: resume.experience || "",
            projects: resume.projects || [],
            skills: resume.skills || [],
            resumeText: resume.resumeText || "",
            createdAt: resume.createdAt
        }))
    }

    static async analyzeResume(file, userId) {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(file.buffer) }).promise

        let rawText = ""
        for (let page = 1; page <= pdf.numPages; page++) {
            const content = await (await pdf.getPage(page)).getTextContent()
            rawText += content.items.map(item => item.str).join(" ") + "\n"
        }

        const resumeText = rawText
            .replace(/\s+/g, " ")
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]+/g, " ")
            .trim()

        const aiResponse = await AIService.analyzeResume(resumeText)
        const parsed = JSON.parse(aiResponse)

        // Compress + persist PDF to MongoDB along with parsed content
        const compressed = await gzipAsync(file.buffer)
        const savedResume = await Resume.create({
            userId,
            originalName: file.originalname || "resume.pdf",
            buffer: compressed,
            size: file.size,
            role: parsed.role || "",
            experience: parsed.experience || "",
            projects: parsed.projects || [],
            skills: parsed.skills || [],
            resumeText
        })

        return {
            resumeId: savedResume._id,
            role: parsed.role || "",
            experience: parsed.experience || "",
            projects: parsed.projects || [],
            skills: parsed.skills || [],
            resumeText
        }
    }

    static async generateQuestions(userId, { role, experience, mode, resumeText, projects, skills, count = 5 }) {
        const user = await User.findById(userId)
        if (!user) throw { status: 404, message: "User not found" }

        const questionCount = Math.min(Math.max(count, 2), 10)
        const creditCost = questionCount * CREDITS_PER_QUESTION

        if (user.credits < creditCost) {
            throw { status: 400, message: `Not enough credits. This interview requires ${creditCost} credits.` }
        }

        const resumeSnippet = resumeText?.trim()
            ? resumeText.trim().slice(0, 800)
            : "none"

        const aiResponse = await AIService.generateQuestions({
            role: role.trim(),
            experience: experience.trim(),
            mode: mode.trim(),
            resumeText: resumeSnippet,
            projects: Array.isArray(projects) ? projects.slice(0, 5) : [],
            skills: Array.isArray(skills) ? skills.slice(0, 10) : [],
            count: questionCount
        })

        const questionsArray = aiResponse
            .split("\n")
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .slice(0, questionCount)

        if (questionsArray.length === 0) throw new Error("AI failed to generate questions")

        user.credits -= creditCost
        await user.save()

        const diffMap = makeDifficultyMap(questionCount)
        const timeMap = makeTimeLimitMap(questionCount)

        const interview = await Interview.create({
            userId: user._id,
            role: role.trim(),
            experience: experience.trim(),
            mode: mode.trim(),
            resumeText: resumeText?.trim() || "None",
            questions: questionsArray.map((q, i) => ({
                question: q,
                difficulty: diffMap[i],
                timeLimit: timeMap[i]
            }))
        })

        return {
            interviewId: interview._id,
            creditsLeft: user.credits,
            userName: user.name,
            questions: interview.questions
        }
    }

    static async resumeInterview(interviewId, userId) {
        const interview = await Interview.findOne({ _id: interviewId, userId })
        if (!interview) throw { status: 404, message: "Interview not found" }
        if (interview.status === "Completed") throw { status: 400, message: "Interview already completed" }

        const user = await User.findById(userId)
        const resumeFromIndex = interview.questions.findIndex(q => !q.answer)

        return {
            interviewId: interview._id,
            userName: user?.name || "",
            questions: interview.questions,
            resumeFromIndex: resumeFromIndex === -1 ? 0 : resumeFromIndex
        }
    }

    static async submitAnswer(userId, { interviewId, questionIndex, answer, timeTaken }) {
        const interview = await Interview.findById(interviewId)
        if (!interview) throw { status: 404, message: "Interview not found" }

        const question = interview.questions[questionIndex]

        if (!answer?.trim()) {
            question.answer = ""
            question.score = 0
            question.feedback = "You did not submit an answer."
            await interview.save()
            return { feedback: question.feedback, score: 0, followUpTrigger: null }
        }

        if (timeTaken > question.timeLimit) {
            question.answer = answer
            question.score = 0
            question.feedback = "Time limit exceeded. Answer not evaluated."
            await interview.save()
            return { feedback: question.feedback, score: 0, followUpTrigger: null }
        }

        const priorQA = interview.questions
            .slice(0, questionIndex)
            .filter(q => q.answer)
            .map((q, i) => `q${i + 1}:${q.question}|a:${q.answer}|s:${q.score}`)
            .join("\n")

        const aiResponse = await AIService.evaluateAnswer({
            question: question.question,
            answer: answer.slice(0, 1200),
            priorQA
        })

        const parsed = JSON.parse(aiResponse)

        question.answer = answer
        question.confidence = parsed.confidence
        question.communication = parsed.communication
        question.correctness = parsed.correctness
        question.score = parsed.finalScore
        question.feedback = parsed.feedback

        // Resolve the original parent (followups of followups count against the root parent)
        const effectiveParentIndex = question.isFollowUp
            ? question.parentQuestionIndex
            : questionIndex

        const existingFollowUps = interview.questions.filter(
            q => q.isFollowUp && q.parentQuestionIndex === effectiveParentIndex
        ).length

        const followUpTrigger = existingFollowUps < MAX_FOLLOW_UPS_PER_QUESTION
            ? this.#resolveFollowUpTrigger(parsed)
            : null

        await interview.save()

        return { feedback: parsed.feedback, score: parsed.finalScore, followUpTrigger }
    }

    static async generateFollowUp({ interviewId, questionIndex, answer, score, trigger }) {
        const interview = await Interview.findById(interviewId)
        if (!interview) throw { status: 404, message: "Interview not found" }

        const currentQuestion = interview.questions[questionIndex]

        // If this question is itself a followup, redirect to the root parent
        const rootParentIndex = currentQuestion.isFollowUp
            ? currentQuestion.parentQuestionIndex
            : questionIndex

        const existingFollowUps = interview.questions.filter(
            q => q.isFollowUp && q.parentQuestionIndex === rootParentIndex
        )

        if (existingFollowUps.length >= MAX_FOLLOW_UPS_PER_QUESTION) {
            return { question: null }
        }

        // Always generate followup based on the root parent question for coherence
        const rootQuestion = interview.questions[rootParentIndex]

        // If this is the 2nd follow-up, pass context of the 1st follow-up question and answer
        let priorFollowUp = ""
        if (existingFollowUps.length === 1) {
            const firstFU = existingFollowUps[0]
            priorFollowUp = `q:${firstFU.question}|a:${firstFU.answer || "none"}`
        }

        const lastResume = await Resume.findOne({ userId: interview.userId }).sort({ createdAt: -1 })
        const skills = lastResume?.skills || []

        const followUpText = await AIService.generateFollowUp({
            question: rootQuestion.question,
            answer,
            score,
            trigger,
            role: interview.role,
            experience: interview.experience,
            mode: interview.mode,
            skills,
            priorFollowUp
        })

        const followUpQuestion = {
            question: followUpText.trim(),
            difficulty: trigger === "go_deeper" ? "Hard" : "Easy",
            timeLimit: 90,
            isFollowUp: true,
            parentQuestionIndex: rootParentIndex
        }

        interview.questions.splice(questionIndex + 1, 0, followUpQuestion)
        await interview.save()

        return { question: interview.questions[questionIndex + 1] }
    }

    static async finishInterview(interviewId) {
        const interview = await Interview.findById(interviewId)
        if (!interview) throw { status: 404, message: "Interview not found" }

        const questions = interview.questions
        const totals = questions.reduce(
            (acc, q) => ({
                score: acc.score + (q.score || 0),
                confidence: acc.confidence + (q.confidence || 0),
                communication: acc.communication + (q.communication || 0),
                correctness: acc.correctness + (q.correctness || 0)
            }),
            { score: 0, confidence: 0, communication: 0, correctness: 0 }
        )

        const count = questions.length
        const avg = (v) => count ? Number((v / count).toFixed(1)) : 0

        interview.finalScore = avg(totals.score)
        interview.confidence = avg(totals.confidence)
        interview.communication = avg(totals.communication)
        interview.correctness = avg(totals.correctness)
        interview.status = "Completed"

        const qaContext = questions
            .map((q, i) =>
                `q${i + 1}[${q.difficulty}]:${q.question}|a:${q.answer || "none"}|conf:${q.confidence}|comm:${q.communication}|corr:${q.correctness}|fb:${q.feedback}`
            )
            .join("\n")

        const [summaryText, topicsRaw] = await Promise.all([
            AIService.generateSummary(qaContext).catch(() => ""),
            AIService.classifyTopics(questions).catch(() => "[]")
        ])

        interview.summary = summaryText.trim()

        try {
            const topics = JSON.parse(topicsRaw)
            topics.forEach(({ questionIndex: qi, topic }) => {
                if (interview.questions[qi]) interview.questions[qi].topic = topic
            })
        } catch {}

        let weakTopics = questions
            .filter(q => (q.score || 0) < 8)
            .map(q => ({ topic: q.topic || "General", score: q.score || 0, answer: q.answer || "" }))

        if (weakTopics.length === 0) {
            weakTopics = questions.map(q => ({ topic: q.topic || "General", score: q.score || 0, answer: q.answer || "" }))
        }

        if (weakTopics.length > 0) {
            try {
                const planRaw = await AIService.generateImprovementPlan({
                    role: interview.role,
                    experience: interview.experience,
                    weakTopics
                })
                interview.improvementPlan = JSON.parse(planRaw)
            } catch (err) {
                console.error("Failed to generate AI improvement plan, using fallback:", err)
            }
        }

        if (!interview.improvementPlan || interview.improvementPlan.length === 0) {
            interview.improvementPlan = weakTopics.slice(0, 3).map(wt => ({
                topic: wt.topic,
                suggestions: [
                    `Review and practice foundational concepts in ${wt.topic}.`,
                    `Study advanced design patterns, tradeoffs, and industry best practices related to ${wt.topic}.`
                ]
            }))
        }

        await interview.save()
        await interview.populate("userId", "name")

        return this.#buildReport(interview)
    }

    static async makePublic(interviewId, userId) {
        const interview = await Interview.findOne({ _id: interviewId, userId })
        if (!interview) throw { status: 404, message: "Interview not found" }
        interview.isPublic = true
        await interview.save()
        return { interviewId: interview._id, isPublic: true }
    }

    static async getMyInterviews(userId) {
        return Interview
            .find({ userId })
            .sort({ createdAt: -1 })
            .select("role experience mode finalScore status createdAt")
    }

    static async getInterviewReport(interviewId) {
        const interview = await Interview.findById(interviewId).populate("userId", "name")
        if (!interview) throw { status: 404, message: "Interview not found" }
        return this.#buildReport(interview)
    }

    static async getPublicReport(interviewId) {
        const interview = await Interview.findById(interviewId).populate("userId", "name")
        if (!interview) throw { status: 404, message: "Interview not found" }
        if (!interview.isPublic) throw { status: 403, message: "This report is not public" }
        return this.#buildReport(interview)
    }

    static async getProgress(userId, { role, mode } = {}) {
        const query = { userId, status: "Completed" }
        if (role) query.role = new RegExp(role, "i")
        if (mode) query.mode = mode

        const interviews = await Interview
            .find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .select("role mode finalScore createdAt questions")

        return interviews.map(iv => {
            const qs = iv.questions
            const n = qs.length
            const avgField = (field) =>
                n ? Number((qs.reduce((s, q) => s + (q[field] || 0), 0) / n).toFixed(1)) : 0

            return {
                date: iv.createdAt,
                role: iv.role,
                mode: iv.mode,
                finalScore: iv.finalScore,
                confidence: avgField("confidence"),
                communication: avgField("communication"),
                correctness: avgField("correctness")
            }
        })
    }

    static #buildReport(interview) {
        return {
            interviewId: interview._id,
            candidateName: interview.userId?.name || "",
            role: interview.role,
            experience: interview.experience,
            resumeText: interview.resumeText || "",
            finalScore: interview.finalScore,
            confidence: interview.confidence || 0,
            communication: interview.communication || 0,
            correctness: interview.correctness || 0,
            summary: interview.summary || "",
            improvementPlan: interview.improvementPlan || [],
            questionWiseScore: this.#formatQuestions(interview.questions),
            isPublic: interview.isPublic
        }
    }

    static #resolveFollowUpTrigger(scores) {
        if (scores.finalScore >= 8) return null
        if (scores.correctness < 5) return "probe_weakness"
        return "go_deeper"
    }

    static #formatQuestions(questions) {
        return questions.map(q => ({
            question: q.question,
            answer: q.answer || "",
            topic: q.topic || "",
            score: q.score || 0,
            feedback: q.feedback || "",
            confidence: q.confidence || 0,
            communication: q.communication || 0,
            correctness: q.correctness || 0,
            isFollowUp: q.isFollowUp || false
        }))
    }
}
