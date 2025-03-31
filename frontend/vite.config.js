import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  esbuild: {
    loader: {
      ".js": 'jsx',
    }
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173, // Your Vite app's port
    hmr: {
      protocol: 'wss', 
      host: 'for-testing.ngrok-free.app', 
      clientPort: 443,
    },
    cors: true,
    allowedHosts: ['localhost', 'for-testing.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Your backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  base: '/', // Use '/' instead of './' for correct routing
});
