# CloudAuditPro: Go Further Security & Operations Checklist

This checklist covers advanced security, operational, and compliance best practices for a production-grade cloud audit platform. Each item includes a detailed explanation and **step-by-step implementation instructions**.

---

## 1. CSRF Protection for All Mutating Endpoints
- [x] **CSRF tokens required for all POST/PUT/DELETE API routes**
  - *Explanation:* Cross-Site Request Forgery (CSRF) attacks trick authenticated users into submitting unwanted actions. All endpoints that mutate data must require a valid CSRF token, which is generated server-side and sent to the frontend for inclusion in requests.
  - *How to implement:*
    1. `/api/csrf-token` endpoint issues a secure CSRF token and sets it as an HTTP-only cookie.
    2. All mutating Next.js API routes now use a reusable CSRF middleware (`lib/csrf.ts`) to validate the token from the cookie and the `x-csrf-token` header.
    3. Frontend must fetch the token and include it in all POST/PUT/DELETE requests.
    4. Tested: POST without token returns 403; with token succeeds.
    5. **Complete.**

---

## 2. Rate Limiting for Sensitive Endpoints
- [x] **Rate limiting on authentication and project mutation endpoints**
  - *Explanation:* Rate limiting prevents brute-force attacks and abuse by limiting the number of requests per IP or user in a given time window. Sensitive endpoints (login, token refresh, project creation/deletion) should have stricter limits.
  - *How to implement:*
    1. A reusable in-memory rate limiting middleware (`lib/rate-limit.ts`) is now used in all sensitive Next.js API routes.
    2. Each endpoint (e.g., `/api/auth/google/refresh`, `/api/projects/set`, `/api/audits/run`, etc.) enforces a per-IP limit (5-10 requests/minute).
    3. If the limit is exceeded, a 429 response is returned.
    4. Test by sending >limit requests in a minute and verify 429 is returned.
    5. **Complete.**

---

## 3. Audit Logging for Sensitive Actions
- [x] **Audit log for authentication, project, and permission changes**
  - *Explanation:* Audit logs provide a tamper-evident record of critical actions (login, logout, project switch, permission changes). This is essential for compliance, forensics, and incident response.
  - *How to implement:*
    1. Prisma schema and client are unified in `/prisma/schema.prisma` and `@prisma/client`.
    2. `AuditLog` model is available and migrations are up to date.
    3. **Login, logout, and project selection actions are now logged in the database with user, action, IP, and user agent.**
    4. Permission changes will be instrumented for audit logging if/when such endpoints exist.
    5. Test by logging in, logging out, and switching projects; verify AuditLog entries in the DB.
    6. **Complete for all current sensitive actions.**

---

## 4. Automated Security Scanning in CI/CD
- [ ] **Dependency and code security scans enforced in CI**
  - *Explanation:* Automated security scanning (SAST, dependency checks, secret scanning) in CI/CD ensures vulnerabilities are caught before deployment. This includes `npm audit`, CodeQL, and secret scanning tools like Gitleaks.
  - *How to implement:*
    1. Ensure `npm audit` and `audit-ci` are in pre-commit hooks and CI (see `AUTO_GUARDRAILS.md`).
    2. In `.github/workflows/security-scan.yml`, add steps for:
       - CodeQL (`github/codeql-action/analyze@v2`)
       - `npm audit --audit-level=moderate`
       - Gitleaks for secret scanning
    3. Fail the build on any critical findings.
    4. Add a security scan badge to the README:
       ```md
       ![Security Scan](https://github.com/<org>/<repo>/actions/workflows/security-scan.yml/badge.svg)
       ```
    5. Test by introducing a known vulnerability and verifying CI fails.

---

## 5. Access Controls (RBAC) for Sensitive Actions
- [ ] **Role-based access control for all sensitive API endpoints**
  - *Explanation:* RBAC ensures only authorized users can perform sensitive actions (e.g., project deletion, permission changes, admin features). Roles (admin, user, auditor) and permissions should be clearly defined and enforced in middleware.
  - *How to implement:*
    1. Add a `role` field to the `User` model in `prisma/schema.prisma`:
       ```prisma
       model User {
         id    String @id @default(uuid())
         email String @unique
         role  String @default("user")
         // ...
       }
       ```
    2. In session creation, include the user's role in the session/cookie.
    3. Create RBAC middleware for Next.js API and Express routes:
       ```js
       function requireRole(role) {
         return (req, res, next) => {
           if (req.user?.role !== role) return res.status(403).json({ error: 'Forbidden' });
           next();
         };
       }
       ```
    4. Apply `requireRole('admin')` to admin/project/permission endpoints.
    5. Test by logging in as different roles and attempting restricted actions.

---

