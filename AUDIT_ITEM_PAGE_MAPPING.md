# Audit Item to Platform Page Mapping

| Category | Subcategory | Audit Item | Sub-Item | Platform Page(s) | Status |
|----------|-------------|------------|----------|------------------|--------|
| Compute Resources | Virtual Machines | VM Instance Inventory | List all VM instances | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Instance Inventory | Check instance types and sizes | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Instance Inventory | Verify machine family usage | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Instance Inventory | Review instance labels and tags | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Instance Inventory | Check for deprecated machine types | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Instance Inventory | Verify instance naming conventions | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Optimization | Check for underutilized instances | /compute, /resource-utilization | ✓ |
| Compute Resources | Virtual Machines | VM Optimization | Review instance scheduling | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Optimization | Verify preemptible/spot instance usage | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Optimization | Check for right-sized instances | /compute, /resource-utilization | ✓ |
| Compute Resources | Virtual Machines | VM Optimization | Review CPU and memory utilization patterns | /compute, /resource-utilization | ✓ |
| Compute Resources | Virtual Machines | VM Optimization | Check for idle instances during non-business hours | /compute, /resource-utilization | ✓ |
| Compute Resources | Virtual Machines | VM Optimization | Verify instance reservations | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Optimization | Check for sustained use discounts | /compute, /discounts | ✓ |
| Compute Resources | Virtual Machines | VM Optimization | Granular VM Right-Sizing & Customization | Missing |  |
| Compute Resources | Virtual Machines | VM Optimization | Sole-Tenant Node Efficiency Review | Missing |  |
| Compute Resources | Virtual Machines | VM Security | Verify OS patch levels | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Security | Check for secure boot enabled | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Security | Review service account usage | /compute, /security | ✓ |
| Compute Resources | Virtual Machines | VM Security | Verify disk encryption | /compute, /storage | ✓ |
| Compute Resources | Virtual Machines | VM Security | Check for Shielded VM features | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Security | Verify integrity monitoring | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Security | Review OS login configuration | /compute | ✗ |
| Compute Resources | Virtual Machines | VM Security | Check for confidential computing | /compute | ✗ |
| Compute Resources | Virtual Machines | VM Security | Verify VM metadata security | /compute | ✓ |
| Compute Resources | Virtual Machines | VM Security | Optimize Machine Image Storage Costs | Missing |  |
| Compute Resources | Kubernetes (GKE) | Cluster Configuration | List all GKE clusters | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Configuration | Check cluster versions | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Configuration | Verify node pool configurations | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Configuration | Review cluster labels and tags | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Configuration | Check for regional vs zonal clusters | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Configuration | Verify cluster maintenance windows | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Security | Check for private clusters | /compute | ✗ |
| Compute Resources | Kubernetes (GKE) | Cluster Security | Verify workload identity | /compute | ✗ |
| Compute Resources | Kubernetes (GKE) | Cluster Security | Review network policies | /compute | ✗ |
| Compute Resources | Kubernetes (GKE) | Cluster Security | Check for binary authorization | /compute | ✗ |
| Compute Resources | Kubernetes (GKE) | Cluster Security | Verify pod security policies | /compute | ✗ |
| Compute Resources | Kubernetes (GKE) | Cluster Security | Check for container image scanning | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Security | Review cluster security posture | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Security | Verify cluster logging and monitoring | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Optimization | Review node pool sizing | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Optimization | Check for cluster autoscaling | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Optimization | Verify vertical pod autoscaling | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Optimization | Review resource quotas | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Optimization | Check for node auto-provisioning | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Optimization | Verify cluster resource utilization | /resource-utilization | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Optimization | Review pod disruption budgets | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Optimization | Check for cost-optimized node pools | /compute | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Optimization | GKE Workload (Pod) Right-Sizing | /gke/workload-right-sizing | ✓ |
| Compute Resources | Kubernetes (GKE) | Cluster Optimization | GKE Idle/Underutilized Node Pool Detection | /gke/idle-node-pools | ✓ |
| Compute Resources | Serverless | Cloud Functions | List all functions | /compute | ✓ |
| Compute Resources | Serverless | Cloud Functions | Check function versions | /compute | ✓ |
| Compute Resources | Serverless | Cloud Functions | Review memory allocations | /compute | ✓ |
| Compute Resources | Serverless | Cloud Functions | Verify function triggers | /compute | ✓ |
| Compute Resources | Serverless | Cloud Functions | Check for cold start optimization | /compute | ✓ |
| Compute Resources | Serverless | Cloud Functions | Review function timeout settings | /compute | ✓ |
| Compute Resources | Serverless | Cloud Functions | Verify function security settings | /compute | ✓ |
| Compute Resources | Serverless | Cloud Functions | Check for function retry policies | /compute | ✓ |
| Compute Resources | Serverless | Cloud Functions | Cloud Functions Resource & Concurrency Optimization | /serverless/cloud-functions-optimization | ✓ |
| Compute Resources | Serverless | Cloud Run | List all services | /compute | ✓ |
| Compute Resources | Serverless | Cloud Run | Check service configurations | /compute | ✓ |
| Compute Resources | Serverless | Cloud Run | Review scaling settings | /compute | ✓ |
| Compute Resources | Serverless | Cloud Run | Verify container images | /compute | ✓ |
| Compute Resources | Serverless | Cloud Run | Check for concurrency settings | /compute | ✓ |
| Compute Resources | Serverless | Cloud Run | Review CPU allocation | /compute | ✓ |
| Compute Resources | Serverless | Cloud Run | Verify service security settings | /compute | ✓ |
| Compute Resources | Serverless | Cloud Run | Check for service mesh integration | /compute | ✓ |
| Compute Resources | Serverless | Cloud Run | Cloud Run Resource & Concurrency Optimization | /serverless/cloud-run-optimization | ✓ |
| Storage | Cloud Storage | Bucket Inventory | List all buckets | /storage | ✓ |
| Storage | Cloud Storage | Bucket Inventory | Check bucket locations | /storage | ✓ |
| Storage | Cloud Storage | Bucket Inventory | Review storage classes | /storage | ✓ |
| Storage | Cloud Storage | Bucket Inventory | Verify bucket labels | /storage | ✓ |
| Storage | Cloud Storage | Bucket Inventory | Check for bucket versioning | /storage | ✗ |
| Storage | Cloud Storage | Bucket Inventory | Review bucket lifecycle rules | /storage | ✗ |
| Storage | Cloud Storage | Bucket Inventory | Verify bucket retention policies | /storage | ✗ |
| Storage | Cloud Storage | Bucket Inventory | Check for bucket logging | /storage | ✗ |
| Storage | Cloud Storage | Bucket Security | Check IAM policies | /storage | ✓ |
| Storage | Cloud Storage | Bucket Security | Verify bucket permissions | /storage | ✓ |
| Storage | Cloud Storage | Bucket Security | Review public access | /storage | ✓ |
| Storage | Cloud Storage | Bucket Security | Check for uniform bucket access | /storage | ✓ |
| Storage | Cloud Storage | Bucket Security | Verify bucket encryption | /storage | ✓ |
| Storage | Cloud Storage | Bucket Security | Check for bucket lock | /storage | ✗ |
| Storage | Cloud Storage | Bucket Security | Review bucket CORS configuration | /storage | ✓ |
| Storage | Cloud Storage | Bucket Security | Verify bucket access logs | /storage | ✗ |
| Storage | Cloud Storage | Bucket Management | Review lifecycle rules | /storage | ✗ |
| Storage | Cloud Storage | Bucket Management | Check versioning status | /storage | ✗ |
| Storage | Cloud Storage | Bucket Management | Verify retention policies | /storage | ✗ |
| Storage | Cloud Storage | Bucket Management | Review object metadata | /storage | ✓ |
| Storage | Cloud Storage | Bucket Management | Check for object immutability | /storage | ✗ |
| Storage | Cloud Storage | Bucket Management | Review storage class transitions | /storage | ✗ |
| Storage | Cloud Storage | Bucket Management | Verify object access patterns | /storage | ✓ |
| Storage | Cloud Storage | Bucket Management | Check for bucket cost optimization | /storage | ✓ |
| Storage | Cloud Storage | Bucket Management | Advanced Object Lifecycle Management (OLM) Policy Tuning | /storage-lifecycle |  |
| Storage | Persistent Disks | Disk Inventory | List all persistent disks | /storage | ✓ |
| Storage | Persistent Disks | Disk Inventory | Check disk types | /storage | ✓ |
| Storage | Persistent Disks | Disk Inventory | Review disk sizes | /storage | ✓ |
| Storage | Persistent Disks | Disk Inventory | Verify disk labels | /storage | ✓ |
| Storage | Persistent Disks | Disk Inventory | Check for disk snapshots | /storage | ✓ |
| Storage | Persistent Disks | Disk Inventory | Review disk performance | /storage | ✓ |
| Storage | Persistent Disks | Disk Inventory | Verify disk attachments | /storage | ✓ |
| Storage | Persistent Disks | Disk Inventory | Check for disk reservations | /storage | ✓ |
| Storage | Persistent Disks | Disk Security | Check for encryption | /storage | ✓ |
| Storage | Persistent Disks | Disk Security | Verify snapshot policies | /storage | ✓ |
| Storage | Persistent Disks | Disk Security | Review access controls | /storage | ✓ |
| Storage | Persistent Disks | Disk Security | Check for secure deletion | /storage | ✓ |
| Storage | Persistent Disks | Disk Security | Verify disk integrity | /storage | ✓ |
| Storage | Persistent Disks | Disk Security | Check for disk backup policies | /storage | ✓ |
| Storage | Persistent Disks | Disk Security | Review disk access logs | /storage | ✓ |
| Storage | Persistent Disks | Disk Security | Verify disk security policies | /storage | ✓ |
| Storage | Persistent Disks | Disk Security | Persistent Disk Type & Snapshot Cost-Effectiveness | /storage/persistent-disk-optimization | ✓ |
| Storage | Filestore | Filestore Instance Optimization | Filestore Instance Optimization | /storage/filestore-optimization | ✓ |
| Networking | VPC | Network Configuration | List all VPCs | /network | ✓ |
| Networking | VPC | Network Configuration | Check subnet configurations | /network | ✓ |
| Networking | VPC | Network Configuration | Review routing tables | /network | ✓ |
| Networking | VPC | Network Configuration | Verify network labels | /network | ✓ |
| Networking | VPC | Network Configuration | Check for VPC peering | /network | ✓ |
| Networking | VPC | Network Configuration | Review network topology | /network | ✓ |
| Networking | VPC | Network Configuration | Verify network performance | /network | ✓ |
| Networking | VPC | Network Configuration | Check for network cost optimization | /network | ✓ |
| Networking | VPC | Network Security | Check firewall rules | /network | ✓ |
| Networking | VPC | Network Security | Review VPC flow logs | /network | ✗ |
| Networking | VPC | Network Security | Verify private Google access | /network | ✓ |
| Networking | VPC | Network Security | Check for VPC service controls | /network | ✓ |
| Networking | VPC | Network Security | Verify network encryption | /network | ✓ |
| Networking | VPC | Network Security | Check for network segmentation | /network | ✓ |
| Networking | VPC | Network Security | Review network access policies | /network | ✓ |
| Networking | VPC | Network Security | Verify network security posture | /network | ✓ |
| Networking | VPC | Network Security | Network Service Tier Analysis (Egress Costs) | /network/service-tier-analysis | ✓ |
| Networking | VPC | Network Security | Cloud NAT Gateway Efficiency | /network/nat-efficiency | ✓ |
| Networking | VPC | Network Security | Inter-Region/Zone Traffic Cost Analysis | /network/inter-region-traffic | ✓ |
| Networking | Load Balancing | Load Balancer Inventory | List all load balancers | /network | ✓ |
| Networking | Load Balancing | Load Balancer Inventory | Check load balancer types | /network | ✓ |
| Networking | Load Balancing | Load Balancer Inventory | Review backend services | /network | ✓ |
| Networking | Load Balancing | Load Balancer Inventory | Verify health checks | /network | ✓ |
| Networking | Load Balancing | Load Balancer Inventory | Check for load balancer redundancy | /network | ✓ |
| Networking | Load Balancing | Load Balancer Inventory | Review load balancer performance | /network | ✓ |
| Networking | Load Balancing | Load Balancer Inventory | Verify load balancer scaling | /network | ✓ |
| Networking | Load Balancing | Load Balancer Inventory | Check for load balancer cost optimization | /network | ✓ |
| Networking | Load Balancing | Load Balancer Security | Check SSL certificates | /network | ✓ |
| Networking | Load Balancing | Load Balancer Security | Review security policies | /network | ✓ |
| Networking | Load Balancing | Load Balancer Security | Verify WAF configurations | /network | ✓ |
| Networking | Load Balancing | Load Balancer Security | Check for DDoS protection | /network | ✓ |
| Networking | Load Balancing | Load Balancer Security | Verify TLS configuration | /network | ✓ |
| Networking | Load Balancer Security | Check for SSL policies | /network | ✓ |
| Networking | Load Balancer Security | Review load balancer access logs | /network | ✓ |
| Networking | Load Balancer Security | Verify load balancer security posture | /network | ✓ |
| Networking | Cloud DNS | DNS Configuration | List all DNS zones | /network | ✓ |
| Networking | Cloud DNS | DNS Configuration | Check DNS records | /network | ✓ |
| Networking | Cloud DNS | DNS Configuration | Review DNSSEC status | /network | ✓ |
| Networking | Cloud DNS | DNS Configuration | Verify DNS policies | /network | ✓ |
| Networking | Cloud DNS | DNS Configuration | Check for DNS redundancy | /network | ✓ |
| Networking | Cloud DNS | DNS Configuration | Review DNS performance | /network | ✓ |
| Networking | Cloud DNS | DNS Configuration | Verify DNS security settings | /network | ✓ |
| Networking | Cloud DNS | DNS Configuration | Check for DNS cost optimization | /network | ✓ |
| Networking | Cloud CDN | Cloud CDN for Egress Optimization | Cloud CDN for Egress Optimization | /network/cdn-egress-optimization | ✓ |
| Security & IAM | Identity & Access Management | IAM Policies | List all IAM policies | /security | ✓ |
| Security & IAM | Identity & Access Management | IAM Policies | Check role assignments | /security | ✓ |
| Security & IAM | Identity & Access Management | IAM Policies | Review custom roles | /security | ✓ |
| Security & IAM | Identity & Access Management | IAM Policies | Verify principle of least privilege | /security | ✓ |
| Security & IAM | Identity & Access Management | IAM Policies | Check for role separation | /security | ✓ |
| Security & IAM | Identity & Access Management | IAM Policies | Review IAM audit logs | /security | ✓ |
| Security & IAM | Identity & Access Management | IAM Policies | Verify IAM security posture | /security | ✓ |
| Security & IAM | Identity & Access Management | IAM Policies | Check for IAM cost optimization | /security | ✓ |
| Security & IAM | Identity & Access Management | Service Accounts | List all service accounts | /security | ✓ |
| Security & IAM | Identity & Access Management | Service Accounts | Check key management | /security | ✓ |
| Security & IAM | Identity & Access Management | Service Accounts | Review account permissions | /security | ✓ |
| Security & IAM | Identity & Access Management | Service Accounts | Verify workload identity | /security | ✓ |
| Security & IAM | Identity & Access Management | Service Accounts | Check for service account rotation | /security | ✓ |
| Security & IAM | Identity & Access Management | Service Accounts | Review service account usage | /security | ✓ |
| Security & IAM | Identity & Access Management | Service Accounts | Verify service account security | /security | ✓ |
| Security & IAM | Identity & Access Management | Service Accounts | Check for service account cost optimization | /security | ✓ |
| Security & IAM | Security Controls | Organization Policies | List all organization policies | /security | ✓ |
| Security & IAM | Security Controls | Organization Policies | Check policy enforcement | /security | ✓ |
| Security & IAM | Security Controls | Organization Policies | Review constraint settings | /security | ✓ |
| Security & IAM | Security Controls | Organization Policies | Verify policy inheritance | /security | ✓ |
| Security & IAM | Security Controls | Organization Policies | Check for policy compliance | /security | ✓ |
| Security & IAM | Security Controls | Organization Policies | Review policy audit logs | /security | ✓ |
| Security & IAM | Security Controls | Organization Policies | Verify policy security posture | /security | ✓ |
| Security & IAM | Security Controls | Organization Policies | Check for policy cost optimization | /security | ✓ |
| Security & IAM | Security Controls | Security Command Center | Check security findings | /security | ✓ |
| Security & IAM | Security Controls | Security Command Center | Review vulnerability reports | /security | ✓ |
| Security & IAM | Security Controls | Security Command Center | Verify security health analytics | /security | ✓ |
| Security & IAM | Security Controls | Security Command Center | Check for threat detection | /security | ✓ |
| Security & IAM | Security Controls | Security Command Center | Review security recommendations | /security | ✓ |
| Security & IAM | Security Controls | Security Command Center | Verify security monitoring | /security | ✓ |
| Security & IAM | Security Controls | Security Command Center | Check for security automation | /security | ✓ |
| Security & IAM | Security Controls | Security Command Center | Review security cost optimization | /security | ✓ |
| Cost Management | Billing | Billing Configuration | List all billing accounts | /cost | ✓ |
| Cost Management | Billing | Billing Configuration | Check billing export | /cost | ✓ |
| Cost Management | Billing | Billing Configuration | Review budget alerts | /cost | ✓ |
| Cost Management | Billing | Billing Configuration | Verify cost allocation | /cost | ✓ |
| Cost Management | Billing | Billing Configuration | Check for billing optimization | /cost | ✓ |
| Cost Management | Billing | Billing Configuration | Review billing reports | /cost | ✓ |
| Cost Management | Billing | Billing Configuration | Verify billing security | /cost | ✓ |
| Cost Management | Billing | Billing Configuration | Check for billing automation | /cost | ✓ |
| Cost Management | Billing | Cost Optimization | Check for committed use discounts | /discounts | ✓ |
| Cost Management | Billing | Cost Optimization | Review sustained use discounts | /discounts | ✓ |
| Cost Management | Billing | Cost Optimization | Verify resource utilization | /resource-utilization | ✓ |
| Cost Management | Billing | Cost Optimization | Check for idle resources | /resource-utilization | ✓ |
| Cost Management | Billing | Cost Optimization | Review cost recommendations | /discounts | ✓ |
| Cost Management | Billing | Cost Optimization | Verify cost allocation tags | /cost | ✓ |
| Cost Management | Billing | Cost Optimization | Check for cost anomaly detection | /cost | ✓ |
| Cost Management | Billing | Cost Optimization | Review cost optimization automation | /cost | ✓ |
| Cost Management | Billing | Cost Optimization | Check for billing automation | /cost | ✓ |
| Cost Management | Resource Management | Resource Organization | List all projects | /cost-allocation | ✓ |
| Cost Management | Resource Management | Resource Organization | Check project hierarchy | /cost-allocation | ✓ |
| Cost Management | Resource Management | Resource Organization | Review resource labels | /cost-allocation | ✓ |
| Cost Management | Resource Management | Resource Organization | Verify resource quotas | /cost-allocation | ✓ |
| Cost Management | Resource Management | Resource Organization | Check for resource optimization | /cost-allocation | ✓ |
| Cost Management | Resource Management | Resource Organization | Review resource security | /cost-allocation | ✓ |
| Cost Management | Resource Management | Resource Organization | Verify resource automation | /cost-allocation | ✓ |
| Cost Management | Resource Management | Resource Organization | Check for resource cost optimization | /cost-allocation | ✓ |
| Cost Management | Resource Management | Resource Organization | Dormant/Unused Projects Review | /network/dormant-projects | ✓ |
| Cost Management | Resource Management | Resource Monitoring | Check monitoring dashboards | /monitoring | ✓ |
| Cost Management | Resource Management | Resource Monitoring | Review alert policies | /monitoring | ✓ |
| Cost Management | Resource Management | Resource Monitoring | Verify logging configuration | /monitoring | ✓ |
| Cost Management | Resource Management | Resource Monitoring | Check for custom metrics | /monitoring | ✓ |
| Cost Management | Resource Management | Resource Monitoring | Review monitoring optimization | /monitoring | ✓ |
| Cost Management | Resource Management | Resource Monitoring | Verify monitoring security | /monitoring | ✓ |
| Cost Management | Resource Management | Resource Monitoring | Check for monitoring automation | /monitoring | ✓ |
| Cost Management | Resource Management | Resource Monitoring | Review monitoring cost optimization | /monitoring | ✓ |
| Compliance | Data Protection | Data Classification | Check for sensitive data | /data-protection | ✗ |
| Compliance | Data Protection | Data Classification | Review data retention | /storage | ✗ |
| Compliance | Data Protection | Data Classification | Verify data encryption | /storage | ✓ |
| Compliance | Data Protection | Data Classification | Check for data residency | /data-protection | ✓ |
| Compliance | Data Protection | Data Classification | Review data security | /data-protection | ✗ |
| Compliance | Data Protection | Data Classification | Verify data compliance | /data-protection | ✗ |
| Compliance | Data Protection | Data Classification | Check for data optimization | /data-protection | ✗ |
| Compliance | Data Protection | Data Classification | Review data automation | /data-protection | ✗ |
| Compliance | Data Protection | Privacy Controls | Review privacy policies | /compliance | ✗ |
| Compliance | Data Protection | Privacy Controls | Check for data access logs | /compliance | ✓ |
| Compliance | Data Protection | Privacy Controls | Verify consent management | /compliance | ✗ |
| Compliance | Data Protection | Privacy Controls | Check for data deletion | /storage | ✗ |
| Compliance | Data Protection | Privacy Controls | Review privacy security | /compliance | ✗ |
| Compliance | Data Protection | Privacy Controls | Verify privacy compliance | /compliance | ✗ |
| Compliance | Data Protection | Privacy Controls | Check for privacy optimization | /compliance | ✗ |
| Compliance | Data Protection | Privacy Controls | Review privacy automation | /compliance | ✗ |
| Compliance | Compliance Standards | Regulatory Compliance | Check for GDPR compliance | /compliance | ✓ |
| Compliance | Compliance Standards | Regulatory Compliance | Review HIPAA compliance | /compliance | ✓ |
| Compliance | Compliance Standards | Regulatory Compliance | Verify PCI DSS compliance | /compliance | ✓ |
| Compliance | Compliance Standards | Regulatory Compliance | Check for SOC 2 compliance | /compliance | ✓ |
| Compliance | Compliance Standards | Regulatory Compliance | Review compliance security | /compliance | ✓ |
| Compliance | Compliance Standards | Regulatory Compliance | Verify compliance optimization | /compliance | ✓ |
| Compliance | Compliance Standards | Regulatory Compliance | Check for compliance automation | /compliance | ✓ |
| Compliance | Compliance Standards | Regulatory Compliance | Review compliance cost optimization | /compliance | ✓ |
| Compliance | Compliance Standards | Audit Logging | Review audit logs | /compliance | ✓ |
| Compliance | Compliance Standards | Audit Logging | Check for log retention | /compliance | ✓ |
| Compliance | Compliance Standards | Audit Logging | Verify log export | /compliance | ✓ |
| Compliance | Compliance Standards | Audit Logging | Check for log analysis | /compliance | ✓ |
| Compliance | Compliance Standards | Audit Logging | Review audit security | /compliance | ✓ |
| Compliance | Compliance Standards | Audit Logging | Verify audit optimization | /compliance | ✓ |
| Compliance | Compliance Standards | Audit Logging | Check for audit automation | /compliance | ✓ |
| Compliance | Compliance Standards | Audit Logging | Review audit cost optimization | /compliance | ✓ |
| BigQuery | BigQuery Analysis | BigQuery Analysis | Check for stale partitioning | /bigquery/stale-partitioning | ✓ |
| BigQuery | BigQuery Analysis | BigQuery Analysis | Identify deprecated UDFs | /bigquery/deprecated-udfs | ✓ |
| BigQuery | BigQuery Analysis | BigQuery Analysis | Query optimization analysis | /bigquery | ✓ |
| BigQuery | BigQuery Analysis | BigQuery Analysis | BigQuery cost optimization | /bigquery | ✓ |
| BigQuery | BigQuery Analysis | BigQuery Analysis | Dataset access controls review | /bigquery | ✓ |
| BigQuery | BigQuery Analysis | BigQuery Analysis | BigQuery job monitoring | /bigquery | ✓ |
| BigQuery | BigQuery Analysis | BigQuery Analysis | BigQuery Storage API Cost Monitoring | /bigquery/storage-api-cost-monitoring | Sidebar: BigQuery > Storage API Cost Monitoring |
| BigQuery | BigQuery Analysis | BigQuery Analysis | BigQuery Slot Utilization & Reservation Sizing | /bigquery/slot-utilization | ✓ |
| Resource Utilization | Cloud SQL Optimization | Cloud SQL instance utilization | /resource-utilization | ✓ |
| Resource Utilization | Cloud SQL Optimization | Database CPU utilization analysis | /resource-utilization | ✓ |
| Resource Utilization | Cloud SQL Optimization | Database memory utilization analysis | /resource-utilization | ✓ |
| Resource Utilization | Cloud SQL Optimization | Database disk utilization analysis | /resource-utilization | ✓ |
| Resource Utilization | Cloud SQL Optimization | Database connection monitoring | /resource-utilization | ✓ |
| Resource Utilization | Cloud SQL Optimization | Database scaling recommendations | /resource-utilization | ✓ |
| Resource Utilization | Compute Resource Optimization | Unused IP address detection | /resource-utilization | ✓ |
| Resource Utilization | Compute Resource Optimization | Load balancer traffic analysis | /resource-utilization | ✓ |
| Resource Utilization | Compute Resource Optimization | VM instance scheduling optimization | /resource-utilization | ✓ |
| Resource Utilization | Compute Resource Optimization | VM instance utilization trends | /resource-utilization | ✓ |
| Storage Lifecycle | Storage Lifecycle Management | Standard tier usage analysis | /storage-lifecycle | ✓ |
| Storage Lifecycle | Storage Lifecycle Management | Unused bucket detection | /storage-lifecycle | ✓ |
| Storage Lifecycle | Storage Lifecycle Management | Storage cost calculation | /storage-lifecycle | ✓ |
| Storage Lifecycle | Storage Lifecycle Management | Storage access pattern analysis | /storage-lifecycle | ✓ |
| Storage Lifecycle | Storage Lifecycle Management | Storage class transition recommendations | /storage-lifecycle | ✓ |
| Storage Lifecycle | Storage Lifecycle Management | Object lifecycle policy optimization | /storage-lifecycle | ✓ |
| Monitoring and Alerting | Advanced Monitoring | Cost anomaly alerts | /monitoring | ✓ |
| Monitoring and Alerting | Advanced Monitoring | Missing critical alerts detection | /monitoring | ✓ |
| Monitoring and Alerting | Advanced Monitoring | Alert notification channel verification | /monitoring | ✓ |
| Monitoring and Alerting | Advanced Monitoring | Alert coverage analysis | /monitoring | ✓ |
| Monitoring and Alerting | Advanced Monitoring | Alert effectiveness assessment | /monitoring | ✓ |
| Cost Management | Budget Management | Budget alert configuration | /cost | ✓ |
| Cost Management | Budget Management | Budget tracking and forecasting | /cost | ✓ |
| Cost Management | Budget Management | Budget vs. actual spending analysis | /cost | ✓ |
| Cost Management | Budget Management | Budget allocation by service | /cost | ✓ |
| Cost Management | Discount Management | Discount utilization analysis | /discounts | ✓ |
| Cost Management | Discount Management | Committed use discount opportunities | /discounts | ✓ |
| Cost Management | Discount Management | Sustained use discount tracking | /discounts | ✓ |
| Cost Management | Discount Management | Discount optimization recommendations | /discounts | ✓ |
| Cost Management | Discount Management | Holistic CUD/SUD Coverage Analysis | /network/cud-sud-coverage | ✓ |
| Cost Management | Discount Management | Flexible CUDs vs. Resource-based CUDs Strategy | /discounts/flexible-vs-resource-cuds | ✓ |
| Cost Management | Cost Allocation | Resource tagging compliance | /cost-allocation | ✓ |
| Cost Management | Cost Allocation | Cost center allocation | /cost-allocation | ✓ |
| Cost Management | Cost Allocation | Project-level cost analysis | /cost-allocation | ✓ |
| Cost Management | Cost Allocation | Service-level cost breakdown | /cost-allocation | ✓ |
| Compliance | Data Residency | Data location compliance | /data-protection | ✓ |
| Compliance | Data Residency | Cross-region data transfer analysis | /data-protection | ✓ |
| Compliance | Data Residency | Regional compliance verification | /data-protection | ✓ |
| Security | Advanced Security Analysis | OS login configuration verification | /security | ✓ |
| Security | Advanced Security Analysis | Confidential computing verification | /security | ✓ |
| Security | Advanced Security Analysis | Private cluster configuration | /security | ✓ |
| Security | Advanced Security Analysis | Workload identity verification | /security | ✓ |
| Security | Advanced Security Analysis | Network policy enforcement | /security | ✓ |
| Security | Advanced Security Analysis | Binary authorization verification | /security | ✓ |
| Security | Advanced Security Analysis | Pod security policy verification | /security | ✓ |
| Security | Network Security | VPC flow logs verification | /security | ✓ |
| Security | Network Security | Network segmentation analysis | /security | ✓ |
| Security | Network Security | Cross-VPC connectivity audit | /security | ✓ |
| Storage | Advanced Storage Management | Bucket versioning verification | /storage | ✓ |
| Storage | Advanced Storage Management | Bucket lifecycle rules review | /storage | ✓ |
| Storage | Advanced Storage Management | Bucket retention policies verification | /storage | ✓ |
| Storage | Advanced Storage Management | Bucket logging configuration | /storage | ✓ |
| Storage | Advanced Storage Management | Bucket lock verification | /storage | ✓ |
| Storage | Advanced Storage Management | Object immutability verification | /storage | ✓ |
| Storage | Advanced Storage Management | Storage class transition verification | /storage | ✓ |
| Storage | Advanced Storage Management | Bucket access logs verification | /storage | ✓ |

// ... continue for all other audit items, sub-items, and their mappings ... 