import { useState } from 'react'
import Step1SetUp from '../components/Step1SetUp'
import Step2Interview from '../components/Step2Interview'
import Step3Report from '../components/Step3Report'

const InterviewPage = () => {
    const [step, setStep] = useState(1)
    const [interviewData, setInterviewData] = useState(null)
    const [report, setReport] = useState(null)

    const handleStart = (data) => {
        setInterviewData(data)
        setStep(2)
    }

    const handleResume = (data) => {
        setInterviewData(data)
        setStep(2)
    }

    const handleFinish = (reportData) => {
        setReport(reportData)
        setStep(3)
    }

    return (
        <div>
            <div className="min-h-screen bg-gray-50">
                {step === 1 && (
                    <Step1SetUp onStart={handleStart} onResume={handleResume} />
                )}
                {step === 2 && (
                    <Step2Interview interviewData={interviewData} onFinish={handleFinish} />
                )}
                {step === 3 && (
                    <Step3Report report={report} />
                )}
            </div>
        </div>
    )
}

export default InterviewPage
