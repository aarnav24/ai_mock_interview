import { useState } from "react"
import { FaArrowLeft, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { motion } from "motion/react"
import { buildStyles, CircularProgressbar } from "react-circular-progressbar"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const SCORE_COLOR = (s) => s >= 7 ? "text-emerald-600" : s >= 4 ? "text-yellow-600" : "text-red-500"
const SCORE_BG    = (s) => s >= 7 ? "bg-emerald-100 text-emerald-700" : s >= 4 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"

const AnswerCollapsible = ({ answer }) => {
    const [open, setOpen] = useState(false)
    if (!answer?.trim()) return <p className="text-xs text-gray-400 italic">No answer recorded</p>
    return (
        <div className="mt-3">
            <button
                onClick={() => setOpen(p => !p)}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium"
            >
                {open ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                {open ? "Hide answer" : "Show my answer"}
            </button>
            {open && (
                <p className="mt-2 text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                    {answer}
                </p>
            )}
        </div>
    )
}

const Step3Report = ({ report }) => {
    const navigate = useNavigate()

    if (!report) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 text-lg">Loading Report...</p>
            </div>
        )
    }

    const {
        finalScore = 0,
        confidence = 0,
        communication = 0,
        correctness = 0,
        summary = "",
        improvementPlan = [],
        questionWiseScore = []
    } = report

    const questionScoreData = questionWiseScore.map((q, i) => ({ name: `Q${i + 1}`, score: q.score || 0 }))

    const skills = [
        { label: "Confidence & Clarity", value: confidence },
        { label: "Communication", value: communication },
        { label: "Correctness & Completeness", value: correctness }
    ]

    const performanceText = finalScore >= 8
        ? "Ready for job opportunities."
        : finalScore >= 5
            ? "Needs minor improvement before interviews."
            : "Significant improvement required."

    const shortTagline = finalScore >= 8
        ? "Excellent clarity and structured responses."
        : finalScore >= 5
            ? "Good foundation, refine articulation."
            : "Work on clarity and confidence."

    const advice = finalScore >= 8
        ? "Excellent performance. Maintain confidence and structure. Continue refining clarity and supporting answers with strong real-world examples."
        : finalScore >= 5
            ? "Good foundation shown. Improve clarity and structure. Practice delivering concise, confident answers with stronger supporting examples."
            : "Significant improvement required. Focus on structured thinking, clarity, and confident delivery. Practice answering aloud regularly."

    const downloadPDF = () => {
        const doc = new jsPDF("p", "mm", "a4")
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 20
        const contentWidth = pageWidth - margin * 2
        let y = 15

        doc.setFont("helvetica", "bold")
        doc.setFontSize(20)
        doc.setTextColor(34, 197, 94)
        doc.text("AI Interview Performance Report", pageWidth / 2, y, { align: "center" })
        y += 8
        doc.setDrawColor(34, 197, 94)
        doc.line(margin, y + 2, pageWidth - margin, y + 2)
        y += 15

        doc.setFillColor(240, 253, 244)
        doc.roundedRect(margin, y, contentWidth, 18, 4, 4, "F")
        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        doc.text(`Final Score: ${finalScore}/10`, pageWidth / 2, y + 12, { align: "center" })
        y += 35

        doc.setFillColor(249, 250, 251)
        doc.roundedRect(margin, y, contentWidth, 34, 4, 4, "F")
        doc.setFontSize(12)
        doc.text(`Confidence & Clarity: ${confidence}`, margin + 10, y + 11)
        doc.text(`Communication: ${communication}`, margin + 10, y + 20)
        doc.text(`Correctness & Completeness: ${correctness}`, margin + 10, y + 29)
        y += 45

        if (summary) {
            doc.setFillColor(255, 255, 255)
            doc.setDrawColor(220)
            doc.roundedRect(margin, y, contentWidth, 30, 4, 4)
            doc.setFont("helvetica", "bold")
            doc.setFontSize(11)
            doc.text("Executive Summary", margin + 10, y + 8)
            doc.setFont("helvetica", "normal")
            const splitSummary = doc.splitTextToSize(summary, contentWidth - 20)
            doc.text(splitSummary.slice(0, 3), margin + 10, y + 16)
            y += 40
        }

        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(220)
        doc.roundedRect(margin, y, contentWidth, 30, 4, 4)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(11)
        doc.text("Professional Advice", margin + 10, y + 8)
        doc.setFont("helvetica", "normal")
        const splitAdvice = doc.splitTextToSize(advice, contentWidth - 20)
        doc.text(splitAdvice, margin + 10, y + 16)
        y += 45

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [["#", "Question", "Answer", "Score", "Feedback"]],
            body: questionWiseScore.map((q, i) => [
                `${i + 1}`,
                q.question || "",
                q.answer?.slice(0, 120) || "—",
                `${q.score || 0}/10`,
                q.feedback || "No feedback"
            ]),
            styles: { fontSize: 7, cellPadding: 2, valign: "top" },
            headStyles: { fillColor: [34, 197, 94], textColor: 255, fontSize: 7, halign: "center" },
            columnStyles: {
                0: { cellWidth: 8, halign: "center" },
                1: { cellWidth: 40 },
                2: { cellWidth: 45 },
                3: { cellWidth: 16, halign: "center" },
                4: { cellWidth: "auto" }
            },
            alternateRowStyles: { fillColor: [249, 250, 251] }
        })

        doc.save("AI_Interview_Report.pdf")
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 px-4 sm:px-6 lg:px-10 py-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4 flex-wrap">
                    <button
                        onClick={() => navigate("/history")}
                        className="mt-1 p-3 rounded-full bg-white shadow hover:shadow-md transition"
                    >
                        <FaArrowLeft className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Interview Analytics Dashboard</h1>
                        <p className="text-gray-500 mt-2">AI-powered performance insights</p>
                    </div>
                </div>
                <button
                    onClick={downloadPDF}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-md transition font-semibold text-sm sm:text-base text-nowrap"
                >
                    Download PDF
                </button>
            </div>

            {/* Executive summary */}
            {summary && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-white rounded-2xl shadow-lg p-6 border-l-4 border-emerald-500"
                >
                    <h2 className="text-base font-semibold text-gray-700 mb-2">Executive Summary</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">{summary}</p>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left column */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 text-center"
                    >
                        <h3 className="text-gray-500 mb-4 text-sm">Overall Performance</h3>
                        <div className="relative w-24 h-24 mx-auto">
                            <CircularProgressbar
                                value={(finalScore / 10) * 100}
                                text={`${finalScore}/10`}
                                styles={buildStyles({
                                    textSize: "20px",
                                    pathColor: "#10b981",
                                    textColor: "#ef4444",
                                    trailColor: "#e5e7eb"
                                })}
                            />
                        </div>
                        <div className="mt-4">
                            <p className="font-semibold text-gray-800">{performanceText}</p>
                            <p className="text-gray-500 text-sm mt-1">{shortTagline}</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8"
                    >
                        <h3 className="text-base font-semibold text-gray-700 mb-6">Skill Evaluation</h3>
                        <div className="space-y-5">
                            {skills.map((s, i) => (
                                <div key={i}>
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span>{s.label}</span>
                                        <span className="font-semibold text-emerald-600">{s.value}</span>
                                    </div>
                                    <div className="bg-gray-200 h-2 rounded-full">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${s.value * 10}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Improvement plan */}
                    {improvementPlan.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white rounded-2xl shadow-lg p-6"
                        >
                            <h3 className="text-base font-semibold text-gray-700 mb-4">Improvement Plan</h3>
                            <div className="space-y-4">
                                {improvementPlan.map((item, i) => (
                                    <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-4">
                                        <p className="text-sm font-semibold text-red-600 mb-2">{item.topic}</p>
                                        <ul className="space-y-1">
                                            {item.suggestions?.map((s, j) => (
                                                <li key={j} className="text-xs text-gray-600 flex gap-2">
                                                    <span className="text-red-400 mt-0.5">•</span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right column */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8"
                    >
                        <h3 className="text-base font-semibold text-gray-700 mb-4">Performance Trend</h3>
                        <div className="h-64 sm:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={questionScoreData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 10]} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="score" stroke="#22c55e" fill="#bbf7d0" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8"
                    >
                        <h3 className="text-base font-semibold text-gray-700 mb-6">Question Breakdown</h3>
                        <div className="space-y-6">
                            {questionWiseScore.map((q, i) => (
                                <div key={i} className="bg-gray-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <p className="text-xs text-gray-400">Question {i + 1}</p>
                                                {q.isFollowUp && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Follow-up</span>
                                                )}
                                                {q.topic && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{q.topic}</span>
                                                )}
                                            </div>
                                            <p className="font-semibold text-gray-800 text-sm leading-relaxed">{q.question || "Question not available"}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full font-bold text-xs w-fit ${SCORE_BG(q.score)}`}>
                                            {q.score ?? 0}/10
                                        </div>
                                    </div>

                                    <AnswerCollapsible answer={q.answer} />

                                    <div className="mt-3 bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                        <p className="text-sm text-emerald-600 font-bold mb-1">AI Feedback</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                            {q.feedback?.trim() || "No feedback available for this question."}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default Step3Report
