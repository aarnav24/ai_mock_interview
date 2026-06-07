import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"
import User from "../models/user.model.js"
import Interview from "../models/interview.model.js"
import { AIService } from "./AIService.js"

const DIFFICULTY_MAP = ["Easy", "Easy", "Medium", "Medium", "Hard"]
const TIME_LIMIT_MAP = [90, 90, 120, 120, 150]
const CREDITS_PER_INTERVIEW = 50

export class InterviewService {

    static async analyzeResume(file) {
        const filepath = file.path
        try {
            const fileBuffer = await fs.promises.readFile(filepath)
            const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) }).promise

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

            return {
                role: parsed.role || "",
                experience: parsed.experience || "",
                projects: parsed.projects || [],
                skills: parsed.skills || [],
                resumeText
            }
        } finally {
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
        }
    }

    static async generateQuestions(userId, { role, experience, mode, resumeText, projects, skills }) {
        const user = await User.findById(userId)
        if (!user) throw { status: 404, message: "User not found" }

        if (user.credits < CREDITS_PER_INTERVIEW) {
            throw { status: 400, message: `Not enough credits. Minimum ${CREDITS_PER_INTERVIEW} required` }
        }

        const aiResponse = await AIService.generateQuestions({
            role: role.trim(),
            experience: experience.trim(),
            mode: mode.trim(),
            resumeText: resumeText?.trim() || "None",
            projects: Array.isArray(projects) ? projects : [],
            skills: Array.isArray(skills) ? skills : []
        })

        const questionsArray = aiResponse
            .split("\n")
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .slice(0, 5)

        if (questionsArray.length === 0) throw new Error("AI failed to generate questions")

        user.credits -= CREDITS_PER_INTERVIEW
        await user.save()

        const interview = await Interview.create({
            userId: user._id,
            role: role.trim(),
            experience: experience.trim(),
            mode: mode.trim(),
            resumeText: resumeText?.trim() || "None",
            questions: questionsArray.map((q, i) => ({
                question: q,
                difficulty: DIFFICULTY_MAP[i],
                timeLimit: TIME_LIMIT_MAP[i]
            }))
        })

        return {
            interviewId: interview._id,
            creditsLeft: user.credits,
            userName: user.name,
            questions: interview.questions
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
            return { feedback: question.feedback, followUpTrigger: null }
        }

        if (timeTaken > question.timeLimit) {
            question.answer = answer
            question.score = 0
            question.feedback = "Time limit exceeded. Answer not evaluated."
            await interview.save()
            return { feedback: question.feedback, followUpTrigger: null }
        }

        const priorQA = interview.questions
            .slice(0, questionIndex)
            .filter(q => q.answer)
            .map((q, i) => `Q${i + 1}: ${q.question}\nAnswer: ${q.answer}\nScore: ${q.score}/10`)
            .join("\n\n")

        const aiResponse = await AIService.evaluateAnswer({
            question: question.question,
            answer,
            priorQA
        })

        const parsed = JSON.parse(aiResponse)

        question.answer = answer
        question.confidence = parsed.confidence
        question.communication = parsed.communication
        question.correctness = parsed.correctness
        question.score = parsed.finalScore
        question.feedback = parsed.feedback

        const followUpTrigger = this.#resolveFollowUpTrigger(parsed)

        await interview.save()

        return { feedback: parsed.feedback, followUpTrigger }
    }

    static async generateFollowUp({ interviewId, questionIndex, answer, score, trigger }) {
        const interview = await Interview.findById(interviewId)
        if (!interview) throw { status: 404, message: "Interview not found" }

        const parentQuestion = interview.questions[questionIndex]

        const followUpText = await AIService.generateFollowUp({
            question: parentQuestion.question,
            answer,
            score,
            trigger
        })

        const followUpQuestion = {
            question: followUpText.trim(),
            difficulty: trigger === "go_deeper" ? "Hard" : "Easy",
            timeLimit: 90,
            isFollowUp: true,
            parentQuestionIndex: questionIndex
        }

        interview.questions.splice(questionIndex + 1, 0, followUpQuestion)
        await interview.save()

        return { followUpQuestion: interview.questions[questionIndex + 1] }
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
        interview.status = "Completed"

        const qaContext = questions
            .map((q, i) =>
                `Q${i + 1} [${q.difficulty}]: ${q.question}\nAnswer: ${q.answer || "Not answered"}\nConfidence: ${q.confidence}, Communication: ${q.communication}, Correctness: ${q.correctness}\nFeedback: ${q.feedback}`
            )
            .join("\n\n")

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

        const weakTopics = questions
            .filter(q => (q.score || 0) < 5 && q.topic)
            .map(q => ({ topic: q.topic, score: q.score || 0, answer: q.answer || "" }))

        if (weakTopics.length > 0) {
            try {
                const planRaw = await AIService.generateImprovementPlan({
                    role: interview.role,
                    experience: interview.experience,
                    weakTopics
                })
                interview.improvementPlan = JSON.parse(planRaw)
            } catch {}
        }

        await interview.save()

        return {
            finalScore: avg(totals.score),
            confidence: avg(totals.confidence),
            communication: avg(totals.communication),
            correctness: avg(totals.correctness),
            summary: interview.summary,
            improvementPlan: interview.improvementPlan || [],
            questionWiseScore: this.#formatQuestions(questions)
        }
    }

    static async getMyInterviews(userId) {
        return Interview
            .find({ userId })
            .sort({ createdAt: -1 })
            .select("role experience mode finalScore status createdAt")
    }

    static async getInterviewReport(interviewId) {
        const interview = await Interview.findById(interviewId)
        if (!interview) throw { status: 404, message: "Interview not found" }

        const questions = interview.questions
        const count = questions.length

        const totals = questions.reduce(
            (acc, q) => ({
                confidence: acc.confidence + (q.confidence || 0),
                communication: acc.communication + (q.communication || 0),
                correctness: acc.correctness + (q.correctness || 0)
            }),
            { confidence: 0, communication: 0, correctness: 0 }
        )

        const avg = (v) => count ? Number((v / count).toFixed(1)) : 0

        return {
            finalScore: interview.finalScore,
            confidence: avg(totals.confidence),
            communication: avg(totals.communication),
            correctness: avg(totals.correctness),
            summary: interview.summary || "",
            improvementPlan: interview.improvementPlan || [],
            questionWiseScore: this.#formatQuestions(questions)
        }
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

    static #resolveFollowUpTrigger(scores) {
        if (scores.correctness < 5) return "probe_weakness"
        if (scores.correctness >= 8 && scores.confidence >= 7) return "go_deeper"
        return null
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
