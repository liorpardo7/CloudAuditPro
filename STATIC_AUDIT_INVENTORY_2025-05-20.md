# Static Audit Inventory (2025-05-20)

| #  | Category | Name | Script | Endpoint | Page Path | Description | Formula |
|----|----------|------|--------|----------|-----------|-------------|---------|
| 1  | Compute Resources | List all VM instances | compute-audit.js | compute.instances.list | /compute | List all VM instances | compute.instances.list |
| 2  | Compute Resources | Check instance types and sizes | compute-audit.js | compute.machineTypes.list | /compute | Check instance types and sizes | compute.machineTypes.list |
| 3  | Compute Resources | Verify machine family usage | compute-audit.js | compute.machineTypes.list | /compute | Verify machine family usage | compute.machineTypes.list |
| 4  | Compute Resources | Review instance labels and tags | compute-audit.js | compute.instances.list | /compute | Review instance labels and tags | compute.instances.list |
| 5  | Compute Resources | Check for deprecated machine types | compute-audit.js | compute.machineTypes.list | /compute | Check for deprecated machine types | compute.machineTypes.list |
| 6  | Compute Resources | Verify instance naming conventions | compute-audit.js | compute.instances.list | /compute | Verify instance naming conventions | compute.instances.list |
| 7  | Compute Resources | Check for underutilized instances | compute-audit.js | monitoring.timeSeries.list | /compute, /resource-utilization | Check for underutilized instances | monitoring.timeSeries.list |
| 8  | Compute Resources | Review instance scheduling | compute-audit.js | compute.instances.list | /compute | Review instance scheduling | compute.instances.list |
| 9  | Compute Resources | Verify preemptible/spot instance usage | compute-audit.js | compute.instances.list | /compute | Verify preemptible/spot instance usage | compute.instances.list |
| 10 | Compute Resources | Check for right-sized instances | compute-audit.js | compute.instances.list | /compute, /resource-utilization | Check for right-sized instances | compute.instances.list, monitoring.timeSeries.list |
| 11 | Compute Resources | Review CPU and memory utilization patterns | compute-audit.js | monitoring.timeSeries.list | /compute, /resource-utilization | Review CPU and memory utilization patterns | monitoring.timeSeries.list |
| 12 | Compute Resources | Check for idle instances during non-business hours | compute-audit.js | monitoring.timeSeries.list | /compute, /resource-utilization | Check for idle instances during non-business hours | monitoring.timeSeries.list |
| 13 | Compute Resources | Verify instance reservations | compute-audit.js | compute.reservations.list | /compute | Verify instance reservations | compute.reservations.list |
| 14 | Compute Resources | Check for sustained use discounts | compute-audit.js | compute.instances.list | /compute, /discounts | Check for sustained use discounts | compute.instances.list |
| 15 | Compute Resources | Granular VM Right-Sizing & Customization | compute-audit.js | monitoring.timeSeries.list | Missing | Granular VM Right-Sizing & Customization | monitoring.timeSeries.list |
| 16 | Compute Resources | Sole-Tenant Node Efficiency Review | compute-audit.js | compute.instances.list | Missing | Sole-Tenant Node Efficiency Review | compute.instances.list |
| 17 | Compute Resources | Verify OS patch levels | compute-audit.js | compute.instances.list | /compute | Verify OS patch levels | compute.instances.list, compute.images.list |
| 18 | Compute Resources | Check for secure boot enabled | compute-audit.js | compute.instances.list | /compute | Check for secure boot enabled | compute.instances.list |
| 19 | Compute Resources | Review service account usage | compute-audit.js | compute.instances.list | /compute, /security | Review service account usage | compute.instances.list, iam.serviceAccounts.get |
| 20 | Compute Resources | Verify disk encryption | compute-audit.js | compute.disks.list | /compute, /storage | Verify disk encryption | compute.disks.list |
| 21 | Compute Resources | Check for Shielded VM features | compute-audit.js | compute.instances.list | /compute | Check for Shielded VM features | compute.instances.list |
| 22 | Compute Resources | Verify integrity monitoring | compute-audit.js | compute.instances.list | /compute | Verify integrity monitoring | compute.instances.list |
| 23 | Compute Resources | Review OS login configuration | checklist-verification.js | compute.instances.list | /compute | Review OS login configuration | compute.instances.list |
| 24 | Compute Resources | Check for confidential computing | checklist-verification.js | compute.instances.list | /compute | Check for confidential computing | compute.instances.list |
| 25 | Compute Resources | Verify VM metadata security | compute-audit.js | compute.instances.list | /compute | Verify VM metadata security | compute.instances.list |
| 26 | Compute Resources | Optimize Machine Image Storage Costs | compute-audit.js | compute.images.list | Missing | Optimize Machine Image Storage Costs | compute.images.list |
| 27 | Compute Resources | List all GKE clusters | gke-audit.js | container.clusters.list | /compute | List all GKE clusters | container.clusters.list |
| 28 | Compute Resources | Check cluster versions | gke-audit.js | container.clusters.get | /compute | Check cluster versions | container.clusters.get |
| 29 | Compute Resources | Verify node pool configurations | gke-audit.js | container.nodePools.list | /compute | Verify node pool configurations | container.nodePools.list |
| 30 | Compute Resources | Review cluster labels and tags | gke-audit.js | container.clusters.list | /compute | Review cluster labels and tags | container.clusters.list |
| 31 | Compute Resources | Check for regional vs zonal clusters | gke-audit.js | container.clusters.get | /compute | Check for regional vs zonal clusters | container.clusters.get |
| 32 | Compute Resources | Verify cluster maintenance windows | gke-audit.js | container.clusters.get | /compute | Verify cluster maintenance windows | container.clusters.get |
| 33 | Compute Resources | Check for private clusters | checklist-verification.js | container.clusters.get | /compute | Check for private clusters | container.clusters.get |
| 34 | Compute Resources | Verify workload identity | checklist-verification.js | container.clusters.get | /compute | Verify workload identity | container.clusters.get |
| 35 | Compute Resources | Review network policies | checklist-verification.js | container.clusters.get | /compute | Review network policies | container.clusters.get |
| 36 | Compute Resources | Check for binary authorization | checklist-verification.js | container.clusters.get | /compute | Check for binary authorization | container.clusters.get |
| 37 | Compute Resources | Verify pod security policies | checklist-verification.js | container.clusters.get | /compute | Verify pod security policies | container.clusters.get |
| 38 | Compute Resources | Check for container image scanning | gke-audit.js | container.clusters.get | /compute | Check for container image scanning | container.clusters.get |
| 39 | Compute Resources | Review cluster security posture | gke-audit.js | container.clusters.get | /compute | Review cluster security posture | container.clusters.get |
| 40 | Compute Resources | Verify cluster logging and monitoring | gke-audit.js | container.clusters.get | /compute | Verify cluster logging and monitoring | container.clusters.get |
| 41 | Compute Resources | Review node pool sizing | gke-audit.js | container.nodePools.list | /compute | Review node pool sizing | container.nodePools.list |
| 42 | Compute Resources | Check for cluster autoscaling | gke-audit.js | container.clusters.get | /compute | Check for cluster autoscaling | container.clusters.get |
| 43 | Compute Resources | Verify vertical pod autoscaling | gke-audit.js | container.clusters.get | /compute | Verify vertical pod autoscaling | container.clusters.get |
| 44 | Compute Resources | Review resource quotas | gke-audit.js | container.clusters.get | /compute | Review resource quotas | container.clusters.get |
| 45 | Compute Resources | Check for node auto-provisioning | gke-audit.js | container.clusters.get | /compute | Check for node auto-provisioning | container.clusters.get |
| 46 | Compute Resources | Verify cluster resource utilization | gke-audit.js | monitoring.timeSeries.list | /resource-utilization | Verify cluster resource utilization | monitoring.timeSeries.list |
| 47 | Compute Resources | Review pod disruption budgets | gke-audit.js | container.clusters.get | /compute | Review pod disruption budgets | container.clusters.get |
| 48 | Compute Resources | Check for cost-optimized node pools | gke-audit.js | container.nodePools.list | /compute | Check for cost-optimized node pools | container.nodePools.list |
| 49 | Compute Resources | GKE Workload (Pod) Right-Sizing | gke-audit.js | container.clusters.get | /gke/workload-right-sizing | GKE Workload (Pod) Right-Sizing | container.clusters.get |
| 50 | Compute Resources | GKE Idle/Underutilized Node Pool Detection | gke-audit.js | container.nodePools.list | /gke/idle-node-pools | GKE Idle/Underutilized Node Pool Detection | container.nodePools.list |
| 51 | Compute Resources | List all functions | run-full-gcp-checklist-audit.js | cloudfunctions.functions.list | /compute | List all functions | cloudfunctions.functions.list |
| 52 | Compute Resources | Check function versions | run-full-gcp-checklist-audit.js | cloudfunctions.functions.get | /compute | Check function versions | cloudfunctions.functions.get |
| 53 | Compute Resources | Review memory allocations | run-full-gcp-checklist-audit.js | cloudfunctions.functions.get | /compute | Review memory allocations | cloudfunctions.functions.get |
| 54 | Compute Resources | Verify function triggers | run-full-gcp-checklist-audit.js | cloudfunctions.functions.get | /compute | Verify function triggers | cloudfunctions.functions.get |
| 55 | Compute Resources | Check for cold start optimization | run-full-gcp-checklist-audit.js | cloudfunctions.functions.get | /compute | Check for cold start optimization | cloudfunctions.functions.get |
| 56 | Compute Resources | Review function timeout settings | run-full-gcp-checklist-audit.js | cloudfunctions.functions.get | /compute | Review function timeout settings | cloudfunctions.functions.get |
| 57 | Compute Resources | Verify function security settings | run-full-gcp-checklist-audit.js | cloudfunctions.functions.get | /compute | Verify function security settings | cloudfunctions.functions.get |
| 58 | Compute Resources | Check for function retry policies | run-full-gcp-checklist-audit.js | cloudfunctions.functions.get | /compute | Check for function retry policies | cloudfunctions.functions.get |
| 59 | Compute Resources | Cloud Functions Resource & Concurrency Optimization | run-full-gcp-checklist-audit.js | cloudfunctions.functions.get | /serverless/cloud-functions-optimization | Cloud Functions Resource & Concurrency Optimization | cloudfunctions.functions.get |
| 60 | Compute Resources | List all services (Cloud Run) | run-full-gcp-checklist-audit.js | run.services.list | /compute | List all services (Cloud Run) | run.services.list |
| 61 | Compute Resources | Check service configurations (Cloud Run) | run-full-gcp-checklist-audit.js | run.services.get | /compute | Check service configurations (Cloud Run) | run.services.get |
| 62 | Compute Resources | Review scaling settings (Cloud Run) | run-full-gcp-checklist-audit.js | run.services.get | /compute | Review scaling settings (Cloud Run) | run.services.get |
| 63 | Compute Resources | Verify container images (Cloud Run) | run-full-gcp-checklist-audit.js | run.services.get | /compute | Verify container images (Cloud Run) | run.services.get |
| 64 | Compute Resources | Check for concurrency settings (Cloud Run) | run-full-gcp-checklist-audit.js | run.services.get | /compute | Check for concurrency settings (Cloud Run) | run.services.get |
| 65 | Compute Resources | Review CPU allocation (Cloud Run) | run-full-gcp-checklist-audit.js | run.services.get | /compute | Review CPU allocation (Cloud Run) | run.services.get |
| 66 | Compute Resources | Verify service security settings (Cloud Run) | run-full-gcp-checklist-audit.js | run.services.get | /compute | Verify service security settings (Cloud Run) | run.services.get |
| 67 | Compute Resources | Check for service mesh integration (Cloud Run) | run-full-gcp-checklist-audit.js | run.services.get | /compute | Check for service mesh integration (Cloud Run) | run.services.get |
| 68 | Compute Resources | Cloud Run Resource & Concurrency Optimization | run-full-gcp-checklist-audit.js | run.services.get | /serverless/cloud-run-optimization | Cloud Run Resource & Concurrency Optimization | run.services.get |
<!-- Continue for all actionable audit items, mapping each to its page path, script, endpoint, and formula. Mark missing page paths as 'Missing'. --> 