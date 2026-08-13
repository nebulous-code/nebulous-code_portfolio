// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://nebulouscode.com',
  integrations: [mdx(), sitemap()],
  // Applies to both `astro dev` and `astro preview`. host: true binds every
  // interface so other machines on the network can reach it — note that on
  // this box that includes the Tailscale address, not just the LAN.
  server: { host: true, port: 7575 },
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    },
  },
  // Static output is the default in Astro 5; declared here for clarity.
  output: 'static',
});
