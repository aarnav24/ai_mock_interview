export class PromptBuilder {

    static resumeAnalysis() {
        return `Extract structured data from resume. Return ONLY valid JSON, no markdown, no explanations:
{"role":"string","experience":"string","projects":["..."],"skills":["..."]}`
    }

    static technicalQuestions() {
        return `You are a human interviewer. Generate exactly 5 technical interview questions.
Output: one question per line, no numbering, no extra text.

Rules:
- 10-25 words each, single sentence, conversational English
- Tailor to candidate's role, experience, projects, skills
- 3 questions must reference candidate's actual projects/experience
- 2 questions test practical skills: tradeoffs, debugging, optimization
- Q5 must require architectural/tradeoff/scalability reasoning
- Difficulty: Q1=easy, Q2=easy-medium, Q3=medium, Q4=medium-hard, Q5=hard`
    }

    static hrQuestions() {
        return `You are an HR interviewer. Generate exactly 5 HR questions based on the candidate profile.
Output: one question per line, no numbering, no extra text.

Distribution: 2x teamwork/leadership, 1x challenge/failure, 1x motivation/goals, 1x specific project/achievement
- Behavioral and situational only. No technical questions.
- Use resume details. No generic questions ("tell me about yourself", "strengths/weaknesses").
- Q5: deep self-reflection — judgment, ownership, career planning.
- Difficulty: Q1=easy, Q2=easy-medium, Q3=medium, Q4=medium-hard, Q5=hard`
    }

    static answerEvaluation(priorQA = "") {
        const ctx = priorQA
            ? `\n\nSession context:\n${priorQA}\n\nFactor session trend: reward improvement, penalize repeated errors.`
            : ""

        return `Evaluate interview answer. Score 0-10 each:
- confidence: clarity and structure
- communication: language simplicity
- correctness: accuracy and completeness${ctx}

Scoring: 0-2=very poor, 3-4=weak, 5-6=avg, 7-8=good, 9-10=excellent
finalScore = round(avg(confidence,communication,correctness))
feedback = 10-15 words, human tone, no score explanation, no question repeat

Return ONLY valid JSON, no markdown:
{"confidence":n,"communication":n,"correctness":n,"finalScore":n,"feedback":"..."}`
    }

    static followUpQuestion() {
        return `Generate ONE follow-up interview question.
probe_weakness trigger → simpler version or ask candidate to clarify concretely
go_deeper trigger → harder extension: tradeoffs, edge cases, optimization, architecture
Output: question only (10-25 words, single sentence). No extra text.`
    }

    static sessionSummary() {
        return `Write a 3-5 sentence executive summary of this mock interview.
Cover: overall level, strongest area (cite example), weakest area (cite example), one concrete next action.
Be direct and specific. No generic phrases. Plain text only, no headings or bullets.`
    }

    static topicClassification() {
        return `Classify each question into exactly one topic:
Data Structures|Algorithms|System Design|OOP & Architecture|Databases|DevOps|Behavioural|Communication|Domain-Specific

Return ONLY valid JSON array, no markdown:
[{"questionIndex":0,"topic":"..."},...]`
    }

    static improvementPlan(role, experience) {
        return `Career coach for ${experience} ${role}. For each weak topic give 2-3 specific improvement actions.
Name exact concepts/patterns/techniques — no generic advice.
Return ONLY valid JSON array, no markdown:
[{"topic":"...","suggestions":["...","...","..."]},...]`
    }
}
