import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Inject env variables into process.env so /api/verify.js can read them
    Object.assign(process.env, env);

    const apiMiddleware = () => ({
      name: 'api-middleware',
      configureServer(server: any) {
        server.middlewares.use(async (req: any, res: any, next: any) => {
          if (req.url?.startsWith('/api/')) {
            try {
              const endpoint = req.url.split('?')[0].replace('/api/', '');
              const modulePath = path.resolve(__dirname, `./api/${endpoint}.js`);
              // Use Vite's ssrLoadModule to execute the endpoint file
              const module = await server.ssrLoadModule(modulePath);

              if (req.method === 'POST') {
                let body = '';
                req.on('data', (chunk: any) => {
                  body += chunk.toString();
                });
                req.on('end', async () => {
                  try {
                    req.body = body ? JSON.parse(body) : {};
                  } catch (e) {
                    req.body = {};
                  }
                  await module.default(req, res);
                });
                return;
              }

              await module.default(req, res);
            } catch (e) {
              console.error("API Route Error:", e);
              res.statusCode = 500;
              res.end('Internal Server Error');
            }
            return;
          }
          next();
        });
      }
    });

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), apiMiddleware()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
