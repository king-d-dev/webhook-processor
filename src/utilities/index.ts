import { env } from "../env"

export const randomDelay = () => {
  return Math.floor(Math.random() * env.MAX_DELAY_IN_MS) + env.MIN_DELAY_IN_MS
}
