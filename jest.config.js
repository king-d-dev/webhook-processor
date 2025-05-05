require("dotenv").config()

const config = {
  verbose: true,
  preset: "ts-jest",
  testTimeout: 180000,
  testEnvironment: "node",
  restoreMocks: true,
}

module.exports = config
