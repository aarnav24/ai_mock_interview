const NotFound = () => {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="max-w-3xl w-full text-center">

                <div
                    className="h-100 flex items-center justify-center bg-center bg-no-repeat bg-contain"
                    style={{
                        backgroundImage:
                            "url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')"
                    }}
                >
                    <h1 className="text-7xl md:text-8xl font-bold text-gray-800">
                        404
                    </h1>
                </div>

                <div className="-mt-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                        Looks like you're lost
                    </h2>

                    <p className="text-gray-600 mb-6">
                        The page you are looking for is unavailable.
                    </p>

                    <button
                        onClick={() => (window.location.href = "/")}
                        className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition"
                    >
                        Go Home
                    </button>
                </div>

            </div>
        </div>
    )
}

export default NotFound