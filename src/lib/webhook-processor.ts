import { randomDelay } from "../utilities"

export const handleWebhookProcessing = async (data: any, logId: string) => {
  const delay = randomDelay()
  console.log(logId, "delay", delay)

  // simulate a 10% failure
  if (Math.random() < 0.1) {
    throw new Error("Failed to process webhook")
  }

  await new Promise((resolve) => setTimeout(resolve, delay))
}
