# GCP Audit Checklist

> **Note**: All permissions listed are read-only. The audit process should not require any write permissions.

## Status Legend
✓ - Passing/Implemented
✗ - Failing/Not Implemented

## Required Base Permissions [✓]
The service account needs the following roles:
1. Basic Access: [✓]
   - `roles/viewer` (Basic read-only access) [✓]
   - `roles/iam.securityReviewer` (Security review access) [✓]
   - `roles/monitoring.viewer` (Monitoring read access) [✓]
   - `roles/logging.viewer` (Logging read access) [✓]

2. Storage Access: [✓]
   - `roles/storage.objectViewer` (Storage object access) [✓]
   - `roles/storage.buckets.getIamPolicy` (Storage bucket IAM policy access) [✓]

3. Security Access: [✓]
   - `roles/securitycenter.findingsViewer` (Security Center findings access) [✓]
   - `roles/securitycenter.sourcesViewer` (Security Center sources access) [✓]
   - `roles/dlp.reader` (DLP read access) [✓]

4. Cost & Billing Access: [✓]
   - `roles/billing.viewer` (Billing account access) [✓]
   - `roles/recommender.viewer` (Cost optimization recommendations) [✓]

5. Asset & Resource Access: [✓]
   - `roles/cloudasset.viewer` (Asset inventory access) [✓]
   - `roles/resourcemanager.organizationViewer` (Organization access) [✓]

## Required APIs [✓]
The following APIs must be enabled in the project:
1. Core APIs: [✓]
   - Compute Engine API (`compute.googleapis.com`) [✓]
   - Cloud Storage API (`storage.googleapis.com`) [✓]
   - Cloud Monitoring API (`monitoring.googleapis.com`) [✓]
   - Cloud Logging API (`logging.googleapis.com`) [✓]

2. Security APIs: [✓]
   - Security Command Center API (`securitycenter.googleapis.com`) [✓]
   - Cloud DLP API (`dlp.googleapis.com`) [✓]
   - Cloud Asset API (`cloudasset.googleapis.com`) [✓]

3. Management APIs: [✓]
   - Cloud Billing API (`cloudbilling.googleapis.com`) [✓]
   - Cloud Resource Manager API (`cloudresourcemanager.googleapis.com`) [✓]
   - Identity and Access Management (IAM) API (`iam.googleapis.com`) [✓]

4. Additional APIs: [✓]
   - Cloud DNS API (`dns.googleapis.com`) [✓]
   - Container API (`container.googleapis.com`) [✓]
   - Cloud Functions API (`cloudfunctions.googleapis.com`) [✓]
   - Cloud Run API (`run.googleapis.com`) [✓]

## Compute Resources

### Virtual Machines
- [✓] VM Instance Inventory
  - [✓] List all VM instances (`compute.instances.list`)
  - [✓] Check instance types and sizes (`compute.machineTypes.list`)
  - [✓] Verify machine family usage (`compute.machineTypes.list`)
  - [✓] Review instance labels and tags (`compute.instances.list`)
  - [✓] Check for deprecated machine types (`compute.machineTypes.list`)
  - [✓] Verify instance naming conventions (`compute.instances.list`)
- [✓] VM Optimization
  - [✓] Check for underutilized instances (`monitoring.timeSeries.list`)
  - [✓] Review instance scheduling (`compute.instances.list`)
  - [✓] Verify preemptible/spot instance usage (`compute.instances.list`)
  - [✓] Check for right-sized instances (`compute.instances.list`, `monitoring.timeSeries.list`)
  - [✓] Review CPU and memory utilization patterns (`monitoring.timeSeries.list`)
  - [✓] Check for idle instances during non-business hours (`monitoring.timeSeries.list`)
  - [✓] Verify instance reservations (`compute.reservations.list`)
  - [✓] Check for sustained use discounts (`compute.instances.list`)
- [✓] VM Security
  - [✓] Verify OS patch levels (`compute.instances.list`, `compute.images.list`)
  - [✓] Check for secure boot enabled (`compute.instances.list`)
  - [✓] Review service account usage (`compute.instances.list`, `iam.serviceAccounts.get`)
  - [✓] Verify disk encryption (`compute.disks.list`)
  - [✓] Check for Shielded VM features (`compute.instances.list`)
  - [✓] Verify integrity monitoring (`compute.instances.list`)
  - [✗] Review OS login configuration (`compute.instances.list`)
  - [✗] Check for confidential computing (`compute.instances.list`)
  - [✓] Verify VM metadata security (`compute.instances.list`)

