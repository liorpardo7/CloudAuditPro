# Platform Pages & Menu Update Plan for Full GCP Audit Coverage

## Objective
Update the CloudAuditPro platform's pages, main menu, and submenus to fully reflect the comprehensive GCP audit suite, ensuring every audit area is discoverable and actionable from the UI.

---

## 1. Audit Areas to Platform Mapping

| Audit Area                        | Page/Menu Name                | Submenu Items (if any)                |
|-----------------------------------|-------------------------------|---------------------------------------|
| BigQuery Deep Dive                | BigQuery Audit                | Deep Dive, Query Optimization         |
| Cloud Storage Folder-Level Audit  | Storage Audit                 | Folder Analysis, Lifecycle, Classes   |
| Composer/Airflow DAG Audit        | Composer/Airflow Audit        | DAGs, Task Performance, Zombie DAGs   |
| Pub/Sub Audit                     | Pub/Sub Audit                 | Topics, Subscriptions                 |
| Cloud SQL/Databases Audit         | SQL Audit                     | Instance Config, Performance, Security|
| Cloud Scheduler/Task Queues       | Scheduler Audit               | Jobs, Task Optimization               |
| Recommendations Engine            | Recommendations               | Prioritized Actions                   |
| Cross-Project Analysis            | Cross-Project Audit           | Waste, Distribution, Billing          |
| Resource Label Consistency        | Label Consistency             | Projects, Buckets, VMs, SQL           |
| Idle External IPs                 | Network Audit                 | Idle IPs, Cleanup                     |
| Advanced Audits                   | Advanced Audits               | AI/ML, Build/Artifact, Dataflow       |

---

## 2. Menu & Navigation Recommendations
- **Main Menu:**
  - Dashboard
  - BigQuery Audit
  - Storage Audit
  - Composer/Airflow Audit
  - Pub/Sub Audit
  - SQL Audit
  - Scheduler Audit
  - Network Audit
  - Recommendations
  - Cross-Project Audit
  - Label Consistency
  - Advanced Audits
- **Submenus:**
  - Each audit page should have submenus/tabs for its major checks (see table above).
  - Recommendations page should highlight high-priority actions from all audits.

---

## 3. Implementation Checklist
- [ ] Update sidebar/main menu to include all audit areas above
- [ ] Add/rename pages to match audit areas (see mapping)
- [ ] Add submenus/tabs for each audit page as per checks
- [ ] Ensure Recommendations page aggregates from all audits
- [ ] Update navigation tests and documentation
- [ ] Remove/merge any legacy or redundant menu items

---

## 4. Notes
- This plan should be reviewed with design/UX before implementation.
- All changes should be made in the `update-platform-pages-for-full-audit` branch.
- After implementation, update onboarding and help docs to match new navigation. 