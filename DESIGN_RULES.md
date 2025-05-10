# CloudAuditPro Design System Rules

## Overview

This document outlines the design rules and patterns for CloudAuditPro's UI components, helping maintain visual consistency and accessibility across the platform.

## Color System

### Current Color Palette

```css
/* Primary palette */
primary-50: #f0f9ff;
primary-100: #e0f2fe;
primary-200: #bae6fd;
primary-300: #7dd3fc;
primary-400: #38bdf8;
primary-500: #0ea5e9;
primary-600: #0284c7;
primary-700: #0369a1;
primary-800: #075985;
primary-900: #0c4a6e;
primary-950: #082f49;

/* Secondary palette */
secondary-50: #ecfdf5;
secondary-100: #d1fae5;
secondary-200: #a7f3d0;
secondary-300: #6ee7b7;
secondary-400: #34d399;
secondary-500: #10b981;
secondary-600: #059669;
secondary-700: #047857;
secondary-800: #065f46;
secondary-900: #064e3b;
secondary-950: #022c22;

/* Accent palette */
accent-50: #fefce8;
accent-100: #fef9c3;
accent-200: #fef08a;
accent-300: #fde047;
accent-400: #facc15;
accent-500: #eab308;
accent-600: #ca8a04;
accent-700: #a16207;
accent-800: #854d0e;
accent-900: #713f12;
accent-950: #422006;
```

### Dark Mode Variables

```css
/* Light mode */
:root {
  --color-bg-primary: 255, 255, 255;
  --color-bg-secondary: 249, 250, 251;
  --color-text-primary: 17, 24, 39;
  --color-text-secondary: 107, 114, 128;
  --color-border: 229, 231, 235;
  --color-card-bg: 255, 255, 255;
}

/* Dark mode */
.dark {
  --color-bg-primary: 17, 24, 39;
  --color-bg-secondary: 31, 41, 55;
  --color-text-primary: 249, 250, 251;
  --color-text-secondary: 156, 163, 175;
  --color-border: 55, 65, 81;
  --color-card-bg: 31, 41, 55;
}
```

### Issues Identified

- ⚠️ Dark mode implementation is inconsistent across components
- ⚠️ No semantic color tokens for success, warning, error, and info states
- ⚠️ Color contrast issues in some interactive elements (buttons in dark mode)

### Recommended Color System

```css
/* Design Token Example */
:root {
  /* Semantic colors */
  --color-success-50: #ecfdf5;
  --color-success-100: #d1fae5;
  --color-success-500: #10b981;
  --color-success-700: #047857;
  
  --color-warning-50: #fffbeb;
  --color-warning-100: #fef3c7;
  --color-warning-500: #f59e0b;
  --color-warning-700: #b45309;
  
  --color-error-50: #fef2f2;
  --color-error-100: #fee2e2;
  --color-error-500: #ef4444;
  --color-error-700: #b91c1c;
  
  --color-info-50: #eff6ff;
  --color-info-100: #dbeafe;
  --color-info-500: #3b82f6;
  --color-info-700: #1d4ed8;
  
  /* Interactive states */
  --color-focus-ring: rgba(59, 130, 246, 0.5);
  --color-overlay: rgba(0, 0, 0, 0.4);
}
```

## Typography

### Current Typography

```css
/* Base font */
fontFamily: {
  sans: ['Inter', 'sans-serif'],
}
```

### Type Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| h1      | 2rem | 800    | 1.2         |
| h2      | 1.5rem | 700  | 1.25        |
| h3      | 1.25rem | 600 | 1.3         |
| h4      | 1.125rem | 600 | 1.35       |
| Body    | 1rem | 400    | 1.5         |
| Small   | 0.875rem | 400 | 1.5        |

### Issues Identified

- ⚠️ Inconsistent type scale implementation across components
- ⚠️ No defined type styles for various UI states (disabled, error, etc.)
- ⚠️ Missing responsive typography adjustments

### Recommended Typography System

```css
:root {
  /* Font sizes */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  /* Line heights */
  --line-height-tight: 1.2;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  
  /* Font weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
}
```

## Spacing

### Current Spacing

Based on Tailwind's default spacing scale (4px increments).

### Issues Identified

- ⚠️ Inconsistent spacing in form elements
- ⚠️ Padding/margin application varies between similar components
- ⚠️ Lack of consistent vertical rhythm

### Recommended Spacing System

```css
:root {
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem;  /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem;    /* 16px */
  --space-6: 1.5rem;  /* 24px */
  --space-8: 2rem;    /* 32px */
  --space-12: 3rem;   /* 48px */
  --space-16: 4rem;   /* 64px */
}
```

## Component Patterns

### Buttons

```jsx
// Primary Button
<button
  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
>
  {children}
</button>

// Secondary Button
<button
  className="px-4 py-2 bg-secondary-600 text-white rounded hover:bg-secondary-700 dark:bg-secondary-500 dark:hover:bg-secondary-600"
>
  {children}
</button>
```

#### Recommended Button Pattern

```jsx
// Recommended Pattern
<Button 
  variant="primary" // or "secondary", "outline", "ghost"
  size="md" // or "sm", "lg"
  loading={isSubmitting}
  disabled={!isValid}
  aria-live="polite"
>
  {actionText}
</Button>
```

### Cards

```jsx
// Current Card
<div className="bg-white rounded-lg shadow-card p-4 transition-shadow hover:shadow-card-hover dark:bg-gray-800 dark:border dark:border-gray-700">
  {children}
</div>
```

#### Recommended Card Pattern

```jsx
// Recommended Pattern
<Card 
  variant="default" // or "interactive", "compact", "bordered"
  padding="medium" // or "small", "large", "none"
>
  <Card.Header>
    <Card.Title>{title}</Card.Title>
    <Card.Subtitle>{subtitle}</Card.Subtitle>
  </Card.Header>
  <Card.Body>
    {children}
  </Card.Body>
  <Card.Footer>
    {footerContent}
  </Card.Footer>
</Card>
```

### Forms

```jsx
// Current Input
<input
  id="email-address"
  name="email"
  type="email"
  autoComplete="email"
  required
  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
  placeholder="Email address"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Recommended Form Patterns

```jsx
// Recommended Pattern
<FormGroup>
  <FormLabel htmlFor="email">Email Address</FormLabel>
  <Input
    id="email"
    name="email"
    type="email"
    autoComplete="email"
    required
    placeholder="you@example.com"
    value={email}
    onChange={handleChange}
    error={errors.email}
  />
  {errors.email && <FormError>{errors.email}</FormError>}
  <FormHelperText>We'll never share your email with anyone else.</FormHelperText>
</FormGroup>
```

## Interaction Patterns

### Motion Guidelines

```js
const transitions = {
  default: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  fast: {
    duration: '150ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  slow: {
    duration: '500ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};
```

### Focus Management

```css
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

## Responsive Design

### Breakpoints

```js
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};
```

### Container Sizes

```jsx
// Recommended container pattern
<Container size="md" className="py-8">
  {children}
</Container>
```

## Accessibility Guidelines

### Minimum Requirements

- All interactive elements must be accessible via keyboard
- Text color must have a minimum contrast ratio of 4.5:1 (WCAG AA)
- Focus states must be visible for all interactive elements
- All form inputs must have associated labels
- Images must have appropriate alt text
- ARIA attributes must be used appropriately

### Touch Targets

- Minimum size: 44x44px for all touch targets
- Spacing between targets: 8px minimum 