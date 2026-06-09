import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from "axios"
import { ServerUrl } from '../App'
import Step3Report from '../components/Step3Report'

const InterviewReport = ({ isPublic = false }) => {
    const { id } = useParams()
    const [report, setReport] = useState(null)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const url = isPublic
                    ? `${ServerUrl}/api/interview/public/${id}`
                    : `${ServerUrl}/api/interview/report/${id}`

                const config = isPublic ? {} : { withCredentials: true }
                const result = await axios.get(url, config)
                setReport(result.data)
            } catch (err) {
                setError(err?.response?.data?.message || "Failed to load report.")
            }
        }
        fetchReport()
    }, [id, isPublic])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        )
    }

    if (!report) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 text-lg">Loading Report...</p>
            </div>
        )
    }

    return <Step3Report report={report} />
}

export default InterviewReport
