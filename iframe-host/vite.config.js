import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5180,
    strictPort: true,
    host: true, // This allows the server to be accessed via the network IP
  },
})
