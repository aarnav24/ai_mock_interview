import { useState } from "react"
import { FaArrowLeft, FaCheck, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { BsBarChart, BsDownload, BsLightbulb, BsStars } from "react-icons/bs"
import { motion } from "motion/react"
import { buildStyles, CircularProgressbar } from "react-circular-progressbar"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const SCORE_BG = (s) => s >= 7 ? "bg-emerald-100 text-emerald-700" : s >= 4 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"
const SCORE_TEXT = (s) => s >= 7 ? "text-emerald-300" : s >= 4 ? "text-amber-300" : "text-red-300"

const AnswerCollapsible = ({ answer }) => {
    const [open, setOpen] = useState(false)
    if (!answer?.trim()) return <p className="mt-3 text-xs italic text-gray-400">No answer recorded</p>

    return (
        <div className="mt-3">
            <button
                onClick={() => setOpen(p => !p)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-emerald-700"
            >
                {open ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                {open ? "Hide answer" : "Show my answer"}
            </button>
            {open && (
                <p className="mt-3 whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-4 text-sm leading-7 text-gray-600">
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
            <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4]">
                <p className="text-lg text-gray-500">Loading report...</p>
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

    const advice = finalScore >= 8
        ? "Excellent performance. Maintain confidence and structure. Continue refining clarity and supporting answers with strong real-world examples."
        : finalScore >= 5
            ? "Good foundation shown. Improve clarity and structure. Practice delivering concise, confident answers with stronger supporting examples."
            : "Significant improvement required. Focus on structured thinking, clarity, and confident delivery. Practice answering aloud regularly."

    const downloadPDF = () => {
        const doc = new jsPDF("p", "mm", "a4")
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const margin = 20
        const cw = pageWidth - margin * 2
        let y = margin

        const TNR = "times"

        const section = (title) => {
            if (y > pageHeight - 40) { doc.addPage(); y = margin }
            doc.setFont(TNR, "bold")
            doc.setFontSize(11)
            doc.setTextColor(30, 30, 30)
            doc.text(title, margin, y)
            y += 2
            doc.setDrawColor(180)
            doc.line(margin, y, pageWidth - margin, y)
            y += 6
        }

        doc.setFont(TNR, "bold")
        doc.setFontSize(20)
        doc.setTextColor(0, 0, 0)
        doc.text("AI Mock Interview - Performance Report", pageWidth / 2, y, { align: "center" })
        y += 10
        doc.setFont(TNR, "normal")
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Final Score: ${finalScore}/10`, pageWidth / 2, y, { align: "center" })
        y += 14

        section("Score Summary")
        const scoreRows = [
            ["Confidence & Clarity", `${confidence}/10`],
            ["Communication", `${communication}/10`],
            ["Correctness & Completeness", `${correctness}/10`],
            ["Overall Final Score", `${finalScore}/10`]
        ]
        scoreRows.forEach(([label, val]) => {
            doc.setFont(TNR, "normal")
            doc.setFontSize(10)
            doc.setTextColor(30, 30, 30)
            doc.text(label, margin + 4, y)
            doc.setFont(TNR, "bold")
            doc.text(val, margin + cw - 4, y, { align: "right" })
            y += 6
        })
        y += 4

        if (summary) {
            section("Executive Summary")
            doc.setFont(TNR, "normal")
            doc.setFontSize(10)
            doc.setTextColor(30, 30, 30)
            const lines = doc.splitTextToSize(summary, cw)
            lines.forEach(line => {
                if (y > pageHeight - 20) { doc.addPage(); y = margin }
                doc.text(line, margin, y)
                y += 5.5
            })
            y += 4
        }

        section("Professional Advice")
        doc.setFont(TNR, "normal")
        doc.setFontSize(10)
        doc.setTextColor(30, 30, 30)
        const adviceLines = doc.splitTextToSize(advice, cw)
        adviceLines.forEach(line => {
            if (y > pageHeight - 20) { doc.addPage(); y = margin }
            doc.text(line, margin, y)
            y += 5.5
        })
        y += 6

        if (improvementPlan.length > 0) {
            section("Improvement Plan")
            improvementPlan.forEach(item => {
                if (y > pageHeight - 30) { doc.addPage(); y = margin }
                doc.setFont(TNR, "bold")
                doc.setFontSize(10)
                doc.text(`- ${item.topic}`, margin + 2, y)
                y += 5
                item.suggestions?.forEach(s => {
                    const sLines = doc.splitTextToSize(`  - ${s}`, cw - 8)
                    sLines.forEach(sl => {
                        if (y > pageHeight - 20) { doc.addPage(); y = margin }
                        doc.setFont(TNR, "normal")
                        doc.setFontSize(9)
                        doc.setTextColor(50, 50, 50)
                        doc.text(sl, margin + 6, y)
                        y += 5
                    })
                })
                y += 2
            })
            y += 2
        }

        section("Question-by-Question Breakdown")
        if (y > pageHeight - 40) { doc.addPage(); y = margin }

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [["#", "Question", "Your Answer", "Score", "AI Feedback"]],
            body: questionWiseScore.map((q, i) => [
                `${i + 1}${q.isFollowUp ? " follow-up" : ""}`,
                q.question || "",
                q.answer?.slice(0, 200) || "-",
                `${q.score || 0}/10`,
                q.feedback || "No feedback"
            ]),
            styles: { font: TNR, fontSize: 8, cellPadding: 3, valign: "top", textColor: [20, 20, 20] },
            headStyles: { font: TNR, fontStyle: "bold", fillColor: [20, 20, 20], textColor: 255, fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10, halign: "center" },
                1: { cellWidth: 42 },
                2: { cellWidth: 50 },
                3: { cellWidth: 14, halign: "center" },
                4: { cellWidth: "auto" }
            },
            alternateRowStyles: { fillColor: [248, 248, 248] }
        })

        doc.save("AI_Interview_Report.pdf")
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f6f7f4] px-4 py-8 text-[#151815] sm:px-6 lg:px-10 lg:py-12">
            <div className="pointer-events-none absolute -left-32 top-14 h-96 w-96 rounded-full bg-emerald-200/35 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 top-120 h-96 w-96 rounded-full bg-lime-200/30 blur-3xl" />

            <div className="relative mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <button
                            onClick={() => navigate("/history")}
                            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md"
                        >
                            <FaArrowLeft size={14} />
                        </button>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Interview complete</p>
                            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Your performance report</h1>
                            <p className="mt-2 text-sm text-gray-500">A clear view of what worked and where to focus next.</p>
                        </div>
                    </div>
                    <button
                        onClick={downloadPDF}
                        className="flex items-center justify-center gap-2 rounded-full bg-[#151815] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-gray-900/15 transition hover:bg-emerald-700"
                    >
                        <BsDownload size={16} />
                        Download report
                    </button>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mb-6 overflow-hidden rounded-4xl bg-[#151815] p-6 text-white shadow-[0_30px_70px_-40px_rgba(17,24,39,0.8)] sm:p-8 lg:p-10"
                >
                    <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-emerald-400/25 blur-3xl" />
                    <div className="relative grid items-center gap-8 lg:grid-cols-[auto_1fr_auto]">
                        <div className="mx-auto h-36 w-36 shrink-0 sm:h-40 sm:w-40">
                            <CircularProgressbar
                                value={(finalScore / 10) * 100}
                                text={`${finalScore}/10`}
                                styles={buildStyles({
                                    textSize: "17px",
                                    pathColor: "#34d399",
                                    textColor: "#ffffff",
                                    trailColor: "rgba(255,255,255,0.1)",
                                    pathTransitionDuration: 1.2
                                })}
                            />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                                <BsStars />
                                Overall performance
                            </div>
                            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{performanceText}</h2>
                            <p className="mt-3 max-w-xl text-sm leading-7 text-gray-400">{summary || advice}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
                            {skills.map((skill) => (
                                <div key={skill.label} className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-center lg:min-w-48 lg:px-4 lg:text-left">
                                    <div className="flex items-center justify-center gap-3 lg:justify-between">
                                        <p className="hidden text-xs text-gray-400 lg:block">{skill.label}</p>
                                        <p className={`text-lg font-semibold ${SCORE_TEXT(skill.value)}`}>{skill.value}</p>
                                    </div>
                                    <p className="mt-1 truncate text-[10px] text-gray-500 lg:hidden">{skill.label.split(" ")[0]}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
                        >
                            <div className="mb-6 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Question scores</p>
                                    <h3 className="mt-2 text-xl font-semibold tracking-tight">Performance trend</h3>
                                </div>
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                                    <BsBarChart size={19} />
                                </span>
                            </div>
                            <div className="h-64 w-full min-w-0 sm:h-72">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <AreaChart data={questionScoreData} margin={{ top: 8, right: 5, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                                                <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 6" stroke="#e5e7eb" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                        <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                        <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 12px 30px rgba(0,0,0,.08)" }} />
                                        <Area type="monotone" dataKey="score" stroke="#10b981" fill="url(#scoreFill)" strokeWidth={3} dot={{ fill: "#151815", stroke: "#ffffff", strokeWidth: 2, r: 4 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {improvementPlan.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
                            >
                                <div className="mb-6 flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                        <BsLightbulb size={19} />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">Your next steps</p>
                                        <h3 className="mt-1 text-xl font-semibold tracking-tight">Improvement plan</h3>
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {improvementPlan.map((item, i) => (
                                        <div key={i} className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                                            <div className="flex items-start gap-3">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#151815] text-xs font-semibold text-white">{i + 1}</span>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{item.topic}</p>
                                                    <ul className="mt-3 space-y-2">
                                                        {item.suggestions?.map((suggestion, j) => (
                                                            <li key={j} className="flex gap-2 text-xs leading-5 text-gray-500">
                                                                <FaCheck className="mt-1 shrink-0 text-emerald-500" size={9} />
                                                                {suggestion}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mt-6 rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
                >
                    <div className="mb-7">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Detailed review</p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Question breakdown</h3>
                        <p className="mt-2 text-sm text-gray-500">Review your responses and turn the feedback into stronger answers.</p>
                    </div>

                    {questionWiseScore.length > 0 ? (
                        <div className="space-y-4">
                            {questionWiseScore.map((q, i) => (
                                <div key={i} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30 sm:p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Question {i + 1}</p>
                                                {q.isFollowUp && (
                                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Follow-up</span>
                                                )}
                                                {q.topic && (
                                                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200">{q.topic}</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-semibold leading-6 text-gray-800">{q.question || "Question not available"}</p>
                                        </div>
                                        <div className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${SCORE_BG(q.score)}`}>
                                            {q.score ?? 0}/10
                                        </div>
                                    </div>

                                    <AnswerCollapsible answer={q.answer} />

                                    <div className="mt-4 border-t border-gray-200 pt-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                                <BsStars size={11} />
                                            </span>
                                            <p className="text-xs font-semibold text-emerald-700">AI feedback</p>
                                        </div>
                                        <p className="text-sm leading-7 text-gray-600">{q.feedback?.trim() || "No feedback available for this question."}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
                            No question details are available for this report.
                        </div>
                    )}
                </motion.section>
            </div>
        </div>
    )
}

export default Step3Report
