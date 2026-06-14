import { useState } from 'react'
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa'
import { BsArrowRight, BsCreditCard, BsStars } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ServerUrl } from '../App'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 'Rs 0',
    credits: 200,
    description: 'Perfect for beginners starting interview preparation.',
    features: [
      '300 AI Interview Credits',
      'Basic Performance Report',
      'Voice Interview Access',
      'Limited History Tracking',
    ],
    default: true,
  },
  {
    id: 'basic',
    name: 'Starter Pack',
    price: 'Rs 100',
    credits: 500,
    description: 'Great for focused practice and skill improvement.',
    features: [
      '500 AI Interview Credits',
      'Detailed Feedback',
      'Performance Analytics',
      'Full Interview History',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: 'Rs 500',
    credits: 3000,
    description: 'Best value for serious job preparation and improvement.',
    features: [
      '3000 AI Interview Credits',
      'Advanced AI Feedback',
      'Skill Trend Analysis',
      'Priority AI Processing',
    ],
    badge: 'Best Value',
  },
]

const Pricing = () => {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState('free')
  const [loadingPlan, setLoadingPlan] = useState(null)
  const dispatch = useDispatch()

  const handlePayment = async (plan) => {
    try {
      setLoadingPlan(plan.id)

      const amount =
        plan.id === 'basic' ? 100 :
        plan.id === 'pro' ? 500 : 0

      const result = await axios.post(ServerUrl + '/api/payment/order', {
        planId: plan.id,
        amount,
        credits: plan.credits,
      }, { withCredentials: true })

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: result.data.amount,
        currency: 'INR',
        name: 'MockMate',
        description: `${plan.name} - ${plan.credits} Credits`,
        order_id: result.data.id,
        handler: async function (response) {
          const verifyPayment = await axios.post(ServerUrl + '/api/payment/verify', response, { withCredentials: true })
          dispatch(setUserData(verifyPayment.data.user))
          alert('Payment successful. Credits added!')
          navigate('/')
        },
        theme: {
          color: '#10b981',
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
      setLoadingPlan(null)
    } catch (error) {
      console.error(error)
      setLoadingPlan(null)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f7f4] px-5 py-10 text-[#151815] sm:px-6 lg:py-16">
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-lime-200/30 blur-3xl" />

      <div className="relative mx-auto mb-14 flex max-w-6xl items-start gap-4">
        <button
          onClick={() => navigate('/')}
          className="mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md"
        >
          <FaArrowLeft size={14} />
        </button>

        <div className="w-full text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm backdrop-blur">
            <BsStars className="text-emerald-500" />
            Add credits when your practice habit grows
          </div>
          <h1 className="text-5xl font-semibold leading-tight tracking-[-0.055em] text-[#151815] sm:text-6xl">
            Choose your practice plan
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-500">
            Flexible interview credits for realistic practice, sharper feedback, and stronger answers before the real conversation.
          </p>
        </div>
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id
          const isFeatured = plan.id === 'pro'

          return (
            <motion.article
              key={plan.id}
              whileHover={!plan.default ? { y: -6 } : undefined}
              onClick={() => !plan.default && setSelectedPlan(plan.id)}
              className={`relative flex min-h-[520px] flex-col overflow-hidden rounded-[2rem] border p-7 transition-all duration-300 ${
                isFeatured
                  ? 'border-[#151815] bg-[#151815] text-white shadow-[0_30px_80px_-40px_rgba(17,24,39,0.9)]'
                  : isSelected
                    ? 'border-emerald-300 bg-white shadow-xl shadow-emerald-900/5'
                    : 'border-gray-200 bg-white shadow-sm hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5'
              } ${plan.default ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {isFeatured && <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/25 blur-3xl" />}

              {plan.badge && (
                <div className="absolute right-6 top-6 rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-semibold text-[#151815] shadow">
                  {plan.badge}
                </div>
              )}

              {plan.default && (
                <div className="absolute right-6 top-6 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                  Default
                </div>
              )}

              <div className="relative">
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${isFeatured ? 'bg-emerald-400 text-[#151815]' : 'bg-emerald-100 text-emerald-700'}`}>
                  <BsCreditCard size={21} />
                </div>

                <h3 className={`text-2xl font-semibold tracking-[-0.025em] ${isFeatured ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>

                <div className="mt-5">
                  <span className={`text-5xl font-semibold tracking-[-0.06em] ${isFeatured ? 'text-white' : 'text-emerald-600'}`}>
                    {plan.price}
                  </span>
                  <p className={`mt-2 text-sm ${isFeatured ? 'text-gray-400' : 'text-gray-500'}`}>
                    {plan.credits} interview credits
                  </p>
                </div>

                <p className={`mt-5 text-sm leading-7 ${isFeatured ? 'text-gray-400' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="relative mt-7 space-y-3 text-left">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <FaCheckCircle className={`text-sm ${isFeatured ? 'text-emerald-300' : 'text-emerald-500'}`} />
                    <span className={`text-sm ${isFeatured ? 'text-gray-300' : 'text-gray-700'}`}>{feature}</span>
                  </div>
                ))}
              </div>

              {!plan.default && (
                <button
                  disabled={loadingPlan === plan.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isSelected) {
                      setSelectedPlan(plan.id)
                    } else {
                      handlePayment(plan)
                    }
                  }}
                  className={`relative mt-auto flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition disabled:opacity-60 ${
                    isSelected
                      ? isFeatured
                        ? 'bg-emerald-400 text-[#151815] hover:bg-emerald-300'
                        : 'bg-[#151815] text-white hover:bg-emerald-700'
                      : isFeatured
                        ? 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15'
                        : 'bg-gray-100 text-gray-700 hover:bg-emerald-50'
                  }`}
                >
                  {loadingPlan === plan.id ? 'Processing...' : isSelected ? 'Proceed to pay' : 'Select plan'}
                  {isSelected && loadingPlan !== plan.id && <BsArrowRight />}
                </button>
              )}

              {plan.default && (
                <div className="relative mt-auto rounded-2xl bg-gray-50 p-4 text-sm text-gray-500 ring-1 ring-gray-200">
                  You already start with enough credits to try the core interview flow.
                </div>
              )}
            </motion.article>
          )
        })}
      </div>

      <div className="relative mx-auto mt-10 max-w-6xl rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 px-6 py-6 text-center text-sm text-emerald-900/70">
        Each interview question costs credits based on your selected session length. Your balance updates automatically after purchase.
      </div>
    </div>
  )
}

export default Pricing
