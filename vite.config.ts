import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    hmr: {
      overlay: false // Disable error overlay that can interfere with auth
    }
  },
  define: {
    // Ensure environment variables are available
    'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV === 'development')
  }
});
