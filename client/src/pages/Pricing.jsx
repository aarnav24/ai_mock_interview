import React from 'react'
import { FaArrowLeft } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const Pricing = () => {
  const navigate = useNavigate()

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "₹0",
      credits: 200,
      description: "Perfect for beginners starting interview preparation.",
      features: [
        "300 AI Interview Credits",
        "Basic Performance Report",
        "Voice Interview Access",
        "Limited History Tracking"
      ],
      default: true
    },
    {
      id: "basic",
      name: "Starter Pack",
      price: "₹100",
      credits: 500,
      description: "Great for focused practice and skill improvement.",
      features: [
        "500 AI Interview Credits",
        "Detailed Feedback",
        "Performance Analytics",
        "Full Interview History"
      ]
    },
    {
      id: "pro",
      name: "Pro pack",
      price: "₹500",
      credits: 3000,
      description: "Best value for serious job preparation.",
      features: [
        "3000 AI Interview Credits.",
        "Advanced AI Feedback",
        "Skill Trend Analysis",
        "Priority AI Processing"
      ],
      badge: "Best Value"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-5 py-16 px-6">
      <div className="max-w-6xl mx-auto mb-14 flex items-start gap-4">
        <button onClick={() => navigate("/")} className="mt-2 p-3 rounded-full bg-white shadow hover:shadow-md transition">
          <FaArrowLeft className="text-gray-600" />
        </button>

        <div className="text-center w-full">
          <h1 className="text-4xl font-bold text-gray-800">Choose Your Plan</h1>
          <p className="text-gray-500 mt-3 text-lg">
            Flexible pricing to match your interview preparation goals.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Pricing