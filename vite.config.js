import { defineConfig, loadEnv } from 'vite';
import { handleDelivery } from './server/delivery.js';
import { resolve } from 'node:path';
import { site } from './src/content.js';
import { renderPage } from './src/render.js';

const pages = {
  home: resolve('index.html'),
  legal: resolve('mentions-legales.html'),
  admin: resolve('admin/index.html'),
  gallery: resolve('galerie/index.html'),
};

function deliveryMiddleware(env) {
  return (server) => {
    server.middlewares.use('/api/delivery', async (incoming, outgoing) => {
      try {
        const chunks = [];
        let size = 0;
        for await (const chunk of incoming) {
          size += chunk.length;
          if (size > 16384) {
            outgoing.writeHead(413).end();
            return;
          }
          chunks.push(chunk);
        }
        const request = new Request(`http://${incoming.headers.host}/api/delivery`, {
          method: incoming.method,
          headers: incoming.headers,
          body: ['GET', 'HEAD'].includes(incoming.method) ? undefined : Buffer.concat(chunks),
        });
        const response = await handleDelivery(request, { ip: incoming.socket.remoteAddress }, env);
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(await response.text());
      } catch {
        if (!outgoing.headersSent) outgoing.writeHead(500);
        outgoing.end();
      }
    });
  };
}

export default defineConfig(({ mode, command }) => {
  const origin = site.url || (command === 'build' && process.env.CONTEXT === 'production' ? process.env.URL : '') || '';
  const middleware = deliveryMiddleware({ ...loadEnv(mode, process.cwd(), ''), ...process.env });
  return {
    plugins: [{
      name: 'delivery-local',
      configureServer: middleware,
      configurePreviewServer: middleware,
    }, {
      name: 'site-content',
      transformIndexHtml: {
        order: 'pre',
        handler: (html, context) => html.includes('<!-- content -->')
          ? renderPage(html, context.filename.endsWith('mentions-legales.html'), origin) : html,
      },
      generateBundle() {
        if (!origin) return;
        const urls = ['/', '/mentions-legales.html'].map((path) =>
          new URL(path, origin).href.replaceAll('&', '&amp;'));
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
          source: `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', origin).href}\n`,
        });
      },
    }],
    build: {
      rollupOptions: {
        input: pages,
      },
    },
  };
});
