const { defineConfig } = require('cypress')
require('dotenv').config()

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.DEV_CLIENT_HOST,
    // setupNodeEvents(on, config) {
    //   // implement node event listeners here
    // },
    env: {
      DEV_CLIENT_HOST: process.env.DEV_CLIENT_HOST,
      API_HOST: process.env.API_HOST,
      API_TEST_EMAIL: process.env.API_TEST_EMAIL,
    },
    // chromeWebSecurity: true,
  },
})
