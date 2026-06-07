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
        </ErrorBoundary>
    )
}

export default App
