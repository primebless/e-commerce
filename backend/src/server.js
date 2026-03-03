import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initAutomation } from './automation/index.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  initAutomation();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server failed to start:', error.message);
  process.exit(1);
});
