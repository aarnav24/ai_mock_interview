import { Component } from "react"

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        console.error("[ErrorBoundary]", error, info.componentStack)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
                    <div className="text-center max-w-md p-8">
                        <h1 className="text-2xl font-bold mb-3 text-red-400">Something went wrong</h1>
                        <p className="text-gray-400 mb-6 text-sm">{this.state.error?.message}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
