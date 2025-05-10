# CloudAuditPro Codebase Visualization

## 1. High-Level Architecture

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│          FRONTEND               │       │            BACKEND               │
│                                 │       │                                  │
│  ┌─────────────┐ ┌───────────┐  │       │  ┌─────────────┐ ┌───────────┐  │
│  │   React     │ │  Services │  │       │  │   NestJS    │ │   API     │  │
│  │ Components  │ │   Layer   │◄─┼───────┼─►│ Controllers │ │ Services  │  │
│  └─────────────┘ └───────────┘  │       │  └─────────────┘ └───────────┘  │
│                                 │       │                                  │
│  ┌─────────────┐ ┌───────────┐  │       │  ┌─────────────┐ ┌───────────┐  │
│  │   State     │ │   Hooks   │  │       │  │   Database  │ │   Cloud   │  │
│  │ Management  │ │           │  │       │  │   Models    │ │ Providers │  │
│  └─────────────┘ └───────────┘  │       │  └─────────────┘ └───────────┘  │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

## 2. Frontend Structure

```
FRONTEND_TREE/
├─ src/
│  ├─ components/                   # React components
│  │  ├─ Dashboard.tsx              # Main dashboard view [31KB]
│  │  ├─ Login.tsx                  # Authentication component [9.5KB]
│  │  ├─ MonitoringDashboard.tsx    # Monitoring UI [86KB]
│  │  ├─ InfrastructureAuditView.tsx # Infrastructure audit UI [17KB]
│  │  ├─ LambdaOptimizerView.tsx    # Lambda optimization UI [27KB]
│  │  ├─ ComputeResourcesView.tsx   # Compute resources UI [21KB]
│  │  ├─ StorageBucketOptimizerView.tsx # Storage optimization UI [11KB]
│  │  ├─ CloudAccountForm.tsx       # Cloud account management [9.8KB]
│  │  ├─ InsightsView.tsx           # Insights view [13KB]
│  │  └─ ...
│  ├─ services/                    # API service layer
│  │  ├─ api/                      # API clients
│  │  │  ├─ index.ts               # API config & interceptors [2.6KB]
│  │  │  ├─ cloud-accounts.ts      # Cloud accounts API [2.2KB]
│  │  │  ├─ insights.ts            # Insights API [2.3KB]
│  │  │  └─ ...
│  ├─ contexts/                    # React contexts
│  ├─ types/                       # TypeScript types
│  ├─ App.tsx                      # Main app component [14KB]
│  └─ index.tsx                    # App entry point
├─ public/                         # Static assets
├─ package.json                    # Frontend dependencies
└─ ...
```

## 3. Backend Structure

```
BACKEND_TREE/
├─ src/
│  ├─ auth/                         # Authentication module
│  │  ├─ auth.controller.ts         # Auth endpoints [1.0KB]
│  │  ├─ auth.service.ts            # Auth business logic [3.1KB]
│  │  ├─ auth.module.ts             # Auth module definition
│  │  ├─ guards/                    # Auth guards
│  │  └─ strategies/                # Auth strategies
│  ├─ users/                        # User management module
│  ├─ cloud/                        # Cloud integration module
│  ├─ audit/                        # Audit functionality
│  ├─ database/                     # Database models & config
│  ├─ storage/                      # Storage-related functionality
│  ├─ gamification/                 # Gamification features
│  ├─ openapi.yaml                  # API specification [14KB]
│  ├─ main.ts                       # Application entry point [4.7KB]
│  └─ app.module.ts                 # Main module definition
├─ test/                            # Test files
├─ package.json                     # Backend dependencies
└─ ...
```

## 4. API Integration Map

| Frontend Component | API Endpoints | Status |
|-------------------|---------------|--------|
| Login.tsx | `/auth/login` `/auth/register` | ⚠️ Security issues |
| Dashboard.tsx | `/api/v1/cloud-accounts` `/api/v1/findings` `/api/v1/insights` | ✅ Working |
| InfrastructureAuditView.tsx | `/api/v1/cloud-accounts/{id}/scan` | ✅ Working |
| StorageBucketOptimizerView.tsx | `/api/v1/findings?resourceType=S3` | ✅ Working |
| ComputeResourcesView.tsx | `/api/v1/findings?resourceType=EC2` | ✅ Working |
| LambdaOptimizerView.tsx | `/api/v1/findings?resourceType=Lambda` | ✅ Working |
| MonitoringDashboard.tsx | `/api/v1/monitoring/{tab}` | ⚠️ Needs metrics collection trigger |
| InsightsView.tsx | `/api/v1/insights` | ✅ Working |

