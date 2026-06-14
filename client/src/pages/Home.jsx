import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  BsArrowRight,
  BsBarChart,
  BsCheck2,
  BsClock,
  BsFileEarmarkText,
  BsMic,
  BsPlayFill,
  BsRobot,
  BsShieldCheck,
  BsStars,
} from 'react-icons/bs'
import { HiSparkles } from 'react-icons/hi'
import { RiDoubleQuotesL } from 'react-icons/ri'
import Navbar from '../components/Navbar'
import AuthModel from '../components/AuthModel'
import Footer from '../components/Footer'
import evalImg from '../assets/ai-ans.png'
import resumeImg from '../assets/resume.png'
import pdfImg from '../assets/pdf.png'
import analyticsImg from '../assets/history.png'

const processSteps = [
  {
    icon: <BsFileEarmarkText size={22} />,
    number: '01',
    title: 'Set your target',
    desc: 'Upload your resume, choose a role, and select the interview style you want to practice.',
  },
  {
    icon: <BsMic size={22} />,
    number: '02',
    title: 'Interview naturally',
    desc: 'Answer adaptive questions in a realistic, voice-first conversation with your AI interviewer.',
  },
  {
    icon: <BsBarChart size={22} />,
    number: '03',
    title: 'Improve with clarity',
    desc: 'Review precise feedback, scores, and practical next steps after every session.',
  },
]

const capabilities = [
  {
    image: evalImg,
    icon: <BsStars size={18} />,
    label: 'Smart evaluation',
    title: 'Understand every answer',
    desc: 'Get focused feedback on technical accuracy, communication, structure, and confidence.',
    className: 'md:col-span-2',
  },
  {
    image: resumeImg,
    icon: <BsFileEarmarkText size={18} />,
    label: 'Personalized',
    title: 'Questions from your resume',
    desc: 'Practice the project and experience questions recruiters are most likely to ask.',
  },
  {
    image: analyticsImg,
    icon: <BsBarChart size={18} />,
    label: 'Progress tracking',
    title: 'See yourself improve',
    desc: 'Track interview scores and skill trends across every practice session.',
  },
  {
    image: pdfImg,
    icon: <BsFileEarmarkText size={18} />,
    label: 'Actionable reports',
    title: 'Take your feedback anywhere',
    desc: 'Download a clear report with strengths, gaps, and your most useful next steps.',
    className: 'md:col-span-2',
  },
]

