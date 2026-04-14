# Static Web App Constitution

## Core Principles

### I. Static-First with Server Functions
The application uses Next.js with static site generation (SSG) as the primary rendering strategy. Pages are pre-rendered at build time wherever possible. Server-side API routes are permitted solely for database operations (MongoDB) and authenticated actions. No traditional server-side rendering (SSR) on every request unless explicitly justified.

### II. Managed Dependencies
Use Next.js as the application framework with React for UI components. External libraries and dependencies must provide significant, justifiable value. Prefer well-maintained, widely-adopted packages. Avoid redundant dependencies that overlap in functionality.

### III. Responsive Design
All user interfaces must adapt naturally to various screen sizes (mobile, tablet, and desktop) using CSS media queries, flexible layouts, and mobile-first design principles. The application must be fully usable on mobile browsers.

### IV. Accessibility (a11y)
The application must meet WCAG 2.1 Level AA compliance. Use appropriate semantic HTML tags, ARIA labels where needed, descriptive `alt` text for images, and full keyboard navigation for all interactive elements.

### V. Core Performance
Pages should leverage Next.js static generation and image optimization to ensure fast load times. Target < 2s initial page load. JavaScript bundles should be code-split per route.

## Technical Constraints

- **Framework**: Next.js with static export configuration where applicable; API routes for server-side database operations.
- **Database**: MongoDB (via MongoDB Atlas or self-hosted).
- **Hosting Requirements**: The application must be deployable to platforms supporting Next.js (Vercel, Netlify, or self-hosted Node.js).
- **Security**: No sensitive information, private API keys, or secrets may be hardcoded in client-side code. Environment variables must be used for all secrets. API routes must validate authentication and authorization.

## Quality Gates & Workflow

- Cross-browser checks must be performed on major browsers (Chrome, Firefox, Safari) and mobile browsers (iOS Safari, Chrome Android) prior to major releases.
- A quick visual validation of responsive layout behaviors across mobile, tablet, and desktop breakpoints is required before pushing changes to production.
- All API routes must validate input and handle errors gracefully.

## Governance

This Constitution sets the technical constraints for this web application. Any proposal that introduces additional server-side runtimes (beyond Next.js API routes), heavy alternative frameworks, or significant architectural complexity requires formal review and an amendment to this Constitution.

**Version**: 2.0.0 | **Ratified**: 2026-03-30 | **Last Amended**: 2026-03-30

### Amendment Log

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-03-30 | Initial static-only constitution |
| 2.0.0 | 2026-03-30 | Amended to allow Next.js framework with API routes and MongoDB. Static-first principle retained via SSG. Mobile-ready requirement added. |