### Kubernetes (GKE)
- [✓] Cluster Configuration
  - [✓] List all GKE clusters (`container.clusters.list`)
  - [✓] Check cluster versions (`container.clusters.get`)
  - [✓] Verify node pool configurations (`container.nodePools.list`)
  - [✓] Review cluster labels and tags (`container.clusters.list`)
  - [✓] Check for regional vs zonal clusters (`container.clusters.get`)
  - [✓] Verify cluster maintenance windows (`container.clusters.get`)
- [✓] Cluster Security
  - [✗] Check for private clusters (`container.clusters.get`)
  - [✗] Verify workload identity (`container.clusters.get`)
  - [✗] Review network policies (`container.clusters.get`)
  - [✗] Check for binary authorization (`container.clusters.get`)
  - [✗] Verify pod security policies (`container.clusters.get`)
  - [✓] Check for container image scanning (`container.clusters.get`)
  - [✓] Review cluster security posture (`container.clusters.get`)
  - [✓] Verify cluster logging and monitoring (`container.clusters.get`)
- [✓] Cluster Optimization
  - [✓] Review node pool sizing (`container.nodePools.list`)
  - [✓] Check for cluster autoscaling (`container.clusters.get`)
  - [✓] Verify vertical pod autoscaling (`container.clusters.get`)
  - [✓] Review resource quotas (`container.clusters.get`)
  - [✓] Check for node auto-provisioning (`container.clusters.get`)
  - [✓] Verify cluster resource utilization (`monitoring.timeSeries.list`)
  - [✓] Review pod disruption budgets (`container.clusters.get`)
  - [✓] Check for cost-optimized node pools (`container.nodePools.list`)

### Serverless
- [✓] Cloud Functions
  - [✓] List all functions (`cloudfunctions.functions.list`)
  - [✓] Check function versions (`cloudfunctions.functions.get`)
  - [✓] Review memory allocations (`cloudfunctions.functions.get`)
  - [✓] Verify function triggers (`cloudfunctions.functions.get`)
  - [✓] Check for cold start optimization (`cloudfunctions.functions.get`)
  - [✓] Review function timeout settings (`cloudfunctions.functions.get`)
  - [✓] Verify function security settings (`cloudfunctions.functions.get`)
  - [✓] Check for function retry policies (`cloudfunctions.functions.get`)
- [✓] Cloud Run
  - [✓] List all services (`run.services.list`)
  - [✓] Check service configurations (`run.services.get`)
  - [✓] Review scaling settings (`run.services.get`)
  - [✓] Verify container images (`run.services.get`)
  - [✓] Check for concurrency settings (`run.services.get`)
  - [✓] Review CPU allocation (`run.services.get`)
  - [✓] Verify service security settings (`run.services.get`)
  - [✓] Check for service mesh integration (`run.services.get`)

## Storage

### Cloud Storage
- [✓] Bucket Inventory
  - [✓] List all buckets (`storage.buckets.list`)
  - [✓] Check bucket locations (`storage.buckets.get`)
  - [✓] Review storage classes (`storage.buckets.get`)
  - [✓] Verify bucket labels (`storage.buckets.get`)
  - [✗] Check for bucket versioning (`storage.buckets.get`)
  - [✗] Review bucket lifecycle rules (`storage.buckets.get`)
  - [✗] Verify bucket retention policies (`storage.buckets.get`)
  - [✗] Check for bucket logging (`storage.buckets.get`)
- [✓] Bucket Security
  - [✓] Check IAM policies (`storage.buckets.getIamPolicy`)
  - [✓] Verify bucket permissions (`storage.buckets.getIamPolicy`)
  - [✓] Review public access (`storage.buckets.getIamPolicy`)
  - [✓] Check for uniform bucket access (`storage.buckets.get`)
  - [✓] Verify bucket encryption (`storage.buckets.get`)
  - [✗] Check for bucket lock (`storage.buckets.get`)
  - [✓] Review bucket CORS configuration (`storage.buckets.get`)
  - [✗] Verify bucket access logs (`storage.buckets.get`)
