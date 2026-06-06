import fs from "fs"
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs"
import { askAI } from "../services/openRouter.service.js"
import User from "../models/user.model.js"
import Interview from "../models/interview.model.js"

export const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Resume required" })
        }
        const filepath = req.file.path
        const fileBuffer = await fs.promises.readFile(filepath)
        const uint8Array = new Uint8Array(fileBuffer)

        const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
        let resumeText = ""
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();

            resumeText += content.items.map(item => item.str).join(" ") + "\n";
        }

        resumeText = resumeText
            .replace(/\s+/g, " ")
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/[ \t]+/g, " ")
            .trim()

        const messages = [
            {
                role: "system",
                content: `Extract structured data from resume.
                Return ONLY valid JSON:
                {
                    "role": "string",
                    "experience": "string",
                    "projects": ["project1", "project2"],
                    "skills" : ["skill1", "skill2"]
                }
                Do not include markdown.
                Do not include explanations.
                Do not wrap in \`\`\`json.
                `
            },
            {
                role: "user",
                content: resumeText
            }
        ]

        const aiResponse = await askAI({ messages })
        const parsed = JSON.parse(aiResponse)

        fs.unlinkSync(filepath)
        res.json({
            role: parsed.role,
            experience: parsed.experience,
            projects: parsed.projects,
            skills: parsed.skills,
            resumeText
        })

    } catch (error) {
        console.error(error);

        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path)

        res.status(500).json({ message: error.message })
    }
}

export const generateQuestions = async (req, res) => {
    try {
        let { role, experience, mode, resumeText, projects, skills } = req.body

        role = role?.trim()
        experience = experience?.trim()
        mode = mode?.trim()

        if (!role || !experience || !mode) {
            return res.status(400).json({ message: "Role, Experience and Mode are required." })
        }

        const user = await User.findById(req.userId)

        if (user.credits < 50) {
            return res.status(400).json({
                message: "Not enough credits. Minimum 50 required"
            })
        }

        const projectText = Array.isArray(projects) && projects.length ? projects.join(", ") : "None"
        const skillText = Array.isArray(skills) && skills.length ? skills.join(", ") : "None"
        const safeResume = resumeText?.trim() || "None"

        const userPrompt = `
            Role: ${role}
            Experience: ${experience}
            InterviewMode: ${mode}
            Projects: ${projectText}
            Skills: ${skillText}
            Resume: ${safeResume}`

        if (!userPrompt.trim()) {
            return res.status(400).json({ message: "Prompt content is empty." })
        }

        const technicalPrompt = `You are a real human experienced interviewer conducting a professional interview.
                    Speak in simple, natural English as if you are directly talking to the candidate.
                    Generate exactly 5 interview questions.Candidate information will be provided by the user.

                    Strict Rules:
                    - Each question must contain between 10 and 25 words.
                    - Each question must be a single complete sentence.
                    - Do NOT number them.
                    - Do NOT add explanations.
                    - Do NOT add extra text before or after.
                    - One question per line only
                    - Keep language simple and conversational
                    - Questions must feel practical and realistic.

                    Question Design:
                    - Tailor every question to the candidate's role and experience.
                    - Use the candidate's projects, skills, and resume details whenever relevant.
                    - Exactly 3 questions must directly reference the candidate's projects, internships, coursework, or experience. Do not place all project-based questions consecutively. Distribute them naturally throughout the interview.
                    - The remaining 2 questions (not necessarily in order) should test skills through practical scenarios, implementation decisions, tradeoffs, problem-solving discussions, or challenges directly related to the candidate's demonstrated skills and experience.Do not ask questions requiring expertise not evidenced in the candidate's resume.
                    - Question 5 must require deeper reasoning, tradeoff analysis, debugging decisions, optimization strategies, scalability considerations, or architectural thinking.
                    - If resume is not provided, ask questions according to the role and experience of the user. For example, questions related to the top skills in demand for that job role
                    - Prefer questions about implementation choices, debugging experiences, optimization, scalability, tradeoffs, and lessons learned.
                    - Avoid generic textbook questions.
                    - Ask practical questions that a real interviewer would ask.
                    - Prefer project-based and experience-based questions over theoretical questions.

                    Difficulty progression:
                    Question 1 -> easy
                    Question 2 -> easy to medium
                    Question 3 -> medium
                    Question 4 -> medium to hard
                    Question 5 -> hard`
        
        const hrPrompt = `You are an experienced HR interviewer conducting a realistic placement interview.

                    Generate exactly 5 HR interview questions based on the candidate's resume, projects, internships, achievements, extracurricular activities, and experience.

                    Question Distribution:

                    - 2 questions about communication, teamwork, collaboration, or leadership.
                    - 1 question about challenges, failures, mistakes, or conflict resolution.
                    - 1 question about motivation, career goals, or learning mindset.
                    - 1 question about a project, internship, achievement, or experience mentioned in the resume.
                    - Question 5 should require deeper self-reflection, judgment, ownership, decision-making, leadership, failure analysis, or career planning.

                    Question Requirements:

                    - Questions must feel realistic and conversational.
                    - Ask behavioral and situational questions.
                    - Encourage detailed responses.
                    - Avoid technical implementation questions.
                    - Avoid generic textbook HR questions.
                    - Use resume details whenever possible.
                    Avoid generic questions such as:
                    - Tell me about yourself.
                    - What are your strengths and weaknesses?
                    - Why should we hire you?
                    - Where do you see yourself in five years?
                    - Prefer resume-specific and experience-based questions whenever possible.
                    - Prefer questions that encourage candidates to answer using specific examples, situations, actions, and outcomes rather than opinions.
                    - Do not ask multiple questions testing the same competency in similar ways. Each question must assess a different aspect of the candidate's professional behavior.

                    Difficulty progression:
                    Question 1 -> easy
                    Question 2 -> easy to medium
                    Question 3 -> medium
                    Question 4 -> medium to hard
                    Question 5 -> hard

                    Output Rules:

                    - Generate exactly 5 questions.
                    - One question per line.
                    - No numbering.
                    - No explanations.
                    - No extra text before or after.
                    - Use simple conversational English.`

        const messages = [
            {
                role: "system",
                content: mode == "Technical" ? technicalPrompt: hrPrompt
            },

            {
                role: "user",
                content: userPrompt
            }
        ]

        const aiResponse = await askAI({ messages })

        if (!aiResponse || !aiResponse.trim()) {
            console.error(error);
            return res.status(500).json({ message: "AI returned empty response" })
        }

        const questionsArray = aiResponse.split("\n").map(q => q.trim()).filter(q => q.length > 0).slice(0, 5)

        if (questionsArray.length === 0) {
            console.error(error);
            return res.status(500).json({ message: "AI failed to generate questions." })
        }

        user.credits -= 50
        await user.save()

        const interview = await Interview.create({
            userId: user._id,
            role,
            experience,
            mode,
            resumeText: safeResume,
            questions: questionsArray.map((q, index) => ({
                question: q,
                difficulty: ["Easy", "Easy", "Medium", "Medium", "Hard"][index],
                timeLimit: [90, 90, 120, 120, 150][index]
            }))
        })

        res.json({
            interviewId: interview._id,
            creditsLeft: user.credits,
            userName: user.name,
            questions: interview.questions
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: `Failed to created interview ${error.message}` })
    }
}

