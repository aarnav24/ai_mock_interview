import { WebSocket } from "ws"

const DG_URL =
    "wss://api.deepgram.com/v1/listen" +
    "?model=nova-2&language=en-US&smart_format=true" +
    "&interim_results=true&endpointing=300&punctuate=true"

export const handleDeepgramWebSocket = (clientWs) => {
    const earlyBuffer = []
    let dgReady = false

    const dgWs = new WebSocket(DG_URL, {
        headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` }
    })

    dgWs.on("open", () => {
        console.log("[deepgram] connected — flushing", earlyBuffer.length, "chunks")
        dgReady = true
        for (const chunk of earlyBuffer) dgWs.send(chunk)
        earlyBuffer.length = 0
    })

    dgWs.on("message", (data) => {
        try {
            const msg = JSON.parse(data)
            const transcript = msg?.channel?.alternatives?.[0]?.transcript
            if (!transcript) return
            if (clientWs.readyState !== 1) return
            clientWs.send(JSON.stringify({
                type: "transcript",
                transcript,
                isFinal: msg.is_final,
                speechFinal: msg.speech_final
            }))
        } catch {}
    })

    dgWs.on("error", (err) => console.error("[deepgram] DG error:", err.message))
    dgWs.on("close", (code) => console.log("[deepgram] DG closed:", code))

    // Buffer audio from client until Deepgram is ready
    clientWs.on("message", (data) => {
        if (dgReady) {
            dgWs.send(data)
        } else {
            earlyBuffer.push(data)
        }
    })

    clientWs.on("close", () => {
        console.log("[deepgram] client closed")
        dgWs.close()
    })

    clientWs.on("error", (err) => {
        console.error("[deepgram] client error:", err.message)
        dgWs.close()
    })
}