- [✓] Bucket Management
  - [✗] Review lifecycle rules (`storage.buckets.get`)
  - [✗] Check versioning status (`storage.buckets.get`)
  - [✗] Verify retention policies (`storage.buckets.get`)
  - [✓] Review object metadata (`storage.objects.list`)
  - [✗] Check for object immutability (`storage.buckets.get`)
  - [✗] Review storage class transitions (`storage.buckets.get`)
  - [✓] Verify object access patterns (`storage.objects.list`)
  - [✓] Check for bucket cost optimization (`storage.buckets.get`)

### Persistent Disks
- [✓] Disk Inventory
  - [✓] List all persistent disks (`compute.disks.list`)
  - [✓] Check disk types (`compute.disks.get`)
  - [✓] Review disk sizes (`compute.disks.get`)
  - [✓] Verify disk labels (`compute.disks.list`)
  - [✓] Check for disk snapshots (`compute.snapshots.list`)
  - [✓] Review disk performance (`compute.disks.get`)
  - [✓] Verify disk attachments (`compute.disks.get`)
  - [✓] Check for disk reservations (`compute.disks.get`)
- [✓] Disk Security
  - [✓] Check for encryption (`compute.disks.get`)
  - [✓] Verify snapshot policies (`compute.snapshots.list`)
  - [✓] Review access controls (`compute.disks.getIamPolicy`)
  - [✓] Check for secure deletion (`compute.disks.get`)
  - [✓] Verify disk integrity (`compute.disks.get`)
  - [✓] Check for disk backup policies (`compute.disks.get`)
  - [✓] Review disk access logs (`compute.disks.get`)
  - [✓] Verify disk security policies (`compute.disks.get`)

## Networking

### VPC
- [✓] Network Configuration
  - [✓] List all VPCs (`compute.networks.list`)
  - [✓] Check subnet configurations (`compute.subnetworks.list`)
  - [✓] Review routing tables (`compute.routes.list`)
  - [✓] Verify network labels (`compute.networks.list`)
  - [✓] Check for VPC peering (`compute.networks.list`)
  - [✓] Review network topology (`compute.networks.get`)
  - [✓] Verify network performance (`compute.networks.get`)
  - [✓] Check for network cost optimization (`compute.networks.get`)
- [✓] Network Security
  - [✓] Check firewall rules (`compute.firewalls.list`)
  - [✗] Review VPC flow logs (`compute.networks.get`)
  - [✓] Verify private Google access (`compute.subnetworks.get`)
  - [✓] Check for VPC service controls (`compute.networks.get`)
  - [✓] Verify network encryption (`compute.networks.get`)
  - [✓] Check for network segmentation (`compute.networks.get`)
  - [✓] Review network access policies (`compute.networks.get`)
  - [✓] Verify network security posture (`compute.networks.get`)

### Load Balancing
- [✓] Load Balancer Inventory
  - [✓] List all load balancers (`compute.forwardingRules.list`)
  - [✓] Check load balancer types (`compute.forwardingRules.get`)
  - [✓] Review backend services (`compute.backendServices.list`)
  - [✓] Verify health checks (`compute.healthChecks.list`)
  - [✓] Check for load balancer redundancy (`compute.forwardingRules.get`)
  - [✓] Review load balancer performance (`compute.forwardingRules.get`)
  - [✓] Verify load balancer scaling (`compute.forwardingRules.get`)
  - [✓] Check for load balancer cost optimization (`compute.forwardingRules.get`)
- [✓] Load Balancer Security
  - [✓] Check SSL certificates (`compute.sslCertificates.list`)
  - [✓] Review security policies (`compute.securityPolicies.list`)
  - [✓] Verify WAF configurations (`compute.securityPolicies.get`)
  - [✓] Check for DDoS protection (`compute.securityPolicies.get`)
  - [✓] Verify TLS configuration (`compute.sslCertificates.get`)
  - [✓] Check for SSL policies (`compute.sslPolicies.list`)
  - [✓] Review load balancer access logs (`compute.forwardingRules.get`)
  - [✓] Verify load balancer security posture (`compute.forwardingRules.get`)

