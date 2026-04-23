// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as { version: string };

const _now = new Date();
const _pad = (n: number, len = 2) => String(n).padStart(len, '0');
const appBuild =
  `${_now.getFullYear()}${_pad(_now.getMonth() + 1)}${_pad(_now.getDate())}` +
  `.${_pad(_now.getHours())}${_pad(_now.getMinutes())}${_pad(_now.getSeconds())}`;

const rawCdn = process.env.CLVQ_CDN ?? 'http://localhost:5173/';
const cdnUrl = rawCdn.endsWith('/') ? rawCdn : rawCdn + '/';

export default defineConfig({
  base: cdnUrl,
  plugins: [svelte({ configFile: resolve(__dirname, 'svelte.config.js') })],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD__: JSON.stringify(appBuild),
  },
  publicDir: resolve(__dirname, 'static'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        play: resolve(__dirname, 'play/index.html'),
        history: resolve(__dirname, 'history/index.html'),
        review: resolve(__dirname, 'review/index.html'),
        settings: resolve(__dirname, 'settings/index.html'),
        sw: resolve(__dirname, 'src/sw.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'sw' ? '[name].js' : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
