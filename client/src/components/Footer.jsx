import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { BsArrowRight, BsCheck2Circle, BsClock, BsShieldCheck } from 'react-icons/bs'
import { RiRobot3Fill } from 'react-icons/ri'
import AuthModel from './AuthModel'

const Footer = () => {
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
    <footer className="bg-[#f6f7f4] px-4 pb-6 pt-8 sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-4xl bg-[#151815] text-white shadow-2xl shadow-gray-900/10">
        <div className="grid gap-10 border-b border-white/10 px-6 py-10 sm:px-10 lg:grid-cols-[1.3fr_.7fr] lg:items-center lg:px-12 lg:py-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <BsClock />
              Your next practice session can start now
            </span>
            <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
              Build confidence before the interview matters.
            </h2>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-400">
              {['Personalized questions', 'Instant feedback', 'Progress tracking'].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <BsCheck2Circle className="text-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:text-right">
            <button
              onClick={() => openProtectedPage('/interview')}
              className="group inline-flex items-center gap-3 rounded-full bg-emerald-400 px-6 py-3.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300"
            >
              Start practicing
              <BsArrowRight className="transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-3 text-xs text-gray-500">One session. Clear next steps.</p>
          </div>
        </div>

        <div className="grid gap-10 px-6 py-10 sm:px-10 md:grid-cols-[1.5fr_1fr_1fr] lg:px-12">
          <div>
            <button onClick={() => navigate('/')} className="flex items-center gap-3 rounded-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-emerald-950">
                <RiRobot3Fill size={21} />
              </span>
              <span>
                <span className="block text-left font-semibold">IntervuAI</span>
                <span className="block text-[10px] uppercase tracking-[0.16em] text-gray-500">Interview coach</span>
              </span>
            </button>
            <p className="mt-5 max-w-sm text-sm leading-7 text-gray-400">
              Thoughtful AI interview practice designed to sharpen your answers, deepen your skills, and help you show up with confidence.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Product</h3>
            <div className="mt-5 flex flex-col items-start gap-3 text-sm text-gray-300">
              <button onClick={() => openProtectedPage('/interview')} className="transition hover:text-emerald-300">Practice interview</button>
              <button onClick={() => openProtectedPage('/history')} className="transition hover:text-emerald-300">Your progress</button>
              <button onClick={() => navigate('/pricing')} className="transition hover:text-emerald-300">Pricing</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Why IntervuAI</h3>
            <div className="mt-5 flex flex-col gap-3 text-sm text-gray-300">
              <span className="flex items-center gap-2"><BsShieldCheck className="text-emerald-400" /> Interactive interview</span>
              <span>Resume-based questions</span>
              <span>Technical and HR modes</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 px-6 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12">
          <p>© {new Date().getFullYear()} Naam. Practice with purpose.</p>
          <p>Built to help you ace your next interview.</p>
        </div>
      </div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </footer>
  )
}

export default Footer