### Cloud DNS
- [✓] DNS Configuration
  - [✓] List all DNS zones (`dns.managedZones.list`)
  - [✓] Check DNS records (`dns.resourceRecordSets.list`)
  - [✓] Review DNSSEC status (`dns.managedZones.get`)
  - [✓] Verify DNS policies (`dns.policies.list`)
  - [✓] Check for DNS redundancy (`dns.managedZones.get`)
  - [✓] Review DNS performance (`dns.managedZones.get`)
  - [✓] Verify DNS security settings (`dns.managedZones.get`)
  - [✓] Check for DNS cost optimization (`dns.managedZones.get`)

## Security & IAM

### Identity & Access Management
- [✓] IAM Policies
  - [✓] List all IAM policies (`resourcemanager.projects.getIamPolicy`)
  - [✓] Check role assignments (`resourcemanager.projects.getIamPolicy`)
  - [✓] Review custom roles (`iam.roles.list`)
  - [✓] Verify principle of least privilege (`resourcemanager.projects.getIamPolicy`)
  - [✓] Check for role separation (`resourcemanager.projects.getIamPolicy`)
  - [✓] Review IAM audit logs (`logging.logEntries.list`)
  - [✓] Verify IAM security posture (`resourcemanager.projects.getIamPolicy`)
  - [✓] Check for IAM cost optimization (`resourcemanager.projects.getIamPolicy`)
- [✓] Service Accounts
  - [✓] List all service accounts (`iam.serviceAccounts.list`)
  - [✓] Check key management (`iam.serviceAccountKeys.list`)
  - [✓] Review account permissions (`iam.serviceAccounts.getIamPolicy`)
  - [✓] Verify workload identity (`iam.serviceAccounts.get`)
  - [✓] Check for service account rotation (`iam.serviceAccounts.get`)
  - [✓] Review service account usage (`iam.serviceAccounts.get`)
  - [✓] Verify service account security (`iam.serviceAccounts.get`)
  - [✓] Check for service account cost optimization (`iam.serviceAccounts.get`)

### Security Controls
- [✓] Organization Policies
  - [✓] List all organization policies (`orgpolicy.policy.get`)
  - [✓] Check policy enforcement (`orgpolicy.policy.get`)
  - [✓] Review constraint settings (`orgpolicy.constraints.list`)
  - [✓] Verify policy inheritance (`orgpolicy.policy.get`)
  - [✓] Check for policy compliance (`orgpolicy.policy.get`)
  - [✓] Review policy audit logs (`logging.logEntries.list`)
  - [✓] Verify policy security posture (`orgpolicy.policy.get`)
  - [✓] Check for policy cost optimization (`orgpolicy.policy.get`)
- [✓] Security Command Center
  - [✓] Check security findings (`securitycenter.findings.list`)
  - [✓] Review vulnerability reports (`securitycenter.sources.list`)
  - [✓] Verify security health analytics (`securitycenter.assets.list`)
  - [✓] Check for threat detection (`securitycenter.findings.list`)
  - [✓] Review security recommendations (`securitycenter.findings.list`)
  - [✓] Verify security monitoring (`securitycenter.findings.list`)
  - [✓] Check for security automation (`securitycenter.findings.list`)
  - [✓] Review security cost optimization (`securitycenter.findings.list`)

## Cost Management

### Billing
- [✓] Billing Configuration
  - [✓] List all billing accounts (`billing.accounts.list`)
  - [✓] Check billing export (`billing.accounts.get`)
  - [✓] Review budget alerts (`billing.budgets.get`)
  - [✓] Verify cost allocation (`billing.accounts.get`)
  - [✓] Check for billing optimization (`billing.accounts.get`)
  - [✓] Review billing reports (`billing.accounts.get`)
  - [✓] Verify billing security (`billing.accounts.get`)
  - [✓] Check for billing automation (`billing.accounts.get`)
- [✓] Cost Optimization
  - [✓] Check for committed use discounts (`compute.commitments.list`)
  - [✓] Review sustained use discounts (`compute.instances.list`)
  - [✓] Verify resource utilization (`monitoring.timeSeries.list`)
  - [✓] Check for idle resources (`monitoring.timeSeries.list`)
  - [✓] Review cost recommendations (`recommender.recommendations.list`)
  - [✓] Verify cost allocation tags (`billing.accounts.get`)
  - [✓] Check for cost anomaly detection (`billing.accounts.get`)
  - [✓] Review cost optimization automation (`billing.accounts.get`)

