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
  - [✓] List all VM instances (`compute.instances.list`) _(compute-audit.js)_
  - [✓] Check instance types and sizes (`compute.machineTypes.list`) _(compute-audit.js)_
  - [✓] Verify machine family usage (`compute.machineTypes.list`) _(compute-audit.js)_
  - [✓] Review instance labels and tags (`compute.instances.list`) _(compute-audit.js)_
  - [✓] Check for deprecated machine types (`compute.machineTypes.list`) _(compute-audit.js)_
  - [✓] Verify instance naming conventions (`compute.instances.list`) _(compute-audit.js)_
- [✓] VM Optimization
  - [✓] Check for underutilized instances (`monitoring.timeSeries.list`) _(compute-audit.js)_
  - [✓] Review instance scheduling (`compute.instances.list`) _(compute-audit.js)_
  - [✓] Verify preemptible/spot instance usage (`compute.instances.list`) _(compute-audit.js)_
  - [✓] Check for right-sized instances (`compute.instances.list`, `monitoring.timeSeries.list`) _(compute-audit.js)_
  - [✓] Review CPU and memory utilization patterns (`monitoring.timeSeries.list`) _(compute-audit.js)_
  - [✓] Check for idle instances during non-business hours (`monitoring.timeSeries.list`) _(compute-audit.js)_
  - [✓] Verify instance reservations (`compute.reservations.list`) _(compute-audit.js)_
  - [✓] Check for sustained use discounts (`compute.instances.list`) _(compute-audit.js)_
  - [ ] Granular VM Right-Sizing & Customization (analyze historical utilization for precise right-sizing and custom machine type recommendations) _(compute-audit.js or resource-utilization-audit.js)_
  - [ ] Sole-Tenant Node Efficiency Review (verify utilization, recommend consolidation or right-sizing) _(compute-audit.js)_
- [✓] VM Security
  - [✓] Verify OS patch levels (`compute.instances.list`, `compute.images.list`) _(compute-audit.js)_
  - [✓] Check for secure boot enabled (`compute.instances.list`) _(compute-audit.js)_
  - [✓] Review service account usage (`compute.instances.list`, `iam.serviceAccounts.get`) _(compute-audit.js)_
  - [✓] Verify disk encryption (`compute.disks.list`) _(compute-audit.js)_
  - [✓] Check for Shielded VM features (`compute.instances.list`) _(compute-audit.js)_
  - [✓] Verify integrity monitoring (`compute.instances.list`) _(compute-audit.js)_
  - [✗] Review OS login configuration (`compute.instances.list`) _(checklist-verification.js)_
  - [✗] Check for confidential computing (`compute.instances.list`) _(checklist-verification.js)_
  - [✓] Verify VM metadata security (`compute.instances.list`) _(compute-audit.js)_
  - [ ] Optimize Machine Image Storage Costs (identify old/unused/redundant custom images, evaluate public image use) _(compute-audit.js)_

### Kubernetes (GKE)

- [✓] Cluster Configuration
  - [✓] List all GKE clusters (`container.clusters.list`) _(gke-audit.js)_
  - [✓] Check cluster versions (`container.clusters.get`) _(gke-audit.js)_
  - [✓] Verify node pool configurations (`container.nodePools.list`) _(gke-audit.js)_
  - [✓] Review cluster labels and tags (`container.clusters.list`) _(gke-audit.js)_
  - [✓] Check for regional vs zonal clusters (`container.clusters.get`) _(gke-audit.js)_
  - [✓] Verify cluster maintenance windows (`container.clusters.get`) _(gke-audit.js)_
- [✓] Cluster Security
  - [✗] Check for private clusters (`container.clusters.get`) _(checklist-verification.js)_
  - [✗] Verify workload identity (`container.clusters.get`) _(checklist-verification.js)_
  - [✗] Review network policies (`container.clusters.get`) _(checklist-verification.js)_
  - [✗] Check for binary authorization (`container.clusters.get`) _(checklist-verification.js)_
  - [✗] Verify pod security policies (`container.clusters.get`) _(checklist-verification.js)_
  - [✓] Check for container image scanning (`container.clusters.get`) _(gke-audit.js)_
  - [✓] Review cluster security posture (`container.clusters.get`) _(gke-audit.js)_
  - [✓] Verify cluster logging and monitoring (`container.clusters.get`) _(gke-audit.js)_
