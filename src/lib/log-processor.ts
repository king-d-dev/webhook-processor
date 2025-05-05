import { webHookQueue } from "./queue"

type LogSummary = {
  total_requests_received: number
  total_requests_processed: {
    failed_count: number // how many requests were being processed but failed during processing
    success_count: number // how many requests were being processed and succeeded
  }
  average_processing_time_in_sec: {
    failed_during_processing: number
    succeeded_processing: number
  }
  current_queue_length: number
  total_requests_failed_with_429: number
}

type Log = {
  accepted: boolean
  processing_time_in_sec: number
  processing_failed: boolean
}

class Logger {
  private logs: Record<string, Log> = {}

  addLog(logId: string) {
    this.logs[logId] = {
      accepted: false,
      processing_time_in_sec: 0,
      processing_failed: false,
    }
  }

  reset() {
    this.logs = {}
  }

  updateLog(logId: string, log: Partial<Log>) {
    this.logs[logId] = { ...this.logs[logId], ...log }
  }

  logProcessingTime(logId: string, startTime: number) {
    const endTime = Date.now()
    const processingTimeInSeconds = (endTime - startTime) / 1000
    this.updateLog(logId, { processing_time_in_sec: processingTimeInSeconds })
  }

  generateSummary() {
    const summary: LogSummary = {
      total_requests_received: 0,
      total_requests_processed: { failed_count: 0, success_count: 0 },
      average_processing_time_in_sec: { failed_during_processing: 0, succeeded_processing: 0 },
      current_queue_length: webHookQueue.size,
      total_requests_failed_with_429: 0,
    }

    let totalProcessingTimeInSec = { failed: 0, success: 0 }

    for (const logId in this.logs) {
      const log = this.logs[logId]

      summary.total_requests_received++
      if (log.accepted) {
        if (log.processing_failed) {
          summary.total_requests_processed.failed_count++
          totalProcessingTimeInSec.failed += log.processing_time_in_sec
        } else {
          summary.total_requests_processed.success_count++
          totalProcessingTimeInSec.success += log.processing_time_in_sec
        }
      } else {
        summary.total_requests_failed_with_429++
      }
    }

    summary.average_processing_time_in_sec = {
      failed_during_processing: totalProcessingTimeInSec.failed / summary.total_requests_processed.failed_count,
      succeeded_processing: totalProcessingTimeInSec.success / summary.total_requests_processed.success_count,
    }
    return summary
  }

  countRequestsReceived() {}
}

export const logger = new Logger()