export const submitAnswer = async (req, res) => {
    try {
        const { interviewId, questionIndex, answer, timeTaken } = req.body

        const interview = await Interview.findById(interviewId)
        const question = interview.questions[questionIndex]

        if (!answer) {
            question.score = 0
            question.feedback = "You did not submit an answer."
            question.answer = ""

            await interview.save()

            return res.json({ feedback: question.feedback })
        }

        if (timeTaken > question.timeLimit) {
            question.score = 0
            question.feedback = "Time limit exceeded. Answer not evaluated."
            question.answer = answer

            await interview.save()

            return res.json({ feedback: question.feedback })
        }

        const messages = [
            {
                role: "system",
                content: `
                    You are a professional human interviewer evaluating a candidate's answer in a real interview.

                    Evaluate naturally and fairly, like a real person would.

                    Score the answer in these areas (0 to 10 inclusive):

                    1. Confidence & Clarity - Does the answer appear confident, clear, and well-structured based on the wording provided?

                    2. Communication - Is the language simple, clear, and easy to understand?

                    3. Correctness & Completeness -  Is the answer factually accurate and relevant to the question? Very short answers should lose points for completeness unless the question genuinely requires a brief response. Answers that miss important details should not receive high correctness scores.

                    Scoring Guidance:

                    0-2 = Very poor
                    3-4 = Weak
                    5-6 = Average
                    7-8 = Good
                    9-10 = Excellent

                    Do not avoid low scores when justified.

                    Evaluation Notes:
                    - Penalize vague answers.
                    - Penalize incorrect technical statements.
                    - Penalize extremely short answers.
                    - Reward clear examples and practical explanations.
                    - Reward structured answers.
                    - Do not inflate scores.
                    - A high final score requires strong performance across all categories.

                    Rules:
                    - Be realistic and unbiased.
                    - Do not give random high scores.
                    - If the answer is weak, score low.
                    - If the answer is strong and detailed, score high.
                    - Consider clarity, structure, and relevance.
                    - Evaluate only the information present in the answer.
                    - Do not assume missing knowledge beyond what is stated.

                    Calculate:
                    finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

                    Feedback Rules:
                    - Write natural human feedback.
                    - Feedback must contain 10 to 15 words only.
                    - Sound like real interview feedback.
                    - Can suggest improvement if needed.
                    - Do NOT repeat the question.
                    - Do NOT explain scoring.
                    - Keep tone professional and honest.

                    Return ONLY valid JSON in this format:

                    {
                        "confidence": number,
                        "communication": number,
                        "correctness": number,
                        "finalScore": number,
                        "feedback": "short human feedback"
                    }
                    Output Requirements:
                    - Return only raw JSON.
                    - Do not use markdown.
                    - Do not wrap the JSON in code blocks.
                    - Do not include any text before or after the JSON.
                `
            }
            ,
            {
                role: "user",
                content: `
                    Question: ${question.question}
                    Answer: ${answer}
                `
            }
        ]

        const aiResponse = await askAI({ messages })

        const parsed = JSON.parse(aiResponse)
        question.confidence = parsed.confidence
        question.communication = parsed.communication
        question.correctness = parsed.correctness
        question.score = parsed.finalScore
        question.feedback = parsed.feedback
        await interview.save()

        return res.status(200).json({ feedback: parsed.feedback })

    } catch (error) {
        res.status(500).json({ message: `Failed to submit answer ${error.message}` })
        console.error(error.message);
        
    }
}