const Home = () => {
  const { userData } = useSelector((state) => state.user)
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  const openProtectedPage = (path) => {
    if (!userData) {
      setShowAuth(true)
      return
    }
    navigate(path)
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f7f4] text-[#151815]">
      <Navbar />

      <main>
        <section className="relative px-5 pb-24 pt-16 sm:px-6 lg:pb-32 lg:pt-24">
          <div className="pointer-events-none absolute left-48 top-0 h-120 w-120 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="pointer-events-none absolute right-40 top-24 h-104 w-104 rounded-full bg-lime-200/30 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm backdrop-blur">
                <HiSparkles className="text-emerald-500" size={17} />
                Your private AI interview coach
              </div>

              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-[4.75rem]">
                Walk into your next interview{' '}
                <span className="relative whitespace-nowrap text-emerald-600">
                  ready.
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 260 16" fill="none">
                    <path d="M4 11C70 3 170 3 256 8" stroke="#86efac" strokeWidth="7" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-gray-600">
                Practice realistic technical and HR interviews, get honest AI feedback, and build the confidence to answer clearly under pressure.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <motion.button
                  onClick={() => openProtectedPage('/interview')}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex items-center justify-center gap-3 rounded-full bg-[#151815] px-7 py-4 font-medium text-white shadow-xl shadow-gray-900/15 transition hover:bg-emerald-700"
                >
                  Start a free interview
                  <BsArrowRight className="transition-transform group-hover:translate-x-1" />
                </motion.button>
                <button
                  onClick={() => openProtectedPage('/history')}
                  className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white/70 px-7 py-4 font-medium transition hover:border-gray-400 hover:bg-white"
                >
                  <BsPlayFill size={18} />
                  View your progress
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-500">
                {['Timer-based simulation', 'Instant feedback', 'Personalized practice'].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <BsCheck2 size={13} />
                    </span>
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 35 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative mx-auto w-full max-w-125"
            >
              <div className="absolute -inset-5 -rotate-3 rounded-[2.5rem] bg-emerald-200/50" />
              <div className="relative overflow-hidden rounded-4xl border border-white/80 bg-white p-4 shadow-[0_30px_80px_-35px_rgba(17,24,39,0.45)]">
                <div className="rounded-3xl bg-[#151815] p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-[#151815]">
                        <BsRobot size={22} />
                      </div>
                      <div>
                        <p className="font-medium">Technical interview</p>
                        <p className="mt-0.5 text-xs text-gray-400">Frontend Developer · Live</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                      08:42
                    </span>
                  </div>

                  <div className="my-9 flex h-24 items-center justify-center gap-1.5">
                    {[20, 34, 52, 78, 45, 64, 92, 58, 35, 70, 48, 28, 42, 65, 32].map((height, index) => (
                      <motion.span
                        key={index}
                        animate={{ height: [`${height}%`, `${Math.max(20, height - 18)}%`, `${height}%`] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: index * 0.06 }}
                        className="w-1.5 rounded-full bg-emerald-400"
                      />
                    ))}
                  </div>

                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-300">Current question</p>
                    <p className="mt-2 text-sm leading-6 text-gray-200">
                      How would you improve the rendering performance of a large React application?
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 pb-1 pt-4">
                  {[
                    ['Confidence', '8.6'],
                    ['Communication', '8.2'],
                    ['Correctness', '9.0'],
                  ].map(([label, score]) => (
                    <div key={label} className="rounded-2xl bg-gray-50 px-3 py-4 text-center">
                      <p className="text-lg font-semibold">{score}</p>
                      <p className="mt-1 text-[11px] text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-8 -left-5 hidden items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xl sm:flex"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <BsShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold">Built for growth</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="px-5 pb-28 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-4xl border border-emerald-100 bg-emerald-50/70 px-6 py-7">
            <div className="grid gap-5 text-center sm:grid-cols-3">
              {[
                ['Realistic', 'Adaptive questions'],
                ['Immediate', 'Actionable feedback'],
                ['Measurable', 'Progress over time'],
              ].map(([value, label], index) => (
                <div key={value} className={index === 1 ? 'sm:border-x sm:border-emerald-200' : ''}>
                  <p className="text-xl font-semibold text-emerald-800">{value}</p>
                  <p className="mt-1 text-sm text-emerald-800/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-28 sm:px-6 lg:pb-36">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">How it works</p>
              <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">One simple loop. Better answers every time.</h2>
              <p className="mt-5 text-lg leading-8 text-gray-500">Turn interview anxiety into a repeatable practice habit that actually moves you forward.</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {processSteps.map((item, index) => (
                <motion.article
                  key={item.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white p-7 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5"
                >
                  <span className="absolute right-6 top-3 text-7xl font-semibold tracking-[-0.08em] text-gray-100 transition group-hover:text-emerald-50">{item.number}</span>
                  <div className="relative">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#151815] text-white">{item.icon}</span>
                    <h3 className="mt-8 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-gray-500">{item.desc}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#151815] px-5 py-28 text-white sm:px-6 lg:py-36">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">Built around you</p>
                <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Feedback that tells you what to do next.</h2>
              </div>
              <p className="max-w-md leading-7 text-gray-400">No vague scores. Each session gives you a clear picture of what worked, what did not, and where to focus next.</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {capabilities.map((item, index) => (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className={`group grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/6 p-6 transition hover:border-emerald-400/40 hover:bg-white/9 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8 ${item.className || ''}`}
                >
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                      {item.icon}
                      {item.label}
                    </span>
                    <h3 className="mt-5 text-2xl font-semibold">{item.title}</h3>
                    <p className="mt-3 max-w-md text-sm leading-7 text-gray-400">{item.desc}</p>
                  </div>
                  <img src={item.image} alt="" className="mt-6 h-32 w-40 object-contain transition duration-500 group-hover:scale-105 sm:mt-0" />
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-28 sm:px-6 lg:py-36">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <div className="rounded- bg-emerald-500 p-8 text-emerald-950 sm:p-10">
              <RiDoubleQuotesL size={32} className="opacity-50" />
              <p className="mt-8 text-2xl font-semibold leading-snug tracking-tight">
                Great interviews are rarely improvised. They are practiced, reviewed, and practiced again.
              </p>
              <div className="mt-10 flex items-center gap-3 text-sm font-medium">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950 text-emerald-300">
                  <BsRobot />
                </span>
                Your AI interview coach
              </div>
            </div>

            <div className="relative overflow-hidden rounded-4xl bg-white p-8 shadow-sm ring-1 ring-gray-200 sm:p-12">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-100 blur-2xl" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                  <BsClock />
                  Your next session is minutes away
                </span>
                <h2 className="mt-7 max-w-xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Ready to sound like your best self?</h2>
                <p className="mt-5 max-w-lg leading-7 text-gray-500">Start with one realistic interview and leave with a sharper answer plan.</p>
                <button
                  onClick={() => openProtectedPage('/interview')}
                  className="group mt-8 flex items-center gap-3 rounded-full bg-[#151815] px-7 py-4 font-medium text-white transition hover:bg-emerald-700"
                >
                  Practice now
                  <BsArrowRight className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
      <Footer />
    </div>
  )
}

export default Home
