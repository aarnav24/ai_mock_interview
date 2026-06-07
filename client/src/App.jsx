import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import { useDispatch } from "react-redux"
import axios from "axios"
import { setUserData } from "./redux/userSlice.js"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import ErrorBoundary from "./components/ErrorBoundary.jsx"
import Home from "./pages/Home"
import Auth from "./pages/Auth"
import InterviewPage from "./pages/InterviewPage.jsx"
import InterviewHistory from "./pages/InterviewHistory.jsx"
import Pricing from "./pages/Pricing.jsx"
import InterviewReport from "./pages/InterviewReport.jsx"

export const ServerUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000"

const App = () => {
    const dispatch = useDispatch()

    useEffect(() => {
        const getUser = async () => {
            try {
                const result = await axios.get(`${ServerUrl}/api/user/current-user`, { withCredentials: true })
                dispatch(setUserData(result.data))
            } catch {
                dispatch(setUserData(null))
            }
        }
        getUser()
    }, [dispatch])

    return (
        <ErrorBoundary>
            <div className="min-h-screen w-full relative bg-white overflow-x-hidden">
                {/* Soft Yellow Glow */}
                <div
                    className="fixed inset-0 z-40 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle at top right, #d1fae5 0%, transparent 70%)`,
                        opacity: 0.6,
                        mixBlendMode: "multiply",
                    }}
                />
                
                {/* Content */}
                <div className="relative z-10 min-h-screen flex flex-col">
                    <Routes>
                        <Route path="/"         element={<Home />} />
                        <Route path="/auth"     element={<Auth />} />
                        <Route path="/pricing"  element={<Pricing />} />
                        <Route path="/interview" element={
                            <ProtectedRoute><InterviewPage /></ProtectedRoute>
                        } />
                        <Route path="/history" element={
                            <ProtectedRoute><InterviewHistory /></ProtectedRoute>
                        } />
                        <Route path="/report/:id" element={
                            <ProtectedRoute><InterviewReport /></ProtectedRoute>
                        } />
                    </Routes>
                </div>
            </div>
        </ErrorBoundary>
    )
}

export default App
