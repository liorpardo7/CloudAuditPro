# OAuth Migration Plan for GCP Audit Scripts

## Objective
Refactor all audit scripts to use OAuth tokens for authentication, ensuring user-selected project access and removing reliance on static service account JSON. This plan covers:
1. Centralizing and modernizing authentication
2. Standardizing audit script interfaces
3. Updating audit orchestration

---

## Step 1: Centralize and Modernize Authentication
- [x] Refactor `auth.js` to accept OAuth tokens as the primary method. **(DONE)**
- [x] Fallback to service account only for legacy/testing. **(DONE)**
- [x] Export `getAuthClient(tokens)` and `getProjectId(authClient)`. **(DONE)**
- [x] Remove direct service account JSON usage from all scripts except as fallback. **(DONE in auth.js, pending in scripts)**

## Step 2: Standardize Audit Script Interfaces
- [ ] Refactor each audit script to export a `run(projectId, tokens)` function.
- [ ] Remove any direct reading of service account JSON from audit scripts.
- [ ] Ensure all scripts use the passed-in `authClient` for API calls.

### Audit Scripts Checklist
- [x] billing-advanced-audit.js (**COMPLETE**)
- [x] disk-audit.js (**COMPLETE**)
- [x] storage-advanced-audit.js (**COMPLETE**)
- [x] securitycenter-audit.js (**COMPLETE**)
- [x] data-protection-audit.js (**COMPLETE**)
- [x] bigquery-audit.js (**COMPLETE, TEMPLATE**)
- [x] run-audit.js (**COMPLETE, ORCHESTRATION**)
- [ ] run-all-audits.js
- [ ] oauth-auth.js (ensure it only handles OAuth, not audits)
- [x] label_consistency.js (**COMPLETE, OAUTH**)
- [x] composer_dag_audit.js (**COMPLETE, OAUTH**)
- [x] devops-audit.js (**COMPLETE, OAUTH**)
- [x] networking-audit.js (**COMPLETE, OAUTH**)
- [x] permissions-audit.js (**COMPLETE, OAUTH**)
- [x] storage_folder_lifecycle.js (**COMPLETE, OAUTH**)
- [x] org-policy-audit.js (**COMPLETE, OAUTH**)
- [x] monitoring-audit.js (**COMPLETE, OAUTH**)
- [x] compliance-audit.js (**COMPLETE, OAUTH**)
- [x] iam-audit.js (**COMPLETE, OAUTH**)
- [x] security-audit.js (**COMPLETE, OAUTH**)
- [x] bigquery_deep_dive.js (**COMPLETE, OAUTH**)
- [x] storage-lifecycle-audit.js (**COMPLETE, OAUTH**)
- [x] persistent-disk-audit.js (**COMPLETE, OAUTH**)
- [x] cloudsql_audit.js (**COMPLETE, OAUTH**)
- [x] gke-audit.js (**COMPLETE, OAUTH**)
- [x] storage-audit.js (**COMPLETE, OAUTH**)
- [x] serverless-audit.js (**COMPLETE, OAUTH**)
- [x] pubsub_audit.js (**COMPLETE, OAUTH**)
- [x] resource-utilization-audit.js (**COMPLETE, OAUTH**)
- [x] billing-audit.js (**COMPLETE, OAUTH**)
- [x] compute-audit.js (**COMPLETE, OAUTH**)
- [x] cost-allocation-audit.js (**COMPLETE, OAUTH**)
- [x] cost-audit.js (**COMPLETE, OAUTH**)
- [x] cost-management-audit.js (**COMPLETE, OAUTH**)
- [x] budget-audit.js (**COMPLETE, OAUTH**)
- [x] discount-audit.js (**COMPLETE, OAUTH**)
- [x] resource-optimization-audit.js (**COMPLETE, OAUTH**)
- [x] run-full-gcp-checklist-audit.js (**COMPLETE, OAUTH**)
- [x] scheduler_audit.js (**COMPLETE, OAUTH**)
- [x] cross_project_audit.js (**COMPLETE, OAUTH**)
- [x] advanced_audits.js (**COMPLETE, OAUTH**)

## Step 3: Update Audit Orchestration
- [x] Refactor `