### Resource Management
- [✓] Resource Organization
  - [✓] List all projects (`resourcemanager.projects.list`)
  - [✓] Check project hierarchy (`resourcemanager.projects.get`)
  - [✓] Review resource labels (`resourcemanager.projects.get`)
  - [✓] Verify resource quotas (`compute.regions.get`)
  - [✓] Check for resource optimization (`resourcemanager.projects.get`)
  - [✓] Review resource security (`resourcemanager.projects.get`)
  - [✓] Verify resource automation (`resourcemanager.projects.get`)
  - [✓] Check for resource cost optimization (`resourcemanager.projects.get`)
- [✓] Resource Monitoring
  - [✓] Check monitoring dashboards (`monitoring.dashboards.list`)
  - [✓] Review alert policies (`monitoring.alertPolicies.list`)
  - [✓] Verify logging configuration (`logging.sinks.list`)
  - [✓] Check for custom metrics (`monitoring.metricDescriptors.list`)
  - [✓] Review monitoring optimization (`monitoring.dashboards.list`)
  - [✓] Verify monitoring security (`monitoring.dashboards.list`)
  - [✓] Check for monitoring automation (`monitoring.dashboards.list`)
  - [✓] Review monitoring cost optimization (`monitoring.dashboards.list`)

## Compliance

### Data Protection
- [✗] Data Classification
  - [✗] Check for sensitive data (`dlp.inspectTemplates.list`)
  - [✗] Review data retention (`storage.buckets.get`)
  - [✓] Verify data encryption (`compute.disks.get`, `storage.buckets.get`)
  - [✓] Check for data residency (`storage.buckets.get`)
  - [✗] Review data security (`dlp.inspectTemplates.list`)
  - [✗] Verify data compliance (`dlp.inspectTemplates.list`)
  - [✗] Check for data optimization (`dlp.inspectTemplates.list`)
  - [✗] Review data automation (`dlp.inspectTemplates.list`)
- [✗] Privacy Controls
  - [✗] Review privacy policies (`resourcemanager.projects.get`)
  - [✓] Check for data access logs (`logging.logEntries.list`)
  - [✗] Verify consent management (`resourcemanager.projects.get`)
  - [✗] Check for data deletion (`storage.buckets.get`)
  - [✗] Review privacy security (`resourcemanager.projects.get`)
  - [✗] Verify privacy compliance (`resourcemanager.projects.get`)
  - [✗] Check for privacy optimization (`resourcemanager.projects.get`)
  - [✗] Review privacy automation (`resourcemanager.projects.get`)

### Compliance Standards
- [✓] Regulatory Compliance
  - [✓] Check for GDPR compliance (`securitycenter.findings.list`)
  - [✓] Review HIPAA compliance (`securitycenter.findings.list`)
  - [✓] Verify PCI DSS compliance (`securitycenter.findings.list`)
  - [✓] Check for SOC 2 compliance (`securitycenter.findings.list`)
  - [✓] Review compliance security (`securitycenter.findings.list`)
  - [✓] Verify compliance optimization (`securitycenter.findings.list`)
  - [✓] Check for compliance automation (`securitycenter.findings.list`)
  - [✓] Review compliance cost optimization (`securitycenter.findings.list`)
- [✓] Audit Logging
  - [✓] Review audit logs (`logging.logEntries.list`)
  - [✓] Check for log retention (`logging.sinks.list`)
  - [✓] Verify log export (`logging.sinks.list`)
  - [✓] Check for log analysis (`logging.logEntries.list`)
  - [✓] Review audit security (`logging.logEntries.list`)
  - [✓] Verify audit optimization (`logging.logEntries.list`)
  - [✓] Check for audit automation (`logging.logEntries.list`)
  - [✓] Review audit cost optimization (`logging.logEntries.list`)

## DevOps

### CI/CD
- [✓] Cloud Build
  - [✓] List all build configurations (`cloudbuild.builds.list`)
  - [✓] Check build triggers (`cloudbuild.triggers.list`)
  - [✓] Review build artifacts (`cloudbuild.builds.get`)
  - [✓] Verify build security (`cloudbuild.builds.get`)
  - [✓] Check for build optimization (`cloudbuild.builds.get`)
  - [✓] Review build automation (`cloudbuild.builds.get`)
  - [✓] Verify build cost optimization (`cloudbuild.builds.get`)
  - [✓] Check for build security posture (`cloudbuild.builds.get`)
