import "dotenv/config"
import { cleanEnv, num, str } from "envalid"

const env = cleanEnv(process.env, {
  PORT: num({ default: 3000 }),
  MAX_CONCURRENCY: num({ default: 10 }),
  MAX_QUEUE_SIZE: num({ default: 100 }),
  MAX_QUEUE_RETRIES_PER_JOB: num({ default: 1 }),
  MAX_DELAY_IN_MS: num({ default: 300 }),
  MIN_DELAY_IN_MS: num({ default: 100 }),
})

export { env }