## 5. API Version Distribution

```
API_VERSION_HEATMAP
┌────────────────────────┐
│ /api/v1/* endpoints    │██████████████████████ 22 endpoints
├────────────────────────┤
│ /api/v2/* endpoints    │██ 2 endpoints
├────────────────────────┤
│ /auth/* endpoints      │███ 3 endpoints
├────────────────────────┤
│ Unversioned endpoints  │█ 1 endpoint
└────────────────────────┘
```

## 6. Component Size Analysis

```
COMPONENT_SIZE_CHART
┌───────────────────────────┐
│ MonitoringDashboard.tsx   │████████████████████████████████████████ 86KB
├───────────────────────────┤
│ Dashboard.tsx             │███████████████ 31KB
├───────────────────────────┤
│ LambdaOptimizerView.tsx   │████████████ 27KB
├───────────────────────────┤
│ ComputeResourcesView.tsx  │█████████ 21KB
├───────────────────────────┤
│ InfrastructureAuditView.tsx│███████ 17KB
├───────────────────────────┤
│ InsightsView.tsx          │█████ 13KB
└───────────────────────────┘
```

## 7. API Flow Diagram

```
┌─────────────┐     ┌────────────────┐     ┌────────────────┐     ┌─────────────────┐
│  Frontend   │     │  API Gateway   │     │  Backend API   │     │  Cloud Provider │
│  Components │────►│  & Auth Layer  │────►│  Controllers   │────►│     APIs        │
└─────────────┘     └────────────────┘     └────────────────┘     └─────────────────┘
       │                                           │                       │
       │                                           │                       │
       │                                           ▼                       │
       │                                    ┌────────────────┐             │
       │                                    │    Database    │             │
       └───────────────────────────────────┤    Services    │◄────────────┘
                                           └────────────────┘
```

## 8. Authentication Flow

```
LOGIN FLOW:
┌──────────┐     ┌────────────┐     ┌─────────────┐     ┌─────────────┐
│  Login   │     │  /auth/    │     │  Validate   │     │ Generate JWT│
│  Form    │────►│  login     │────►│  Credentials│────►│   Token     │
└──────────┘     └────────────┘     └─────────────┘     └─────────────┘
                                                               │
┌──────────┐     ┌────────────┐                                │
│ Frontend │     │ Store in   │◄──────────────────────────────┘
│  App     │◄────│localStorage│
└──────────┘     └────────────┘

TOKEN REFRESH FLOW:
┌──────────┐     ┌────────────┐     ┌─────────────┐     ┌─────────────┐
│ API Call │     │ Intercept  │     │  /auth/     │     │ New JWT     │
│ 401 Error│────►│ Response   │────►│  refresh    │────►│ Token       │
└──────────┘     └────────────┘     └─────────────┘     └─────────────┘
                                                               │
┌──────────┐     ┌────────────┐                                │
│ Retry    │     │ Update     │◄──────────────────────────────┘
│ Request  │◄────│ localStorage│
└──────────┘     └────────────┘
```

## 9. Component Test Coverage

```
TEST_COVERAGE_CHART
┌───────────────────────────┐
│ Dashboard                 │████████████████████████████████ 80%
├───────────────────────────┤
│ CloudAccountForm          │██████████████████████████████ 75%
├───────────────────────────┤
│ InfrastructureAuditView   │████████████████████████████ 70%
├───────────────────────────┤
│ InsightsView              │██████████████████████████ 65%
├───────────────────────────┤
│ ComputeResourcesView      │█████████████████ 45%
├───────────────────────────┤
│ StorageBucketOptimizerView│████████████████ 40%
├───────────────────────────┤
│ LambdaOptimizerView       │████████████ 30%
├───────────────────────────┤
│ MonitoringDashboard       │█████ 15%
└───────────────────────────┘
```

## 10. Dependency Graph

```
CORE DEPENDENCIES:
- React 18.2.0
- TypeScript 4.9.5
- Axios 1.3.4
- Tailwind CSS 3.3.1
- React Router 6.10.0
- NestJS 9.4.0
- Jest 29.5.0
``` 