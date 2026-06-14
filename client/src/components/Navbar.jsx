import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import axios from 'axios'
import { BsArrowRight, BsBarChart, BsCoin, BsPlus, BsStars } from 'react-icons/bs'
import { FaUserAstronaut } from 'react-icons/fa'
import { HiOutlineLogout } from 'react-icons/hi'
import { RiRobot3Fill } from 'react-icons/ri'
import { ServerUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import AuthModel from './AuthModel'

const Navbar = () => {
  const { userData } = useSelector((state) => state.user)
  const [showCreditPopup, setShowCreditPopup] = useState(false)
  const [showUserPopup, setShowUserPopup] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const openProtectedPage = (path) => {
    setShowCreditPopup(false)
    setShowUserPopup(false)

    if (!userData) {
      setShowAuth(true)
      return
    }

    navigate(path)
  }

  const handleLogout = async () => {
    try {
      await axios.get(`${ServerUrl}/api/auth/logout`, { withCredentials: true })
      dispatch(setUserData(null))
      setShowCreditPopup(false)
      setShowUserPopup(false)
      navigate('/')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <header className="relative z-50 bg-[#f6f7f4] px-4 pt-5 sm:px-6">
      <motion.nav
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-[1.4rem] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_12px_35px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:px-5"
      >
        <button
          onClick={() => navigate('/')}
          aria-label="Go to home"
          className="group flex items-center gap-3 rounded-xl"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#151815] text-emerald-300 transition group-hover:bg-emerald-600 group-hover:text-white">
            <RiRobot3Fill size={21} />
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-[15px] font-semibold leading-none tracking-[-0.02em]">Naam</span>
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-gray-400">Interview coach</span>
          </span>
        </button>

        <div className="hidden items-center gap-1 rounded-full bg-gray-100/80 p-1 md:flex">
          <button
            onClick={() => navigate('/')}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm"
          >
            Home
          </button>
          <button
            onClick={() => openProtectedPage('/history')}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-white hover:text-gray-900"
          >
            Progress
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-white hover:text-gray-900"
          >
            Pricing
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              onClick={() => {
                if (!userData) {
                  setShowAuth(true)
                  return
                }
                setShowCreditPopup(!showCreditPopup)
                setShowUserPopup(false)
              }}
              aria-label="View credits"
              className="flex h-10 items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-100 sm:px-4"
            >
              <BsCoin size={17} />
              {userData?.credits || 0}
            </button>

            {showCreditPopup && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-14 mt-3 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-900/10 sm:right-0"
              >
                <div className="rounded-xl bg-[#151815] p-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Available balance</span>
                    <BsStars className="text-emerald-300" />
                  </div>
                  <p className="mt-2 text-3xl font-semibold">{userData?.credits || 0}</p>
                  <p className="mt-1 text-xs text-gray-400">interview credits</p>
                </div>
                <button
                  onClick={() => {
                    setShowCreditPopup(false)
                    navigate('/pricing')
                  }}
                  className="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Get more credits
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <BsPlus />
                  </span>
                </button>
              </motion.div>
            )}
          </div>

          {userData ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserPopup(!showUserPopup)
                  setShowCreditPopup(false)
                }}
                aria-label="Open profile menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#151815] text-sm font-semibold text-white ring-2 ring-white transition hover:bg-emerald-700"
              >
                {userData?.name?.slice(0, 1).toUpperCase()}
              </button>

              {showUserPopup && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-3 w-64 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl shadow-gray-900/10"
                >
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="truncate text-sm font-semibold text-gray-900">{userData?.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">Keep showing up. You are improving.</p>
                  </div>
                  <button
                    onClick={() => openProtectedPage('/history')}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <BsBarChart className="text-emerald-600" />
                    Interview history
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-500 transition hover:bg-red-50"
                  >
                    <HiOutlineLogout size={18} />
                    Log out
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="group flex h-10 items-center gap-2 rounded-full bg-[#151815] px-4 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <FaUserAstronaut size={15} className="sm:hidden" />
              <span className="hidden sm:inline">Sign in</span>
              <BsArrowRight className="hidden transition-transform group-hover:translate-x-0.5 sm:block" />
            </button>
          )}
        </div>
      </motion.nav>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </header>
  )
}

export default Navbar