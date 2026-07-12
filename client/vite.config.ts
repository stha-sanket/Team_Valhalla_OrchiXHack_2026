import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Leading dot allows any subdomain — ngrok free URLs rotate on restart.
    allowedHosts: [".ngrok-free.app", ".devtunnels.ms"],
  }
})
