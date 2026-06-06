// // npm install @deepgram/sdk ws
// // DEEPGRAM_API_KEY must be in .env

// import { createClient } from "@deepgram/sdk"
// import WebSocket from "ws"

// // SDK v3+ dropped LiveTranscriptionEvents from main export — use string literals
// const DG = {
//     Open:       "open",
//     Transcript: "Results",
//     Error:      "error",
//     Close:      "close",
// }

// const deepgram = createClient(process.env.DEEPGRAM_API_KEY)

// class DeepgramConnection {
//     static #count = 0
//     static KEEPALIVE_MS = 8000
//     static IDLE_TIMEOUT_MS = 15000
//     static BUFFER_MAX = 200

//     #connId
//     #ws
//     #connection
//     #dgReady = false
//     #finished = false
//     #earlyBuffer = []
//     #hasReceivedAudio = false
//     #keepAliveTimer = null
//     #idleTimer = null

//     constructor(ws) {
//         this.#connId = ++DeepgramConnection.#count
//         this.#ws = ws
//     }

//     start() {
//         console.log(`[deepgram] conn #${this.#connId} opened`)

//         this.#connection = deepgram.listen.live({
//             model: "nova-2",
//             language: "en-US",
//             smart_format: true,
//             interim_results: true,
//             endpointing: 300,
//             punctuate: true,
//         })

//         this.#attachClientListeners()
//         this.#attachDeepgramListeners()
//         this.#startIdleTimer()
//     }

//     // ── Private: client WebSocket ─────────────────────────────────────────────

//     #attachClientListeners() {
//         this.#ws.on("message", (data) => this.#onClientMessage(data))
//         this.#ws.on("close", () => this.#finish("client closed"))
//         this.#ws.on("error", (err) => {
//             console.error(`[deepgram] conn #${this.#connId} client error:`, err.message)
//             this.#finish("client error")
//         })
//     }

//     #onClientMessage(data) {
//         if (!this.#hasReceivedAudio) {
//             this.#hasReceivedAudio = true
//             clearTimeout(this.#idleTimer)
//         }

//         if (!this.#dgReady) {
//             if (this.#earlyBuffer.length < DeepgramConnection.BUFFER_MAX) {
//                 this.#earlyBuffer.push(data)
//             }
//             return
//         }

//         if (this.#connection.getReadyState() === 1) {
//             this.#connection.send(data)
//         }
//     }

//     // ── Private: Deepgram connection ──────────────────────────────────────────

//     #attachDeepgramListeners() {
//         this.#connection.on(DG.Open,       () => this.#onDgOpen())
//         this.#connection.on(DG.Transcript, (data) => this.#onDgTranscript(data))
//         this.#connection.on(DG.Error,      (err) => this.#onDgError(err))
//         this.#connection.on(DG.Close,      () => this.#onDgClose())
//     }

//     #onDgOpen() {
//         this.#dgReady = true
//         console.log(`[deepgram] conn #${this.#connId} Deepgram open — flushing ${this.#earlyBuffer.length} buffered chunks`)

//         for (const chunk of this.#earlyBuffer) {
//             this.#connection.send(chunk)
//         }
//         this.#earlyBuffer = []

//         this.#startKeepalive()
//     }

//     #onDgTranscript(data) {
//         const transcript = data.channel?.alternatives?.[0]?.transcript
//         const isFinal = data.is_final
//         const speechFinal = data.speech_final

//         if (!transcript) return
//         if (this.#ws.readyState !== WebSocket.OPEN) return

//         this.#ws.send(JSON.stringify({ type: "transcript", transcript, isFinal, speechFinal }))
//     }

//     #onDgError(err) {
//         console.error(`[deepgram] conn #${this.#connId} Deepgram error:`, err.message)
//         if (this.#ws.readyState === WebSocket.OPEN) {
//             this.#ws.send(JSON.stringify({ type: "error", message: err.message }))
//         }
//     }

//     #onDgClose() {
//         console.log(`[deepgram] conn #${this.#connId} Deepgram closed`)
//         clearInterval(this.#keepAliveTimer)
//     }

//     // ── Private: timers ───────────────────────────────────────────────────────

//     #startIdleTimer() {
//         this.#idleTimer = setTimeout(() => {
//             if (!this.#hasReceivedAudio) {
//                 console.warn(`[deepgram] conn #${this.#connId} idle timeout — closing`)
//                 this.#finish("idle timeout")
//                 if (this.#ws.readyState === WebSocket.OPEN) this.#ws.close()
//             }
//         }, DeepgramConnection.IDLE_TIMEOUT_MS)
//     }

//     #startKeepalive() {
//         this.#keepAliveTimer = setInterval(() => {
//             if (this.#connection.getReadyState() === 1 && typeof this.#connection.keepAlive === "function") {
//                 this.#connection.keepAlive()
//             }
//         }, DeepgramConnection.KEEPALIVE_MS)
//     }

//     // ── Private: teardown ─────────────────────────────────────────────────────

//     #finish(reason) {
//         if (this.#finished) return
//         this.#finished = true
//         clearInterval(this.#keepAliveTimer)
//         clearTimeout(this.#idleTimer)
//         this.#connection.finish()
//         console.log(`[deepgram] conn #${this.#connId} finished (${reason})`)
//     }
// }

// export const handleDeepgramWebSocket = (ws) => {
//     new DeepgramConnection(ws).start()
// }
