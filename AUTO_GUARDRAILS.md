# CloudAuditPro Self-Healing Rules

This document outlines automated guardrails and enforcement rules to prevent quality issues and maintain codebase health.

## 1. API Version Enforcement

```typescript
// frontend/src/services/api/index.ts
// Enforce API version standardization
const API_VERSION = 'v1';
const API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-Version': '2023-10',
  'X-API-Key': process.env.REACT_APP_API_KEY,
};

// Add path normalization to ensure API version consistency
const normalizePath = (path: string): string => {
  // Already contains version
  if (path.includes('/api/v')) return path;
  
  // Add version to path
  return path.startsWith('/api/') 
    ? path.replace('/api/', `/api/${API_VERSION}/`) 
    : `/api/${API_VERSION}${path.startsWith('/') ? path : `/${path}`}`;
};
```

## 2. Security Enforcement Rules

```jsonc
// .eslintrc.json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.object.name='localStorage'][callee.property.name=/setItem|getItem/] > .arguments:first-child[value=/token|auth|password|key/]",
        "message": "Use secure storage for auth tokens. localStorage is vulnerable to XSS."
      }
    ],
    "no-restricted-globals": [
      "error", 
      {
        "name": "localStorage",
        "message": "Use the secure storage service instead of localStorage directly."
      }
    ]
  }
}
```

## 3. Component Design System Enforcement

```typescript
// frontend/.prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}

// frontend/.cursorrules
{
  "component_naming": {
    "pattern": "^[A-Z][a-zA-Z]+(?:View|Form|Modal|Page|Card|List|Item)$",
    "errorMessage": "Component names must start with uppercase and use appropriate suffixes"
  },
  "color_palette": {
    "allowed": [
      "text-primary-600",
      "bg-primary-100",
      "text-red-600",
      "bg-red-100",
      "text-gray-700",
      "bg-gray-100"
    ],
    "pattern": "\\b(text|bg|border)-(primary|red|gray|green|blue|yellow)-(\\d{2}|\\d{3})\\b"
  }
}
```

## 4. API Schema Validation

```typescript
// backend/src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Enable validation pipe globally
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  })
);

// Set up OpenAPI documentation
const config = new DocumentBuilder()
  .setTitle('CloudAuditPro API')
  .setDescription('API for CloudAuditPro platform')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

## 5. Component Test Coverage Rules

```yaml
# .github/workflows/test-coverage.yml
name: Test Coverage Check

on:
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'frontend/src/**'
      - 'backend/src/**'

jobs:
  test-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:coverage
      
      - name: Enforce coverage thresholds
        run: |
          COVERAGE=$(cat ./coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "Test coverage ($COVERAGE%) is below the required threshold (70%)"
            exit 1
          fi
```

## 6. Accessibility Enforcement

```typescript
// .cursorrules
{
  "accessibility": {
    "require_aria_labels": [
      "button",
      "a[href]",
      "input",
      "select",
      "textarea"
    ],
    "contrast_requirements": {
      "normal_text": 4.5,
      "large_text": 3
    }
  }
}
```

## 7. Bundle Size Monitoring

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'resource-summary:script:size': ['warning', { maxNumericValue: 500000 }],
        'resource-summary:document:size': ['warning', { maxNumericValue: 100000 }],
        'resource-summary:stylesheet:size': ['warning', { maxNumericValue: 100000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

## 8. Git Pre-Commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
  
  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.38.0
    hooks:
      - id: eslint
        files: \.(js|ts|tsx)$
        types: [file]
        additional_dependencies:
          - eslint@8.38.0
          - typescript@4.9.5
          - "@typescript-eslint/eslint-plugin@5.59.0"
          - "@typescript-eslint/parser@5.59.0"
  
  - repo: local
    hooks:
      - id: security-check
        name: Security Check
        entry: npx audit-ci --moderate
        language: system
        pass_filenames: false
``` 