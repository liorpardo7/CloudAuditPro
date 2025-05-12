#!/usr/bin/env python3

import json
import os
from datetime import datetime
from pathlib import Path

def audit_service_accounts():
    """
    Sample audit function that generates mock data for service accounts.
    In a real implementation, this would use the GCP API to fetch actual data.
    """
    # Mock data for demonstration
    results = {
        "timestamp": datetime.now().isoformat(),
        "items": [
            {
                "id": "service-account-1",
                "name": "default-service-account",
                "email": "default-service-account@project.iam.gserviceaccount.com",
                "status": "active",
                "roles": ["roles/viewer", "roles/storage.objectViewer"],
                "last_used": "2024-03-15T10:30:00Z",
                "findings": [
                    {
                        "severity": "high",
                        "description": "Service account has broad viewer permissions",
                        "recommendation": "Consider limiting to specific resources"
                    }
                ]
            },
            {
                "id": "service-account-2",
                "name": "compute-engine-service-account",
                "email": "compute-engine@project.iam.gserviceaccount.com",
                "status": "active",
                "roles": ["roles/compute.admin"],
                "last_used": "2024-03-15T11:45:00Z",
                "findings": [
                    {
                        "severity": "critical",
                        "description": "Service account has compute.admin role",
                        "recommendation": "Review if full compute admin access is required"
                    }
                ]
            }
        ],
        "summary": {
            "total_accounts": 2,
            "active_accounts": 2,
            "critical_findings": 1,
            "high_findings": 1
        }
    }
    
    return results

def main():
    # Get the results directory path
    results_dir = Path(__file__).parent / "results"
    results_dir.mkdir(exist_ok=True)
    
    # Run the audit
    results = audit_service_accounts()
    
    # Save results to JSON file
    output_file = results_dir / "gcp_iam_service_accounts.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"Audit results saved to {output_file}")

if __name__ == "__main__":
    main() 