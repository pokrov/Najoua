import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { site } from './src/content.js';
import { renderPage } from './src/render.js';

const pages = {
  home: resolve('index.html'),
  legal: resolve('mentions-legales.html'),
};

export default defineConfig({
  plugins: [{
    name: 'site-content',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, context) => renderPage(html, context.filename.endsWith('mentions-legales.html')),
    },
    generateBundle() {
      if (!site.url) return;
      const urls = ['/', '/mentions-legales.html'].map((path) =>
        new URL(path, site.url).href.replaceAll('&', '&amp;'));
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`,
      });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', site.url).href}\n`,
      });
    },
  }],
  build: {
    rollupOptions: {
      input: pages,
    },
  },
});
