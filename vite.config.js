// vite.config.js

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs'; // Import fs module

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $components: path.resolve('./src/components'),
      $lib: path.resolve('./src/lib')
    }
  },
  ssr: {
    external: [
      'jsonwebtoken',
      '@prisma/client',
      '@fullcalendar/svelte'
      // Removed '@fullcalendar/core/main.css' as it should not be externalized
    ]
  },
  server: {
    host: true,
    port: 443, // Use 8443 to avoid needing root privileges
	proxy: {},
  },
});
