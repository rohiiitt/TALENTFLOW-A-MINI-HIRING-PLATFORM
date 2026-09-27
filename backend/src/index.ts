import { createApp } from './server.js';

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🤖 AI Purchasing Agent Backend is LIVE`);
  console.log(`🚀 Port: http://localhost:${PORT}`);
  console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🛍️ Products: http://localhost:${PORT}/api/products`);
  console.log(`=================================================`);
});