export const finishInterview = async (req, res) => {
    try {
        const { interviewId } = req.body
        const interview = await Interview.findById(interviewId)
        if (!interview) {
            return res.status(400).json({ message: "Failed to find interview" })
        }

        const totalQuestions = interview.questions.length
        let totalScore = 0
        let totalConfidence = 0
        let totalCommunication = 0
        let totalCorrectness = 0

        interview.questions.forEach((q) => {
            totalScore += q.score || 0
            totalConfidence += q.confidence || 0
            totalCommunication += q.communication || 0
            totalCorrectness += q.correctness || 0
        })

        const finalScore = totalQuestions ? totalScore / totalQuestions : 0
        const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0
        const avgCommunication = totalQuestions ? totalCommunication / totalQuestions : 0
        const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0

        interview.finalScore = finalScore
        interview.status = "Completed"
        await interview.save()

        return res.status(200).json({
            finalScore: Number(finalScore.toFixed(1)),
            confidence: Number(avgConfidence.toFixed(1)),
            communication: Number(avgCommunication.toFixed(1)),
            correctness: Number(avgCorrectness.toFixed(1)),
            questionWiseScore: interview.questions.map((q) => ({
                question: q.question,
                score: q.score || 0,
                feedback: q.feedback || "",
                confidence: q.confidence || 0,
                communication: q.communication || 0,
                correctness: q.correctness || 0,
            }))
        })

    } catch (error) {
        return res.status(500).json({ message: `Failed to finish interview ${error.message}` })
    }
}

export const getMyInterviews = async (req, res) => {
    try {
        const interview = await Interview.find({userId: req.userId}).sort({ createdAt: -1 }).select("role experience mode finalScore status createdAt")

        return res.status(200).json(interview)
    } catch (error) {
        return res.status(500).json({message: `Failed to find currentUser interview ${error.message}`})
    }
}

export const getInterviewReport = async (req, res) => {
    try {
        const interview = await Interview.findById(req.params.id)

        if(!interview) {
            return res.status(404).json({message: "Interview not found"})
        }

        const totalQuestions = interview.questions.length
        let totalConfidence = 0
        let totalCommunication = 0
        let totalCorrectness = 0

        interview.questions.forEach((q) => {
            totalConfidence += q.confidence || 0
            totalCommunication += q.communication || 0
            totalCorrectness += q.correctness || 0
        })

        const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0
        const avgCommunication = totalQuestions ? totalCommunication / totalQuestions : 0
        const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0

        return res.json({
            finalScore: interview.finalScore,
            confidence: Number(avgConfidence.toFixed(1)),
            communication: Number(avgCommunication.toFixed(1)),
            correctness: Number(avgCorrectness.toFixed(1)),
            questionWiseScore: interview.questions
        })
    } catch (error) {
        return res.status(500).json({message: `Failed to find currentUser Report ${error.message}`})
    }
}