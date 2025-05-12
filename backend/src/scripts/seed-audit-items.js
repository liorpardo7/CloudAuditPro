const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

// This is a partial sample. The full version will include all items from the checklist.
const auditItems = [
  // Required Base Permissions
  {
    category: 'Required Base Permissions',
    subcategory: 'Basic Access',
    auditItem: 'Basic Access',
    name: 'Verify roles/viewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  {
    category: 'Required Base Permissions',
    subcategory: 'Basic Access',
    auditItem: 'Basic Access',
    name: 'Verify roles/iam.securityReviewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  {
    category: 'Required Base Permissions',
    subcategory: 'Basic Access',
    auditItem: 'Basic Access',
    name: 'Verify roles/monitoring.viewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  {
    category: 'Required Base Permissions',
    subcategory: 'Basic Access',
    auditItem: 'Basic Access',
    name: 'Verify roles/logging.viewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  // Storage Access
  {
    category: 'Required Base Permissions',
    subcategory: 'Storage Access',
    auditItem: 'Storage Access',
    name: 'Verify roles/storage.objectViewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  {
    category: 'Required Base Permissions',
    subcategory: 'Storage Access',
    auditItem: 'Storage Access',
    name: 'Verify roles/storage.buckets.getIamPolicy access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  // Security Access
  {
    category: 'Required Base Permissions',
    subcategory: 'Security Access',
    auditItem: 'Security Access',
    name: 'Verify roles/securitycenter.findingsViewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  {
    category: 'Required Base Permissions',
    subcategory: 'Security Access',
    auditItem: 'Security Access',
    name: 'Verify roles/securitycenter.sourcesViewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  {
    category: 'Required Base Permissions',
    subcategory: 'Security Access',
    auditItem: 'Security Access',
    name: 'Verify roles/dlp.reader access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  // Cost & Billing Access
  {
    category: 'Required Base Permissions',
    subcategory: 'Cost & Billing Access',
    auditItem: 'Cost & Billing Access',
    name: 'Verify roles/billing.viewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  {
    category: 'Required Base Permissions',
    subcategory: 'Cost & Billing Access',
    auditItem: 'Cost & Billing Access',
    name: 'Verify roles/recommender.viewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  // Asset & Resource Access
  {
    category: 'Required Base Permissions',
    subcategory: 'Asset & Resource Access',
    auditItem: 'Asset & Resource Access',
    name: 'Verify roles/cloudasset.viewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  {
    category: 'Required Base Permissions',
    subcategory: 'Asset & Resource Access',
    auditItem: 'Asset & Resource Access',
    name: 'Verify roles/resourcemanager.organizationViewer access',
    scriptFile: 'permissions-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  // Required APIs
  {
    category: 'Required APIs',
    subcategory: 'Core APIs',
    auditItem: 'Core APIs',
    name: 'Verify Compute Engine API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'compute.googleapis.com',
    status: 'implemented'
  },
  {
    category: 'Required APIs',
    subcategory: 'Core APIs',
    auditItem: 'Core APIs',
    name: 'Verify Cloud Storage API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'storage.googleapis.com',
    status: 'implemented'
  },
  {
    category: 'Required APIs',
    subcategory: 'Core APIs',
    auditItem: 'Core APIs',
    name: 'Verify Cloud Monitoring API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'monitoring.googleapis.com',
    status: 'implemented'
  },
  {
    category: 'Required APIs',
    subcategory: 'Core APIs',
    auditItem: 'Core APIs',
    name: 'Verify Cloud Logging API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'logging.googleapis.com',
    status: 'implemented'
  },
  // Security APIs
  {
    category: 'Required APIs',
    subcategory: 'Security APIs',
    auditItem: 'Security APIs',
    name: 'Verify Security Command Center API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'securitycenter.googleapis.com',
    status: 'implemented'
  },
  {
    category: 'Required APIs',
    subcategory: 'Security APIs',
    auditItem: 'Security APIs',
    name: 'Verify Cloud DLP API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'dlp.googleapis.com',
    status: 'implemented'
  },
  {
    category: 'Required APIs',
    subcategory: 'Security APIs',
    auditItem: 'Security APIs',
    name: 'Verify Cloud Asset API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'cloudasset.googleapis.com',
    status: 'implemented'
  },
  // Management APIs
  {
    category: 'Required APIs',
    subcategory: 'Management APIs',
    auditItem: 'Management APIs',
    name: 'Verify Cloud Billing API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'cloudbilling.googleapis.com',
    status: 'implemented'
  },
  {
    category: 'Required APIs',
    subcategory: 'Management APIs',
    auditItem: 'Management APIs',
    name: 'Verify Cloud Resource Manager API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'cloudresourcemanager.googleapis.com',
    status: 'implemented'
  },
  {
    category: 'Required APIs',
    subcategory: 'Management APIs',
    auditItem: 'Management APIs',
    name: 'Verify IAM API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'iam.googleapis.com',
    status: 'implemented'
  },
  // Additional APIs
  {
    category: 'Required APIs',
    subcategory: 'Additional APIs',
    auditItem: 'Additional APIs',
    name: 'Verify Cloud DNS API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'dns.googleapis.com',
    status: 'implemented'
  },
  {
    category: 'Required APIs',
    subcategory: 'Additional APIs',
    auditItem: 'Additional APIs',
    name: 'Verify Container API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'container.googleapis.com',
    status: 'implemented'
  },
  {
    category: 'Required APIs',
    subcategory: 'Additional APIs',
    auditItem: 'Additional APIs',
    name: 'Verify Cloud Functions API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'cloudfunctions.googleapis.com',
    status: 'implemented'
  },
  {
    category: 'Required APIs',
    subcategory: 'Additional APIs',
    auditItem: 'Additional APIs',
    name: 'Verify Cloud Run API',
    scriptFile: 'api-audit.js',
    apiEndpoint: 'run.googleapis.com',
    status: 'implemented'
  },
  // Compute Resources > Virtual Machines
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Instance Inventory',
    name: 'List all VM instances',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Instance Inventory',
    name: 'Check instance types and sizes',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.machineTypes.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Instance Inventory',
    name: 'Verify machine family usage',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.machineTypes.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Instance Inventory',
    name: 'Review instance labels and tags',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Instance Inventory',
    name: 'Check for deprecated machine types',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.machineTypes.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Instance Inventory',
    name: 'Verify instance naming conventions',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  // VM Optimization
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Optimization',
    name: 'Check for underutilized instances',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'monitoring.timeSeries.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Optimization',
    name: 'Review instance scheduling',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Optimization',
    name: 'Verify preemptible/spot instance usage',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Optimization',
    name: 'Check for right-sized instances',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Optimization',
    name: 'Review CPU and memory utilization patterns',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'monitoring.timeSeries.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Optimization',
    name: 'Check for idle instances during non-business hours',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'monitoring.timeSeries.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Optimization',
    name: 'Verify instance reservations',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.reservations.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Optimization',
    name: 'Check for sustained use discounts',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Optimization',
    name: 'Granular VM Right-Sizing & Customization',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'monitoring.timeSeries.list',
    status: 'not_started'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Optimization',
    name: 'Sole-Tenant Node Efficiency Review',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'not_started'
  },
  // VM Security
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Security',
    name: 'Verify OS patch levels',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Security',
    name: 'Check for secure boot enabled',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Security',
    name: 'Review service account usage',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Security',
    name: 'Verify disk encryption',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.disks.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Security',
    name: 'Check for Shielded VM features',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Security',
    name: 'Verify integrity monitoring',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Security',
    name: 'Review OS login configuration',
    scriptFile: 'checklist-verification.js',
    apiEndpoint: 'compute.instances.list',
    status: 'not_implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Security',
    name: 'Check for confidential computing',
    scriptFile: 'checklist-verification.js',
    apiEndpoint: 'compute.instances.list',
    status: 'not_implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Security',
    name: 'Verify VM metadata security',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.instances.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Virtual Machines',
    auditItem: 'VM Security',
    name: 'Optimize Machine Image Storage Costs',
    scriptFile: 'compute-audit.js',
    apiEndpoint: 'compute.images.list',
    status: 'not_started'
  },
  // Kubernetes (GKE)
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Configuration',
    name: 'List all GKE clusters',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Configuration',
    name: 'Check cluster versions',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Configuration',
    name: 'Verify node pool configurations',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.nodePools.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Configuration',
    name: 'Review cluster labels and tags',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Configuration',
    name: 'Check for regional vs zonal clusters',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Configuration',
    name: 'Verify cluster maintenance windows',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  // GKE Security
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Security',
    name: 'Check for private clusters',
    scriptFile: 'checklist-verification.js',
    apiEndpoint: 'container.clusters.get',
    status: 'not_implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Security',
    name: 'Verify workload identity',
    scriptFile: 'checklist-verification.js',
    apiEndpoint: 'container.clusters.get',
    status: 'not_implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Security',
    name: 'Review network policies',
    scriptFile: 'checklist-verification.js',
    apiEndpoint: 'container.clusters.get',
    status: 'not_implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Security',
    name: 'Check for binary authorization',
    scriptFile: 'checklist-verification.js',
    apiEndpoint: 'container.clusters.get',
    status: 'not_implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Security',
    name: 'Verify pod security policies',
    scriptFile: 'checklist-verification.js',
    apiEndpoint: 'container.clusters.get',
    status: 'not_implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Security',
    name: 'Check for container image scanning',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Security',
    name: 'Review cluster security posture',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Security',
    name: 'Verify cluster logging and monitoring',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  // GKE Optimization
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Optimization',
    name: 'Review node pool sizing',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.nodePools.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Optimization',
    name: 'Check for cluster autoscaling',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Optimization',
    name: 'Verify vertical pod autoscaling',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Optimization',
    name: 'Review resource quotas',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Optimization',
    name: 'Check for node auto-provisioning',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Optimization',
    name: 'Verify cluster resource utilization',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'monitoring.timeSeries.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Optimization',
    name: 'Review pod disruption budgets',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Optimization',
    name: 'Check for cost-optimized node pools',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.nodePools.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Optimization',
    name: 'GKE Workload (Pod) Right-Sizing',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.clusters.get',
    status: 'not_started'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Kubernetes (GKE)',
    auditItem: 'Cluster Optimization',
    name: 'GKE Idle/Underutilized Node Pool Detection',
    scriptFile: 'gke-audit.js',
    apiEndpoint: 'container.nodePools.list',
    status: 'not_started'
  },
  // Serverless > Cloud Functions
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Functions',
    name: 'List all functions',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'cloudfunctions.functions.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Functions',
    name: 'Check function versions',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'cloudfunctions.functions.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Functions',
    name: 'Review memory allocations',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'cloudfunctions.functions.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Functions',
    name: 'Verify function triggers',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'cloudfunctions.functions.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Functions',
    name: 'Check for cold start optimization',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'cloudfunctions.functions.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Functions',
    name: 'Review function timeout settings',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'cloudfunctions.functions.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Functions',
    name: 'Verify function security settings',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'cloudfunctions.functions.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Functions',
    name: 'Check for function retry policies',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'cloudfunctions.functions.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Functions',
    name: 'Cloud Functions Resource & Concurrency Optimization',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'cloudfunctions.functions.get',
    status: 'not_started'
  },
  // Serverless > Cloud Run
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Run',
    name: 'List all services',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'run.services.list',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Run',
    name: 'Check service configurations',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'run.services.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Run',
    name: 'Review scaling settings',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'run.services.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Run',
    name: 'Verify container images',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'run.services.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Run',
    name: 'Check for concurrency settings',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'run.services.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Run',
    name: 'Review CPU allocation',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'run.services.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Run',
    name: 'Verify service security settings',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'run.services.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Run',
    name: 'Check for service mesh integration',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'run.services.get',
    status: 'implemented'
  },
  {
    category: 'Compute Resources',
    subcategory: 'Serverless',
    auditItem: 'Cloud Run',
    name: 'Cloud Run Resource & Concurrency Optimization',
    scriptFile: 'run-full-gcp-checklist-audit.js',
    apiEndpoint: 'run.services.get',
    status: 'not_started'
  },
  // Storage > Cloud Storage
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Configuration',
    name: 'List all storage buckets',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.list',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Configuration',
    name: 'Check bucket versions',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Configuration',
    name: 'Verify bucket labels',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.list',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Configuration',
    name: 'Check storage classes',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Configuration',
    name: 'Review lifecycle policies',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Security',
    name: 'Check bucket IAM policies',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.getIamPolicy',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Security',
    name: 'Verify bucket encryption',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Security',
    name: 'Review public access settings',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Security',
    name: 'Check for uniform bucket-level access',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Optimization',
    name: 'Review storage usage patterns',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'monitoring.timeSeries.list',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Optimization',
    name: 'Check for unused buckets',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.list',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Optimization',
    name: 'Verify cost-effective storage classes',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'implemented'
  },
  // Networking > VPC
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Configuration',
    name: 'List all VPC networks',
    scriptFile: 'network-audit.js',
    apiEndpoint: 'compute.networks.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Configuration',
    name: 'Check subnet configurations',
    scriptFile: 'network-audit.js',
    apiEndpoint: 'compute.subnetworks.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Configuration',
    name: 'Review firewall rules',
    scriptFile: 'network-audit.js',
    apiEndpoint: 'compute.firewalls.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Configuration',
    name: 'Verify VPC peering',
    scriptFile: 'network-audit.js',
    apiEndpoint: 'compute.networks.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Configuration',
    name: 'Check for shared VPC',
    scriptFile: 'network-audit.js',
    apiEndpoint: 'compute.networks.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Security',
    name: 'Review network security groups',
    scriptFile: 'network-audit.js',
    apiEndpoint: 'compute.networks.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Security',
    name: 'Verify private Google access',
    scriptFile: 'network-audit.js',
    apiEndpoint: 'compute.subnetworks.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Security',
    name: 'Check for VPC Service Controls',
    scriptFile: 'network-audit.js',
    apiEndpoint: 'compute.networks.list',
    status: 'implemented'
  },
  // Security & IAM
  {
    category: 'Security & IAM',
    subcategory: 'IAM',
    auditItem: 'IAM Configuration',
    name: 'List all IAM policies',
    scriptFile: 'iam-audit.js',
    apiEndpoint: 'cloudresourcemanager.projects.getIamPolicy',
    status: 'implemented'
  },
  {
    category: 'Security & IAM',
    subcategory: 'IAM',
    auditItem: 'IAM Configuration',
    name: 'Check service account usage',
    scriptFile: 'iam-audit.js',
    apiEndpoint: 'iam.serviceAccounts.list',
    status: 'implemented'
  },
  {
    category: 'Security & IAM',
    subcategory: 'IAM',
    auditItem: 'IAM Configuration',
    name: 'Review custom roles',
    scriptFile: 'iam-audit.js',
    apiEndpoint: 'iam.roles.list',
    status: 'implemented'
  },
  {
    category: 'Security & IAM',
    subcategory: 'IAM',
    auditItem: 'IAM Security',
    name: 'Check for least privilege access',
    scriptFile: 'iam-audit.js',
    apiEndpoint: 'cloudresourcemanager.projects.getIamPolicy',
    status: 'implemented'
  },
  {
    category: 'Security & IAM',
    subcategory: 'IAM',
    auditItem: 'IAM Security',
    name: 'Verify service account key rotation',
    scriptFile: 'iam-audit.js',
    apiEndpoint: 'iam.serviceAccounts.keys.list',
    status: 'implemented'
  },
  {
    category: 'Security & IAM',
    subcategory: 'IAM',
    auditItem: 'IAM Security',
    name: 'Review organization policies',
    scriptFile: 'iam-audit.js',
    apiEndpoint: 'orgpolicy.policies.list',
    status: 'implemented'
  },
  // Add BigQuery category
  {
    category: 'BigQuery',
    subcategory: 'BigQuery Analysis',
    auditItem: 'BigQuery Analysis',
    name: 'Check for stale partitioning',
    scriptFile: 'bigquery-audit.js',
    apiEndpoint: 'bigquery.datasets.get',
    status: 'implemented'
  },
  {
    category: 'BigQuery',
    subcategory: 'BigQuery Analysis',
    auditItem: 'BigQuery Analysis',
    name: 'Identify deprecated UDFs',
    scriptFile: 'bigquery-audit.js',
    apiEndpoint: 'bigquery.routines.list',
    status: 'implemented'
  },
  {
    category: 'BigQuery',
    subcategory: 'BigQuery Analysis',
    auditItem: 'BigQuery Analysis',
    name: 'Query optimization analysis',
    scriptFile: 'bigquery-audit.js',
    apiEndpoint: 'bigquery.jobs.list',
    status: 'implemented'
  },
  {
    category: 'BigQuery',
    subcategory: 'BigQuery Analysis',
    auditItem: 'BigQuery Analysis',
    name: 'BigQuery cost optimization',
    scriptFile: 'bigquery-audit.js',
    apiEndpoint: 'bigquery.datasets.get',
    status: 'implemented'
  },
  {
    category: 'BigQuery',
    subcategory: 'BigQuery Analysis',
    auditItem: 'BigQuery Analysis',
    name: 'Dataset access controls review',
    scriptFile: 'bigquery-audit.js',
    apiEndpoint: 'bigquery.datasets.getIamPolicy',
    status: 'implemented'
  },
  {
    category: 'BigQuery',
    subcategory: 'BigQuery Analysis',
    auditItem: 'BigQuery Analysis',
    name: 'BigQuery job monitoring',
    scriptFile: 'bigquery-audit.js',
    apiEndpoint: 'bigquery.jobs.list',
    status: 'implemented'
  },
  {
    category: 'BigQuery',
    subcategory: 'BigQuery Analysis',
    auditItem: 'BigQuery Analysis',
    name: 'BigQuery Storage API Cost Monitoring',
    scriptFile: 'bigquery-audit.js',
    apiEndpoint: 'bigquery.datasets.get',
    status: 'not_started'
  },
  {
    category: 'BigQuery',
    subcategory: 'BigQuery Analysis',
    auditItem: 'BigQuery Analysis',
    name: 'BigQuery Slot Utilization & Reservation Sizing',
    scriptFile: 'bigquery-audit.js',
    apiEndpoint: 'bigquery.reservations.list',
    status: 'not_started'
  },
  // Add Cloud SQL category
  {
    category: 'Cloud SQL',
    subcategory: 'Cloud SQL Optimization',
    auditItem: 'Cloud SQL Optimization',
    name: 'Cloud SQL instance utilization',
    scriptFile: 'resource-utilization-audit.js',
    apiEndpoint: 'sqladmin.instances.list',
    status: 'implemented'
  },
  {
    category: 'Cloud SQL',
    subcategory: 'Cloud SQL Optimization',
    auditItem: 'Cloud SQL Optimization',
    name: 'Database CPU utilization analysis',
    scriptFile: 'resource-utilization-audit.js',
    apiEndpoint: 'monitoring.timeSeries.list',
    status: 'implemented'
  },
  {
    category: 'Cloud SQL',
    subcategory: 'Cloud SQL Optimization',
    auditItem: 'Cloud SQL Optimization',
    name: 'Database memory utilization analysis',
    scriptFile: 'resource-utilization-audit.js',
    apiEndpoint: 'monitoring.timeSeries.list',
    status: 'implemented'
  },
  {
    category: 'Cloud SQL',
    subcategory: 'Cloud SQL Optimization',
    auditItem: 'Cloud SQL Optimization',
    name: 'Database disk utilization analysis',
    scriptFile: 'resource-utilization-audit.js',
    apiEndpoint: 'monitoring.timeSeries.list',
    status: 'implemented'
  },
  {
    category: 'Cloud SQL',
    subcategory: 'Cloud SQL Optimization',
    auditItem: 'Cloud SQL Optimization',
    name: 'Database connection monitoring',
    scriptFile: 'resource-utilization-audit.js',
    apiEndpoint: 'monitoring.timeSeries.list',
    status: 'implemented'
  },
  {
    category: 'Cloud SQL',
    subcategory: 'Cloud SQL Optimization',
    auditItem: 'Cloud SQL Optimization',
    name: 'Database scaling recommendations',
    scriptFile: 'resource-utilization-audit.js',
    apiEndpoint: 'recommender.recommendations.list',
    status: 'implemented'
  },
  // Add Cloud Memorystore category
  {
    category: 'Cloud Memorystore',
    subcategory: 'Memorystore Optimization',
    auditItem: 'Memorystore Optimization',
    name: 'Cloud Memorystore (Redis/Memcached) Sizing',
    scriptFile: 'memorystore-audit.js',
    apiEndpoint: 'redis.instances.list',
    status: 'not_started'
  },
  // Add Cloud Spanner category
  {
    category: 'Cloud Spanner',
    subcategory: 'Spanner Optimization',
    auditItem: 'Spanner Optimization',
    name: 'Cloud Spanner Instance Right-Sizing',
    scriptFile: 'spanner-audit.js',
    apiEndpoint: 'spanner.instances.list',
    status: 'not_started'
  },
  // Add Persistent Disks category
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Inventory',
    name: 'List all persistent disks',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.list',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Inventory',
    name: 'Check disk types',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Inventory',
    name: 'Review disk sizes',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Inventory',
    name: 'Verify disk labels',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.list',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Inventory',
    name: 'Check for disk snapshots',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.snapshots.list',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Inventory',
    name: 'Review disk performance',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Inventory',
    name: 'Verify disk attachments',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Inventory',
    name: 'Check for disk reservations',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Security',
    name: 'Check for encryption',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Security',
    name: 'Verify snapshot policies',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.snapshots.list',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Security',
    name: 'Review access controls',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.getIamPolicy',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Security',
    name: 'Check for secure deletion',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Security',
    name: 'Verify disk integrity',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Security',
    name: 'Check for disk backup policies',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Security',
    name: 'Review disk access logs',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Security',
    name: 'Verify disk security policies',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Persistent Disks',
    auditItem: 'Disk Optimization',
    name: 'Persistent Disk Type & Snapshot Cost-Effectiveness',
    scriptFile: 'disk-audit.js',
    apiEndpoint: 'compute.disks.get',
    status: 'not_started'
  },
  // Add Filestore category
  {
    category: 'Storage',
    subcategory: 'Filestore',
    auditItem: 'Filestore Optimization',
    name: 'Filestore Instance Optimization',
    scriptFile: 'filestore-audit.js',
    apiEndpoint: 'file.instances.list',
    status: 'not_started'
  },
  // Add Load Balancing category
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Inventory',
    name: 'List all load balancers',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.forwardingRules.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Inventory',
    name: 'Check load balancer types',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.forwardingRules.get',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Inventory',
    name: 'Review backend services',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.backendServices.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Inventory',
    name: 'Verify health checks',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.healthChecks.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Inventory',
    name: 'Check for load balancer redundancy',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.forwardingRules.get',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Inventory',
    name: 'Review load balancer performance',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.forwardingRules.get',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Inventory',
    name: 'Verify load balancer scaling',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.forwardingRules.get',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Inventory',
    name: 'Check for load balancer cost optimization',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.forwardingRules.get',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Security',
    name: 'Check SSL certificates',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.sslCertificates.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Security',
    name: 'Review security policies',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.securityPolicies.list',
    status: 'implemented'
  },
  {
    category: 'Networking',
    subcategory: 'Load Balancing',
    auditItem: 'Load Balancer Security',
    name: 'Verify WAF configurations',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.securityPolicies.get',
    status: 'implemented'
  },
  // Add missing Cloud Storage items
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Security',
    name: 'Check for bucket lock',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'not_implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Security',
    name: 'Verify bucket access logs',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'not_implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Management',
    name: 'Review lifecycle rules',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'not_implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Management',
    name: 'Check versioning status',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'not_implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Management',
    name: 'Verify retention policies',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'not_implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Management',
    name: 'Check for object immutability',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'not_implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Management',
    name: 'Review storage class transitions',
    scriptFile: 'storage-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'not_implemented'
  },
  {
    category: 'Storage',
    subcategory: 'Cloud Storage',
    auditItem: 'Bucket Management',
    name: 'Advanced Object Lifecycle Management (OLM) Policy Tuning',
    scriptFile: 'storage-lifecycle-audit.js',
    apiEndpoint: 'storage.buckets.get',
    status: 'not_started'
  },
  // Add missing Networking items
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Optimization',
    name: 'Network Service Tier Analysis (Egress Costs)',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.networks.get',
    status: 'not_started'
  },
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Optimization',
    name: 'Cloud NAT Gateway Efficiency',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.routers.list',
    status: 'not_started'
  },
  {
    category: 'Networking',
    subcategory: 'VPC',
    auditItem: 'Network Optimization',
    name: 'Inter-Region/Zone Traffic Cost Analysis',
    scriptFile: 'networking-audit.js',
    apiEndpoint: 'compute.networks.get',
    status: 'not_started'
  },
];

async function seedDatabase() {
  try {
    await prisma.auditItem.deleteMany();
    await prisma.auditCategory.deleteMany();

    // Create categories and subcategories
    const categoryMap = {};
    for (const item of auditItems) {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = await prisma.auditCategory.create({
          data: {
            name: item.category,
            description: item.category + ' audits',
          },
        });
      }
    }

    // Create audit items
    for (const item of auditItems) {
      await prisma.auditItem.create({
        data: {
          categoryId: categoryMap[item.category].id,
          name: item.name,
          description: item.auditItem + (item.subcategory ? ' (' + item.subcategory + ')' : ''),
          scriptFile: item.scriptFile,
          apiEndpoint: item.apiEndpoint,
          status: item.status,
        },
      });
    }

    console.log('Database seeded with all audit items!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase(); 