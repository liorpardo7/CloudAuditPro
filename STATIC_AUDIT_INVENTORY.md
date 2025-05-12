# Static Audit Inventory

| #  | Category         | Name                        | Script                  | Endpoint                                         | Description                        | Formula                    |
|----|------------------|-----------------------------|-------------------------|--------------------------------------------------|-------------------------------------|----------------------------|
| 1  | Compute          | VM Instance Inventory       | compute-audit.js        | /api/audits/compute/vm-instance-inventory        | List all VM instances               | compute.instances.list     |
| 2  | Compute          | Check instance types/sizes  | compute-audit.js        | /api/audits/compute/check-instance-types         | Check instance types and sizes      | compute.machineTypes.list  |
| 3  | Compute          | Verify machine family usage | compute-audit.js        | /api/audits/compute/verify-machine-family        | Verify machine family usage         | compute.machineTypes.list  |
| 4  | Compute          | Review instance labels/tags | compute-audit.js        | /api/audits/compute/review-labels-tags           | Review instance labels and tags     | compute.instances.list     |
| 5  | Compute          | Check for deprecated types  | compute-audit.js        | /api/audits/compute/check-deprecated-types       | Check for deprecated machine types  | compute.machineTypes.list  |
| 6  | Compute          | Verify naming conventions   | compute-audit.js        | /api/audits/compute/verify-naming-conventions    | Verify instance naming conventions  | compute.instances.list     |
| 7  | Data Protection  | Check for sensitive data    | data-protection-audit.js| /api/audits/data-protection/check-for-sensitive-data | Check for sensitive data using DLP | dlp.inspectTemplates.list  |
| 8  | Data Protection  | Review data retention       | data-protection-audit.js| /api/audits/data-protection/review-data-retention| Review data retention policies      | storage.buckets.get        |
| 9  | Data Protection  | Verify data encryption      | data-protection-audit.js| /api/audits/data-protection/verify-data-encryption| Verify data encryption for disks/buckets | compute.disks.get, storage.buckets.get |
| 10 | DevOps           | Cloud Build Configurations  | devops-audit.js         | /api/audits/devops/cloud-build-configurations    | List and review Cloud Build configs | cloudbuild.builds.list     |
| 11 | DevOps           | Deployment History          | devops-audit.js         | /api/audits/devops/deployment-history            | Check deployment history/configs    | clouddeploy.releases.list  |
| 12 | Compliance       | GDPR Compliance             | compliance-audit.js     | /api/audits/compliance/gdpr-compliance           | Check for GDPR compliance           | securitycenter.findings.list |
| 13 | Compliance       | HIPAA Compliance            | compliance-audit.js     | /api/audits/compliance/hipaa-compliance          | Review HIPAA compliance             | securitycenter.findings.list |
| 14 | Compliance       | PCI DSS Compliance          | compliance-audit.js     | /api/audits/compliance/pci-dss-compliance        | Verify PCI DSS compliance           | securitycenter.findings.list |
| 15 | Compliance       | SOC 2 Compliance            | compliance-audit.js     | /api/audits/compliance/soc2-compliance           | Check for SOC 2 compliance          | securitycenter.findings.list |
| 16 | Security         | IAM Policy Review           | security-audit.js       | /api/audits/security/iam-policy-review           | Review all IAM policies             | resourcemanager.projects.getIamPolicy |
| 17 | Security         | Service Account Review      | security-audit.js       | /api/audits/security/service-account-review      | List and review service accounts    | iam.serviceAccounts.list    |
| 18 | Security         | Key Management              | security-audit.js       | /api/audits/security/key-management              | Check key management                | iam.serviceAccountKeys.list |
| 19 | Cost             | Billing Configuration       | cost-audit.js           | /api/audits/cost/billing-configuration           | List all billing accounts           | billing.accounts.list       |
| 20 | Cost             | Cost Optimization           | cost-audit.js           | /api/audits/cost/cost-optimization               | Check for committed use discounts   | compute.commitments.list    |
| 21 | Storage          | Bucket Inventory            | storage-audit.js        | /api/audits/storage/bucket-inventory             | List all buckets                    | storage.buckets.list        |
| 22 | Storage          | Bucket Security             | storage-audit.js        | /api/audits/storage/bucket-security              | Check IAM policies and permissions  | storage.buckets.getIamPolicy |
| 23 | Networking       | VPC Inventory               | networking-audit.js     | /api/audits/networking/vpc-inventory             | List all VPCs                       | compute.networks.list       |
| 24 | Networking       | Firewall Rules              | networking-audit.js     | /api/audits/networking/firewall-rules            | Check firewall rules                | compute.firewalls.list      |
| 25 | Monitoring       | Monitoring Dashboards       | monitoring-audit.js     | /api/audits/monitoring/monitoring-dashboards     | Check monitoring dashboards         | monitoring.dashboards.list  |
| 26 | Monitoring       | Alert Policies              | monitoring-audit.js     | /api/audits/monitoring/alert-policies            | Review alert policies               | monitoring.alertPolicies.list |
| 27 | Logging          | Log Retention               | logging-audit.js        | /api/audits/logging/log-retention                | Check log retention                 | logging.sinks.list          |
| 28 | Logging          | Log Exports                 | logging-audit.js        | /api/audits/logging/log-exports                  | Review log exports                  | logging.sinks.list          |
| 29 | Logging          | Log Analysis                | logging-audit.js        | /api/audits/logging/log-analysis                 | Verify log analysis                 | logging.logEntries.list     |
| 30 | DevOps           | Build Security              | devops-audit.js         | /api/audits/devops/build-security                | Verify build security               | cloudbuild.builds.get       |
| 31 | DevOps           | Deployment Security         | devops-audit.js         | /api/audits/devops/deployment-security           | Verify deployment security          | clouddeploy.releases.get    |
| 32 | Compliance       | Audit Logging               | compliance-audit.js     | /api/audits/compliance/audit-logging             | Review audit logs                   | logging.logEntries.list     |
| 33 | Compliance       | Log Retention Compliance    | compliance-audit.js     | /api/audits/compliance/log-retention-compliance  | Check for log retention             | logging.sinks.list          |
| 34 | Compliance       | Log Export Compliance       | compliance-audit.js     | /api/audits/compliance/log-export-compliance     | Verify log export                   | logging.sinks.list          |
| 35 | Compliance       | Log Analysis Compliance     | compliance-audit.js     | /api/audits/compliance/log-analysis-compliance   | Check for log analysis              | logging.logEntries.list     |
| 36 | Compliance       | Audit Security              | compliance-audit.js     | /api/audits/compliance/audit-security            | Review audit security               | logging.logEntries.list     |
| 37 | Compliance       | Audit Optimization          | compliance-audit.js     | /api/audits/compliance/audit-optimization        | Verify audit optimization           | logging.logEntries.list     |
| 38 | Compliance       | Audit Automation            | compliance-audit.js     | /api/audits/compliance/audit-automation          | Check for audit automation          | logging.logEntries.list     |
| 39 | Compliance       | Audit Cost Optimization     | compliance-audit.js     | /api/audits/compliance/audit-cost-optimization   | Review audit cost optimization      | logging.logEntries.list     |

<!-- Continue for every actionable audit check from the checklist --> 