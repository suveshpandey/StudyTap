// -----------------------------------------------------------------------------
// File: vite.config.ts
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Vite build tool configuration for React frontend
// -----------------------------------------------------------------------------

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
