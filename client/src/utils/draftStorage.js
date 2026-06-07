const PREFIX = "interview_draft_"

export const saveDraft = (interviewId, questionIndex, answer) => {
    try {
        localStorage.setItem(`${PREFIX}${interviewId}_${questionIndex}`, answer)
    } catch {
        // storage quota exceeded — silently ignore
    }
}

export const loadDraft = (interviewId, questionIndex) => {
    try {
        return localStorage.getItem(`${PREFIX}${interviewId}_${questionIndex}`) ?? ""
    } catch {
        return ""
    }
}

export const clearDraft = (interviewId, questionIndex) => {
    try {
        localStorage.removeItem(`${PREFIX}${interviewId}_${questionIndex}`)
    } catch {
        // ignore
    }
}

export const clearAllDrafts = (interviewId) => {
    try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(`${PREFIX}${interviewId}_`))
        keys.forEach(k => localStorage.removeItem(k))
    } catch {
        // ignore
    }
}
