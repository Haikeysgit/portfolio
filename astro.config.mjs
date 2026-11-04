import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.obaseki.dev',
  integrations: [react(), mdx()],
  vite: {
    // Pre-bundle React's JSX runtimes up front. Without this, adding a dependency while the dev
    // server runs can leave a stale cache and the demos fail with "jsxDEV is not a function".
    optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'] },
    // File-change events don't always fire on this Windows setup, so the dev server polls instead.
    server: { watch: { usePolling: true, interval: 300 } },
  },
});
