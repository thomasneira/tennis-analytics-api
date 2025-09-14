require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const playersRouter = require('./routes/players');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/players', playersRouter);
app.use('/api/stats', statsRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: '🎾 Tennis Analytics API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🎾 Tennis Analytics API running on port ${PORT}`);
  console.log(`�� Environment: ${process.env.NODE_ENV || 'development'}`);
});
