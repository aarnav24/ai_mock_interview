import { motion } from "motion/react"
import { FaUserTie, FaBriefcase, FaFileUpload, FaMicrophoneAlt, FaChartLine, FaCheck } from 'react-icons/fa'
import { BsArrowRight, BsFileEarmarkText, BsStars } from 'react-icons/bs'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { ServerUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { saveActiveInterview, loadActiveInterview, clearActiveInterview } from '../utils/draftStorage'

const QUESTION_COUNTS = [2, 5, 8, 10]

const Step1SetUp = ({ onStart, onResume }) => {
    const { userData } = useSelector((state) => state.user)
    const dispatch = useDispatch()
    const [role, setRole] = useState("")
    const [experience, setExperience] = useState("")
    const [mode, setMode] = useState("Technical")
    const [questionCount, setQuestionCount] = useState(5)
    const [resumeFile, setResumeFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [skills, setSkills] = useState([])
    const [resumeText, setResumeText] = useState("")
    const [analysisDone, setAnalysisDone] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [activeInterviewId, setActiveInterviewId] = useState(() => loadActiveInterview())
    const [resuming, setResuming] = useState(false)
    const [fetchedResumeName, setFetchedResumeName] = useState("")
    const [resumeSummary, setResumeSummary] = useState("")
    const [resumesList, setResumesList] = useState([])
    const [showResumeList, setShowResumeList] = useState(false)

    const creditCost = questionCount * 10

    useEffect(() => {
        const fetchAllResumes = async () => {
            try {
                const response = await axios.get(ServerUrl + "/api/interview/all-resumes", { withCredentials: true })
                if (Array.isArray(response.data)) {
                    setResumesList(response.data)
                }
            } catch (error) {
                console.error("Failed to load resumes", error)
            }
        }
        fetchAllResumes()
    }, [])

    const handleUploadResume = async (file) => {
        const fileToUpload = file || resumeFile
        if (!fileToUpload || analyzing) return
        setAnalyzing(true)
        const formdata = new FormData()
        formdata.append("resume", fileToUpload)
        try {
            const result = await axios.post(ServerUrl + "/api/interview/resume", formdata, { withCredentials: true })
            setSkills(result.data.skills || [])
            setResumeText(result.data.resumeText || "")
            setResumeSummary(result.data.experience || "")
            setAnalysisDone(true)
        } catch (error) {
            console.error(error)
        } finally {
            setAnalyzing(false)
        }
    }

    const handleStart = async () => {
        setLoading(true)
        setErrorMsg("")
        try {
            const result = await axios.post(
                ServerUrl + "/api/interview/generate-questions",
                { role, experience, mode, resumeText, skills, count: questionCount },
                { withCredentials: true }
            )

            if (userData) {
                dispatch(setUserData({ ...userData, credits: result.data.creditsLeft }))
            }
            saveActiveInterview(result.data.interviewId)
            onStart(result.data)
        } catch (error) {
            const msg = error?.response?.data?.message || "Failed to start interview. Try again."
            setErrorMsg(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleResume = async () => {
        setResuming(true)
        try {
            const result = await axios.get(
                `${ServerUrl}/api/interview/resume/${activeInterviewId}`,
                { withCredentials: true }
            )
            onResume(result.data)
        } catch {
            clearActiveInterview()
            setActiveInterviewId(null)
        } finally {
            setResuming(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative min-h-screen overflow-hidden bg-[#f6f7f4] px-4 py-8 text-[#151815] sm:px-6 lg:flex lg:items-center lg:py-12">
            <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-lime-200/35 blur-3xl" />

            <div className="relative mx-auto grid w-full max-w-7xl overflow-hidden rounded-4xl border border-white/80 bg-white shadow-[0_30px_90px_-45px_rgba(17,24,39,0.45)] lg:grid-cols-[0.82fr_1.18fr]">
                <motion.div
                    initial={{ x: -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.65 }}
                    className="relative overflow-hidden bg-[#151815] p-7 text-white sm:p-10 lg:p-12">
                    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-20 h-64 w-64 rounded-full bg-lime-300/10 blur-3xl" />

                    <div className="relative flex h-full flex-col">
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3.5 py-2 text-xs font-medium text-emerald-300">
                            <BsStars size={15} />
                            Personalized practice session
                        </div>

                        <h1 className="mt-7 max-w-md text-4xl font-semibold leading-[1.06] tracking-[-0.045em] sm:text-5xl">
                            Build an interview around your next role.
                        </h1>
                        <p className="mt-5 max-w-md text-sm leading-7 text-gray-400 sm:text-base">
                            Choose your focus, set the pace, and optionally add your resume for questions grounded in your experience.
                        </p>

                        <div className="mt-9 space-y-3">
                        {[
                            { icon: <FaUserTie />, title: "Targeted questions", text: "Matched to your role and experience" },
                            { icon: <FaMicrophoneAlt />, title: "Realistic practice", text: "A focused, voice-first interview" },
                            { icon: <FaChartLine />, title: "Actionable feedback", text: "Clear scores and practical next steps" }
                        ].map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.25 + index * 0.1 }}
                                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/6 p-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-[#151815]">
                                    {item.icon}
                                </span>
                                <div>
                                    <p className="text-sm font-medium text-white">{item.title}</p>
                                    <p className="mt-1 text-xs text-gray-400">{item.text}</p>
                                </div>
                            </motion.div>
                        ))}
                        </div>

                    </div>
                </motion.div>

                <motion.div
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.65 }}
                    className="bg-white p-6 sm:p-9 lg:p-12">
                    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Step 1 of 3</p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-[#151815]">Set up your interview</h2>
                            <p className="mt-2 text-sm text-gray-500">Tell your coach what you want to practice.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map((step) => (
                                <span key={step} className={`h-1.5 rounded-full ${step === 1 ? "w-10 bg-emerald-500" : "w-5 bg-gray-200"}`} />
                            ))}
                        </div>
                    </div>

                    {activeInterviewId && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-7 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-amber-900">Your last interview is waiting</p>
                                <p className="mt-1 text-xs text-amber-700">Resume from where you left off or begin a fresh session.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleResume}
                                    disabled={resuming}
                                    className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60">
                                    {resuming ? "Loading..." : "Resume"}
                                </button>
                                <button
                                    onClick={() => { clearActiveInterview(); setActiveInterviewId(null) }}
                                    className="px-2 text-xs font-medium text-amber-800 transition hover:text-amber-950">
                                    Discard
                                </button>
                            </div>
                        </motion.div>
                    )}

                    <div className="space-y-7">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-gray-700">Target role</span>
                                <div className="relative">
                                    <FaUserTie className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="e.g. Frontend Developer" className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100" onChange={(e) => setRole(e.target.value)} value={role} />
                                </div>
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-gray-700">Experience</span>
                                <div className="relative">
                                    <FaBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="e.g. 2 years" className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100" onChange={(e) => setExperience(e.target.value)} value={experience} />
                                </div>
                            </label>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-medium text-gray-700">Interview style</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: "Technical", title: "Technical", text: "Skills & problem solving" },
                                    { value: "HR", title: "HR & behavioral", text: "Communication & fit" }
                                ].map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => setMode(item.value)}
                                        className={`rounded-2xl border p-4 text-left transition ${
                                            mode === item.value
                                                ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                                                : "border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"
                                        }`}>
                                        <span className={`text-sm font-semibold ${mode === item.value ? "text-emerald-800" : "text-gray-800"}`}>{item.title}</span>
                                        <span className="mt-1 block text-xs text-gray-500">{item.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Session length</p>
                                    <p className="mt-0.5 text-xs text-gray-400">Choose how many questions you want to practice.</p>
                                </div>
                                <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-gray-200">
                                    {creditCost} credits
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {QUESTION_COUNTS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setQuestionCount(c)}
                                        className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                                            questionCount === c
                                                ? "border-[#151815] bg-[#151815] text-white shadow-md"
                                                : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300"
                                        }`}>
                                        {c} <span className="hidden text-[10px] font-normal opacity-70 sm:inline">questions</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {resumesList.length > 0 && !analysisDone && !analyzing && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                            <BsFileEarmarkText size={18} />
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Use a previously uploaded resume</p>
                                            <p className="text-xs text-gray-500">{resumesList.length} resume(s) available</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowResumeList(p => !p)}
                                        className="rounded-full bg-emerald-100 hover:bg-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700 transition"
                                    >
                                        {showResumeList ? "Hide List" : "Show Resumes"}
                                    </button>
                                </div>
                                {showResumeList && (
                                    <div className="mt-3 max-h-40 overflow-y-auto space-y-2 pr-1">
                                        {resumesList.map((res) => (
                                            <div
                                                key={res.resumeId}
                                                onClick={() => {
                                                    setRole(res.role || "")
                                                    setExperience(res.experience || "")
                                                    setFetchedResumeName(res.originalName || "resume.pdf")
                                                    setSkills(res.skills || [])
                                                    setResumeText(res.resumeText || "")
                                                    setResumeSummary(res.experience || "")
                                                    setAnalysisDone(true)
                                                    setShowResumeList(false)
                                                }}
                                                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 cursor-pointer hover:border-emerald-400 transition"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-gray-800 truncate">{res.originalName}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {res.role ? `${res.role}` : ""} {res.createdAt ? `• ${new Date(res.createdAt).toLocaleDateString()}` : ""}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Select</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {!analysisDone && (
                            <motion.div
                                whileHover={{ y: -2 }}
                                onClick={() => !analyzing && document.getElementById("resumeUpload").click()}
                                className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 transition sm:p-6 ${
                                    resumeFile ? "border-emerald-300 bg-emerald-50/60" : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                                }`}>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    id="resumeUpload"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files[0]
                                        if (file) {
                                            setResumeFile(file)
                                            handleUploadResume(file)
                                        }
                                    }}
                                />
                                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                        {analyzing ? (
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                                        ) : resumeFile ? (
                                            <BsFileEarmarkText size={22} />
                                        ) : (
                                            <FaFileUpload size={20} />
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-gray-800">
                                            {analyzing ? "Analyzing resume..." : resumeFile ? resumeFile.name : "Personalize with your resume"}
                                        </p>
                                        <p className="mt-1 text-xs leading-5 text-gray-500">
                                            {analyzing ? "Reading skills and experience..." : resumeFile ? "Analyzing your resume to tailor the interview." : "Optional PDF upload for questions based on your skills and experience."}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {analysisDone && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white"><FaCheck size={13} /></span>
                                        <div>
                                            <h3 className="text-sm font-semibold text-emerald-950">Resume ready</h3>
                                            <p className="text-xs text-emerald-700">Uploaded: {resumeFile ? resumeFile.name : fetchedResumeName || "Resume Analysis"}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setResumeFile(null)
                                            setFetchedResumeName("")
                                            setSkills([])
                                            setResumeText("")
                                            setAnalysisDone(false)
                                        }}
                                        className="rounded-full bg-red-100 hover:bg-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition"
                                    >
                                        Upload New
                                    </button>
                                </div>
                                <div>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-800">Experience Summary</p>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-white rounded-xl border border-emerald-100 p-3 shadow-sm">{resumeSummary || "None specified"}</p>
                                </div>
                                {skills.length > 0 && (
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.map((s, i) => (
                                                <span key={i} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <motion.button
                            onClick={handleStart}
                            disabled={!role || !experience || loading}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="group flex w-full items-center justify-center gap-3 rounded-full bg-[#151815] py-4 text-sm font-semibold text-white shadow-xl shadow-gray-900/15 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none">
                            {loading ? "Building your interview..." : "Start interview"}
                            {!loading && <BsArrowRight className="transition-transform group-hover:translate-x-1" />}
                        </motion.button>

                        {loading && (
                            <div className="flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                                <span>Preparing personalized questions...</span>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-600">
                                {errorMsg}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default Step1SetUp
