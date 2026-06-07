import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { FaArrowLeft } from "react-icons/fa"
import {
    Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend
} from "recharts"
import { ServerUrl } from "../App"

const MODES = ["All", "Technical", "HR"]

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-10">
            <div className="w-[90vw] lg:w-[70vw] max-w-[90%] mx-auto">
                <div className="mb-8 flex items-start gap-4">
                    <button
                        onClick={() => navigate("/")}
                        className="mt-1 p-3 rounded-full bg-white shadow hover:shadow-md transition"
                    >
                        <FaArrowLeft className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Interview History</h1>
                        <p className="text-gray-500 mt-2">Track your past interviews and performance reports</p>
                    </div>
                </div>

                {/* Progress chart */}
                {progressChartData.length > 1 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                        <h2 className="text-base font-semibold text-gray-700 mb-4">Performance Over Time</h2>
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 10]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Overall" />
                                    <Line type="monotone" dataKey="confidence" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" name="Confidence" />
                                    <Line type="monotone" dataKey="communication" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" name="Communication" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <input
                        type="text"
                        placeholder="Filter by role..."
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <div className="flex gap-2">
                        {MODES.map(m => (
                            <button
                                key={m}
                                onClick={() => setModeFilter(m)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${modeFilter === m
                                    ? "bg-emerald-600 text-white shadow"
                                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interview list */}
                {filteredInterviews.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl shadow text-center">
                        <p className="text-gray-500">No interviews found. Start your first interview.</p>
                    </div>
                ) : (
                    <div className="grid gap-5">
                        {filteredInterviews.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(`/report/${item._id}`)}
                                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{item.role}</h3>
                                        <p className="text-gray-500 text-sm mt-1">{item.experience} ● {item.mode}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="text-right">
                                            <p className={`text-xl font-bold ${item.finalScore >= 7 ? "text-emerald-600" : item.finalScore >= 4 ? "text-yellow-600" : "text-red-500"}`}>
                                                {item.finalScore || 0}/10
                                            </p>
                                            <p className="text-xs text-gray-400">Overall Score</p>
                                        </div>
                                        <span className={`px-4 py-1 rounded-full text-xs font-medium ${item.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default InterviewHistory
