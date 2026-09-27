import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ProductController } from './products/product.controller.js';
import { OrderController } from './orders/order.controller.js';
import { SessionController } from './sessions/session.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { AdminController } from './admin/admin.controller.js';

dotenv.config();

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Root endpoint with status & API documentation
  app.get('/', (req, res) => {
    if (req.accepts('html')) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>AI Purchasing Agent API</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
              .card { max-width: 650px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 28px; border: 1px solid #334155; }
              h1 { color: #10b981; font-size: 24px; margin-top: 0; }
              .badge { display: inline-block; padding: 4px 10px; background: rgba(16,185,129,0.15); color: #34d399; border-radius: 8px; font-weight: 600; font-size: 13px; }
              a { color: #38bdf8; text-decoration: none; }
              a:hover { text-decoration: underline; }
              ul { line-height: 1.8; color: #cbd5e1; font-size: 14px; }
              .btn { display: inline-block; margin-top: 16px; padding: 10px 20px; background: #10b981; color: #022c22; font-weight: bold; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="card">
              <span class="badge">API Engine Active</span>
              <h1>🤖 AI Purchasing Agent & Admin API</h1>
              <p>The backend REST API is online and healthy.</p>
              <p>To use the full visual application and Admin Dashboard:</p>
              <a class="btn" href="http://localhost:3000" target="_blank">Open Frontend UI (http://localhost:3000)</a>
              <h3 style="margin-top: 24px; color: #94a3b8; font-size: 14px; text-transform: uppercase;">Available API Endpoints:</h3>
              <ul>
                <li><a href="/api/health">GET /api/health</a> — Health check</li>
                <li><a href="/api/products">GET /api/products</a> — Product catalog</li>
                <li><a href="/api/orders">GET /api/orders</a> — Orders list</li>
                <li><a href="/api/admin/metrics">GET /api/admin/metrics</a> — Admin Analytics</li>
                <li><a href="/api/auth/demo-accounts">GET /api/auth/demo-accounts</a> — Quick Login Credentials</li>
                <li><code>POST /api/agent/session</code> — Execute Purchasing Agent</li>
              </ul>
            </div>
          </body>
        </html>
      `);
      return;
    }

    res.json({
      name: 'AI Purchasing Agent Backend',
      status: 'active',
      frontendUrl: 'http://localhost:3000',
      endpoints: {
        health: '/api/health',
        products: '/api/products',
        orders: '/api/orders',
        metrics: '/api/admin/metrics',
        auth: '/api/auth/login',
        createSession: 'POST /api/agent/session'
      }
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      agentEngine: 'Active',
      time: new Date().toISOString()
    });
  });

  // Auth Endpoints
  app.post('/api/auth/signup', AuthController.signup);
  app.post('/api/auth/login', AuthController.login);
  app.get('/api/auth/me', AuthController.getMe);
  app.get('/api/auth/demo-accounts', AuthController.getDemoAccounts);

  // Admin Endpoints
  app.get('/api/admin/metrics', AdminController.getMetrics);
  app.get('/api/admin/users', AdminController.getUsers);
  app.post('/api/admin/products', AdminController.createProduct);
  app.put('/api/admin/products/:id', AdminController.updateProduct);
  app.delete('/api/admin/products/:id', AdminController.deleteProduct);
  app.put('/api/admin/orders/:id/status', AdminController.updateOrderStatus);
  app.get('/api/admin/sessions', AdminController.getSessions);

  // Product Catalog Endpoints
  app.get('/api/products/search', ProductController.search);
  app.get('/api/products/health', ProductController.getHealth);
  app.post('/api/products/import', ProductController.importProducts);
  app.get('/api/products', ProductController.getAll);
  app.get('/api/products/:id', ProductController.getById);
  app.post('/api/products', ProductController.create);
  app.patch('/api/products/:id', ProductController.update);
  app.put('/api/products/:id', ProductController.update);
  app.delete('/api/products/:id', ProductController.delete);

  // Orders Endpoints
  app.get('/api/orders', OrderController.getAll);
  app.get('/api/orders/:id', OrderController.getById);
  app.post('/api/orders/:id/validate', OrderController.validateOrder);

  // Agent Pipeline Endpoints
  app.post('/api/agent/session', SessionController.createAndRun);
  app.get('/api/agent/session/:id', SessionController.getById);
  app.get('/api/agent/session/:id/actions', SessionController.getActions);
  app.post('/api/agent/session/:id/purchase', SessionController.purchase);
  app.post('/api/agent/reset', SessionController.resetData);

  return app;
}
