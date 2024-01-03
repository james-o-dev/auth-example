require('dotenv').config()
const { cleanupTests } = require('./shared')

const teardown = async () => {
  await cleanupTests()
}

module.exports = teardown