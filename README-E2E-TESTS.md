# CloudAuditPro End-to-End Testing Guide

This document provides information on the end-to-end testing setup for CloudAuditPro. Our end-to-end tests ensure that the application works correctly from a user's perspective, testing complete user flows and integrations between components.

## Testing Technologies

- **Backend**: Jest + Supertest for API testing
- **Frontend**: Cypress for browser-based testing
- **Coverage**: Istanbul for code coverage reporting

## Backend E2E Tests

Backend end-to-end tests are located in the `backend/test` directory and use Jest with Supertest to test API endpoints.

### Running Backend Tests

```bash
cd CloudAuditPro/backend
npm run test:e2e
```

### Backend Test Structure

- `app.e2e-spec.ts`: Basic application tests
- `security-compliance.e2e-spec.ts`: Tests for the security compliance endpoints
- `cost-optimization.e2e-spec.ts`: Tests for the cost optimization endpoints

## Frontend E2E Tests

Frontend end-to-end tests are located in the `cypress/e2e` directory and use Cypress to test the UI in a real browser.

### Running Cypress Tests

```bash
# Open Cypress test runner
cd CloudAuditPro
npm run cypress:open

# Run Cypress tests headlessly
npm run cypress:run
```

### Cypress Test Structure

- `dashboard.cy.js`: Tests for the dashboard page
- `security-compliance.cy.js`: Tests for the security compliance features
- `auth.cy.js`: Tests for authentication flows

### Custom Cypress Commands

We've created custom Cypress commands to simplify common test operations:

- `cy.login()`: Logs in with a test user
- `cy.selectAccount(index)`: Selects an account from the dropdown
- `cy.toggleTheme()`: Toggles between dark and light mode
- `cy.checkNotification(message)`: Checks for a notification with optional message
- `cy.dismissNotification()`: Dismisses visible notifications

Example usage:

```javascript
describe('Dashboard after login', () => {
  beforeEach(() => {
    cy.login('test@cloudauditpro.com', 'password');
  });

  it('should display user data', () => {
    cy.get('[data-testid="user-name"]').should('contain', 'Test User');
  });
});
```

## Test Mocking

Both backend and frontend tests use mocking to avoid dependencies on external services:

- Backend tests mock the cloud provider services
- Cypress tests use route interception (`cy.intercept()`) to mock API responses

## Code Coverage

Code coverage is collected during test runs:

```bash
# Backend coverage
cd CloudAuditPro/backend
npm run test:cov

# Frontend coverage
cd CloudAuditPro
npm run cypress:coverage
```

## Continuous Integration

Tests are run automatically in our CI pipeline:

1. Backend unit tests and E2E tests
2. Frontend unit tests
3. Cypress E2E tests
4. Coverage report generation

Tests must pass before changes can be merged to the main branch.

## Best Practices

When writing end-to-end tests:

1. Test user flows, not implementation details
2. Use data attributes (`data-testid`) for element selection
3. Mock API responses when appropriate
4. Include both happy path and error case tests
5. Keep tests independent of each other
6. Use custom commands for repetitive operations
7. Include assertions that verify the application state
8. Organize tests by feature/page

## Adding New Tests

To add a new test:

1. Identify the feature or user flow to test
2. Create a new test file in the appropriate directory
3. Use existing tests as a template
4. Run tests locally to ensure they pass
5. Submit a PR with the new tests

## Debugging Failed Tests

When tests fail:

1. Check the test logs for error messages
2. For Cypress tests, review screenshots and videos
3. Verify that the application is running correctly
4. Check for changes to the UI or API that might have broken tests
5. Run the test in debug mode for step-by-step inspection

For assistance with end-to-end tests, contact the CloudAuditPro development team. 