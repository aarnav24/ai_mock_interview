import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa"
import { BsArrowRight } from "react-icons/bs"
import axios from "axios"
import maleVideo from "../assets/Videos/male-ai.mp4"
import femaleVideo from "../assets/Videos/female-ai.mp4"
import Timer from "./timer"
import { ServerUrl } from "../App"
import { saveDraft, loadDraft, clearDraft, clearAllDrafts } from "../utils/draftStorage"

// Coaching thresholds
const COACHING = {
    wordCountWarn: 20,
    wordCountGood: 60,
    scoreColors: { low: "text-red-500", mid: "text-yellow-500", high: "text-emerald-600" }
}

const getScoreColor = (score) => {
    if (!score) return ""
    if (score >= 7) return COACHING.scoreColors.high
    if (score >= 4) return COACHING.scoreColors.mid
    return COACHING.scoreColors.low
}

const getWordCountHint = (text) => {
    const count = text.trim().split(/\s+/).filter(Boolean).length
    if (count === 0) return null
    if (count < COACHING.wordCountWarn) return { label: `${count} words — try to elaborate more`, color: "text-red-400" }
    if (count < COACHING.wordCountGood) return { label: `${count} words — good, keep going`, color: "text-yellow-500" }
    return { label: `${count} words — great detail`, color: "text-emerald-500" }
}

