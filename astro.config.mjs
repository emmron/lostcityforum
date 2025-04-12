// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';
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
    includeFiles: ['./db/seed.ts'],
  }),

  integrations: [db()],

  vite: {
    optimizeDeps: {
      exclude: ['astro:db'],
    },
  }
});