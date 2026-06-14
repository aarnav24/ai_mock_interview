import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { signInWithPopup } from 'firebase/auth'
import axios from 'axios'
import { FcGoogle } from 'react-icons/fc'
import { FaTimes } from 'react-icons/fa'
import {
  BsArrowLeft,
  BsBarChart,
  BsCheck2,
  BsFileEarmarkText,
  BsMic,
  BsShieldCheck,
  BsStars,
} from 'react-icons/bs'
import { RiRobot3Fill } from 'react-icons/ri'
import { auth, provider } from '../utils/firebase'
import { ServerUrl } from '../App'
import { setUserData } from '../redux/userSlice'

const benefits = [
  {
    icon: <BsMic size={17} />,
    title: 'Practice naturally',
    text: 'Realistic voice-first interviews',
  },
  {
    icon: <BsBarChart size={17} />,
    title: 'Improve faster',
    text: 'Clear feedback after every session',
  },
  {
    icon: <BsFileEarmarkText size={17} />,
    title: 'Make it personal',
    text: 'Questions shaped around your resume',
  },
]

const Auth = ({ isModel = false }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleGoogleAuth = async () => {
    if (isSigningIn) return

    try {
      setIsSigningIn(true)
      setErrorMessage('')

      const response = await signInWithPopup(auth, provider)
      const idToken = await response.user.getIdToken()
      const result = await axios.post(`${ServerUrl}/api/auth/google`, { idToken }, { withCredentials: true })

      dispatch(setUserData(result.data))
      if (!isModel) navigate('/')
    } catch (error) {
      console.error(error)
      dispatch(setUserData(null))

      if (error?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage('We could not sign you in. Please check your connection and try again.')
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  const authCard = (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45 }}
      className={`relative overflow-hidden bg-white ${isModel
          ? 'w-full rounded-[1.75rem] p-6 shadow-2xl shadow-gray-900/20 sm:p-8'
          : 'rounded-[2rem] border border-gray-200 p-7 shadow-2xl shadow-gray-900/10 sm:p-10'
        }`}
    >

      <div className="relative">

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#151815] text-emerald-300">
            <RiRobot3Fill size={22} />
          </span>
          <span>
            <span className="block font-semibold tracking-[-0.02em]">Naam</span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">Interview coach</span>
          </span>
        </div>

        <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <BsStars />
          Your practice space is ready
        </span>

        <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#151815] sm:text-4xl">
          Sign in and give your best answer.
        </h1>
        <p className="mt-4 text-sm leading-7 text-gray-500">
          Continue to personalized interviews, honest feedback, and a clear view of your progress.
        </p>

        {isModel && (
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {['Private', 'Personalized', 'Actionable'].map((item) => (
              <span key={item} className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
                <BsCheck2 className="text-emerald-600" />
                {item}
              </span>
            ))}
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
            {errorMessage}
          </div>
        )}

        <button
          onClick={handleGoogleAuth}
          disabled={isSigningIn}
          className="group mt-7 flex w-full items-center justify-between rounded-2xl bg-[#151815] px-4 py-3.5 text-sm font-medium text-white shadow-lg shadow-gray-900/10 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <FcGoogle size={18} />
            </span>
            {isSigningIn ? 'Signing you in...' : 'Continue with Google'}
          </span>
          {isSigningIn ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
          )}
        </button>

        <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-gray-400">
          <BsShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={15} />
          <p>We use Google only to securely create your account. Your interview practice stays private.</p>
        </div>
      </div>
    </motion.div>
  )

  if (isModel) return authCard

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f7f4] px-5 py-6 sm:px-6 lg:py-10">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-lime-200/30 blur-3xl" />

      <button
        onClick={() => navigate('/')}
        className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <BsArrowLeft />
        Back to home
      </button>

      <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-10 py-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="hidden lg:block"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-medium text-emerald-800 backdrop-blur">
            <BsStars className="text-emerald-500" />
            Practice with purpose
          </span>
          <h2 className="mt-7 max-w-xl text-6xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#151815]">
            Every strong answer starts with practice.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-gray-500">
            A calm, private place to test your thinking, sharpen your communication, and prepare for the questions that matter.
          </p>

          <div className="mt-10 grid max-w-xl gap-3">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
                className="flex items-center gap-4 rounded-2xl border border-white bg-white/60 p-4 backdrop-blur"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  {benefit.icon}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{benefit.title}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{benefit.text}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <section className="mx-auto w-full max-w-lg">{authCard}</section>
      </div>
    </main>
  )
}

export default Auth