/**
 * =====================================================
 * SMT Solder Paste Traceability System - Express Backend
 * =====================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const pastesRoutes = require('./routes/pastes');
const partLinesRoutes = require('./routes/part-lines');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/pastes', pastesRoutes);
app.use('/api/part-lines', partLinesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
