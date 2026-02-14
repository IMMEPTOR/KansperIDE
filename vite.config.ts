import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,          // фиксируем порт на 5173
    strictPort: true,    // если занят — ошибка, а не авто-смена
    hmr: {
      clientPort: 5173   // важно для Tauri
    }
  }
});