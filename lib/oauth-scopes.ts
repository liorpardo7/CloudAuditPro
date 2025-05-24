// Comprehensive OAuth scopes required for CloudAuditPro audit functionality
// Updated to include only VALID scopes as confirmed by Google OAuth

export const GCP_AUDIT_SCOPES = [
  // Core identity and profile (Google's preferred format)
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  
  // Core GCP platform access (broad permissions)
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/cloud-platform.read-only',
  'https://www.googleapis.com/auth/cloudplatformprojects.readonly',
  
  // Compute Engine
  'https://www.googleapis.com/auth/compute.readonly',
  'https://www.googleapis.com/auth/compute',
  
  // Cloud Storage (using valid scope only)
  'https://www.googleapis.com/auth/devstorage.read_write',
  
  // BigQuery
  'https://www.googleapis.com/auth/bigquery.readonly',
  'https://www.googleapis.com/auth/bigquery',
  
  // Cloud Monitoring and Logging
  'https://www.googleapis.com/auth/monitoring.read',
  'https://www.googleapis.com/auth/monitoring.write',
  'https://www.googleapis.com/auth/logging.read',
  'https://www.googleapis.com/auth/logging.write',
  
  // Cloud Billing
  'https://www.googleapis.com/auth/cloud-billing.readonly',
  
  // Service Management
  'https://www.googleapis.com/auth/service.management.readonly',
  'https://www.googleapis.com/auth/servicecontrol',
  
  // Cloud DNS
  'https://www.googleapis.com/auth/ndev.clouddns.readonly',
  
  // Cloud Trace
  'https://www.googleapis.com/auth/trace.readonly'
] as const;

// Invalid scopes that were rejected by Google (commented out for reference):
// 'https://www.googleapis.com/auth/cloudkms.readonly',
// 'https://www.googleapis.com/auth/pubsub.readonly', 
// 'https://www.googleapis.com/auth/container.readonly',
// 'https://www.googleapis.com/auth/recommender.readonly',
// 'https://www.googleapis.com/auth/iam.readonly',
// 'https://www.googleapis.com/auth/cloudasset.readonly',
// 'https://www.googleapis.com/auth/sqlservice.readonly',
// 'https://www.googleapis.com/auth/appengine.readonly',
// 'https://www.googleapis.com/auth/devstorage.readonly',
// 'https://www.googleapis.com/auth/cloudresourcemanager.readonly',
// 'https://www.googleapis.com/auth/securitycenter.readonly'

// Formatted for URL encoding
export const GCP_AUDIT_SCOPES_STRING = GCP_AUDIT_SCOPES.join(' ');

// Minimum required scopes for basic functionality
export const MINIMUM_REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/compute.readonly',
  'https://www.googleapis.com/auth/bigquery.readonly',
  'https://www.googleapis.com/auth/monitoring.read'
] as const;

// Check if provided scopes include minimum requirements
export function hasMinimumScopes(providedScopes: string | string[]): boolean {
  const scopeArray = Array.isArray(providedScopes) 
    ? providedScopes 
    : providedScopes.split(' ');
    
  return MINIMUM_REQUIRED_SCOPES.every(requiredScope => 
    scopeArray.includes(requiredScope)
  );
}

// Get missing scopes
export function getMissingScopes(providedScopes: string | string[]): string[] {
  const scopeArray = Array.isArray(providedScopes) 
    ? providedScopes 
    : providedScopes.split(' ');
    
  return MINIMUM_REQUIRED_SCOPES.filter(requiredScope => 
    !scopeArray.includes(requiredScope)
  );
}

export default {
  GCP_AUDIT_SCOPES,
  GCP_AUDIT_SCOPES_STRING,
  MINIMUM_REQUIRED_SCOPES,
  hasMinimumScopes,
  getMissingScopes
}; 