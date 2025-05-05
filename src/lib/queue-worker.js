import { parentPort } from "worker_threads"
import { handleWebhookProcessing } from "./webhook-processor"

// reason for a js file is because worker_threads expects a js file.
parentPort?.on("message", async ({ queueName, item }) => {
  switch (queueName) {
    case "webhook":
      await handleWebhookProcessing(item.data, item.logId)
        .then(() => {
          parentPort.postMessage({ success: true })
        })
        .catch((err) => {
          parentPort.postMessage({ success: false })
        })
      break
    default:
      throw new Error(`Unknown job type: ${item.name}`)
  }
})
