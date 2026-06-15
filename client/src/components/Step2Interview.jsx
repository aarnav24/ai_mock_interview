import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa"
import { BsArrowRight, BsPauseFill, BsStars, BsStopFill } from "react-icons/bs"
import axios from "axios"
import maleVideo from "../assets/Videos/male-ai.mp4"
import femaleVideo from "../assets/Videos/female-ai.mp4"
import Timer from "./timer"
import { ServerUrl } from "../App"
import { saveDraft, loadDraft, clearDraft, clearAllDrafts, clearActiveInterview } from "../utils/draftStorage"

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
    const { interviewId, questions: initialQuestions, userName, resumeFromIndex = 0 } = interviewData

    const [questions, setQuestions] = useState(initialQuestions)
    const [isIntroPhase, setIsIntroPhase] = useState(resumeFromIndex === 0)
    const [isMicOn, setIsMicOn] = useState(false)
    const [isAIPlaying, setIsAIPlaying] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(resumeFromIndex)
    const [answer, setAnswer] = useState("")
    const [feedback, setFeedback] = useState("")
    const [lastScore, setLastScore] = useState(null)
    const [timeLeft, setTimeLeft] = useState(initialQuestions[resumeFromIndex]?.timeLimit || 60)
    const [selectedVoice, setSelectedVoice] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [voiceGender, setVoiceGender] = useState("female")
    const [canAnswer, setCanAnswer] = useState(resumeFromIndex > 0)
    const [subtitle, setSubtitle] = useState("")
    const [isFinishing, setIsFinishing] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [volume, setVolume] = useState(0)
    const [liveTranscript, setLiveTranscript] = useState("")
    const [tabSwitchToast, setTabSwitchToast] = useState(false)
    const [isFetchingFollowUp, setIsFetchingFollowup] = useState(false)

    const videoRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const wsRef = useRef(null)
    const silenceTimerRef = useRef(null)
    const pendingTextRef = useRef("")
    const isMicOnRef = useRef(false)
    const audioCtxRef = useRef(null)
    const analyserRef = useRef(null)
    const rafRef = useRef(null)
    const hasFollowUpRef = useRef(false)

    const currentQuestion = questions[currentIndex]

    useEffect(() => { isMicOnRef.current = isMicOn }, [isMicOn])

    const flushPending = useCallback(() => {
        const text = pendingTextRef.current.trim()
        if (text) {
            setAnswer(prev => (prev ? prev + " " + text : text))
            pendingTextRef.current = ""
        }
    }, [])

    const stopMic = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
        }
        flushPending()

        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
        if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
        analyserRef.current = null
        setVolume(0)
        setLiveTranscript("")

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

    useEffect(() => {
        if (!isIntroPhase && interviewId) {
            const draft = loadDraft(interviewId, currentIndex)
            if (draft) {
                const id = requestAnimationFrame(() => setAnswer(draft))
                return () => cancelAnimationFrame(id)
            }
        }
    }, [currentIndex, isIntroPhase, interviewId])

    useEffect(() => {
        if (!isIntroPhase && interviewId && answer) {
            saveDraft(interviewId, currentIndex, answer)
        }
    }, [answer, currentIndex, isIntroPhase, interviewId])

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
    }, [selectedVoice, stopMic])

    useEffect(() => {
        if (!selectedVoice) return

        const runIntro = async () => {
            if (isIntroPhase) {
                await speakText(`Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`)
                await speakText("I'll ask you a few questions. Just answer naturally. Let's begin!")
                setIsIntroPhase(false)
            } else if (currentQuestion) {
                setCanAnswer(false)
                setTimeLeft(currentQuestion.timeLimit || 60)
                await new Promise(r => setTimeout(r, 800))
                if (currentIndex === questions.length - 1) {
                    await speakText("Alright, this one might be a bit more challenging")
                }
                await speakText(currentQuestion.question)
                setCanAnswer(true)
            }
        }
        runIntro()
    }, [selectedVoice, isIntroPhase, currentIndex, currentQuestion, speakText, userName])

    useEffect(() => {
        if (isIntroPhase || !currentQuestion || !canAnswer || isPaused) return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) { clearInterval(timer); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [isIntroPhase, currentIndex, canAnswer, isPaused, currentQuestion])

    const startMic = useCallback(async () => {
        if (isSubmitting || feedback || isIntroPhase) return
        if (wsRef.current) return

        try {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel()
                setIsAIPlaying(false)
            }
            setCanAnswer(true)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Audio volume analyser
            const audioCtx = new AudioContext()
            const source = audioCtx.createMediaStreamSource(stream)
            const analyser = audioCtx.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)
            audioCtxRef.current = audioCtx
            analyserRef.current = analyser

            const measureVolume = () => {
                if (!analyserRef.current) return
                const data = new Uint8Array(analyserRef.current.frequencyBinCount)
                analyserRef.current.getByteFrequencyData(data)
                const avg = data.reduce((s, v) => s + v, 0) / data.length
                setVolume(avg / 128)
                rafRef.current = requestAnimationFrame(measureVolume)
            }
            rafRef.current = requestAnimationFrame(measureVolume)

            const wsUrl = ServerUrl.replace(/^http/, "ws") + "/api/deepgram/live"
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onclose = () => flushPending()
            ws.onerror = (err) => console.error("[websocket] client error:", err)

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data)
                    if (msg.type !== "transcript" || !msg.transcript) return
                    if (msg.isFinal) {
                        setLiveTranscript("")
                        setAnswer(prev => {
                            const trimmed = prev.trim()
                            return trimmed ? trimmed + " " + msg.transcript : msg.transcript
                        })
                    } else {
                        // Show interim result immediately
                        setLiveTranscript(msg.transcript)
                    }
                } catch { /* ignore parse errors */ }
            }

            const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
                .find(t => MediaRecorder.isTypeSupported(t)) || ""

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
            mediaRecorderRef.current = recorder

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) ws.send(e.data)
            }

            recorder.start(250)
        } catch (err) {
            console.error("[mic] startMic error:", err)
        }
    }, [canAnswer, isAIPlaying, isSubmitting, feedback, flushPending])

    const toggleMic = useCallback(() => {
        setIsMicOn(prev => !prev)
    }, [])

    useEffect(() => {
        if (canAnswer && isMicOn && !isAIPlaying) {
            startMic()
        } else {
            stopMic()
        }
    }, [canAnswer, isAIPlaying, isMicOn, startMic, stopMic])

    useEffect(() => {
        return () => {
            stopMic()
            window.speechSynthesis.cancel()
        }
    }, [stopMic])

    // Fullscreen + tab-switch guard
    useEffect(() => {
        document.documentElement.requestFullscreen().catch(() => {})

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitchToast(true)
                setTimeout(() => setTabSwitchToast(false), 3500)
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
        }
    }, [])

    const submitAnswer = useCallback(async () => {
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
            hasFollowUpRef.current = !!followUpTrigger
            setFeedback(fb)
            
            // Disable ability to answer/interact while AI is speaking feedback
            setCanAnswer(false)
            await speakText(fb)

            setLastScore(score)
            clearDraft(interviewId, currentIndex)

            if (followUpTrigger) {
                setIsFetchingFollowup(true)
                try {
                    const fuResult = await axios.post(
                        `${ServerUrl}/api/interview/follow-up`,
                        { interviewId, questionIndex: currentIndex, answer, score, trigger: followUpTrigger },
                        { withCredentials: true }
                    )
                    const followUpQuestion = fuResult.data?.question
                    if (followUpQuestion) {
                        let newQuestions
                        setQuestions(prev => {
                            const updated = [...prev]
                            updated.splice(currentIndex + 1, 0, followUpQuestion)
                            newQuestions = updated
                            return updated
                        })
                        
                        // Automatically proceed to follow-up question immediately after feedback ends
                        setCanAnswer(false)
                        setAnswer("")
                        setFeedback("")
                        setLastScore(null)
                        setCurrentIndex(prev => prev + 1)
                        return // Skip standard next/report path because we just auto-advanced
                    }
                } catch (err) {
                    console.error("[follow-up] error:", err)
                } finally {
                    setIsFetchingFollowup(false)
                }
            }
            
            // Allow clicking next/view report after feedback finishes
            setCanAnswer(true)

        } catch (error) {
            console.error("[submit] error:", error)
            setCanAnswer(true)
        } finally {
            setIsSubmitting(false)
        }
    }, [answer, currentIndex, currentQuestion, interviewId, isAIPlaying, isSubmitting, speakText, stopMic, timeLeft])

    useEffect(() => {
        if (canAnswer && !isIntroPhase && currentQuestion && timeLeft === 0 && !isSubmitting && !feedback) {
            const id = requestAnimationFrame(() => submitAnswer())
            return () => cancelAnimationFrame(id)
        }
    }, [canAnswer, timeLeft, isSubmitting, feedback, isIntroPhase, currentQuestion, submitAnswer])

    const doFinishInterview = useCallback(async () => {
        stopMic()
        setIsMicOn(false)
        window.speechSynthesis.cancel()
        setIsAIPlaying(false)
        setIsFinishing(true)
        try {
            const result = await axios.post(`${ServerUrl}/api/interview/finish`, { interviewId }, { withCredentials: true })
            clearAllDrafts(interviewId)
            clearActiveInterview()
            onFinish(result.data)
        } catch (error) {
            console.error("[finish] error:", error)
            setIsFinishing(false)
        }
    }, [interviewId, onFinish, stopMic])

    const handleNext = async () => {
        if(isFetchingFollowUp) return
        
        if (isAIPlaying) {
            window.speechSynthesis.cancel()
            setIsAIPlaying(false)
            if (hasFollowUpRef.current) {
                return
            }
        }

        setCanAnswer(false)
        setAnswer("")
        setFeedback("")
        setLastScore(null)
        setIsSubmitting(false)

        if (currentIndex + 1 === questions.length) {
            await doFinishInterview()
            return
        }

        setCurrentIndex(prev => prev + 1)
    }

    const handlePause = () => {
        stopMic()
        setIsMicOn(false)
        window.speechSynthesis.cancel()
        setIsAIPlaying(false)
        setIsPaused(true)
    }

    const handleResumePause = () => {
        setIsPaused(false)
    }

    const wordHint = !feedback ? getWordCountHint(answer) : null

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f6f7f4] p-4 text-[#151815] sm:p-6 lg:flex lg:items-center lg:justify-center">
            <div className="pointer-events-none absolute -left-32 top-12 h-96 w-96 rounded-full bg-emerald-200/35 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-lime-200/30 blur-3xl" />

            {/* Tab switch warning toast */}
            {tabSwitchToast && (
                <div className="fixed left-1/2 top-5 z-60 -translate-x-1/2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-2xl shadow-red-900/20 animate-bounce">
                    ⚠️ Tab switching is not allowed during the interview
                </div>
            )}

            {/* Pause overlay */}
            {isPaused && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#f6f7f4]/95 p-6 backdrop-blur-sm">
                    <div className="text-5xl">⏸</div>
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold tracking-tight text-[#151815]">Interview Paused</h2>
                        <p className="mt-2 max-w-xs text-sm text-gray-500">
                            Your progress is saved. The timer is frozen. Resume whenever you're ready.
                        </p>
                        <p className="text-xs text-gray-400 mt-3 font-mono">
                            Interview ID: {interviewId}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button
                            onClick={handleResumePause}
                            className="w-full rounded-full bg-[#151815] py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:bg-emerald-700">
                            Resume Interview
                        </button>
                        <button
                            onClick={doFinishInterview}
                            className="w-full rounded-full border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100">
                            End Interview &amp; Get Report
                        </button>
                    </div>
                </div>
            )}

            {/* Preparing report loader */}
            {isFinishing && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#f6f7f4]/95 backdrop-blur-sm">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold tracking-tight text-[#151815]">Preparing Your Report</h2>
                        <p className="mt-2 text-sm text-gray-500">Analyzing performance and generating insights...</p>
                    </div>
                </div>
            )}

            <div className="relative flex min-h-[82vh] w-full max-w-350 flex-col overflow-hidden rounded-4xl border border-white/80 bg-white shadow-[0_30px_90px_-45px_rgba(17,24,39,0.45)] lg:flex-row">

                {/* Left panel — AI avatar */}
                <div className="relative flex w-full flex-col items-center gap-5 overflow-hidden border-b border-gray-200 bg-[#151815] p-5 text-white sm:p-7 lg:w-[36%] lg:border-b-0 lg:border-r lg:border-white/10">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="relative flex w-full max-w-md items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Live practice</p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">AI Interview Room</h2>
                        </div>
                        <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs text-gray-300">
                            <span className={`h-2 w-2 rounded-full ${isAIPlaying ? "bg-emerald-400 animate-pulse" : isMicOn ? "bg-blue-400 animate-pulse" : "bg-gray-500"}`} />
                            {isAIPlaying ? "Speaking" : isMicOn ? "Listening" : "Ready"}
                        </span>
                    </div>

                    <div className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/8 p-2 shadow-2xl shadow-black/20">
                        <video src={videoSource} key={videoSource} ref={videoRef} muted playsInline preload="auto" className="w-full rounded-[1.35rem] object-cover" />
                    </div>

                    {subtitle && (
                        <div className="relative w-full max-w-md rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                            <p className="text-center text-sm font-medium leading-relaxed text-emerald-50">{subtitle}</p>
                        </div>
                    )}

                    <div className="relative w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-white/6 p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Interview status</span>
                            {isAIPlaying && <span className="text-sm font-semibold text-emerald-300">AI speaking</span>}
                            {isMicOn && !isAIPlaying && (
                                <span className="text-sm font-semibold text-blue-300 animate-pulse">Listening...</span>
                            )}
                        </div>

                        <div className="h-px bg-white/10" />
                        <div className="flex justify-center">
                            <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit || 60} />
                        </div>

                        <div className="h-px bg-white/10" />
                        <div className="grid grid-cols-2 gap-6 text-center">
                            <div className="rounded-2xl bg-white/6 p-3">
                                <span className="text-2xl font-semibold text-emerald-300">{currentIndex + 1}</span>
                                <p className="text-xs text-gray-500">Current</p>
                            </div>
                            <div className="rounded-2xl bg-white/6 p-3">
                                <span className="text-2xl font-semibold text-emerald-300">{questions.length}</span>
                                <p className="text-xs text-gray-500">Total</p>
                            </div>
                        </div>

                        {lastScore !== null && (
                            <>
                                <div className="h-px bg-white/10" />
                                <div className="rounded-2xl bg-white/6 p-3 text-center">
                                    <span className={`text-2xl font-semibold ${getScoreColor(lastScore)}`}>{lastScore}/10</span>
                                    <p className="text-xs text-gray-500">Last score</p>
                                </div>
                            </>
                        )}

                        <div className="h-px bg-white/10" />
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handlePause}
                                disabled={isFinishing || isSubmitting || isPaused}
                                className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-300/15 disabled:opacity-40">
                                <BsPauseFill />
                                Pause Interview
                            </button>
                            <button
                                onClick={doFinishInterview}
                                disabled={isFinishing || isSubmitting}
                                className="flex w-full items-center justify-center gap-2 rounded-full border border-red-300/20 bg-red-400/10 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-400/15 disabled:opacity-40">
                                <BsStopFill />
                                Finish Interview
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right panel — question + answer */}
                <div className="flex flex-1 flex-col bg-white p-5 sm:p-7 md:p-9">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Question workspace</p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#151815]">Answer naturally</h2>
                            <p className="mt-2 text-sm text-gray-500">Speak or type your response. Your draft is saved while you work.</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500">
                            <BsStars className="text-emerald-500" />
                            Personalized interview
                        </div>
                    </div>

                    {!isIntroPhase && (
                        <div className="mb-4 rounded-3xl border border-gray-200 bg-gray-50/70 p-4 shadow-sm sm:p-6">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Question {currentIndex + 1} of {questions.length}</p>
                                {currentQuestion?.isFollowUp && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Follow-up</span>
                                )}
                                {currentQuestion?.topic && (
                                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">{currentQuestion.topic}</span>
                                )}
                            </div>
                            <p className="text-base font-semibold leading-7 text-gray-800 sm:text-lg">{currentQuestion?.question}</p>
                        </div>
                    )}

                    <textarea
                        placeholder="Type or speak your answer here..."
                        onChange={(e) => {
                            if (window.speechSynthesis) {
                                window.speechSynthesis.cancel()
                                setIsAIPlaying(false)
                            }
                            setCanAnswer(true)
                            setAnswer(e.target.value)
                        }}
                        value={answer}
                        disabled={isIntroPhase || isSubmitting || !!feedback}
                        className="min-h-72 flex-1 resize-none rounded-3xl border border-gray-200 bg-gray-50/80 p-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-60 sm:p-6"
                    />

                    {liveTranscript && (
                        <p className="text-xs mt-1 ml-1 text-blue-500 italic animate-pulse">
                            🎙 {liveTranscript}
                        </p>
                    )}

                    {wordHint && !liveTranscript && (
                        <p className={`text-xs mt-1 ml-1 ${wordHint.color}`}>{wordHint.label}</p>
                    )}

                    {!feedback ? (
                        <div className="mt-4 flex items-center gap-3">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleMic}
                                disabled={isIntroPhase || isSubmitting || !!feedback}
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-lg transition sm:h-14 sm:w-14
                                    ${isMicOn ? "bg-blue-600 text-white animate-pulse" : "bg-[#151815] text-white hover:bg-emerald-700"}
                                    disabled:opacity-40`}
                            >
                                {isMicOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
                            </motion.button>

                            {/* Live volume indicator */}
                            {isMicOn && !isAIPlaying && (
                                <div className="flex h-8 items-end gap-0.5 rounded-full border border-gray-200 bg-gray-50 px-3">
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-1 rounded-full transition-all duration-75 ${
                                                volume * 16 > i
                                                    ? volume > 0.6 ? "bg-emerald-500" : volume > 0.3 ? "bg-yellow-400" : "bg-red-400"
                                                    : "bg-gray-200"
                                            }`}
                                            style={{ height: `${Math.max(4, 6 + Math.sin(i * 0.8) * 10)}px` }}
                                        />
                                    ))}
                                </div>
                            )}

                            <motion.button
                                onClick={submitAnswer}
                                disabled={isSubmitting || isAIPlaying || !canAnswer}
                                whileTap={{ scale: 0.95 }}
                                className="flex-1 rounded-full bg-[#151815] py-3 font-semibold text-white shadow-xl shadow-gray-900/15 transition hover:bg-emerald-700 disabled:opacity-50 sm:py-4"
                            >
                                {isSubmitting ? "Submitting…" : "Submit Answer"}
                            </motion.button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm"
                        >
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                <BsStars />
                                AI feedback
                            </div>
                            <p className="font-medium leading-7 text-emerald-800">{feedback}</p>
                            <button
                                onClick={handleNext}
                                disabled={isSubmitting || isFetchingFollowUp}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#151815] py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {currentIndex === questions.length - 1 ? "View Report" : "Next Question"}
                                <BsArrowRight size={16} />
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Step2Interview
