import { nanoid } from "nanoid"
import { app } from "../app"
import { webHookQueue, QueueItem } from "../lib/queue"
import { logger } from "../lib/log-processor"

app.post("/webhook", (req, res) => {
  const data = req.body
  const id = nanoid()

  logger.addLog(id)
  const queueItem: QueueItem = { id, data, logId: id, retryCount: 0 }

  const success = webHookQueue.add(queueItem)
  if (!success) {
    logger.updateLog(id, { accepted: false })
    res.status(429).send("Too many requests")
  } else {
    logger.updateLog(id, { accepted: true })
    res.sendStatus(202)
  }
})

app.get("/metrics", (req, res) => {
  const summary = logger.generateSummary()
  res.json(summary)
})