- [✓] Deployment
  - [✓] Check deployment history (`clouddeploy.releases.list`)
  - [✓] Review deployment configurations (`clouddeploy.deliveryPipelines.get`)
  - [✓] Verify deployment security (`clouddeploy.releases.get`)
  - [✓] Check for deployment automation (`clouddeploy.deliveryPipelines.get`)
  - [✓] Review deployment optimization (`clouddeploy.releases.get`)
  - [✓] Verify deployment cost optimization (`clouddeploy.releases.get`)
  - [✓] Check for deployment security posture (`clouddeploy.releases.get`)
  - [✓] Review deployment automation (`clouddeploy.releases.get`)

### Monitoring & Logging
- [✓] Cloud Monitoring
  - [✓] Check monitoring dashboards (`monitoring.dashboards.list`)
  - [✓] Review alert policies (`monitoring.alertPolicies.list`)
  - [✓] Verify metric collection (`monitoring.metricDescriptors.list`)
  - [✓] Check for custom metrics (`monitoring.metricDescriptors.list`)
  - [✓] Review monitoring optimization (`monitoring.dashboards.list`)
  - [✓] Verify monitoring security (`monitoring.dashboards.list`)
  - [✓] Check for monitoring automation (`monitoring.dashboards.list`)
  - [✓] Review monitoring cost optimization (`monitoring.dashboards.list`)
- [✓] Cloud Logging
  - [✓] Check log retention (`logging.sinks.list`)
  - [✓] Review log exports (`logging.sinks.list`)
  - [✓] Verify log analysis (`logging.logEntries.list`)
  - [✓] Check for log-based metrics (`logging.metrics.list`)
  - [✓] Review logging optimization (`logging.sinks.list`)
  - [✓] Verify logging security (`logging.sinks.list`)
  - [✓] Check for logging automation (`logging.sinks.list`)
  - [✓] Review logging cost optimization (`logging.sinks.list`)

## Audit Development Standards

### 1. Development Process
- [✓] Follow the standards in `AUDIT_DEVELOPMENT_RULES.md`
- [✓] Use the provided template for new audit scripts
- [✓] Implement all required error handling
- [✓] Include comprehensive testing
- [✓] Document all functions and parameters

### 2. Required Components
- [✓] Authentication setup
- [✓] Input validation
- [✓] Resource collection
- [✓] Analysis logic
- [✓] Recommendation generation
- [✓] Results formatting
- [✓] Error handling
- [✓] Logging

### 3. Testing Requirements
- [✓] Unit tests for all functions
- [✓] Integration tests for API calls
- [✓] Mock responses for testing
- [✓] Error scenario testing
- [✓] Output validation

### 4. Documentation
- [✓] README with setup instructions
- [✓] Function documentation
- [✓] Example usage
- [✓] Error handling guide
- [✓] Output format description

### 5. Code Review
- [✓] Security review
- [✓] Performance review
- [✓] Reliability review
- [✓] Maintainability review
- [✓] Compliance review

### 6. Deployment
- [✓] Version control
- [✓] Dependency management
- [✓] Environment configuration
- [✓] Credential management
- [✓] Access control

## Status Legend
- [✓] Passing/Implemented
- [✗] Failing/Not Implemented
- [ ] Not Started
- [-] Not Applicable

## Permission Summary
To perform all read-only audits, the service account needs the following roles:
1. `roles/viewer` - Basic read access
2. `roles/iam.securityReviewer` - Security review access
3. `roles/monitoring.viewer` - Monitoring access
4. `roles/logging.viewer` - Logging access
5. `roles/securitycenter.viewer` - Security Center access
6. `roles/billing.viewer` - Billing access
7. `roles/cloudasset.viewer` - Asset inventory access
8. `roles/recommender.viewer` - Cost optimization recommendations
9. `roles/orgpolicy.policyViewer` - Organization policy access
10. `roles/iam.securityReviewer` - IAM security review access

> **Important**: All permissions listed are read-only. The audit process should not require any write permissions to GCP resources. 