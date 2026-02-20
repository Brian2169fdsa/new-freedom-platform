import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      '**/lib/**/*',
      '**/node_modules/**/*'
    ],
    coverage: {
      provider: 'v8' // or 'v8'
    },
    //silent: true
  },
})