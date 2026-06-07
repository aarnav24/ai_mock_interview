import { useSelector } from "react-redux"
import { Navigate } from "react-router-dom"

const ProtectedRoute = ({ children }) => {
    const userData = useSelector(state => state.user.userData)

    if (userData === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" />
            </div>
        )
    }

    if (userData === null) {
        return <Navigate to="/" replace />
    }

    return children
}

export default ProtectedRoute
