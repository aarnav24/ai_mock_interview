import axios from "axios"
import { PromptBuilder } from "./PromptBuilder.js"

export class AIService {
    static #BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
    static #MODEL = "openai/gpt-oss-120b:free"

    static async #call(messages) {
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
    }

    static async analyzeResume(resumeText) {
        return this.#call([
            { role: "system", content: PromptBuilder.resumeAnalysis() },
            { role: "user", content: resumeText }
        ])
    }

    static async generateQuestions({ role, experience, mode, resumeText, projects, skills }) {
        const userPrompt = `Role: ${role}
Experience: ${experience}
InterviewMode: ${mode}
Projects: ${projects.length ? projects.join(", ") : "None"}
Skills: ${skills.length ? skills.join(", ") : "None"}
Resume: ${resumeText || "None"}`

        const systemPrompt = mode === "Technical"
            ? PromptBuilder.technicalQuestions()
            : PromptBuilder.hrQuestions()

        return this.#call([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ])
    }

    static async evaluateAnswer({ question, answer, priorQA = "" }) {
        return this.#call([
            { role: "system", content: PromptBuilder.answerEvaluation(priorQA) },
            { role: "user", content: `Question: ${question}\nAnswer: ${answer}` }
        ])
    }

    static async generateFollowUp({ question, answer, score, trigger }) {
        return this.#call([
            { role: "system", content: PromptBuilder.followUpQuestion() },
            { role: "user", content: `Question: ${question}\nAnswer: ${answer}\nScore: ${score}/10\nTrigger: ${trigger}` }
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
            .map(t => `Topic: ${t.topic} (Score: ${t.score}/10)\nWeak answer: ${t.answer}`)
            .join("\n\n")

        return this.#call([
            { role: "system", content: PromptBuilder.improvementPlan(role, experience) },
            { role: "user", content: topicContext }
        ])
    }
}
