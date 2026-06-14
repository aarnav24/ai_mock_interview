import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { FaArrowLeft } from "react-icons/fa"
import { BsArrowRight, BsBarChart, BsClockHistory, BsSearch, BsStars } from "react-icons/bs"
import {
    Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend
} from "recharts"
import { ServerUrl } from "../App"

const MODES = ["All", "Technical", "HR"]

const getScoreColor = (score) => {
    if (score >= 7) return "text-emerald-600"
    if (score >= 4) return "text-amber-600"
    return "text-red-500"
}

const getScoreTheme = (score) => {
    if (score >= 7) {
        return {
            card: "hover:border-emerald-200 hover:shadow-emerald-900/5",
            icon: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
            arrow: "group-hover:text-emerald-600",
        }
    }
    if (score >= 4) {
        return {
            card: "hover:border-amber-200 hover:shadow-amber-900/5",
            icon: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
            arrow: "group-hover:text-amber-600",
        }
    }
    return {
        card: "hover:border-red-200 hover:shadow-red-900/5",
        icon: "bg-red-100 text-red-600 ring-1 ring-red-200",
        arrow: "group-hover:text-red-500",
    }
}

const InterviewHistory = () => {
    const [interviews, setInterviews] = useState([])
    const [progress, setProgress] = useState([])
    const [roleFilter, setRoleFilter] = useState("")
    const [modeFilter, setModeFilter] = useState("All")
    const navigate = useNavigate()

    useEffect(() => {
        const fetch = async () => {
            try {
                const [listRes, progressRes] = await Promise.all([
                    axios.get(`${ServerUrl}/api/interview/get-interviews`, { withCredentials: true }),
                    axios.get(`${ServerUrl}/api/interview/progress`, { withCredentials: true })
                ])
                setInterviews(listRes.data)
                setProgress(progressRes.data.reverse())
            } catch (error) {
                console.error(error)
            }
        }
        fetch()
    }, [])

    const progressChartData = progress.map((p, i) => ({
        name: `#${i + 1}`,
        score: p.finalScore,
        confidence: p.confidence,
        communication: p.communication
    }))

    const filteredInterviews = interviews.filter(item => {
        const matchRole = roleFilter === "" || item.role.toLowerCase().includes(roleFilter.toLowerCase())
        const matchMode = modeFilter === "All" || item.mode === modeFilter
        return matchRole && matchMode
    })

    const completedCount = interviews.filter(item => item.status === "Completed").length
    const averageScore = interviews.length
        ? (interviews.reduce((sum, item) => sum + (item.finalScore || 0), 0) / interviews.length).toFixed(1)
        : "0.0"

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f6f7f4] px-5 py-10 text-[#151815] sm:px-6 lg:px-10 lg:py-12">
            <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-200/35 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 top-96 h-96 w-96 rounded-full bg-lime-200/30 blur-3xl" />

            <div className="relative mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <button
                            onClick={() => navigate("/")}
                            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md"
                        >
                            <FaArrowLeft size={14} />
                        </button>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Practice history</p>
                            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Track your interview growth</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
                                Review past sessions, spot progress patterns, and jump back into detailed performance reports.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    {[
                        ["Total sessions", interviews.length],
                        ["Completed", completedCount],
                        ["Average score", `${averageScore}/10`],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm backdrop-blur">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">{label}</p>
                            <p className="mt-2 text-2xl font-semibold text-[#151815]">{value}</p>
                        </div>
                    ))}
                </div>

                {progressChartData.length > 1 && (
                    <div className="mb-8 rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Progress trend</p>
                                <h2 className="mt-2 text-xl font-semibold tracking-tight">Performance over time</h2>
                            </div>
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                <BsBarChart size={19} />
                            </span>
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressChartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="4 6" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 12px 30px rgba(0,0,0,.08)" }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#151815", stroke: "#ffffff", strokeWidth: 2 }} name="Overall" />
                                    <Line type="monotone" dataKey="confidence" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Confidence" />
                                    <Line type="monotone" dataKey="communication" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Communication" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="relative flex-1">
                            <BsSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter by role..."
                                value={roleFilter}
                                onChange={e => setRoleFilter(e.target.value)}
                                className="w-full rounded-full border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                            />
                        </label>
                        <div className="flex gap-2 overflow-x-auto">
                            {MODES.map(m => (
                                <button
                                    key={m}
                                    onClick={() => setModeFilter(m)}
                                    className={`shrink-0 rounded-full px-5 py-3 text-sm font-medium transition ${modeFilter === m
                                        ? "bg-[#151815] text-white shadow-lg shadow-gray-900/10"
                                        : "border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50"
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filteredInterviews.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-gray-300 bg-white/80 p-12 text-center shadow-sm">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                            <BsClockHistory size={21} />
                        </div>
                        <h2 className="mt-5 text-xl font-semibold tracking-tight">No interviews found</h2>
                        <p className="mt-2 text-sm text-gray-500">Start your first interview or adjust your filters.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredInterviews.map((item) => {
                            const score = item.finalScore || 0
                            const scoreTheme = getScoreTheme(score)

                            return (
                            <button
                                key={item._id}
                                onClick={() => navigate(`/report/${item._id}`)}
                                className={`group w-full rounded-3xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl sm:p-6 ${scoreTheme.card}`}
                            >
                                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-start gap-4">
                                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${scoreTheme.icon}`}>
                                            <BsStars size={20} />
                                        </span>
                                        <div>
                                            <h3 className="text-lg font-semibold tracking-[-0.02em] text-gray-900">{item.role}</h3>
                                            <p className="mt-1 text-sm text-gray-500">{item.experience}</p>
                                            <p className="mt-2 text-xs text-gray-400">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-5 md:justify-end">
                                        <div className="text-left md:text-right">
                                            <p className={`text-2xl font-semibold ${getScoreColor(score)}`}>
                                                {score}/10
                                            </p>
                                            <p className="text-xs text-gray-400">Overall score</p>
                                        </div>
                                        <span className={`rounded-full px-4 py-1.5 text-xs font-medium ${item.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                            {item.status}
                                        </span>
                                        <BsArrowRight className={`hidden text-gray-300 transition group-hover:translate-x-1 sm:block ${scoreTheme.arrow}`} />
                                    </div>
                                </div>
                            </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default InterviewHistory
