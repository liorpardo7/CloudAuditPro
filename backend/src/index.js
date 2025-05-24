const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { limiter, securityHeaders, cookieMiddleware } = require('./middleware/security');
const gcpClient = require('../../shared-scripts/gcp-audit/gcpClient');
const auditRoutes = require('./routes/audit');
const { PrismaClient } = require('@prisma/client');
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

// Apply CSRF protection to all routes except auth, health check, AND audit endpoints for now
const csurf = require('csurf');
const csrfProtection = csurf({ 
  cookie: { 
    key: 'csrf_token',
    httpOnly: false, // Allow frontend access
    secure: false,   // Allow HTTP during development
    sameSite: 'lax',
    path: '/'
  }
});

app.use((req, res, next) => {
  // Skip CSRF for auth routes, health check, AND audit endpoints for now
  if (req.path.startsWith('/auth/') || 
      req.path === '/api/health' ||
      req.path.startsWith('/api/audits/') ||
      req.path.startsWith('/api/admin/')) {
    console.log('[BACKEND-CSRF] Skipping CSRF for path:', req.path);
    next();
  } else {
    // Add detailed CSRF debugging
    console.log('[BACKEND-CSRF] Request path:', req.path);
    console.log('[BACKEND-CSRF] Cookies:', req.headers.cookie);
    console.log('[BACKEND-CSRF] CSRF headers:', {
      'x-csrf-token': req.headers['x-csrf-token'],
      'X-CSRF-Token': req.headers['X-CSRF-Token'],
      'csrf-token': req.headers['csrf-token']
    });
    
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
    
    // Check if we have audit scopes by trying to get token info
    try {
      const tokenInfoRes = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${googleAccessToken}`);
      const tokenInfo = await tokenInfoRes.json();
      console.log('[AUTH] Current token scopes:', tokenInfo.scope);
      
      // Comprehensive required scopes for full audit functionality (using only VALID scopes)
      const requiredScopes = [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/compute.readonly',
        'https://www.googleapis.com/auth/bigquery.readonly',
        'https://www.googleapis.com/auth/monitoring.read',
        'https://www.googleapis.com/auth/devstorage.read_write',
        'https://www.googleapis.com/auth/cloud-billing.readonly'
      ];
      
      const providedScopes = (tokenInfo.scope || '').split(' ');
      const missingScopes = requiredScopes.filter(scope => 
        !providedScopes.includes(scope)
      );
      
      if (missingScopes.length > 0) {
        console.warn('[AUTH] Token is missing some required audit scopes:', missingScopes);
        console.log('[AUTH] Provided scopes:', providedScopes.length, 'Required scopes:', requiredScopes.length);
      } else {
        console.log('[AUTH] ✅ Token has all required audit scopes!');
      }
      
      // Log scope statistics
      console.log('[AUTH] Scope analysis:', {
        total_provided: providedScopes.length,
        total_required: requiredScopes.length,
        missing_count: missingScopes.length,
        coverage_percentage: Math.round((1 - missingScopes.length / requiredScopes.length) * 100)
      });
      
    } catch (scopeError) {
      console.warn('[AUTH] Could not verify token scopes:', scopeError.message);
    }
    
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

// Get audit job by ID
app.get('/api/audits/:jobId', authenticateToken, async (req, res) => {
  const { jobId } = req.params;
  const googleId = req.user?.userId;
  console.log(`[AUDIT] GET /api/audits/${jobId} called by googleId=${googleId}`);
  
  try {
    // Find the user by Google ID
    const user = await prisma.user.findUnique({
      where: { googleId: googleId }
    });
    
    if (!user) {
      console.warn(`[AUDIT] No user found for googleId=${googleId}`);
      return res.status(401).json({ error: 'User not found. Please re-authenticate.' });
    }
    
    // Find the audit job
    const auditJob = await prisma.auditJob.findFirst({
      where: { 
        id: jobId,
        userId: user.id // Ensure user can only access their own audit jobs
      }
    });
    
    if (!auditJob) {
      console.warn(`[AUDIT] Audit job ${jobId} not found for userId=${user.id}`);
      return res.status(404).json({ error: 'Audit job not found.' });
    }
    
    // Parse the result JSON if it exists
    let parsedResult = null;
    if (auditJob.result) {
      try {
        parsedResult = JSON.parse(auditJob.result);
      } catch (parseError) {
        console.error(`[AUDIT] Failed to parse audit job result for ${jobId}:`, parseError);
      }
    }
    
    console.log(`[AUDIT] Retrieved audit job ${jobId} for userId=${user.id}`);
    res.json({
      id: auditJob.id,
      category: auditJob.category,
      status: auditJob.status,
      result: parsedResult,
      started: auditJob.started,
      completed: auditJob.completed,
      error: auditJob.error
    });
  } catch (err) {
    console.error(`[AUDIT] Error retrieving audit job ${jobId} for googleId=${googleId}:`, err);
    res.status(500).json({ error: 'Internal server error retrieving audit job.' });
  }
});

app.post('/api/audits/run', authenticateToken, async (req, res) => {
  const { projectId, category } = req.body; // Extract both projectId and category
  const googleId = req.user?.userId; // This is the Google user ID from JWT
  console.log(`[AUDIT] /api/audits/run called by googleId=${googleId} for gcpProjectId=${projectId}, category=${category}`);
  
  let auditJob = null; // Declare outside try block for error handling
  
  try {
    // First, find the user by Google ID
    const user = await prisma.user.findUnique({
      where: { googleId: googleId }
    });
    
    if (!user) {
      console.warn(`[AUDIT] No user found for googleId=${googleId}`);
      return res.status(401).json({ error: 'User not found. Please re-authenticate.' });
    }
    
    // Then find the internal project record by GCP project ID and user's internal ID
    const project = await prisma.project.findFirst({
      where: { 
        gcpProjectId: projectId,
        userId: user.id // Use the internal user ID
      },
      include: {
        tokens: true // Include the OAuth tokens
      }
    });
    
    if (!project) {
      console.warn(`[AUDIT] No project found for userId=${user.id}, gcpProjectId=${projectId}`);
      return res.status(404).json({ error: 'Project not found for this user.' });
    }
    
    // Check if project has OAuth tokens
    if (!project.tokens || project.tokens.length === 0) {
      console.warn(`[AUDIT] No OAuth tokens found for userId=${user.id}, gcpProjectId=${projectId}, projectId=${project.id}`);
      return res.status(401).json({ error: 'No OAuth tokens found for this user/project. Please re-authenticate.' });
    }
    
    const tokenRecord = project.tokens[0]; // Use the first token record
    console.log(`[AUDIT] Found OAuth tokens for userId=${user.id}, gcpProjectId=${projectId}, projectId=${project.id}`);
    
    // Create an audit job record in the database
    auditJob = await prisma.auditJob.create({
      data: {
        projectId: project.id,
        userId: user.id,
        category: category,
        status: 'running'
      }
    });
    
    console.log(`[AUDIT] Created audit job ${auditJob.id} for userId=${user.id}, gcpProjectId=${projectId}, category=${category}`);
    
    // Run category-specific audit based on the category parameter
    console.log(`[AUDIT] Starting ${category} audit for userId=${user.id}, gcpProjectId=${projectId}`);
    
    // Prepare OAuth tokens for the audit scripts
    const tokens = {
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
      expiry_date: new Date(tokenRecord.expiry).getTime(),
      scope: tokenRecord.scopes
    };
    
    let results;
    try {
      switch (category) {
        case 'all':
          // Run all audit categories
          console.log(`[AUDIT] Running all audits for gcpProjectId=${projectId}`);
          const allResults = {};
          const categories = [
            'compute', 'storage', 'bigquery', 'security', 'networking', 
            'cost-management', 'iam', 'monitoring', 'serverless', 'gke',
            'resource-utilization', 'data-protection', 'compliance'
          ];
          
          for (const cat of categories) {
            try {
              console.log(`[AUDIT] Running ${cat} audit...`);
              let catResults;
              
              switch (cat) {
                case 'compute':
                  const computeAudit = require('../../shared-scripts/gcp-audit/compute-audit');
                  catResults = await computeAudit.run(projectId, tokens);
                  break;
                case 'storage':
                  const storageAudit = require('../../shared-scripts/gcp-audit/storage-audit');
                  catResults = await storageAudit.run(projectId, tokens);
                  break;
                case 'bigquery':
                  const bigqueryAudit = require('../../shared-scripts/gcp-audit/bigquery-audit');
                  catResults = await bigqueryAudit.run(projectId, tokens);
                  break;
                case 'security':
                  const securityAudit = require('../../shared-scripts/gcp-audit/security-audit');
                  catResults = await securityAudit.run(projectId, tokens);
                  break;
                case 'networking':
                  const networkingAudit = require('../../shared-scripts/gcp-audit/networking-audit');
                  catResults = await networkingAudit.run(projectId, tokens);
                  break;
                case 'cost-management':
                  const costAudit = require('../../shared-scripts/gcp-audit/cost-management-audit');
                  catResults = await costAudit.run(projectId, tokens);
                  break;
                case 'iam':
                  const iamAudit = require('../../shared-scripts/gcp-audit/iam-audit');
                  catResults = await iamAudit.run(projectId, tokens);
                  break;
                case 'monitoring':
                  const monitoringAudit = require('../../shared-scripts/gcp-audit/monitoring-audit');
                  catResults = await monitoringAudit.run(projectId, tokens);
                  break;
                case 'serverless':
                  const serverlessAudit = require('../../shared-scripts/gcp-audit/serverless-audit');
                  catResults = await serverlessAudit.run(projectId, tokens);
                  break;
                case 'gke':
                  const gkeAudit = require('../../shared-scripts/gcp-audit/gke-audit');
                  catResults = await gkeAudit.run(projectId, tokens);
                  break;
                case 'resource-utilization':
                  const resourceAudit = require('../../shared-scripts/gcp-audit/resource-utilization-audit');
                  catResults = await resourceAudit.run(projectId, tokens);
                  break;
                case 'data-protection':
                  const dataProtectionAudit = require('../../shared-scripts/gcp-audit/data-protection-audit');
                  catResults = await dataProtectionAudit.run(projectId, tokens);
                  break;
                case 'compliance':
                  const complianceAudit = require('../../shared-scripts/gcp-audit/compliance-audit');
                  catResults = await complianceAudit.run(projectId, tokens);
                  break;
              }
              
              allResults[cat] = catResults;
              console.log(`[AUDIT] ${cat} audit completed`);
            } catch (catError) {
              console.error(`[AUDIT] Error in ${cat} audit:`, catError.message);
              allResults[cat] = { error: catError.message, findings: [], errors: [catError.message] };
            }
          }
          
          // Combine all results
          const allFindings = [];
          let totalChecks = 0;
          let totalPassed = 0;
          let totalWarnings = 0;
          let totalFailures = 0;
          
          Object.entries(allResults).forEach(([cat, catResults]) => {
            if (catResults.findings) {
              catResults.findings.forEach(finding => {
                allFindings.push({
                  id: `${cat}-${Math.random().toString(36).substr(2, 9)}`,
                  title: finding.check || finding.type || `${cat} Finding`,
                  severity: finding.passed === false ? 'medium' : 'low',
                  description: finding.result || finding.message || 'No description available',
                  recommendation: getRecommendationForFinding(finding),
                  resource: finding.resource || 'N/A',
                  category: cat,
                  cost_savings: estimateCostSavings(finding)
                });
              });
            }
            if (catResults.summary) {
              totalChecks += catResults.summary.totalChecks || 0;
              totalPassed += catResults.summary.passed || 0;
              totalWarnings += catResults.summary.warnings || 0;
              totalFailures += catResults.summary.failed || 0;
            }
          });
          
          results = {
            category: 'all',
            status: 'completed',
            findings: allFindings,
            summary: {
              total_checks: totalChecks,
              passed: totalPassed,
              warnings: totalWarnings,
              failures: totalFailures,
              potential_savings: calculateTotalSavings(allFindings),
              categories_run: Object.keys(allResults)
            },
            detailed_results: allResults
          };
          break;
          
        case 'compute':
          const computeAudit = require('../../shared-scripts/gcp-audit/compute-audit');
          const computeResults = await computeAudit.run(projectId, tokens);
          results = {
            category: 'compute',
            status: 'completed',
            findings: computeResults.findings.map(finding => ({
              id: `compute-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.type || finding.check || 'Compute Finding',
              severity: finding.status === 'warning' ? 'medium' : finding.status === 'error' ? 'high' : 'low',
              description: finding.message || finding.result || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.instance || finding.resource || 'N/A',
              cost_savings: estimateCostSavings(finding)
            })),
            summary: {
              total_checks: computeResults.summary?.totalChecks || computeResults.findings.length,
              passed: computeResults.summary?.passed || 0,
              warnings: computeResults.findings.filter(f => f.status === 'warning').length,
              failures: computeResults.summary?.failed || computeResults.errors.length,
              potential_savings: calculateTotalSavings(computeResults.findings)
            }
          };
          break;
          
        case 'storage':
          const storageAudit = require('../../shared-scripts/gcp-audit/storage-audit');
          const storageResults = await storageAudit.run(projectId, tokens);
          results = {
            category: 'storage',
            status: 'completed',
            findings: storageResults.findings.map(finding => ({
              id: `storage-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'Storage Finding',
              severity: finding.passed === false ? 'high' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.bucket || finding.resource || 'N/A',
              cost_impact: estimateCostSavings(finding)
            })),
            summary: {
              total_checks: storageResults.summary?.totalChecks || storageResults.findings.length,
              passed: storageResults.summary?.passed || 0,
              warnings: storageResults.findings.filter(f => !f.passed).length,
              failures: storageResults.summary?.failed || storageResults.errors.length,
              potential_savings: calculateTotalSavings(storageResults.findings)
            }
          };
          break;
          
        case 'bigquery':
          const bigqueryAudit = require('../../shared-scripts/gcp-audit/bigquery-audit');
          const bigqueryResults = await bigqueryAudit.run(projectId, tokens);
          results = {
            category: 'bigquery',
            status: 'completed', 
            findings: bigqueryResults.findings.map(finding => ({
              id: `bq-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'BigQuery Finding',
              severity: finding.passed === false ? 'medium' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.dataset || finding.table || finding.resource || 'N/A',
              cost_savings: estimateCostSavings(finding)
            })),
            summary: {
              total_checks: bigqueryResults.summary?.totalChecks || bigqueryResults.findings.length,
              passed: bigqueryResults.summary?.passed || 0,
              warnings: bigqueryResults.findings.filter(f => !f.passed).length,
              failures: bigqueryResults.summary?.failed || bigqueryResults.errors.length,
              potential_savings: calculateTotalSavings(bigqueryResults.findings)
            }
          };
          break;
          
        case 'security':
          const securityAudit = require('../../shared-scripts/gcp-audit/security-audit');
          const securityResults = await securityAudit.auditAll ? await securityAudit.auditAll() : await securityAudit.run(projectId, tokens);
          results = {
            category: 'security',
            status: 'completed',
            findings: (securityResults.findings || []).map(finding => ({
              id: `security-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'Security Finding',
              severity: finding.status === 'FAILED' ? 'high' : finding.status === 'WARNING' ? 'medium' : 'low',
              description: finding.message || finding.result || finding.error || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.resource || 'N/A',
              cost_savings: 'N/A'
            })),
            summary: {
              total_checks: securityResults.summary?.totalChecks || securityResults.findings?.length || 0,
              passed: securityResults.summary?.passed || 0,
              warnings: securityResults.summary?.warnings || 0,
              failures: securityResults.summary?.failed || securityResults.summary?.failures || 0,
              potential_savings: 'N/A'
            }
          };
          break;
          
        case 'network':
        case 'networking':
          const networkingAudit = require('../../shared-scripts/gcp-audit/networking-audit');
          const networkingResults = await networkingAudit.run(projectId, tokens);
          results = {
            category: 'networking',
            status: 'completed',
            findings: networkingResults.findings.map(finding => ({
              id: `network-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'Networking Finding',
              severity: finding.passed === false ? 'medium' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.resource || 'N/A',
              cost_savings: estimateCostSavings(finding)
            })),
            summary: {
              total_checks: networkingResults.summary?.totalChecks || networkingResults.findings.length,
              passed: networkingResults.summary?.passed || 0,
              warnings: networkingResults.findings.filter(f => !f.passed).length,
              failures: networkingResults.summary?.failed || networkingResults.errors.length,
              potential_savings: calculateTotalSavings(networkingResults.findings)
            }
          };
          break;
          
        case 'cost-management':
        case 'cost':
          const costAudit = require('../../shared-scripts/gcp-audit/cost-management-audit');
          const costResults = await costAudit.run(projectId, tokens);
          results = {
            category: 'cost-management',
            status: 'completed',
            findings: costResults.findings.map(finding => ({
              id: `cost-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'Cost Management Finding',
              severity: finding.passed === false ? 'medium' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.resource || 'N/A',
              cost_savings: estimateCostSavings(finding)
            })),
            summary: {
              total_checks: costResults.summary?.totalChecks || costResults.findings.length,
              passed: costResults.summary?.passed || 0,
              warnings: costResults.findings.filter(f => !f.passed).length,
              failures: costResults.summary?.failed || costResults.errors.length,
              potential_savings: calculateTotalSavings(costResults.findings)
            }
          };
          break;
          
        case 'iam':
          const iamAudit = require('../../shared-scripts/gcp-audit/iam-audit');
          const iamResults = await iamAudit.run(projectId, tokens);
          results = {
            category: 'iam',
            status: 'completed',
            findings: iamResults.findings.map(finding => ({
              id: `iam-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'IAM Finding',
              severity: finding.passed === false ? 'high' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.resource || 'N/A',
              cost_savings: 'Security improvement'
            })),
            summary: {
              total_checks: iamResults.summary?.totalChecks || iamResults.findings.length,
              passed: iamResults.summary?.passed || 0,
              warnings: iamResults.findings.filter(f => !f.passed).length,
              failures: iamResults.summary?.failed || iamResults.errors.length,
              potential_savings: 'Security improvement'
            }
          };
          break;
          
        case 'monitoring':
          const monitoringAudit = require('../../shared-scripts/gcp-audit/monitoring-audit');
          const monitoringResults = await monitoringAudit.run(projectId, tokens);
          results = {
            category: 'monitoring',
            status: 'completed',
            findings: monitoringResults.findings.map(finding => ({
              id: `monitoring-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'Monitoring Finding',
              severity: finding.passed === false ? 'medium' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.resource || 'N/A',
              cost_savings: estimateCostSavings(finding)
            })),
            summary: {
              total_checks: monitoringResults.summary?.totalChecks || monitoringResults.findings.length,
              passed: monitoringResults.summary?.passed || 0,
              warnings: monitoringResults.findings.filter(f => !f.passed).length,
              failures: monitoringResults.summary?.failed || monitoringResults.errors.length,
              potential_savings: calculateTotalSavings(monitoringResults.findings)
            }
          };
          break;
          
        case 'serverless':
          const serverlessAudit = require('../../shared-scripts/gcp-audit/serverless-audit');
          const serverlessResults = await serverlessAudit.run(projectId, tokens);
          results = {
            category: 'serverless',
            status: 'completed',
            findings: serverlessResults.findings.map(finding => ({
              id: `serverless-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'Serverless Finding',
              severity: finding.passed === false ? 'medium' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.resource || 'N/A',
              cost_savings: estimateCostSavings(finding)
            })),
            summary: {
              total_checks: serverlessResults.summary?.totalChecks || serverlessResults.findings.length,
              passed: serverlessResults.summary?.passed || 0,
              warnings: serverlessResults.findings.filter(f => !f.passed).length,
              failures: serverlessResults.summary?.failed || serverlessResults.errors.length,
              potential_savings: calculateTotalSavings(serverlessResults.findings)
            }
          };
          break;
          
        case 'gke':
          const gkeAudit = require('../../shared-scripts/gcp-audit/gke-audit');
          const gkeResults = await gkeAudit.run(projectId, tokens);
          results = {
            category: 'gke',
            status: 'completed',
            findings: gkeResults.findings.map(finding => ({
              id: `gke-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'GKE Finding',
              severity: finding.passed === false ? 'medium' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.resource || 'N/A',
              cost_savings: estimateCostSavings(finding)
            })),
            summary: {
              total_checks: gkeResults.summary?.totalChecks || gkeResults.findings.length,
              passed: gkeResults.summary?.passed || 0,
              warnings: gkeResults.findings.filter(f => !f.passed).length,
              failures: gkeResults.summary?.failed || gkeResults.errors.length,
              potential_savings: calculateTotalSavings(gkeResults.findings)
            }
          };
          break;
          
        case 'resource-utilization':
          const resourceAudit = require('../../shared-scripts/gcp-audit/resource-utilization-audit');
          const resourceResults = await resourceAudit.run(projectId, tokens);
          results = {
            category: 'resource-utilization',
            status: 'completed',
            findings: resourceResults.findings.map(finding => ({
              id: `resource-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'Resource Utilization Finding',
              severity: finding.passed === false ? 'medium' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.resource || 'N/A',
              cost_savings: estimateCostSavings(finding)
            })),
            summary: {
              total_checks: resourceResults.summary?.totalChecks || resourceResults.findings.length,
              passed: resourceResults.summary?.passed || 0,
              warnings: resourceResults.findings.filter(f => !f.passed).length,
              failures: resourceResults.summary?.failed || resourceResults.errors.length,
              potential_savings: calculateTotalSavings(resourceResults.findings)
            }
          };
          break;
          
        case 'data-protection':
          const dataProtectionAudit = require('../../shared-scripts/gcp-audit/data-protection-audit');
          const dataProtectionResults = await dataProtectionAudit.run(projectId, tokens);
          results = {
            category: 'data-protection',
            status: 'completed',
            findings: dataProtectionResults.findings.map(finding => ({
              id: `data-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'Data Protection Finding',
              severity: finding.passed === false ? 'high' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.resource || 'N/A',
              cost_savings: 'Security improvement'
            })),
            summary: {
              total_checks: dataProtectionResults.summary?.totalChecks || dataProtectionResults.findings.length,
              passed: dataProtectionResults.summary?.passed || 0,
              warnings: dataProtectionResults.findings.filter(f => !f.passed).length,
              failures: dataProtectionResults.summary?.failed || dataProtectionResults.errors.length,
              potential_savings: 'Security improvement'
            }
          };
          break;
          
        case 'compliance':
          const complianceAudit = require('../../shared-scripts/gcp-audit/compliance-audit');
          const complianceResults = await complianceAudit.run(projectId, tokens);
          results = {
            category: 'compliance',
            status: 'completed',
            findings: complianceResults.findings.map(finding => ({
              id: `compliance-${Math.random().toString(36).substr(2, 9)}`,
              title: finding.check || finding.type || 'Compliance Finding',
              severity: finding.passed === false ? 'high' : 'low',
              description: finding.result || finding.message || 'No description available',
              recommendation: getRecommendationForFinding(finding),
              resource: finding.resource || 'N/A',
              cost_savings: 'Compliance improvement'
            })),
            summary: {
              total_checks: complianceResults.summary?.totalChecks || complianceResults.findings.length,
              passed: complianceResults.summary?.passed || 0,
              warnings: complianceResults.findings.filter(f => !f.passed).length,
              failures: complianceResults.summary?.failed || complianceResults.errors.length,
              potential_savings: 'Compliance improvement'
            }
          };
          break;
          
        default:
          // For unknown categories, try to find a matching audit script
          try {
            const auditScript = require(`../../shared-scripts/gcp-audit/${category}-audit`);
            const auditResults = await auditScript.run(projectId, tokens);
            results = {
              category: category,
              status: 'completed',
              findings: auditResults.findings.map(finding => ({
                id: `${category}-${Math.random().toString(36).substr(2, 9)}`,
                title: finding.check || finding.type || `${category} Finding`,
                severity: finding.passed === false ? 'medium' : 'low',
                description: finding.result || finding.message || 'No description available',
                recommendation: getRecommendationForFinding(finding),
                resource: finding.resource || 'N/A',
                cost_savings: estimateCostSavings(finding)
              })),
              summary: {
                total_checks: auditResults.summary?.totalChecks || auditResults.findings.length,
                passed: auditResults.summary?.passed || 0,
                warnings: auditResults.findings.filter(f => !f.passed).length,
                failures: auditResults.summary?.failed || auditResults.errors.length,
                potential_savings: calculateTotalSavings(auditResults.findings)
              }
            };
          } catch (scriptError) {
            console.warn(`[AUDIT] No audit script found for category '${category}':`, scriptError.message);
            results = {
              category: category || 'unknown',
              status: 'completed',
              findings: [
                {
                  id: 'general-001',
                  title: 'Audit Category Not Available',
                  severity: 'info',
                  description: `Audit for category '${category}' is not yet available`,
                  recommendation: 'Contact support for additional audit categories'
                }
              ],
              summary: {
                total_checks: 1,
                passed: 0,
                warnings: 1,
                failures: 0,
                potential_savings: '$0/month'
              }
            };
          }
      }
    } catch (auditError) {
      console.error(`[AUDIT] Error running ${category} audit:`, auditError);
      results = {
        category: category,
        status: 'error',
        findings: [
          {
            id: 'error-001',
            title: 'Audit Execution Error',
            severity: 'high',
            description: `Failed to run ${category} audit: ${auditError.message}`,
            recommendation: 'Check your GCP project permissions and try again',
            error: auditError.message
          }
        ],
        summary: {
          total_checks: 1,
          passed: 0,
          warnings: 0,
          failures: 1,
          potential_savings: 'N/A'
        }
      };
    }
    
    // Update the audit job with the results
    await prisma.auditJob.update({
      where: { id: auditJob.id },
      data: {
        status: 'completed',
        result: JSON.stringify(results),
        completed: new Date()
      }
    });
    
    console.log(`[AUDIT] ${category} audit completed for userId=${user.id}, gcpProjectId=${projectId}, jobId=${auditJob.id}`);
    
    // Return both the immediate results AND the job ID for frontend compatibility
    res.json({ 
      success: true, 
      results: results,
      jobId: auditJob.id,
      status: 'completed'
    });
  } catch (err) {
    console.error(`[AUDIT] Error running ${category} audit for googleId=${googleId}, gcpProjectId=${projectId}:`, err);
    
    // If we created an audit job, mark it as failed
    if (auditJob) {
      try {
        await prisma.auditJob.update({
          where: { id: auditJob.id },
          data: {
            status: 'error',
            error: err.message,
            completed: new Date()
          }
        });
      } catch (updateError) {
        console.error(`[AUDIT] Failed to update audit job status:`, updateError);
      }
    }
    
    res.status(500).json({ error: `Internal server error during ${category} audit.` });
  }
});

// Add error logging middleware (should be after all routes)
app.use(errorLogger);

// Helper functions for audit result processing
function getRecommendationForFinding(finding) {
  const type = finding.type || finding.check || '';
  
  switch (type) {
    case 'low_cpu_utilization':
      return 'Consider downsizing the VM instance to a smaller machine type';
    case 'low_memory_utilization':
      return 'Consider reducing memory allocation or downsizing instance';
    case 'missing_labels':
      return 'Add proper labels for resource organization and cost tracking';
    case 'no_service_account':
      return 'Configure a dedicated service account with minimal required permissions';
    case 'unencrypted_disk':
      return 'Enable disk encryption for security compliance';
    case 'Stale Partitioning':
      return 'Review and update table partitioning strategy or archive old data';
    case 'Deprecated UDFs':
      return 'Update or replace deprecated user-defined functions';
    case 'Query Optimization':
      return 'Optimize queries to reduce data processed and improve performance';
    case 'Cost Optimization':
      return 'Review large tables for archival opportunities or compression';
    case 'Dataset Access Controls':
      return 'Review and tighten dataset access permissions';
    default:
      return finding.recommendation || 'Review finding details for optimization opportunities';
  }
}

function estimateCostSavings(finding) {
  const type = finding.type || finding.check || '';
  
  switch (type) {
    case 'low_cpu_utilization':
      return '$50-150/month';
    case 'low_memory_utilization':
      return '$30-100/month';
    case 'unencrypted_disk':
      return 'Security improvement';
    case 'Stale Partitioning':
      return '$20-80/month';
    case 'Query Optimization':
      return '$100-500/month';
    case 'Cost Optimization':
      return '$200-1000/month';
    default:
      return 'N/A';
  }
}

function calculateTotalSavings(findings) {
  const savingsFindings = findings.filter(f => {
    const type = f.type || f.check || '';
    return ['low_cpu_utilization', 'low_memory_utilization', 'Stale Partitioning', 'Query Optimization', 'Cost Optimization'].includes(type);
  });
  
  if (savingsFindings.length === 0) return '$0/month';
  
  // Estimate based on number of optimization opportunities
  const estimatedSavings = savingsFindings.length * 75; // Average $75 per finding
  return `$${estimatedSavings}/month`;
}

// Add endpoint to check audit permissions
app.get('/api/audit-permissions', authenticateToken, async (req, res) => {
  const googleId = req.user?.userId;
  console.log(`[AUDIT-PERMS] Checking audit permissions for googleId=${googleId}`);
  
  try {
    // Find the user by Google ID
    const user = await prisma.user.findUnique({
      where: { googleId: googleId }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found. Please re-authenticate.' });
    }
    
    // Find user's projects with tokens
    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      include: { tokens: true }
    });
    
    if (projects.length === 0) {
      return res.json({ 
        hasPermissions: false, 
        reason: 'No projects found',
        message: 'Please connect your GCP project first.'
      });
    }
    
    const project = projects[0];
    if (!project.tokens || project.tokens.length === 0) {
      return res.json({ 
        hasPermissions: false, 
        reason: 'No OAuth tokens',
        message: 'Please re-authenticate with Google Cloud to grant audit permissions.'
      });
    }
    
    // Test permissions by making a simple API call
    const tokenRecord = project.tokens[0];
    const tokens = {
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
      expiry_date: new Date(tokenRecord.expiry).getTime(),
      scope: tokenRecord.scopes
    };
    
    try {
      const { google } = require('googleapis');
      const authClient = new google.auth.OAuth2();
      authClient.setCredentials(tokens);
      
      // Test compute access
      const compute = google.compute({ version: 'v1', auth: authClient });
      await compute.projects.get({ project: project.gcpProjectId });
      
      return res.json({ 
        hasPermissions: true, 
        message: 'Audit permissions are configured correctly.',
        scopes: tokenRecord.scopes
      });
    } catch (apiError) {
      console.error('[AUDIT-PERMS] API test failed:', apiError.message);
      return res.json({ 
        hasPermissions: false, 
        reason: 'Insufficient scopes',
        message: 'Please re-authenticate with expanded permissions for cloud auditing.',
        error: apiError.message,
        requiredScopes: [
          'https://www.googleapis.com/auth/cloud-platform',
          'https://www.googleapis.com/auth/compute.readonly',
          'https://www.googleapis.com/auth/bigquery.readonly',
          'https://www.googleapis.com/auth/monitoring.read'
        ]
      });
    }
  } catch (err) {
    console.error(`[AUDIT-PERMS] Error checking permissions for googleId=${googleId}:`, err);
    res.status(500).json({ error: 'Internal server error checking audit permissions.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 