// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import db from '@astrojs/db';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: vercel({
    webAnalytics: {
      enabled: true
    },
    imageService: true,
    devImageService: 'sharp',
    maxDuration: 60,
  }),

  integrations: [db()],

  vite: {
    optimizeDeps: {
      exclude: ['astro:db'],
    },
    ssr: {
      noExternal: ['bcryptjs']
    }
  }
});