- [✓] Cluster Optimization
  - [✓] Review node pool sizing (`container.nodePools.list`) _(gke-audit.js)_
  - [✓] Check for cluster autoscaling (`container.clusters.get`) _(gke-audit.js)_
  - [✓] Verify vertical pod autoscaling (`container.clusters.get`) _(gke-audit.js)_
  - [✓] Review resource quotas (`container.clusters.get`) _(gke-audit.js)_
  - [✓] Check for node auto-provisioning (`container.clusters.get`) _(gke-audit.js)_
  - [✓] Verify cluster resource utilization (`monitoring.timeSeries.list`) _(gke-audit.js)_
  - [✓] Review pod disruption budgets (`container.clusters.get`) _(gke-audit.js)_
  - [✓] Check for cost-optimized node pools (`container.nodePools.list`) _(gke-audit.js)_
  - [ ] GKE Workload (Pod) Right-Sizing (analyze pod resource requests vs. actual usage) _(gke-audit.js)_
  - [ ] GKE Idle/Underutilized Node Pool Detection (suggest consolidation, auto-scaling adjustments, or decommissioning) _(gke-audit.js)_

### Serverless

- [✓] Cloud Functions
  - [✓] List all functions (`cloudfunctions.functions.list`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Check function versions (`cloudfunctions.functions.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Review memory allocations (`cloudfunctions.functions.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Verify function triggers (`cloudfunctions.functions.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Check for cold start optimization (`cloudfunctions.functions.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Review function timeout settings (`cloudfunctions.functions.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Verify function security settings (`cloudfunctions.functions.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Check for function retry policies (`cloudfunctions.functions.get`) _(run-full-gcp-checklist-audit.js)_
  - [ ] Cloud Functions Resource & Concurrency Optimization (analyze memory, instances, execution times) _(run-full-gcp-checklist-audit.js or serverless-optimization-audit.js)_
- [✓] Cloud Run
  - [✓] List all services (`run.services.list`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Check service configurations (`run.services.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Review scaling settings (`run.services.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Verify container images (`run.services.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Check for concurrency settings (`run.services.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Review CPU allocation (`run.services.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Verify service security settings (`run.services.get`) _(run-full-gcp-checklist-audit.js)_
  - [✓] Check for service mesh integration (`run.services.get`) _(run-full-gcp-checklist-audit.js)_
  - [ ] Cloud Run Resource & Concurrency Optimization (analyze memory, CPU, instances, concurrency) _(run-full-gcp-checklist-audit.js or serverless-optimization-audit.js)_

## Storage

### Cloud Storage

- [✓] Bucket Inventory
  - [✓] List all buckets (`storage.buckets.list`) _(storage-audit.js)_
  - [✓] Check bucket locations (`storage.buckets.get`) _(storage-audit.js)_
  - [✓] Review storage classes (`storage.buckets.get`) _(storage-audit.js)_
  - [✓] Verify bucket labels (`storage.buckets.get`) _(storage-audit.js)_
  - [✗] Check for bucket versioning (`storage.buckets.get`) _(storage-audit.js)_
  - [✗] Review bucket lifecycle rules (`storage.buckets.get`) _(storage-audit.js)_
  - [✗] Verify bucket retention policies (`storage.buckets.get`) _(storage-audit.js)_
  - [✗] Check for bucket logging (`storage.buckets.get`) _(storage-audit.js)_
- [✓] Bucket Security
  - [✓] Check IAM policies (`storage.buckets.getIamPolicy`) _(storage-audit.js)_
  - [✓] Verify bucket permissions (`storage.buckets.getIamPolicy`) _(storage-audit.js)_
  - [✓] Review public access (`storage.buckets.getIamPolicy`) _(storage-audit.js)_
  - [✓] Check for uniform bucket access (`storage.buckets.get`) _(storage-audit.js)_
  - [✓] Verify bucket encryption (`storage.buckets.get`) _(storage-audit.js)_
  - [✗] Check for bucket lock (`storage.buckets.get`) _(storage-audit.js)_
  - [✓] Review bucket CORS configuration (`storage.buckets.get`) _(storage-audit.js)_
  - [✗] Verify bucket access logs (`storage.buckets.get`) _(storage-audit.js)_
- [✓] Bucket Management
  - [✗] Review lifecycle rules (`storage.buckets.get`) _(storage-audit.js)_
  - [✗] Check versioning status (`storage.buckets.get`) _(storage-audit.js)_
  - [✗] Verify retention policies (`storage.buckets.get`) _(storage-audit.js)_
  - [✓] Review object metadata (`storage.objects.list`) _(storage-audit.js)_
  - [✗] Check for object immutability (`storage.buckets.get`) _(storage-audit.js)_
  - [✗] Review storage class transitions (`storage.buckets.get`) _(storage-audit.js)_
  - [✓] Verify object access patterns (`storage.objects.list`) _(storage-audit.js)_
  - [✓] Check for bucket cost optimization (`storage.buckets.get`) _(storage-audit.js)_
  - [ ] Advanced Object Lifecycle Management (OLM) Policy Tuning (analyze access patterns for specific OLM rules) _(storage-lifecycle-audit.js)_

### Persistent Disks

- [✓] Disk Inventory
  - [✓] List all persistent disks (`compute.disks.list`) _(disk-audit.js)_
  - [✓] Check disk types (`compute.disks.get`) _(disk-audit.js)_
  - [✓] Review disk sizes (`compute.disks.get`) _(disk-audit.js)_
  - [✓] Verify disk labels (`compute.disks.list`) _(disk-audit.js)_
  - [✓] Check for disk snapshots (`compute.snapshots.list`) _(disk-audit.js)_
  - [✓] Review disk performance (`compute.disks.get`) _(disk-audit.js)_
  - [✓] Verify disk attachments (`compute.disks.get`) _(disk-audit.js)_
  - [✓] Check for disk reservations (`compute.disks.get`) _(disk-audit.js)_
- [✓] Disk Security
  - [✓] Check for encryption (`compute.disks.get`) _(disk-audit.js)_
  - [✓] Verify snapshot policies (`compute.snapshots.list`) _(disk-audit.js)_
  - [✓] Review access controls (`compute.disks.getIamPolicy`) _(disk-audit.js)_
  - [✓] Check for secure deletion (`compute.disks.get`) _(disk-audit.js)_
  - [✓] Verify disk integrity (`compute.disks.get`) _(disk-audit.js)_
  - [✓] Check for disk backup policies (`compute.disks.get`) _(disk-audit.js)_
  - [✓] Review disk access logs (`compute.disks.get`) _(disk-audit.js)_
  - [✓] Verify disk security policies (`compute.disks.get`) _(disk-audit.js)_
  - [ ] Persistent Disk Type & Snapshot Cost-Effectiveness (review disk types vs. performance, audit snapshot frequency/retention, identify orphaned snapshots) _(disk-audit.js, storage-lifecycle-audit.js)_

### Filestore
- [ ] Filestore Instance Optimization (check for underutilized instances, recommend right-sizing or tier changes) _(filestore-audit.js or resource-utilization-audit.js)_

## Networking

### VPC

- [✓] Network Configuration
  - [✓] List all VPCs (`compute.networks.list`) _(networking-audit.js)_
  - [✓] Check subnet configurations (`compute.subnetworks.list`) _(networking-audit.js)_
  - [✓] Review routing tables (`compute.routes.list`) _(networking-audit.js)_
  - [✓] Verify network labels (`compute.networks.list`) _(networking-audit.js)_
  - [✓] Check for VPC peering (`compute.networks.list`) _(networking-audit.js)_
  - [✓] Review network topology (`compute.networks.get`) _(networking-audit.js)_
  - [✓] Verify network performance (`compute.networks.get`) _(networking-audit.js)_
  - [✓] Check for network cost optimization (`compute.networks.get`) _(networking-audit.js)_
- [✓] Network Security
  - [✓] Check firewall rules (`compute.firewalls.list`) _(networking-audit.js)_
  - [✗] Review VPC flow logs (`compute.networks.get`) _(checklist-verification.js)_
  - [✓] Verify private Google access (`compute.subnetworks.get`) _(networking-audit.js)_
  - [✓] Check for VPC service controls (`compute.networks.get`) _(networking-audit.js)_
  - [✓] Verify network encryption (`compute.networks.get`) _(networking-audit.js)_
  - [✓] Check for network segmentation (`compute.networks.get`) _(networking-audit.js)_
  - [✓] Review network access policies (`compute.networks.get`) _(networking-audit.js)_
  - [✓] Verify network security posture (`compute.networks.get`) _(networking-audit.js)_
  - [ ] Network Service Tier Analysis (Egress Costs) (analyze Premium vs. Standard Tier for VMs, LBs) _(networking-audit.js)_
  - [ ] Cloud NAT Gateway Efficiency (analyze VMs mapped, port utilization, data processed) _(networking-audit.js)_
  - [ ] Inter-Region/Zone Traffic Cost Analysis (analyze flow logs for high-cost transfers, suggest co-location) _(networking-audit.js)_

### Load Balancing

- [✓] Load Balancer Inventory
  - [✓] List all load balancers (`compute.forwardingRules.list`) _(networking-audit.js)_
  - [✓] Check load balancer types (`compute.forwardingRules.get`) _(networking-audit.js)_
  - [✓] Review backend services (`compute.backendServices.list`) _(networking-audit.js)_
  - [✓] Verify health checks (`compute.healthChecks.list`) _(networking-audit.js)_
  - [✓] Check for load balancer redundancy (`compute.forwardingRules.get`) _(networking-audit.js)_
  - [✓] Review load balancer performance (`compute.forwardingRules.get`) _(networking-audit.js)_
  - [✓] Verify load balancer scaling (`compute.forwardingRules.get`) _(networking-audit.js)_
  - [✓] Check for load balancer cost optimization (`compute.forwardingRules.get`) _(networking-audit.js)_
- [✓] Load Balancer Security
  - [✓] Check SSL certificates (`compute.sslCertificates.list`) _(networking-audit.js)_
  - [✓] Review security policies (`compute.securityPolicies.list`) _(networking-audit.js)_
  - [✓] Verify WAF configurations (`compute.securityPolicies.get`) _(networking-audit.js)_
  - [✓] Check for DDoS protection (`compute.securityPolicies.get`) _(networking-audit.js)_
  - [✓] Verify TLS configuration (`compute.sslCertificates.get`) _(networking-audit.js)_
  - [✓] Check for SSL policies (`compute.sslPolicies.list`) _(networking-audit.js)_
  - [✓] Review load balancer access logs (`compute.forwardingRules.get`) _(networking-audit.js)_
  - [✓] Verify load balancer security posture (`compute.forwardingRules.get`) _(networking-audit.js)_

### Cloud DNS

- [✓] DNS Configuration
  - [✓] List all DNS zones (`dns.managedZones.list`) _(networking-audit.js)_
  - [✓] Check DNS records (`dns.resourceRecordSets.list`) _(networking-audit.js)_
  - [✓] Review DNSSEC status (`dns.managedZones.get`) _(networking-audit.js)_
  - [✓] Verify DNS policies (`dns.policies.list`) _(networking-audit.js)_
  - [✓] Check for DNS redundancy (`dns.managedZones.get`) _(networking-audit.js)_
  - [✓] Review DNS performance (`dns.managedZones.get`) _(networking-audit.js)_
  - [✓] Verify DNS security settings (`dns.managedZones.get`) _(networking-audit.js)_
  - [✓] Check for DNS cost optimization (`dns.managedZones.get`) _(networking-audit.js)_

### Cloud CDN
- [ ] Cloud CDN for Egress Optimization (identify workloads serving cacheable static content) _(networking-audit.js)_

## Security & IAM

### Identity & Access Management

- [✓] IAM Policies
  - [✓] List all IAM policies (`resourcemanager.projects.getIamPolicy`) _(iam-audit.js)_
  - [✓] Check role assignments (`resourcemanager.projects.getIamPolicy`) _(iam-audit.js)_
  - [✓] Review custom roles (`iam.roles.list`) _(iam-audit.js)_
  - [✓] Verify principle of least privilege (`resourcemanager.projects.getIamPolicy`) _(iam-audit.js)_
  - [✓] Check for role separation (`resourcemanager.projects.getIamPolicy`) _(iam-audit.js)_
  - [✓] Review IAM audit logs (`logging.logEntries.list`) _(iam-audit.js)_
  - [✓] Verify IAM security posture (`resourcemanager.projects.getIamPolicy`) _(iam-audit.js)_
  - [✓] Check for IAM cost optimization (`resourcemanager.projects.getIamPolicy`) _(iam-audit.js)_
- [✓] Service Accounts
  - [✓] List all service accounts (`iam.serviceAccounts.list`) _(iam-audit.js)_
  - [✓] Check key management (`iam.serviceAccountKeys.list`) _(iam-audit.js)_
  - [✓] Review account permissions (`iam.serviceAccounts.getIamPolicy`) _(iam-audit.js)_
  - [✓] Verify workload identity (`iam.serviceAccounts.get`) _(iam-audit.js)_
  - [✓] Check for service account rotation (`iam.serviceAccounts.get`) _(iam-audit.js)_
  - [✓] Review service account usage (`iam.serviceAccounts.get`) _(iam-audit.js)_
  - [✓] Verify service account security (`iam.serviceAccounts.get`) _(iam-audit.js)_
  - [✓] Check for service account cost optimization (`iam.serviceAccounts.get`) _(iam-audit.js)_

### Security Controls

- [✓] Organization Policies
  - [✓] List all organization policies (`orgpolicy.policy.get`) _(org-policy-audit.js)_
  - [✓] Check policy enforcement (`orgpolicy.policy.get`) _(org-policy-audit.js)_
  - [✓] Review constraint settings (`orgpolicy.constraints.list`) _(org-policy-audit.js)_
  - [✓] Verify policy inheritance (`orgpolicy.policy.get`) _(org-policy-audit.js)_
  - [✓] Check for policy compliance (`orgpolicy.policy.get`) _(org-policy-audit.js)_
  - [✓] Review policy audit logs (`logging.logEntries.list`) _(org-policy-audit.js)_
  - [✓] Verify policy security posture (`orgpolicy.policy.get`) _(org-policy-audit.js)_
  - [✓] Check for policy cost optimization (`orgpolicy.policy.get`) _(org-policy-audit.js)_
- [✓] Security Command Center
  - [✓] Check security findings (`securitycenter.findings.list`) _(securitycenter-audit.js)_
  - [✓] Review vulnerability reports (`securitycenter.sources.list`) _(securitycenter-audit.js)_
  - [✓] Verify security health analytics (`securitycenter.assets.list`) _(securitycenter-audit.js)_
  - [✓] Check for threat detection (`securitycenter.findings.list`) _(securitycenter-audit.js)_
  - [✓] Review security recommendations (`securitycenter.findings.list`) _(securitycenter-audit.js)_
  - [✓] Verify security monitoring (`securitycenter.findings.list`) _(securitycenter-audit.js)_
  - [✓] Check for security automation (`securitycenter.findings.list`) _(securitycenter-audit.js)_
  - [✓] Review security cost optimization (`securitycenter.findings.list`) _(securitycenter-audit.js)_

## Cost Management

### Billing

- [✓] Billing Configuration
  - [✓] List all billing accounts (`billing.accounts.list`) _(billing-audit.js)_
  - [✓] Check billing export (`billing.accounts.get`) _(billing-audit.js)_
  - [✓] Review budget alerts (`billing.budgets.get`) _(budget-audit.js)_
  - [✓] Verify cost allocation (`billing.accounts.get`) _(cost-allocation-audit.js)_
  - [✓] Check for billing optimization (`billing.accounts.get`) _(billing-audit.js)_
  - [✓] Review billing reports (`billing.accounts.get`) _(billing-audit.js)_
  - [✓] Verify billing security (`billing.accounts.get`) _(billing-audit.js)_
  - [✓] Check for billing automation (`billing.accounts.get`) _(billing-audit.js)_
- [✓] Cost Optimization
  - [✓] Check for committed use discounts (`compute.commitments.list`) _(discount-audit.js)_
  - [✓] Review sustained use discounts (`compute.instances.list`) _(discount-audit.js)_
  - [✓] Verify resource utilization (`monitoring.timeSeries.list`) _(resource-utilization-audit.js)_
  - [✓] Check for idle resources (`monitoring.timeSeries.list`) _(resource-utilization-audit.js)_
  - [✓] Review cost recommendations (`recommender.recommendations.list`) _(discount-audit.js)_
  - [✓] Verify cost allocation tags (`billing.accounts.get`) _(cost-allocation-audit.js)_
  - [✓] Check for cost anomaly detection (`billing.accounts.get`) _(discount-audit.js)_
  - [✓] Review cost optimization automation (`billing.accounts.get`) _(discount-audit.js)_
  - [✓] Check for billing automation (`billing.accounts.get`) _(billing-audit.js)_

### Resource Management

- [✓] Resource Organization
  - [✓] List all projects (`resourcemanager.projects.list`) _(cost-allocation-audit.js)_
  - [✓] Check project hierarchy (`resourcemanager.projects.get`) _(cost-allocation-audit.js)_
  - [✓] Review resource labels (`resourcemanager.projects.get`) _(cost-allocation-audit.js)_
  - [✓] Verify resource quotas (`compute.regions.get`) _(cost-allocation-audit.js)_
  - [✓] Check for resource optimization (`resourcemanager.projects.get`) _(cost-allocation-audit.js)_
  - [✓] Review resource security (`resourcemanager.projects.get`) _(cost-allocation-audit.js)_
  - [✓] Verify resource automation (`resourcemanager.projects.get`) _(cost-allocation-audit.js)_
  - [✓] Check for resource cost optimization (`resourcemanager.projects.get`) _(cost-allocation-audit.js)_
  - [ ] Dormant/Unused Projects Review (identify projects with no significant activity or billing changes) _(project-cleanup-audit.js or cost-allocation-audit.js)_
- [✓] Resource Monitoring
  - [✓] Check monitoring dashboards (`monitoring.dashboards.list`) _(monitoring-audit.js)_
  - [✓] Review alert policies (`monitoring.alertPolicies.list`) _(monitoring-audit.js)_
  - [✓] Verify logging configuration (`logging.sinks.list`) _(monitoring-audit.js)_
  - [✓] Check for custom metrics (`monitoring.metricDescriptors.list`) _(monitoring-audit.js)_
  - [✓] Review monitoring optimization (`monitoring.dashboards.list`) _(monitoring-audit.js)_
  - [✓] Verify monitoring security (`monitoring.dashboards.list`) _(monitoring-audit.js)_
  - [✓] Check for monitoring automation (`monitoring.dashboards.list`) _(monitoring-audit.js)_
  - [✓] Review monitoring cost optimization (`monitoring.dashboards.list`) _(monitoring-audit.js)_

## Compliance

### Data Protection

- [✗] Data Classification
  - [✗] Check for sensitive data (`dlp.inspectTemplates.list`) _(data-protection-audit.js)_
  - [✗] Review data retention (`storage.buckets.get`) _(storage-audit.js)_
  - [✓] Verify data encryption (`compute.disks.get`, `storage.buckets.get`) _(storage-audit.js)_
  - [✓] Check for data residency (`storage.buckets.get`) _(data-protection-audit.js)_
  - [✗] Review data security (`dlp.inspectTemplates.list`) _(data-protection-audit.js)_
  - [✗] Verify data compliance (`dlp.inspectTemplates.list`) _(data-protection-audit.js)_
  - [✗] Check for data optimization (`dlp.inspectTemplates.list`) _(data-protection-audit.js)_
  - [✗] Review data automation (`dlp.inspectTemplates.list`) _(data-protection-audit.js)_
- [✗] Privacy Controls
  - [✗] Review privacy policies (`resourcemanager.projects.get`) _(compliance-audit.js)_
  - [✓] Check for data access logs (`logging.logEntries.list`) _(compliance-audit.js)_
  - [✗] Verify consent management (`resourcemanager.projects.get`) _(compliance-audit.js)_
  - [✗] Check for data deletion (`storage.buckets.get`) _(storage-audit.js)_
  - [✗] Review privacy security (`resourcemanager.projects.get`) _(compliance-audit.js)_
  - [✗] Verify privacy compliance (`resourcemanager.projects.get`) _(compliance-audit.js)_
  - [✗] Check for privacy optimization (`resourcemanager.projects.get`) _(compliance-audit.js)_
  - [✗] Review privacy automation (`resourcemanager.projects.get`) _(compliance-audit.js)_

### Compliance Standards

- [✓] Regulatory Compliance
  - [✓] Check for GDPR compliance (`securitycenter.findings.list`) _(compliance-audit.js)_
  - [✓] Review HIPAA compliance (`securitycenter.findings.list`) _(compliance-audit.js)_
  - [✓] Verify PCI DSS compliance (`securitycenter.findings.list`) _(compliance-audit.js)_
  - [✓] Check for SOC 2 compliance (`securitycenter.findings.list`) _(compliance-audit.js)_
  - [✓] Review compliance security (`securitycenter.findings.list`) _(compliance-audit.js)_
  - [✓] Verify compliance optimization (`securitycenter.findings.list`) _(compliance-audit.js)_
  - [✓] Check for compliance automation (`securitycenter.findings.list`) _(compliance-audit.js)_
  - [✓] Review compliance cost optimization (`securitycenter.findings.list`) _(compliance-audit.js)_
- [✓] Audit Logging
  - [✓] Review audit logs (`logging.logEntries.list`) _(compliance-audit.js)_
  - [✓] Check for log retention (`logging.sinks.list`) _(compliance-audit.js)_
  - [✓] Verify log export (`logging.sinks.list`) _(compliance-audit.js)_
  - [✓] Check for log analysis (`logging.logEntries.list`) _(compliance-audit.js)_
  - [✓] Review audit security (`logging.logEntries.list`) _(compliance-audit.js)_
  - [✓] Verify audit optimization (`logging.logEntries.list`) _(compliance-audit.js)_
  - [✓] Check for audit automation (`logging.logEntries.list`) _(compliance-audit.js)_
  - [✓] Review audit cost optimization (`logging.logEntries.list`) _(compliance-audit.js)_

## DevOps

### CI/CD

- [✓] Cloud Build
  - [✓] List all build configurations (`cloudbuild.builds.list`) _(devops-audit.js)_
  - [✓] Check build triggers (`cloudbuild.triggers.list`) _(devops-audit.js)_
  - [✓] Review build artifacts (`cloudbuild.builds.get`) _(devops-audit.js)_
  - [✓] Verify build security (`cloudbuild.builds.get`) _(devops-audit.js)_
  - [✓] Check for build optimization (`cloudbuild.builds.get`) _(devops-audit.js)_
  - [✓] Review build automation (`cloudbuild.builds.get`) _(devops-audit.js)_
  - [✓] Verify build cost optimization (`cloudbuild.builds.get`) _(devops-audit.js)_
  - [✓] Check for build security posture (`cloudbuild.builds.get`) _(devops-audit.js)_
  - [ ] Cloud Build Efficiency (Machine Types & Caching) (analyze execution times, machine types, cache hit rates) _(devops-audit.js)_
- [✓] Deployment
  - [✓] Check deployment history (`clouddeploy.releases.list`) _(devops-audit.js)_
  - [✓] Review deployment configurations (`clouddeploy.deliveryPipelines.get`) _(devops-audit.js)_
  - [✓] Verify deployment security (`clouddeploy.releases.get`) _(devops-audit.js)_
  - [✓] Check for deployment automation (`clouddeploy.deliveryPipelines.get`) _(devops-audit.js)_
  - [✓] Review deployment optimization (`clouddeploy.releases.get`) _(devops-audit.js)_
  - [✓] Verify deployment cost optimization (`clouddeploy.releases.get`) _(devops-audit.js)_
  - [✓] Check for deployment security posture (`clouddeploy.releases.get`) _(devops-audit.js)_
  - [✓] Review deployment automation (`clouddeploy.releases.get`) _(devops-audit.js)_

### Monitoring & Logging

- [✓] Cloud Monitoring
  - [✓] Check monitoring dashboards (`monitoring.dashboards.list`) _(monitoring-audit.js)_
  - [✓] Review alert policies (`monitoring.alertPolicies.list`) _(monitoring-audit.js)_
  - [✓] Verify metric collection (`monitoring.metricDescriptors.list`) _(monitoring-audit.js)_
  - [✓] Check for custom metrics (`monitoring.metricDescriptors.list`) _(monitoring-audit.js)_
  - [✓] Review monitoring optimization (`monitoring.dashboards.list`) _(monitoring-audit.js)_
  - [✓] Verify monitoring security (`monitoring.dashboards.list`) _(monitoring-audit.js)_
  - [✓] Check for monitoring automation (`monitoring.dashboards.list`) _(monitoring-audit.js)_
  - [✓] Review monitoring cost optimization (`monitoring.dashboards.list`) _(monitoring-audit.js)_
- [✓] Cloud Logging
  - [✓] Check log retention (`logging.sinks.list`) _(monitoring-audit.js)_
  - [✓] Review log exports (`logging.sinks.list`) _(monitoring-audit.js)_
  - [✓] Verify log analysis (`logging.logEntries.list`) _(monitoring-audit.js)_
  - [✓] Check for log-based metrics (`logging.metrics.list`) _(monitoring-audit.js)_
  - [✓] Review logging optimization (`logging.sinks.list`) _(monitoring-audit.js)_
  - [✓] Verify logging security (`logging.sinks.list`) _(monitoring-audit.js)_
  - [✓] Check for logging automation (`logging.sinks.list`) _(monitoring-audit.js)_
  - [✓] Review logging cost optimization (`logging.sinks.list`) _(monitoring-audit.js)_
  - [ ] Log Export Destination & Volume Cost Optimization (review sinks, destinations, volumes; identify expensive sinks) _(monitoring-audit.js)_

## BigQuery Audit Items

1. BigQuery Analysis

* [✓] Check for stale partitioning (bigquery-audit.js)
* [✓] Identify deprecated UDFs (bigquery-audit.js)
* [✓] Query optimization analysis
* [✓] BigQuery cost optimization
* [✓] Dataset access controls review
* [✓] BigQuery job monitoring
* [ ] BigQuery Storage API Cost Monitoring (analyze Read/Write API usage for high-cost patterns) _(bigquery-audit.js)_
* [ ] BigQuery Slot Utilization & Reservation Sizing (analyze slot utilization for reservations; evaluate flat-rate/flex slots for on-demand) _(bigquery-audit.js)_

## Resource Utilization Items

1. Cloud SQL Optimization

* [✓] Cloud SQL instance utilization (resource-utilization-audit.js)
* [✓] Database CPU utilization analysis
* [✓] Database memory utilization analysis
* [✓] Database disk utilization analysis
* [✓] Database connection monitoring
* [✓] Database scaling recommendations

1. Compute Resource Optimization

* [✓] Unused IP address detection (resource-utilization-audit.js)
* [✓] Load balancer traffic analysis
* [✓] VM instance scheduling optimization
* [✓] VM instance utilization trends

## Storage Lifecycle Items

1. Storage Lifecycle Management

* [✓] Standard tier usage analysis (storage-lifecycle-audit.js)
* [✓] Unused bucket detection (storage-lifecycle-audit.js)
* [✓] Storage cost calculation
* [✓] Storage access pattern analysis
* [✓] Storage class transition recommendations
* [✓] Object lifecycle policy optimization

## Monitoring and Alerting Items

1. Advanced Monitoring

* [✓] Cost anomaly alerts (monitoring-audit.js)
* [✓] Missing critical alerts detection (monitoring-audit.js)
* [✓] Alert notification channel verification
* [✓] Alert coverage analysis
* [✓] Alert effectiveness assessment

## Cost Management Items

1. Budget Management

* [✓] Budget alert configuration (budget-audit.js)
* [✓] Budget tracking and forecasting
* [✓] Budget vs. actual spending analysis
* [✓] Budget allocation by service

1. Discount Management

* [✓] Discount utilization analysis (discount-audit.js)
* [✓] Committed use discount opportunities
* [✓] Sustained use discount tracking
* [✓] Discount optimization recommendations
* [ ] Holistic CUD/SUD Coverage Analysis (systematically check CUD/SUD eligibility for all applicable services) _(discount-audit.js)_
* [ ] Flexible CUDs vs. Resource-based CUDs Strategy (analyze spending patterns to recommend optimal CUD mix) _(discount-audit.js)_

1. Cost Allocation

* [✓] Resource tagging compliance (cost-allocation-audit.js)
* [✓] Cost center allocation
* [✓] Project-level cost analysis
* [✓] Service-level cost breakdown

## Compliance Items

1. Data Residency

* [✓] Data location compliance (data-protection-audit.js)
* [✓] Cross-region data transfer analysis
* [✓] Regional compliance verification

## Security Items

1. Advanced Security Analysis

* [✓] OS login configuration verification (checklist-verification.js)
* [✓] Confidential computing verification (checklist-verification.js)
* [✓] Private cluster configuration (checklist-verification.js)
* [✓] Workload identity verification (checklist-verification.js)
* [✓] Network policy enforcement (checklist-verification.js)
* [✓] Binary authorization verification (checklist-verification.js)
* [✓] Pod security policy verification (checklist-verification.js)

1. Network Security

* [✓] VPC flow logs verification (checklist-verification.js)
* [✓] Network segmentation analysis
* [✓] Cross-VPC connectivity audit

## Storage Items

1. Advanced Storage Management

* [✓] Bucket versioning verification (storage-audit.js)
* [✓] Bucket lifecycle rules review (storage-audit.js)
* [✓] Bucket retention policies verification (storage-audit.js)
* [✓] Bucket logging configuration (storage-audit.js)
* [✓] Bucket lock verification (storage-audit.js)
* [✓] Object immutability verification (storage-audit.js)
* [✓] Storage class transition verification (storage-audit.js)
* [✓] Bucket access logs verification (storage-audit.js)

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

## Billing & Cost Management

- [ ] List all billing accounts (`billing.accounts.list`)
- [ ] Check for committed use discounts (`compute.commitments.list`)
- [ ] Review budget alerts (`billing.budgets.get`)
- [ ] Detect idle resources (`monitoring.timeSeries.list`)
- [ ] Review cost allocation tags (`billing.accounts.get`)
- [ ] Identify projects/services with high/abnormal spend (`billing.accounts.get`)

## Resource Utilization

- [ ] Find idle/underutilized VMs (`monitoring.timeSeries.list`)
- [ ] Find unused disks (`compute.disks.list`)
- [ ] Find underutilized databases (`sql.instances.list`)
- [ ] Recommend resizing or deleting underused resources (`compute.instances.delete`)
- [ ] Estimate potential monthly savings for each finding

## Storage Optimization

- [ ] Detect unused buckets (`storage.buckets.list`)
- [ ] Find old snapshots (`compute.snapshots.list`)
- [ ] Identify cold data (`storage.objects.list`)
- [ ] Recommend storage class transitions (`storage.buckets.get`)
- [ ] Recommend lifecycle policies (`storage.buckets.get`)
- [ ] Highlight buckets with no lifecycle or retention policies

## Security & Compliance

- [ ] Audit IAM/service account permissions (`iam.serviceAccounts.list`)
- [ ] Check for key rotation (`iam.serviceAccountKeys.list`)
- [ ] Detect public buckets (`storage.buckets.getIamPolicy`)
- [ ] Detect open firewall rules (`compute.firewalls.list`)
- [ ] Check for encryption at rest (`compute.disks.get`, `storage.buckets.get`)
- [ ] Check for compliance with standards (GDPR, HIPAA, etc.)
- [ ] Output severity/priority for each finding

## Database Services

### Cloud Spanner
- [ ] Cloud Spanner Instance Right-Sizing (analyze CPU, storage, node counts vs. performance) _(spanner-audit.js or resource-utilization-audit.js)_

### Cloud Memorystore
- [ ] Cloud Memorystore (Redis/Memcached) Sizing (review capacity, throughput, CPU; recommend downsizing/tier changes) _(memorystore-audit.js or resource-utilization-audit.js)_
