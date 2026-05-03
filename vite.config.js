import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function jsonSyncPlugin() {
  return {
    name: 'json-sync',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/sync' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString() });
          req.on('end', () => {
            try {
              JSON.parse(body);
              fs.writeFileSync(path.resolve(__dirname, 'src/data/dummy_data.json'), body);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
          });
        } else if (req.url === '/api/sync' && req.method === 'GET') {
          const data = fs.readFileSync(path.resolve(__dirname, 'src/data/dummy_data.json'), 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } else {
          next();
        }
      });
    }
  }
}

// Deploying to: https://ludarp.github.io (root — repo must be named LUDARP.github.io)
export default defineConfig({
  base: './',
  plugins: [react(), jsonSyncPlugin()],
  server: {
    watch: {
      ignored: ['**/src/data/dummy_data.json']
    }
  }
})