## 6. Monitoring and Alerting
- [ ] **Error and security event monitoring with alerting**
  - *Explanation:* Real-time monitoring (e.g., Sentry, Datadog, Prometheus) enables rapid detection of errors and security incidents. Alerting ensures the team is notified of critical issues immediately.
  - *How to implement:*
    1. For error monitoring, sign up for [Sentry](https://sentry.io/) and get a DSN.
    2. Install Sentry SDKs:
       - Backend: `npm install @sentry/node`
       - Frontend: `npm install @sentry/nextjs`
    3. Initialize Sentry in `backend/src/index.js` and `app/_app.tsx`:
       ```js
       import * as Sentry from '@sentry/node';
       Sentry.init({ dsn: process.env.SENTRY_DSN });
       ```
    4. Set up alerting rules in Sentry for critical errors.
    5. Optionally, integrate Prometheus/Grafana or Datadog for metrics.
    6. Test by throwing an error and verifying it appears in Sentry.

---

## 7. Automated Tests for All Security Flows
- [ ] **Automated tests for auth, session, RBAC, and audit log flows**
  - *Explanation:* Automated tests (unit, integration, E2E) ensure that security controls work as intended and regressions are caught early. This includes tests for login/logout, session expiry, CSRF, RBAC, and audit logging.
  - *How to implement:*
    1. Backend: Use Jest + Supertest for API tests (see `backend/test`).
    2. Frontend: Use Cypress for E2E tests (see `cypress/e2e`).
    3. Add tests for:
       - Login/logout/session expiry
       - CSRF protection (POST without token should fail)
       - RBAC (forbidden for wrong role)
       - Audit log creation (verify DB entry after action)
    4. Require all tests to pass in CI before merging.
    5. Test by running `npm run test` and `npm run cypress:run`.

---

## 8. Documentation and Security Badges
- [ ] **Security documentation and CI status badges in README**
  - *Explanation:* Clear documentation of security controls and visible CI/security scan badges build trust with users and contributors. They also help maintainers quickly spot issues.
  - *How to implement:*
    1. Add a `Security` section to `README.md` describing all implemented controls.
    2. Add CI and security scan badges at the top of the README:
       ```md
       ![CI](https://github.com/<org>/<repo>/actions/workflows/ci.yml/badge.svg)
       ![Security Scan](https://github.com/<org>/<repo>/actions/workflows/security-scan.yml/badge.svg)
       ```
    3. Document how to report vulnerabilities (add a `SECURITY.md` file).
    4. Test by viewing the README and verifying badge status.

---

## 9. Principle of Least Privilege & Access Reviews
- [ ] **Regularly review and minimize permissions for users and service accounts**
  - *Explanation:* The principle of least privilege reduces risk by ensuring users and services have only the permissions they need. Regular reviews catch privilege creep and misconfigurations.
  - *How to implement:*
    1. Schedule quarterly access reviews (add to team calendar).
    2. Use scripts (see `backend/src/scripts/gcp-audit/verify-permissions.js`) to list all roles and permissions.
    3. Remove unnecessary permissions from users and service accounts.
    4. Document the review process in `SECURITY.md`.
    5. Test by running the script and reviewing output.

---

## 10. Backup, Recovery, and Disaster Planning
- [ ] **Automated backups and tested recovery procedures**
  - *Explanation:* Regular, automated backups and tested recovery plans are essential for resilience against data loss, ransomware, or accidental deletion.
  - *How to implement:*
    1. Set up automated database backups (e.g., GCP Cloud SQL automated backups, or `pg_dump` for Postgres).
    2. Store backups in a secure, offsite location (e.g., GCS bucket with restricted access).
    3. Document and test the restore process at least twice a year.
    4. Add backup/restore instructions to `SECURITY.md` or a dedicated `BACKUP.md`.
    5. Test by restoring from backup in a staging environment.

---

## 11. Security Monitoring & Threat Detection
- [ ] **Integrate with cloud provider security monitoring (e.g., GCP Security Command Center)**
  - *Explanation:* Cloud-native security monitoring tools provide threat detection, vulnerability scanning, and compliance reporting.
  - *How to implement:*
    1. Enable GCP Security Command Center (SCC) in the GCP Console.
    2. Grant the app/service account `roles/securitycenter.viewer`.
    3. Use the SCC API to fetch and review findings (see `securitycenter-audit.js`).
    4. Set up alerting for new/critical findings.
    5. Document the process in `SECURITY.md`.
    6. Test by generating a test finding and verifying alerting.

---

## 12. Compliance & Privacy Controls
- [ ] **Implement and document compliance controls (GDPR, HIPAA, etc.)**
  - *Explanation:* If handling regulated data, document and enforce compliance controls (data retention, access logging, consent management, etc.).
  - *How to implement:*
    1. Map all controls to requirements (see `GCP_AUDIT_CHECKLIST.md`).
    2. Implement data retention and deletion policies in code and DB.
    3. Add consent management UI and backend logic if needed.
    4. Document compliance controls in a `COMPLIANCE.md` file.
    5. Test by simulating a data deletion or access request.

---

## 13. Secure Coding & Dependency Management
- [ ] **Enforce secure coding standards and dependency updates**
  - *Explanation:* Secure coding standards (linting, code review, dependency pinning) reduce the risk of introducing vulnerabilities.
  - *How to implement:*
    1. Enforce linting with ESLint/Prettier (see `.eslintrc.json`, `.prettierrc`).
    2. Require code review for all PRs (enforce in GitHub branch protection).
    3. Use Dependabot or Renovate for automated dependency updates.
    4. Pin dependency versions in `package.json` and lockfiles.
    5. Document secure coding practices in `SECURITY.md`.
    6. Test by submitting a PR with a lint error or outdated dependency.

---

## 14. Incident Response & Responsible Disclosure
- [ ] **Document incident response and vulnerability disclosure process**
  - *Explanation:* A clear process for handling incidents and vulnerabilities ensures rapid, responsible response and builds trust with users.
  - *How to implement:*
    1. Add an `INCIDENT_RESPONSE.md` file describing:
       - How to report an incident
       - Who to contact (email, Slack, etc.)
       - Response timelines and escalation paths
    2. Add a `SECURITY.md` file with a responsible disclosure policy.
    3. Link these files from the README.
    4. Test by simulating a test incident and following the documented process.

--- 