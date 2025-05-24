const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { limiter, securityHeaders, cookieMiddleware } = require('./middleware/security');
const gcpClient = require('../../shared-scripts/gcp-audit/gcpClient');
const auditRoutes = require('./routes/audit');
const { PrismaClient } = require('./generated/prisma');
const runFullGcpChecklistAudit = require('../../shared-scripts/gcp-audit/run-full-gcp-checklist-audit');
const { requestLogger, errorLogger, prismaQueryLogger } = require('./services/logging');
const logger = require('./services/logging').default;
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
  origin: process.env.CORS_ORIGIN || 'https://local.cloudauditpro.com:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Apply rate limiting to all routes
app.use(limiter);

// Add logging middleware before CSRF protection
app.use((req, res, next) => {
  console.log('Incoming cookies:', req.headers.cookie);
  console.log('Incoming x-csrf-token:', req.headers['x-csrf-token']);
  next();
});

// Apply CSRF protection to all routes except auth, using a consistent cookie name
const csurf = require('csurf');
const csrfProtection = csurf({ cookie: { key: 'csrf_token' } });
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

// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
prismaQueryLogger(prisma);

// Add request logging middleware
app.use(requestLogger);

// API routes
app.get('/api/health', (req, res) => {
  logger.info({ message: 'Health check', status: 'ok', timestamp: new Date().toISOString() });
  res.json({ status: 'ok', message: 'Server is running' });
});

// CSRF token endpoint - this will automatically generate a token through csurf middleware
app.get('/api/csrf-token', (req, res) => {
  console.log('[BACKEND-CSRF] CSRF token requested');
  console.log('[BACKEND-CSRF] Cookies:', req.headers.cookie);
  console.log('[BACKEND-CSRF] Available token:', req.csrfToken ? req.csrfToken() : 'NOT_AVAILABLE');
  
  try {
    const csrfToken = req.csrfToken();
    console.log('[BACKEND-CSRF] Generated CSRF token:', csrfToken);
    res.json({ csrfToken });
  } catch (error) {
    console.error('[BACKEND-CSRF] Error generating CSRF token:', error);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
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
  logger.info({
    message: 'Fetching cloud accounts',
    user: req.user,
    timestamp: new Date().toISOString()
  });
  try {
    const resourceManager = gcpClient.getResourceManager();
    logger.info({ message: 'Calling GCP ResourceManager.projects.list', user: req.user });
    const result = await resourceManager.projects.list();
    logger.info({ message: 'GCP projects.list result', result: result.data });
    const projects = (result.data.projects || []).map(p => ({
      id: p.projectId,
      name: p.name,
      projectNumber: p.projectNumber,
      lifecycleState: p.lifecycleState,
      labels: p.labels,
      parent: p.parent
    }));
    logger.info({ message: 'Returning projects', count: projects.length });
    res.json(projects);
  } catch (err) {
    logger.error({
      message: 'GCP API error (cloud-accounts)',
      error: err.message,
      stack: err.stack,
      user: req.user
    });
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
    const securityCenter = gcpClient.getSecurityCenter();
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
    const recommender = gcpClient.getRecommender();
    const projectId = gcpClient.auth._cachedProjectId || gcpClient.auth.jsonContent.project_id;
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
    const monitoring = gcpClient.getMonitoring();
    const projectId = gcpClient.auth._cachedProjectId || gcpClient.auth.jsonContent.project_id;
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
    const results = await runFullGcpChecklistAudit(projectId, tokenRecord);
    console.log(`[AUDIT] Full audit complete for userId=${userId}, projectId=${projectId}`);
    res.json({ success: true, results });
  } catch (err) {
    console.error(`[AUDIT] Error running full audit for userId=${userId}, projectId=${projectId}:`, err);
    res.status(500).json({ error: 'Internal server error during full audit.' });
  }
});

// Add error logging middleware (should be after all routes)
app.use(errorLogger);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 