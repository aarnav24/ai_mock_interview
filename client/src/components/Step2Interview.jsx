import React from 'react'
import maleVideo from "../assets/Videos/male-ai.mp4"
import femaleVideo from "../assets/Videos/female-ai.mp4"
import Timer from './timer'
import { motion } from "motion/react"
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa"
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import axios from "axios"
import { ServerUrl } from '../App'
import { BsArrowRight } from 'react-icons/bs'
import toast from "react-hot-toast"

const Step2Interview = ({ interviewData, onFinish }) => {
  const { interviewId, questions, userName } = interviewData
  const [isIntroPhase, setIsIntroPhase] = useState(true)
  const [isMicOn, setIsMicOn] = useState(false)
  const [isAIPlaying, setIsAIPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [feedback, setFeedback] = useState("")
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60)
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [voiceGender, setVoiceGender] = useState("female")
  const [canAnswer, setCanAnswer] = useState(false)
  const [subtitle, setSubtitle] = useState("")
  const videoRef = useRef(null)
  const currentQuestion = questions[currentIndex]
  const isMicOnRef = useRef(false)
  const canAnswerRef = useRef(false)
  const mediaRecorderRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    isMicOnRef.current = isMicOn
  }, [isMicOn])

  useEffect(() => {
    canAnswerRef.current = canAnswer
  }, [canAnswer])

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      if (!voices.length) return

      const femaleVoice = voices.find(v =>
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("female")
      )

      if (femaleVoice) {
        setSelectedVoice(femaleVoice)
        setVoiceGender("female")
        return
      }

      const maleVoice = voices.find(v =>
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("mark") ||
        v.name.toLowerCase().includes("male")
      )

      if (maleVoice) {
        setSelectedVoice(maleVoice)
        setVoiceGender("male")
        return
      }

      setSelectedVoice(voices[0])
      setVoiceGender("female")
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  const videoSource = voiceGender === "male" ? maleVideo : femaleVideo

  const speakText = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        resolve()
        return
      }

      window.speechSynthesis.cancel()

      const humanText = text.replace(/,/g, ", ... ").replace(/\./g, ". ... ")

      const utterance = new SpeechSynthesisUtterance(humanText)
      utterance.voice = selectedVoice
      utterance.rate = 0.92
      utterance.pitch = 1.05
      utterance.volume = 1

      const finishSpeech = () => {
        videoRef.current?.pause()

        if (videoRef.current) {
          videoRef.current.currentTime = 0
        }

        setIsAIPlaying(false)

        setTimeout(() => {
          setSubtitle("")
          resolve()
        }, 300)
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
  }

  useEffect(() => {
    if (!selectedVoice) return

    const runIntro = async () => {
      if (isIntroPhase) {
        await speakText(`Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`)

        await speakText("I'll ask you a few questions Just answer naturally. Let's begin!")

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

  useEffect(() => {
    if (isIntroPhase || !currentQuestion || !canAnswer) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isIntroPhase, currentIndex, canAnswer])

  const startMic = async () => {
    if (!canAnswerRef.current) {
      console.warn("[mic] blocked — canAnswer is false (AI still speaking?)")
      return
    }
    if (isAIPlaying) {
      console.warn("[mic] blocked — AI is playing")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("[mic] got audio stream")

      const ws = new WebSocket(`ws://localhost:8000/api/deepgram/live`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[mic] WS open — starting MediaRecorder")

        const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", ""]
          .find((t) => t === "" || MediaRecorder.isTypeSupported(t))

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
        mediaRecorderRef.current = recorder

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data)
          }
        }

        recorder.start(250)
        console.log("[mic] recording started, mimeType:", recorder.mimeType)
      }

      let pendingText = ""
      let silenceTimer = null

      const flushPending = () => {
        if (!pendingText.trim()) return
        const toCommit = pendingText.trim()
        pendingText = ""
        setAnswer((prev) => prev ? prev + " " + toCommit : toCommit)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type !== "transcript" || !msg.isFinal || !msg.transcript) return

          pendingText += (pendingText ? " " : "") + msg.transcript

          clearTimeout(silenceTimer)
          silenceTimer = setTimeout(flushPending, 5000)
        } catch {
          // ignore malformed frames
        }
      }

      ws.onerror = (err) => console.error("[mic] Deepgram WS error", err)

      ws.onclose = (e) => {
        console.log("[mic] WS closed", e.code, e.reason)
        clearTimeout(silenceTimer)
        flushPending()
        stream.getTracks().forEach((t) => t.stop())
      }

    } catch (err) {
      console.error("[mic] access error:", err)
      setIsMicOn(false)
    }
  }

  const stopMic = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }

  const toggleMic = () => {
    if (isAIPlaying || !canAnswer) {
      alert("Please wait until the interviewer finishes speaking.")
      return
    }
    if (isMicOn) {
      stopMic()
      setIsMicOn(false)
    } else {
      setIsMicOn(true)
      startMic()
    }
  }

  useEffect(() => {
    if (isAIPlaying && isMicOn) {
      stopMic()
    }
  }, [isAIPlaying])

  const submitAnswer = async () => {
    if (isSubmitting || isAIPlaying) {
      return
    }

    stopMic()
    setIsSubmitting(true)

    try {

      const result = await axios.post(
        ServerUrl + "/api/interview/submit-answer",
        {
          interviewId,
          questionIndex: currentIndex,
          answer,
          timeTaken: currentQuestion.timeLimit - timeLeft,
        },
        { withCredentials: true }
      )

      setFeedback(result.data.feedback)

      await speakText(result.data.feedback)

      setIsSubmitting(false)

    } catch (error) {
      console.error(error)

      setIsSubmitting(false)
    }
  }

  const handleNext = async () => {

    setCanAnswer(false)
    setAnswer("")
    setFeedback("")
    setIsSubmitting(false)

    if (currentIndex + 1 == questions.length) {
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
      const result = await axios.post(ServerUrl + "/api/interview/finish", { interviewId }, { withCredentials: true })

      console.log(result.data)
      onFinish(result.data)

    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {

    if (
      canAnswer && 
      !isIntroPhase &&
      currentQuestion &&
      timeLeft === 0 &&
      !isSubmitting &&
      !feedback
    ) {
      submitAnswer()
    }

  }, [canAnswer, timeLeft, isSubmitting, feedback, isIntroPhase, currentQuestion])

  useEffect(() => {
    return () => {
      stopMic()
      window.speechSynthesis.cancel()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-350 min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">

        <div className="w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <video src={videoSource} key={videoSource} ref={videoRef} muted playsInline preload="auto" className="w-full h-auto object-cover"></video>
          </div>

          <div>
            {subtitle && (
              <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-gray-700 text-sm sm:text-base font-medium text-center leading-relaxed">{subtitle}</p>
              </div>
            )}
          </div>

          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Interview Status
              </span>
              {isAIPlaying && (<span className="text-sm font-semibold text-emerald-600">
                AI speaking
              </span>)}
            </div>

            <div className="h-px bg-gray-200"></div>
            <div className="flex justify-center">
              <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit || 60} />
            </div>

            <div className="h-px bg-gray-200"></div>
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <span className="text-2xl font-bold text-emerald-600">{currentIndex + 1}</span>
                <span className="text-xs text-gray-400">Current Question</span>
              </div>

              <div>
                <span className="text-2xl font-bold text-emerald-600">{questions.length}</span>
                <span className="text-xs text-gray-400">Total Questions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 mb-6">
            AI Smart Interview
          </h2>

          {!isIntroPhase && (<div className="relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <div className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed">{currentQuestion?.question}</div>
          </div>)}

          <textarea placeholder="Type your answer here..."
            onChange={(e) => setAnswer(e.target.value)}
            value={answer}
            className="flex-1 bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800" />

          {!feedback ? (<div className="flex items-center gap-4 mt-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleMic}
              className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full text-white shadow-lg ${isAIPlaying || !canAnswer
                  ? "bg-gray-400 cursor-not-allowed"
                  : isMicOn
                    ? "bg-emerald-500 cursor-pointer"
                    : "bg-red-500 cursor-pointer"
                }`}
            >
              {isMicOn ? (
                <FaMicrophone size={20} />
              ) : (
                <FaMicrophoneSlash size={20} />
              )}
            </motion.button>
            <motion.button
              onClick={submitAnswer}
              disabled={isSubmitting}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:bg-gray-500">
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </motion.button>
          </div>) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
              <p className="text-emerald-700 font-medium mb-4">{feedback}</p>

              <button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-1">
                  {currentIndex === questions.length - 1
                    ? "Finish Interview"
                    : "Next Question"} <BsArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Step2Interview