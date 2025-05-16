const { google } = require('googleapis');
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// OAuth 2.0 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

// Scopes required for all audit scripts
const SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/cloud-platform.read-only',
  'https://www.googleapis.com/auth/cloudplatformprojects.readonly',
  'https://www.googleapis.com/auth/cloud-billing.readonly',
  'https://www.googleapis.com/auth/compute.readonly',
  'https://www.googleapis.com/auth/bigquery.readonly',
  'https://www.googleapis.com/auth/monitoring.readonly'
];

class OAuthAuthenticator {
  constructor() {
    this.app = express();
    this.setupExpress();
    this.tokens = null;
    this.selectedProjects = [];
  }

  setupExpress() {
    this.app.use(session({
      secret: 'cloudauditpro-secret',
      resave: false,
      saveUninitialized: true
    }));

    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.use(express.json());

    // Routes
    this.app.get('/auth', this.handleAuth.bind(this));
    this.app.get('/oauth2callback', this.handleCallback.bind(this));
    this.app.get('/projects', this.getProjects.bind(this));
    this.app.post('/select-projects', this.selectProjects.bind(this));
    this.app.get('/status', this.getStatus.bind(this));
    this.app.get('/api/gcp/projects', this.getProjects.bind(this));
    this.app.post('/api/gcp/save-projects', (req, res) => {
      const { projectIds } = req.body;
      if (!Array.isArray(projectIds)) {
        return res.status(400).json({ error: 'projectIds must be an array' });
      }
      // For now, just log or store in memory
      this.selectedProjects = projectIds;
      console.log('Selected projects:', projectIds);
      res.json({ success: true, selectedProjects: projectIds });
    });
  }

  async handleAuth(req, res) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
    res.redirect(authUrl);
  }

  async handleCallback(req, res) {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code);
      this.tokens = tokens;
      oauth2Client.setCredentials(tokens);
      
      // Save tokens to file
      const tokenPath = path.join(__dirname, 'oauth-tokens.json');
      fs.writeFileSync(tokenPath, JSON.stringify(tokens));
      
      res.redirect('/projects');
    } catch (error) {
      console.error('Error getting tokens:', error);
      res.status(500).send('Authentication failed');
    }
  }

  async getProjects(req, res) {
    if (!this.tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(this.tokens);
    const cloudResourceManager = google.cloudresourcemanager('v1');
    try {
      const result = await cloudResourceManager.projects.list({
        auth: oauth2Client,
        pageSize: 1000
      });
      const projects = result.data.projects || [];
      res.json({ projects });
    } catch (err) {
      console.error('Error fetching projects:', err);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }

  async selectProjects(req, res) {
    const { projects } = req.body;
    this.selectedProjects = projects;
    
    // Save selected projects
    const projectsPath = path.join(__dirname, 'selected-projects.json');
    fs.writeFileSync(projectsPath, JSON.stringify(projects));
    
    res.json({ success: true });
  }

  getStatus(req, res) {
    res.json({
      authenticated: !!this.tokens,
      selectedProjects: this.selectedProjects
    });
  }

  async startServer() {
    return new Promise((resolve) => {
      this.server = this.app.listen(3000, () => {
        console.log('OAuth server running on http://localhost:3000');
        resolve();
      });
    });
  }

  async stopServer() {
    if (this.server) {
      this.server.close();
    }
  }

  async authenticate() {
    await this.startServer();
    
    // Replace require with dynamic import
    const open = (await import('open')).default;
    await open('http://localhost:3000/auth');
    
    // Wait for authentication
    return new Promise((resolve, reject) => {
      const checkAuth = setInterval(async () => {
        try {
          const response = await fetch('http://localhost:3000/status');
          const { authenticated, selectedProjects } = await response.json();
          
          if (authenticated && selectedProjects.length > 0) {
            clearInterval(checkAuth);
            await this.stopServer();
            resolve({
              tokens: this.tokens,
              selectedProjects: this.selectedProjects
            });
          }
        } catch (error) {
          clearInterval(checkAuth);
          reject(error);
        }
      }, 1000);
    });
  }
}

module.exports = { OAuthAuthenticator }; 