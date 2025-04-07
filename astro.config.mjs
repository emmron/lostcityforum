// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

import db from '@astrojs/db';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  adapter: vercel({
    analytics: true,
    imageService: true,
    devImageService: 'sharp',
    speedInsights: {
      enabled: true
    }
  }),

  integrations: [db()]
});