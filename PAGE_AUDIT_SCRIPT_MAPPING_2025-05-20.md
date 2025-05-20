# Page to Audit Script Mapping (2025-05-20)

## Plan: Top-Level Report/Summary Pages

Each top-level menu item now has a summary/report page (e.g., `/cost`, `/security`, `/storage`, etc.) that aggregates and summarizes the most important findings, metrics, and recommendations from all its subpages. These pages provide:
- Key metrics and charts
- High-level recommendations
- Links to detailed subpages
- Aggregated data from all relevant audit scripts and API endpoints

---

| Page Path | Audit Script(s) | Audit Item(s) / Check(s) | API Endpoint(s) | Audit Button | Copy Raw Response |
|-----------|-----------------|--------------------------|-----------------|--------------|-------------------|
| /cost | cost-audit.js, cost-allocation-audit.js, discount-audit.js, monitoring-audit.js, budgeting-audit.js | Cost allocation, budgeting, discount utilization, cost anomaly detection, cost optimization, monitoring & alerts | /api/cost, /api/cost-allocation, /api/discounts, /api/monitoring, /api/budgeting, ... | ✅ | ✅ |
| /security | security-audit.js | IAM policies, role assignments, service account security, org policies, security findings, vulnerability reports, threat detection, security recommendations | /api/security, /api/audits/security/iam-policy-review, ... | ✅ | ✅ |
| /resource-utilization | resource-utilization-audit.js | Cluster and VM utilization, idle resources, scheduling optimization, unused IPs, load balancer traffic | /api/resource-utilization, /api/audits/resource-utilization/cluster, ... | ✅ | ✅ |
| /storage | storage-audit.js, persistent-disk-audit.js, filestore-audit.js | Bucket inventory, storage class, lifecycle, persistent disk and filestore optimization | /api/storage, /api/storage/persistent-disk-optimization, /api/storage/filestore-optimization, ... | ✅ | ✅ |
| /compute | compute-audit.js | VM inventory, right-sizing, machine images, sole-tenant efficiency, OS/security checks | /api/compute, /api/compute/right-sizing, /api/compute/optimize-machine-images, /api/compute/sole-tenant-efficiency, ... | ✅ | ✅ |
| /serverless | run-full-gcp-checklist-audit.js | Cloud Functions and Cloud Run resource/concurrency optimization | /api/serverless/cloud-functions-optimization, /api/serverless/cloud-run-optimization | ✅ | ✅ |
| /bigquery | bigquery-audit.js | Query optimization, cost, access controls, slot utilization, deprecated UDFs, storage API monitoring | /api/bigquery, /api/bigquery/slot-utilization, /api/bigquery/deprecated-udfs, ... | ✅ | ✅ |
| /network | networking-audit.js | VPCs, subnets, routing, peering, firewall, flow logs, NAT, CDN, egress, segmentation, DNS | /api/network, /api/audits/network/vpc-inventory, /api/audits/networking/firewall-rules, ... | ✅ | ✅ |
| /compliance | compliance-audit.js | GDPR, HIPAA, PCI, SOC2, audit logs, privacy, consent, data access, log retention | /api/compliance, /api/audits/compliance/gdpr-compliance, ... | ✅ | ✅ |
| /audits | N/A | Audit job history, status, and results | /api/audits, /api/audits/[id] |
| /admin/audit-inventory | N/A | Audit Inventory Management | /api/admin/audit-inventory |
| /compute/optimize-machine-images | compute-audit.js | Optimize Machine Image Storage Costs | /api/compute/optimize-machine-images |
| /compute/right-sizing | compute-audit.js | Granular VM Right-Sizing & Customization | /api/compute/right-sizing |
| /compute/sole-tenant-efficiency | compute-audit.js | Sole-Tenant Node Efficiency Review | /api/compute/sole-tenant-efficiency |
| /gke/workload-right-sizing | gke-audit.js | GKE Workload (Pod) Right-Sizing | /api/audits/gke/workload-right-sizing |
| /gke/idle-node-pools | gke-audit.js | GKE Idle/Underutilized Node Pool Detection | /api/audits/gke/idle-node-pools |
| /serverless/cloud-functions-optimization | run-full-gcp-checklist-audit.js | Cloud Functions Resource & Concurrency Optimization | /api/serverless/cloud-functions-optimization |
| /serverless/cloud-run-optimization | run-full-gcp-checklist-audit.js | Cloud Run Resource & Concurrency Optimization | /api/serverless/cloud-run-optimization |
| /storage/persistent-disk-optimization | persistent-disk-audit.js | Persistent Disk Type & Snapshot Cost-Effectiveness | /api/storage/persistent-disk-optimization |
| /storage/filestore-optimization | filestore-audit.js | Filestore Instance Optimization | /api/storage/filestore-optimization |
| /network/service-tier-analysis | networking-audit.js | Network Service Tier Analysis (Egress Costs) | /api/audits/network/service-tier-analysis |
| /network/nat-efficiency | networking-audit.js | Cloud NAT Gateway Efficiency | /api/audits/network/nat-efficiency |
| /network/dormant-projects | networking-audit.js | Dormant/Unused Projects Review | /api/audits/network/dormant-projects |
| /network/inter-region-traffic | networking-audit.js | Inter-Region/Zone Traffic Cost Analysis | /api/audits/network/inter-region-traffic |
| /network/cdn-egress-optimization | networking-audit.js | Cloud CDN for Egress Optimization | /api/audits/network/cdn-egress-optimization |
| /network/cud-sud-coverage | networking-audit.js | Holistic CUD/SUD Coverage Analysis | /api/audits/network/cud-sud-coverage |
| /discounts | discount-audit.js | Check for committed use discounts, Review sustained use discounts, Review cost recommendations, Discount utilization analysis, Committed use discount opportunities, Sustained use discount tracking, Discount optimization recommendations | /api/audits/discounts/cost-optimization |
| /discounts/flexible-vs-resource-cuds | discount-audit.js | Flexible CUDs vs. Resource-based CUDs Strategy | /api/audits/discounts/flexible-vs-resource-cuds |
| /bigquery/storage-api-cost-monitoring | bigquery-audit.js | BigQuery Storage API Cost Monitoring | /api/audits/bigquery/storage-api-cost-monitoring |
| /bigquery/slot-utilization | bigquery-audit.js | BigQuery Slot Utilization & Reservation Sizing | /api/audits/bigquery/slot-utilization |
| /bigquery/deprecated-udfs | bigquery-audit.js | Identify deprecated UDFs | /api/audits/bigquery/deprecated-udfs |
| /bigquery/stale-partitioning | bigquery-audit.js | Check for stale partitioning | /api/audits/bigquery/stale-partitioning |
| /monitoring | monitoring-audit.js | Check monitoring dashboards, Review alert policies, Verify logging configuration, Check for custom metrics, Review monitoring optimization, Verify monitoring security, Check for monitoring automation, Review monitoring cost optimization, Cost anomaly alerts, Missing critical alerts detection, Alert notification channel verification, Alert coverage analysis, Alert effectiveness assessment | /api/audits/monitoring/dashboards, /api/audits/monitoring/alert-policies, ... |
| /storage-lifecycle | storage-lifecycle-audit.js | Advanced Object Lifecycle Management (OLM) Policy Tuning, Standard tier usage analysis, Unused bucket detection, Storage cost calculation, Storage access pattern analysis, Storage class transition recommendations, Object lifecycle policy optimization | /api/audits/storage-lifecycle/olm-policy, ... |
| /cost-allocation | cost-allocation-audit.js | List all projects, Check project hierarchy, Review resource labels, Verify resource quotas, Check for resource optimization, Review resource security, Verify resource automation, Check for resource cost optimization, Resource tagging compliance, Cost center allocation, Project-level cost analysis, Service-level cost breakdown | /api/audits/cost-allocation/projects, ... |
| /devops | devops-audit.js | Cloud Build Configurations, Deployment History, Build Security, Deployment Security | /api/audits/devops/cloud-build-configurations, /api/audits/devops/deployment-history, ... |
| /data-protection | data-protection-audit.js | Check for sensitive data, Review data retention, Verify data encryption, Check for data residency, Review data security, Verify data compliance, Check for data optimization, Review data automation | /api/audits/data-protection/check-for-sensitive-data, ... |
| /budgeting | budget-audit.js | Budget alert configuration, Budget tracking and forecasting, Budget vs. actual spending analysis, Budget allocation by service | /api/audits/budgeting/alerts, ... |
| /audits/[id] | N/A | Audit Job Details | /api/audits/[id] |
<!-- If any audit script is not surfaced on a page, list it here: -->
<!-- Example: | (none) | advanced_audits.js | Advanced Audits (future/utility) | (none) | --> 