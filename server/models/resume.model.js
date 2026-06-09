import mongoose from "mongoose"
import resumeConn from "../config/resumeDB.js"

const resumeSchema = new mongoose.Schema({
    userId:       { type: mongoose.Schema.Types.ObjectId, required: true },
    originalName: { type: String, default: "" },
    buffer:       { type: Buffer, required: true },
    size:         { type: Number },
    compressed:   { type: Boolean, default: true }
}, { timestamps: true })

const Resume = resumeConn.model("Resume", resumeSchema)

export default Resume
