// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://nebulouscode.com',
  integrations: [vue(), mdx()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    },
  },
  // Static output is the default in Astro 5; declared here for clarity.
  output: 'static',
});
