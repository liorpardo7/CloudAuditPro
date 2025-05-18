const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { limiter, csrfProtection, securityHeaders, cookieMiddleware } = require('./middleware/security');
const gcp = require('./scripts/gcp-audit/gcpClient');
const auditRoutes = require('./routes/audit');
const { PrismaClient } = require('./generated/prisma');
const { runFullAudit } = require('./scripts/gcp-audit/run-full-gcp-checklist-audit');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'COOKIE_SECRET',
  'NODE_ENV'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const app = express();
app.set('trust proxy', 1); // Trust the first proxy (for dev proxying)
const PORT = process.env.PORT || 7778;

// Security middleware
app.use(securityHeaders);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieMiddleware);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Apply rate limiting to all routes
app.use(limiter);

// Apply CSRF protection to all routes except auth
app.use((req, res, next) => {
  if (req.path.startsWith('/auth/')) {
    next();
  } else {
    csrfProtection(req, res, next);
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Helper for cookie options
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  };
}

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Login route
app.post('/auth/login', async (req, res) => {
  try {
    const { googleAccessToken } = req.body;
    if (!googleAccessToken) {
      return res.status(400).json({ error: 'Missing Google access token' });
    }
    // Verify token with Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });
    if (!userInfoRes.ok) {
      return res.status(401).json({ error: 'Invalid Google access token' });
    }
    const userInfo = await userInfoRes.json();
    // userInfo: { sub, email, name, ... }
    const token = jwt.sign(
      { userId: userInfo.sub, email: userInfo.email, name: userInfo.name, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );
    res.cookie('token', token, getCookieOptions());
    res.json({ success: true, user: { email: userInfo.email, name: userInfo.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Status route
app.get('/auth/status', authenticateToken, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

// Add /auth/me route for frontend compatibility
app.get('/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Logout route
app.post('/auth/logout', (req, res) => {
  res.clearCookie('token', getCookieOptions());
  res.json({ success: true });
});

// --- API: Cloud Accounts ---
app.get('/api/cloud-accounts', authenticateToken, async (req, res) => {
  try {
    const resourceManager = gcp.getResourceManager();
    const result = await resourceManager.projects.list();
    const projects = (result.data.projects || []).map(p => ({
      id: p.projectId,
      name: p.name,
      projectNumber: p.projectNumber,
      lifecycleState: p.lifecycleState,
      labels: p.labels,
      parent: p.parent
    }));
    res.json(projects);
  } catch (err) {
    console.error('GCP API error (cloud-accounts):', err);
    res.json({ accounts: [], noAccounts: true, error: 'No cloud accounts connected or GCP unavailable.' });
  }
});
app.post('/api/cloud-accounts', (req, res) => {
  res.status(201).json({ success: true, id: 'new-account-id', ...req.body });
});
app.get('/api/cloud-accounts/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'Demo Account', provider: 'aws', isActive: true });
});
app.put('/api/cloud-accounts/:id', (req, res) => {
  res.json({ success: true, ...req.body });
});
app.delete('/api/cloud-accounts/:id', (req, res) => {
  res.json({ success: true });
});
app.post('/api/cloud-accounts/:id/test-connection', (req, res) => {
  res.json({ success: true, message: 'Connection successful' });
});
app.post('/api/cloud-accounts/:id/scan', async (req, res) => {
  try {
    res.json({ success: true, message: 'Scan triggered (dummy response)' });
  } catch (err) {
    console.error('GCP API error (scan):', err);
    res.status(500).json({ error: err.message, stack: err.stack, details: err });
  }
});

// --- API: Findings ---
app.get('/api/findings', authenticateToken, async (req, res) => {
  try {
    const securityCenter = gcp.getSecurityCenter();
    const orgId = 'organizations/your-org-id';
    const sources = await securityCenter.organizations.sources.list({ parent: orgId });
    if (!sources.data.sources || sources.data.sources.length === 0) {
      return res.json([]);
    }
    const sourceName = sources.data.sources[0].name;
    const findings = await securityCenter.organizations.sources.findings.list({ parent: sourceName });
    res.json(findings.data.findings || []);
  } catch (err) {
    console.error('GCP API error (findings):', err);
    res.status(500).json({ error: err.message, stack: err.stack, details: err });
  }
});

// --- API: Insights ---
app.get('/api/insights', authenticateToken, async (req, res) => {
  try {
    const recommender = gcp.getRecommender();
    const projectId = gcp.auth._cachedProjectId || gcp.auth.jsonContent.project_id;
    const parent = `projects/${projectId}/locations/global/recommenders/google.compute.instance.MachineTypeRecommender`;
    const result = await recommender.projects.locations.recommenders.recommendations.list({ parent });
    res.json(result.data.recommendations || []);
  } catch (err) {
    console.error('GCP API error (insights):', err);
    res.status(500).json({ error: err.message, stack: err.stack, details: err });
  }
});
app.get('/api/insights/:id', authenticateToken, (req, res) => {
  res.json({ id: req.params.id, title: 'Dummy Insight', status: 'open' });
});
app.put('/api/insights/:id/status', authenticateToken, (req, res) => {
  res.json({ success: true, status: req.body.status });
});

// --- API: Monitoring ---
app.get('/api/monitoring/:tab', authenticateToken, async (req, res) => {
  try {
    const monitoring = gcp.getMonitoring();
    const projectId = gcp.auth._cachedProjectId || gcp.auth.jsonContent.project_id;
    const result = await monitoring.projects.monitoredResourceDescriptors.list({ name: `projects/${projectId}` });
    res.json(result.data.resourceDescriptors || []);
  } catch (err) {
    console.error('GCP API error (monitoring):', err);
    res.status(500).json({ error: err.message, stack: err.stack, details: err });
  }
});
app.put('/api/monitoring/retention-policy', authenticateToken, (req, res) => {
  res.json({ success: true });
});
app.post('/api/monitoring/metrics/collect', authenticateToken, (req, res) => {
  res.json({ success: true });
});

// --- Auth: Refresh ---
app.post('/auth/refresh', (req, res) => {
  res.json({ token: 'dummy-refreshed-token' });
});

// Protected routes
app.get('/api/v2/cloud-accounts', authenticateToken, (req, res) => {
  // TODO: Implement cloud accounts logic
  res.json({ accounts: [] });
});

// Register routes
app.use('/api/audit', auditRoutes);

// Add a placeholder for /api/audits/run endpoint with detailed logging for token lookup
const prisma = new PrismaClient();

app.post('/api/audits/run', authenticateToken, async (req, res) => {
  const { projectId } = req.body;
  const userId = req.user?.id || req.user?.username || 'unknown';
  console.log(`[AUDIT] /api/audits/run called by userId=${userId} for projectId=${projectId}`);
  try {
    const tokenRecord = await prisma.oAuthToken.findFirst({
      where: { projectId },
    });
    if (!tokenRecord) {
      console.warn(`[AUDIT] No OAuth tokens found for userId=${userId}, projectId=${projectId}`);
      return res.status(401).json({ error: 'No OAuth tokens found for this user/project. Please re-authenticate.' });
    }
    console.log(`[AUDIT] Found OAuth tokens for userId=${userId}, projectId=${projectId}`);
    // Run the full audit and return results
    console.log(`[AUDIT] Starting full audit for userId=${userId}, projectId=${projectId}`);
    const results = await runFullAudit(projectId, tokenRecord);
    console.log(`[AUDIT] Full audit complete for userId=${userId}, projectId=${projectId}`);
    res.json({ success: true, results });
  } catch (err) {
    console.error(`[AUDIT] Error running full audit for userId=${userId}, projectId=${projectId}:`, err);
    res.status(500).json({ error: 'Internal server error during full audit.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error details
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determine if we're in production
  const isProduction = process.env.NODE_ENV === 'production';

  // Prepare error response
  const errorResponse = {
    error: isProduction ? 'Internal server error' : err.message,
    code: err.status || 500
  };

  // Only include stack trace in development
  if (!isProduction) {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(errorResponse.code).json(errorResponse);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 