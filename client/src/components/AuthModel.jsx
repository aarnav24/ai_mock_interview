import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'motion/react'
import { FaTimes } from 'react-icons/fa'
import Auth from '../pages/Auth'

const AuthModel = ({ onClose }) => {
  const { userData } = useSelector((state) => state.user)

  useEffect(() => {
    if (userData) onClose()
  }, [userData, onClose])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-[#151815]/55 px-4 py-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      <div className="relative w-full max-w-lg" style={{ position: 'relative' }}>
        <Auth isModel />
        <button
          onClick={onClose}
          aria-label="Close sign in"
          style={{ position: 'absolute', right: '16px', top: '16px', zIndex: 1000 }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-100 hover:text-gray-900"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </motion.div>
  )
}

export default AuthModel