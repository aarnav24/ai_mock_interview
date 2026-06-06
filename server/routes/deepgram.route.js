import express from "express"
import { handleDeepgramWebSocket } from "../controllers/deepgram.controller.js"

const router = express.Router()

router.ws("/live", (ws, req) => {
    handleDeepgramWebSocket(ws)
})

export default router