const Step2Interview = ({ interviewData, onFinish }) => {
    const { interviewId, questions: initialQuestions, userName } = interviewData

    const [questions, setQuestions] = useState(initialQuestions)
    const [isIntroPhase, setIsIntroPhase] = useState(true)
    const [isMicOn, setIsMicOn] = useState(false)
    const [isAIPlaying, setIsAIPlaying] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answer, setAnswer] = useState("")
    const [feedback, setFeedback] = useState("")
    const [lastScore, setLastScore] = useState(null)
    const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60)
    const [selectedVoice, setSelectedVoice] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [voiceGender, setVoiceGender] = useState("female")
    const [canAnswer, setCanAnswer] = useState(false)
    const [subtitle, setSubtitle] = useState("")

    const videoRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const wsRef = useRef(null)
    const silenceTimerRef = useRef(null)
    const pendingTextRef = useRef("")
    const isMicOnRef = useRef(false)

    const currentQuestion = questions[currentIndex]

    useEffect(() => { isMicOnRef.current = isMicOn }, [isMicOn])

    // Load draft for current question
    useEffect(() => {
        if (!isIntroPhase && interviewId) {
            const draft = loadDraft(interviewId, currentIndex)
            if (draft) setAnswer(draft)
        }
    }, [currentIndex, isIntroPhase, interviewId])

    // Persist draft on answer change
    useEffect(() => {
        if (!isIntroPhase && interviewId && answer) {
            saveDraft(interviewId, currentIndex, answer)
        }
    }, [answer, currentIndex, isIntroPhase, interviewId])

    // Load voices
    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices()
            if (!voices.length) return

            const femaleVoice = voices.find(v =>
                v.name.toLowerCase().includes("zira") ||
                v.name.toLowerCase().includes("samantha") ||
                v.name.toLowerCase().includes("female")
            )
            if (femaleVoice) { setSelectedVoice(femaleVoice); setVoiceGender("female"); return }

            const maleVoice = voices.find(v =>
                v.name.toLowerCase().includes("david") ||
                v.name.toLowerCase().includes("mark") ||
                v.name.toLowerCase().includes("male")
            )
            if (maleVoice) { setSelectedVoice(maleVoice); setVoiceGender("male"); return }

            setSelectedVoice(voices[0])
            setVoiceGender("female")
        }
        loadVoices()
        window.speechSynthesis.onvoiceschanged = loadVoices
    }, [])

    const videoSource = voiceGender === "male" ? maleVideo : femaleVideo

    const speakText = useCallback((text) => {
        return new Promise((resolve) => {
            if (!window.speechSynthesis || !selectedVoice) { resolve(); return }
            window.speechSynthesis.cancel()

            const humanText = text.replace(/,/g, ", ... ").replace(/\./g, ". ... ")
            const utterance = new SpeechSynthesisUtterance(humanText)
            utterance.voice = selectedVoice
            utterance.rate = 0.92
            utterance.pitch = 1.05
            utterance.volume = 1

            const finishSpeech = () => {
                videoRef.current?.pause()
                if (videoRef.current) videoRef.current.currentTime = 0
                setIsAIPlaying(false)
                setTimeout(() => { setSubtitle(""); resolve() }, 300)
            }

            utterance.onstart = () => {
                setIsAIPlaying(true)
                stopMic()
                videoRef.current?.play()
            }
            utterance.onend = finishSpeech
            utterance.onerror = finishSpeech

            setSubtitle(text)
            window.speechSynthesis.speak(utterance)
        })
    }, [selectedVoice])

    // Intro + question narration
    useEffect(() => {
        if (!selectedVoice) return

        const runIntro = async () => {
            if (isIntroPhase) {
                await speakText(`Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`)
                await speakText("I'll ask you a few questions. Just answer naturally. Let's begin!")
                setIsIntroPhase(false)
            } else if (currentQuestion) {
                setCanAnswer(false)
                await new Promise(r => setTimeout(r, 800))
                if (currentIndex === questions.length - 1) {
                    await speakText("Alright, this one might be a bit more challenging")
                }
                await speakText(currentQuestion.question)
                setCanAnswer(true)
            }
        }
        runIntro()
    }, [selectedVoice, isIntroPhase, currentIndex])

    // Countdown timer
    useEffect(() => {
        if (isIntroPhase || !currentQuestion || !canAnswer) return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [isIntroPhase, currentIndex, canAnswer])

    // Auto-submit on timer expire
    useEffect(() => {
        if (canAnswer && !isIntroPhase && currentQuestion && timeLeft === 0 && !isSubmitting && !feedback) {
            submitAnswer()
        }
    }, [canAnswer, timeLeft, isSubmitting, feedback, isIntroPhase, currentQuestion])

    // --- Deepgram mic ---
    const flushPending = useCallback(() => {
        const text = pendingTextRef.current.trim()
        if (text) {
            setAnswer(prev => (prev ? prev + " " + text : text))
            pendingTextRef.current = ""
        }
    }, [])

    const startMic = useCallback(async () => {
        if (!canAnswer || isAIPlaying || isSubmitting || feedback) return

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            console.log("[mic] got audio stream")

            const wsUrl = ServerUrl.replace(/^http/, "ws") + "/api/deepgram/live"
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => console.log("[mic] WS open")
            ws.onclose = (e) => {
                console.log("[mic] WS closed", e.code)
                flushPending()
            }

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data)
                    if (msg.type !== "transcript") return

                    if (msg.isFinal) {
                        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
                        pendingTextRef.current += (pendingTextRef.current ? " " : "") + msg.transcript

                        silenceTimerRef.current = setTimeout(() => {
                            flushPending()
                        }, 5000)
                    }
                } catch { /* ignore parse errors */ }
            }

            const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
                .find(t => MediaRecorder.isTypeSupported(t)) || ""

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
            mediaRecorderRef.current = recorder

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                    ws.send(e.data)
                }
            }

            recorder.start(250)
            console.log("[mic] recording started")
        } catch (err) {
            console.error("[mic] startMic error:", err)
        }
    }, [canAnswer, isAIPlaying, isSubmitting, feedback, flushPending])

    const stopMic = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
        }
        flushPending()

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop())
            mediaRecorderRef.current = null
        }
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close()
            wsRef.current = null
        }
    }, [flushPending])

    const toggleMic = useCallback(() => {
        if (isMicOnRef.current) {
            stopMic()
            setIsMicOn(false)
        } else {
            setIsMicOn(true)
            startMic()
        }
    }, [startMic, stopMic])

    // Re-start mic when canAnswer flips true and mic was on
    useEffect(() => {
        if (canAnswer && isMicOn && !isAIPlaying) {
            startMic()
        }
    }, [canAnswer, isAIPlaying])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopMic()
            window.speechSynthesis.cancel()
        }
    }, [])

    const submitAnswer = async () => {
        if (isSubmitting || isAIPlaying) return
        stopMic()
        setIsMicOn(false)
        setIsSubmitting(true)

        try {
            const result = await axios.post(
                `${ServerUrl}/api/interview/submit-answer`,
                { interviewId, questionIndex: currentIndex, answer, timeTaken: currentQuestion.timeLimit - timeLeft },
                { withCredentials: true }
            )

            const { feedback: fb, score, followUpTrigger } = result.data
            setFeedback(fb)
            setLastScore(score)
            clearDraft(interviewId, currentIndex)

            // Inject follow-up if triggered
            if (followUpTrigger) {
                try {
                    const fuResult = await axios.post(
                        `${ServerUrl}/api/interview/follow-up`,
                        { interviewId, questionIndex: currentIndex, answer, score, trigger: followUpTrigger },
                        { withCredentials: true }
                    )
                    const followUpQuestion = fuResult.data?.followUpQuestion || fuResult.data?.question
                    if (followUpQuestion) {
                        setQuestions(prev => {
                            const updated = [...prev]
                            updated.splice(currentIndex + 1, 0, followUpQuestion)
                            return updated
                        })
                    }
                } catch (err) {
                    console.error("[follow-up] error:", err)
                }
            }

            await speakText(fb)
        } catch (error) {
            console.error("[submit] error:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleNext = async () => {
        setCanAnswer(false)
        setAnswer("")
        setFeedback("")
        setLastScore(null)
        setIsSubmitting(false)

        if (currentIndex + 1 === questions.length) {
            finishInterview()
            return
        }

        await speakText("Alright, let's move to the next question.")
        setCurrentIndex(prev => prev + 1)
        setTimeLeft(questions[currentIndex + 1].timeLimit)
    }

    const finishInterview = async () => {
        stopMic()
        setIsMicOn(false)
        try {
            const result = await axios.post(`${ServerUrl}/api/interview/finish`, { interviewId }, { withCredentials: true })
            clearAllDrafts(interviewId)
            onFinish(result.data)
        } catch (error) {
            console.error("[finish] error:", error)
        }
    }

    const wordHint = !feedback ? getWordCountHint(answer) : null

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-350 min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">

                {/* Left panel — AI avatar */}
                <div className="w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200">
                    <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
                        <video src={videoSource} key={videoSource} ref={videoRef} muted playsInline preload="auto" className="w-full h-auto object-cover" />
                    </div>

                    {subtitle && (
                        <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                            <p className="text-gray-700 text-sm font-medium text-center leading-relaxed">{subtitle}</p>
                        </div>
                    )}

                    <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Interview Status</span>
                            {isAIPlaying && <span className="text-sm font-semibold text-emerald-600">AI speaking</span>}
                            {isMicOn && !isAIPlaying && (
                                <span className="text-sm font-semibold text-blue-500 animate-pulse">Listening…</span>
                            )}
                        </div>

                        <div className="h-px bg-gray-200" />
                        <div className="flex justify-center">
                            <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit || 60} />
                        </div>

                        <div className="h-px bg-gray-200" />
                        <div className="grid grid-cols-2 gap-6 text-center">
                            <div>
                                <span className="text-2xl font-bold text-emerald-600">{currentIndex + 1}</span>
                                <p className="text-xs text-gray-400">Current</p>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-emerald-600">{questions.length}</span>
                                <p className="text-xs text-gray-400">Total</p>
                            </div>
                        </div>

                        {lastScore !== null && (
                            <>
                                <div className="h-px bg-gray-200" />
                                <div className="text-center">
                                    <span className={`text-2xl font-bold ${getScoreColor(lastScore)}`}>{lastScore}/10</span>
                                    <p className="text-xs text-gray-400">Score</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right panel — question + answer */}
                <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 mb-6">AI Smart Interview</h2>

                    {!isIntroPhase && (
                        <div className="mb-4 bg-gray-50 p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-xs text-gray-400">Question {currentIndex + 1} of {questions.length}</p>
                                {currentQuestion?.isFollowUp && (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Follow-up</span>
                                )}
                                {currentQuestion?.topic && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{currentQuestion.topic}</span>
                                )}
                            </div>
                            <p className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed">{currentQuestion?.question}</p>
                        </div>
                    )}

                    <textarea
                        placeholder="Type or speak your answer here..."
                        onChange={(e) => setAnswer(e.target.value)}
                        value={answer}
                        disabled={feedback}
                        className="flex-1 bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800 disabled:opacity-60"
                    />

                    {wordHint && (
                        <p className={`text-xs mt-1 ml-1 ${wordHint.color}`}>{wordHint.label}</p>
                    )}

                    {!feedback ? (
                        <div className="flex items-center gap-4 mt-4">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleMic}
                                disabled={!canAnswer || isAIPlaying || isSubmitting}
                                className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full shadow-lg transition
                                    ${isMicOn ? "bg-blue-600 text-white animate-pulse" : "bg-black text-white"}
                                    disabled:opacity-40`}
                            >
                                {isMicOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
                            </motion.button>

                            <motion.button
                                onClick={submitAnswer}
                                disabled={isSubmitting || isAIPlaying || !canAnswer}
                                whileTap={{ scale: 0.95 }}
                                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:opacity-50"
                            >
                                {isSubmitting ? "Submitting…" : "Submit Answer"}
                            </motion.button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm"
                        >
                            <p className="text-emerald-700 font-medium mb-4">{feedback}</p>
                            <button
                                onClick={handleNext}
                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-1"
                            >
                                {currentIndex === questions.length - 1 ? "Finish Interview" : "Next Question"}
                                <BsArrowRight size={18} />
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Step2Interview
