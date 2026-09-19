const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const connectDB = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Financial Service Routes
const insuranceRoutes = require('./modules/insurance/insuranceRoutes');
const renewalRoutes = require('./modules/insuranceRenewal/renewalRoutes');
const loanRoutes = require('./modules/loans/loanRoutes');
const fdRoutes = require('./modules/fd/fdRoutes');
const rdRoutes = require('./modules/rd/rdRoutes');
const bondRoutes = require('./modules/bonds/bondRoutes');
const investmentRoutes = require('./modules/investments/investmentRoutes');
const shareRoutes = require('./modules/shares/shareRoutes');

// Admin Routes
const adminRoutes = require('./routes/adminRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');

const app = express();

/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

connectDB();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: '*',
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  })
);

app.use(
  express.json({
    limit: '10mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MH StepPays Backend is running',
    environment: env.nodeEnv,
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MH StepPays API is healthy',
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| Customer Authentication
|--------------------------------------------------------------------------
*/

app.use('/api/auth', authRoutes);




app.use('/api/notifications', notificationRoutes);
/*
|--------------------------------------------------------------------------
| Customer Enquiries
|--------------------------------------------------------------------------
*/

app.use('/api/enquiries', enquiryRoutes);

/*
|--------------------------------------------------------------------------
| Available Financial Services
|--------------------------------------------------------------------------
*/

app.use('/api/services', serviceRoutes);

/*
|--------------------------------------------------------------------------
| Financial Service Lead APIs
|--------------------------------------------------------------------------
*/

app.use('/api/insurance', insuranceRoutes);

app.use(
  '/api/insurance-renewal',
  renewalRoutes
);

app.use('/api/loans', loanRoutes);

app.use('/api/fd', fdRoutes);

app.use('/api/rd', rdRoutes);

app.use('/api/bonds', bondRoutes);

app.use(
  '/api/investments',
  investmentRoutes
);

app.use('/api/shares', shareRoutes);

/*
|--------------------------------------------------------------------------
| Admin APIs
|--------------------------------------------------------------------------
*/

app.use('/api/admin', adminRoutes);

app.use(
  '/api/admin/auth',
  adminAuthRoutes
);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorMiddleware);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const PORT = env.port;

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log('🚀 MH StepPays Backend Started');
  console.log('========================================');
  console.log(`📡 Port        : ${PORT}`);
  console.log(`🌍 Environment : ${env.nodeEnv}`);
  console.log(`🔗 API         : http://localhost:${PORT}`);
  console.log(
    `❤️  Health      : http://localhost:${PORT}/api/health`
  );
  console.log('========================================');
  console.log('');
});