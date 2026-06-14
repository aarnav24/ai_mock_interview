import axios from "axios"
import { PromptBuilder } from "./PromptBuilder.js"

export class AIService {
    static #BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
    static #MODEL = "openai/gpt-oss-120b:free"
    static #FALLBACK_MODEL = "google/gemma-4-31b-it:free"

    static async #call(messages) {
        try {
            const response = await axios.post(
                this.#BASE_URL,
                { model: this.#MODEL, messages },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            )

            const content = response?.data?.choices?.[0]?.message?.content || ""
            if (!content.trim()) throw new Error("AI returned empty response")
            return content
        } catch (error) {
            console.warn(`Primary model ${this.#MODEL} failed, retrying with fallback model ${this.#FALLBACK_MODEL}... Error: ${error.message}`)
            const response = await axios.post(
                this.#BASE_URL,
                { model: this.#FALLBACK_MODEL, messages },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json"
                    }
                }
            )

            const content = response?.data?.choices?.[0]?.message?.content || ""
            if (!content.trim()) throw new Error("Fallback AI returned empty response")
            return content
        }
    }

    static async analyzeResume(resumeText) {
        return this.#call([
            { role: "system", content: PromptBuilder.resumeAnalysis() },
            { role: "user", content: resumeText }
        ])
    }

    static async generateQuestions({ role, experience, mode, resumeText, projects, skills, count = 5 }) {
        const userPrompt = `role:${role}|exp:${experience}|mode:${mode}|skills:${skills.length ? skills.join(",") : "none"}|projects:${projects.length ? projects.join(",") : "none"}|resume:${resumeText || "none"}`

        const systemPrompt = mode === "Technical"
            ? PromptBuilder.technicalQuestions(count, role, experience)
            : PromptBuilder.hrQuestions(count, role, experience)

        return this.#call([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ])
    }

    static async evaluateAnswer({ question, answer, priorQA = "" }) {
        return this.#call([
            { role: "system", content: PromptBuilder.answerEvaluation(priorQA) },
            { role: "user", content: `q:${question}\na:${answer}` }
        ])
    }

    static async generateFollowUp({ question, answer, score, trigger, role, experience, mode, skills, priorFollowUp = "" }) {
        const skillsList = Array.isArray(skills) ? skills.join(", ") : (skills || "none")
        let userPrompt = `role: ${role || "none"}
experience: ${experience || "none"}
mode: ${mode || "none"}
skills: ${skillsList}
q: ${question}
a: ${answer}
score: ${score}
trigger: ${trigger}`

        if (priorFollowUp) {
            userPrompt += `\npriorFollowUp: ${priorFollowUp}`
        }

        return this.#call([
            { role: "system", content: PromptBuilder.followUpQuestion() },
            { role: "user", content: userPrompt }
        ])
    }

    static async generateSummary(qaContext) {
        return this.#call([
            { role: "system", content: PromptBuilder.sessionSummary() },
            { role: "user", content: qaContext }
        ])
    }

    static async classifyTopics(questions) {
        const questionList = questions
            .map((q, i) => `Q${i + 1}: ${q.question}`)
            .join("\n")

        return this.#call([
            { role: "system", content: PromptBuilder.topicClassification() },
            { role: "user", content: questionList }
        ])
    }

    static async generateImprovementPlan({ role, experience, weakTopics }) {
        const topicContext = weakTopics
            .map(t => `topic:${t.topic}|score:${t.score}|ans:${t.answer}`)
            .join("\n")

        return this.#call([
            { role: "system", content: PromptBuilder.improvementPlan(role, experience) },
            { role: "user", content: topicContext }
        ])
    }
}
