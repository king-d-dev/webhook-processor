import path from "path"
import { Worker } from "worker_threads"

import { env } from "../env"
import { logger } from "./log-processor"

export type QueueItem<T = any> = {
  name?: string
  id: string
  data: T
  logId: string
  retryCount: number
}

export class Queue {
  private queue: QueueItem[] = []
  private maxConcurrency = env.MAX_CONCURRENCY
  private maxQueueSize = env.MAX_QUEUE_SIZE
  private maxQueueRetriesPerJob = env.MAX_QUEUE_RETRIES_PER_JOB
  public processingCount = 0
  public name: string
  private timerHandle: NodeJS.Timeout

  constructor(name: string) {
    this.queue = []
    this.name = name

    this.timerHandle = setInterval(() => {
      this.process()
    }, 1000)
  }

  add(item: QueueItem) {
    if (this.queue.length >= this.maxQueueSize) return false

    this.queue.push({ ...item, retryCount: item.retryCount || 0 })
    return true
  }

  remove(id: string) {
    this.queue = this.queue.filter((i) => i.id !== id)
  }

  retry(startTime: number, item: QueueItem) {
    if (item.retryCount < this.maxQueueRetriesPerJob) {
      console.log("retrying", item.id)
      this.add({ ...item, retryCount: item.retryCount + 1 })
    } else {
      console.log("FAILED", item.id)
      logger.logProcessingTime(item.logId, startTime)
      logger.updateLog(item.logId, { processing_failed: true })
    }
  }

  async processSingleItem(item: QueueItem) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(path.join(__dirname, "./queue-worker.js"))
      const startTime = Date.now()
      worker.postMessage({ queueName: this.name, item })

      worker.on("message", (message) => {
        if (message.success) {
          console.log("DONE PROCESSING", item.id, message)
          logger.logProcessingTime(item.logId, startTime)
        } else {
          this.retry(startTime, item)
        }
        resolve(undefined)
      })
      worker.on("error", reject)
      worker.on("exit", (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with code ${code}`))
      })
    })
  }

  async process() {
    if (this.processingCount >= this.maxConcurrency) {
      console.log("max concurrency reached", this.processingCount)
      return
    }

    const spliceCount = this.maxConcurrency - this.processingCount
    const items = this.queue.splice(0, spliceCount)

    const promises = items.map((item) => {
      this.processingCount++
      return this.processSingleItem(item).finally(() => {
        this.processingCount--
      })
    })
    await Promise.all(promises)
  }

  get size() {
    return this.queue.length
  }

  get isProcessing() {
    return this.processingCount > 0
  }

  async flush() {
    while (this.size > 0 || this.isProcessing) {
      console.log("Waiting for queue to finish...", this.size, this.isProcessing)
      let handle: NodeJS.Timeout | undefined

      await new Promise((resolve) => {
        handle = setTimeout(resolve, 2000)
      })
      if (handle) clearTimeout(handle)
    }

    this.stop()
  }

  stop() {
    clearInterval(this.timerHandle)
  }
}

export const webHookQueue = new Queue("webhook")
