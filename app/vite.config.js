import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuração do Vite (build) e do Vitest (testes das regras de negócio)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
