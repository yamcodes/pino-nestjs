/**
 * Patch for TestCase utility to improve test stability with Vitest
 */

// Track active servers to ensure they are all closed
const activeServers = new Set()
const originalListen = require('http').Server.prototype.listen

// Override the listen method to track servers
require('http').Server.prototype.listen = function (...args) {
  activeServers.add(this)
  return originalListen.apply(this, args)
}

// Create a cleanup function to close lingering servers
global.cleanupServers = function () {
  console.log(`[Vitest] Cleaning up ${activeServers.size} remaining servers`)
  for (const server of activeServers) {
    try {
      if (server && typeof server.close === 'function') {
        server.close()
      }
    } catch (e) {
      console.warn('[Vitest] Error closing server:', e.message)
    }
  }
  activeServers.clear()
}

// Make sure the TestCase class closes servers properly
setTimeout(() => {
  try {
    // Attempt to load the TestCase
    const testCasePath = require.resolve('./test-case')
    const TestCaseModule = require(testCasePath)
    const OriginalTestCase = TestCaseModule.TestCase

    // Create a patched version that ensures proper cleanup
    class PatchedTestCase extends OriginalTestCase {
      constructor(...args) {
        super(...args)
        this.servers = new Set()
      }

      async run(...paths) {
        try {
          return await super.run(...paths)
        } catch (error) {
          console.error('[Vitest] TestCase run error:', error)
          throw error
        } finally {
          // Clean up on completion
          global.cleanupServers()
        }
      }
    }

    // Replace the original TestCase with our patched version
    TestCaseModule.TestCase = PatchedTestCase
    console.log('[Vitest] TestCase patched for improved stability')
  } catch (e) {
    console.warn('[Vitest] Could not patch TestCase:', e.message)
  }
}, 0)

// Register cleanup for afterEach
if (typeof afterEach === 'function') {
  afterEach(() => {
    global.cleanupServers()
  })
}

// Register final cleanup
if (typeof afterAll === 'function') {
  afterAll(() => {
    global.cleanupServers()
  })
}
