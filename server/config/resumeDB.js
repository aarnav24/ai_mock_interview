import mongoose from "mongoose"

const resumeConn = mongoose.createConnection(process.env.RESUME_MONGODB_URL)

resumeConn.on("connected", () => console.log("Resume DB connected"))
resumeConn.on("error", (err) => console.error("Resume DB error:", err.message))

export default resumeConn
