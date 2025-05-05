import http from "http"
import { app } from "./app"
import { env } from "./env"
import "./routes"
import { webHookQueue } from "./lib/queue"

const server = http.createServer(app)

async function main() {
  server.listen(env.PORT, () => console.log(`Server running on PORT ${env.PORT}`))
}

main()

process.on("SIGINT", async () => {
  console.log("Received SIGINT. Wrapping up pending tasks...")

  try {
    await webHookQueue.flush()
    console.log("Done. Exiting.", webHookQueue.size, webHookQueue.isProcessing)
    process.exit(0)
  } catch (err) {
    console.error("Error while waiting for queue to finish:", err)
    process.exit(1)
  }
})
