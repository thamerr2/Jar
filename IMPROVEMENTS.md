# Jar — Frontend Improvement Prompts

This file contains structured prompts for improving the Jar property management platform frontend.
Each section is self-contained and can be pasted directly into an LLM prompt.

---

## 1. UI / Visual Design Overhaul

```
You are working on a React 18 + TypeScript + TailwindCSS + shadcn/ui frontend for "Jar",
a bilingual (Arabic RTL / English LTR) property management platform.

The current UI uses basic shadcn defaults. Improve the visual design across the entire app:

- Replace flat white cards with subtle glassmorphism cards (backdrop-blur, semi-transparent backgrounds)
- Add gradient accent colors — use a blue-to-indigo primary gradient throughout
- Add smooth page transition animations using CSS keyframes (fade-in + slide-up on route change)
- Make the sidebar collapsible on desktop with an icon-only mode (collapsed = 64px wide, expanded = 256px)
- Add a sticky top progress bar that shows during data fetching (like GitHub's loading bar)
- Improve typography: use a larger font scale for headings, tighter letter-spacing on labels
- Add hover micro-animations on all cards (translateY -2px, shadow increase)
- Use skeleton loaders that match the exact shape of the content being loaded
- Add empty state illustrations (SVG) for pages with no data instead of just text
- Make all tables have alternating row colors and a hover highlight

Tech stack: React 18, TypeScript, TailwindCSS 3, shadcn/ui (Radix UI), lucide-react icons.
Styles live in src/index.css (CSS variables) and tailwind.config.ts.
All components are in src/components/ui/.
```

---

## 2. Dashboard Redesign

```
You are improving the Dashboard page (src/pages/Dashboard.tsx) of "Jar", a property
management platform built with React 18, TypeScript, TailwindCSS, and Recharts.

The dashboard is role-based (roles: super_admin, owner, tenant, contractor, union_admin).
Data comes from GET /api/dashboard/stats and GET /api/maintenance/stats via React Query.

Redesign the dashboard with these improvements:

1. Stats Cards: Replace plain cards with animated counter cards. Numbers should count up
   from 0 to their value on first load using a useCountUp hook. Add a trend indicator
   (up/down arrow with percentage change vs last month).

2. Charts: Replace the basic LineChart with an AreaChart (filled gradient under the line).
   Add a date range picker (last 7 days / 30 days / 90 days / custom) that refetches data.
   Add a donut chart for maintenance category breakdown instead of a bar chart.

3. Recent Activity Feed: Add a real-time activity feed card on the right side showing the
   last 10 notifications/events with icons per type, timestamps formatted as "2 hours ago",
   and a pulsing green dot for events in the last hour.

4. Quick Actions: Add a floating action button (FAB) in the bottom-right corner with a "+"
   that expands into quick actions based on role:
   - Owner: Add Property, New Maintenance Request
   - Tenant: New Maintenance Request
   - Contractor: View Assigned Requests

5. Map View (optional): Add a toggle to switch the properties list to a map view using
   Leaflet.js showing property pin locations.

Keep RTL support for Arabic. All text must use the useTranslation() hook from react-i18next.
```

---

## 3. Maintenance Request Flow UX

```
You are improving the maintenance request workflow in "Jar", a React 18 + TypeScript app.

Relevant files:
- src/pages/Maintenance.tsx (list page)
- src/pages/MaintenanceDetail.tsx (detail page)
- src/components/ (shared components)

API endpoints:
- GET/POST /api/maintenance-requests
- PATCH /api/maintenance-requests/:id
- GET/POST /api/quotes
- GET/POST /api/comments/:id

Improve the UX with these changes:

1. Kanban Board View: Add a toggle between table view and a Kanban board view on
   Maintenance.tsx. The board has 5 columns (Submitted, Assigned, In Progress, Completed,
   Closed). Cards are draggable between columns using @dnd-kit/core. Dropping a card on a
   column calls PATCH /api/maintenance-requests/:id with the new status.

2. Request Timeline: In MaintenanceDetail.tsx, add a vertical timeline component showing
   all status changes with timestamps, who made the change, and an icon per status.

3. Photo Upload: Add a drag-and-drop image upload zone in the request creation dialog.
   Use POST /api/upload/multiple. Show upload progress bars per file. Display uploaded
   images as a thumbnail grid in the detail page.

4. Priority Urgency Banner: If a request has priority "urgent" and status "submitted" for
   more than 24 hours, show a red pulsing banner at the top of MaintenanceDetail.tsx.

5. Contractor Assignment UI: In MaintenanceDetail.tsx (for owner role), add a
   "Assign Contractor" button that opens a searchable dropdown of contractors from
   GET /api/contractors, showing their rating, specialties, and a "Select" button.
   On select, call PATCH /api/maintenance-requests/:id with { assignedToId: contractorId,
   status: "assigned" }.

6. Quote Comparison: When multiple quotes exist, show them side-by-side in a comparison
   table with columns: Contractor, Amount, Duration, Rating, Action.

Maintain bilingual Arabic/English support via react-i18next.
```

---

## 4. Authentication & Onboarding

```
You are improving the authentication and onboarding experience in "Jar", a React 18 +
TypeScript + TailwindCSS app.

Relevant files:
- src/pages/Login.tsx
- src/pages/Register.tsx
- src/pages/Landing.tsx
- src/contexts/AuthContext.tsx

API: POST /api/auth/login, POST /api/auth/register, GET /api/auth/me

Implement these improvements:

1. Landing Page Redesign: Replace the current simple landing page with a modern marketing
   page containing:
   - Full-screen hero with animated gradient background and floating property cards
   - Features section with scroll-triggered animations (Intersection Observer)
   - Testimonials carousel
   - Pricing/plan section (even if placeholder)
   - Arabic and English versions that switch instantly with a language toggle in the navbar

2. Multi-step Registration: Replace the single-page register form with a 3-step wizard:
   - Step 1: Account type selection (large clickable cards for Tenant, Owner, Contractor)
   - Step 2: Personal info (name, email, phone, password)
   - Step 3: Role-specific info (Owner: company name; Contractor: specialties, license;
     Tenant: nothing extra)
   Show a progress bar at the top. Validate each step before allowing "Next".

3. Remember Me: Add a "Remember me" checkbox on login. If checked, store token in
   localStorage; if unchecked, store in sessionStorage only.

4. Password Strength Meter: Below the password field in Register, add a color-coded
   strength bar (weak/fair/strong/very strong) with hints about what's missing.

5. Animated Transitions: Add a smooth crossfade + slide between login and register pages
   instead of a hard navigation.

6. Error Handling: Instead of a static error alert, show inline field errors that highlight
   the specific field that caused the server error (e.g. "Email already in use" highlights
   the email field in red).
```

---

## 5. Notifications & Real-time Updates

```
You are adding real-time notifications to "Jar", a React 18 + TypeScript property
management frontend.

Current state: Notifications are polled every 30 seconds via GET /api/notifications.
The backend runs Express on port 5001.

Upgrade the notification system:

1. WebSocket Connection: Replace polling with a WebSocket connection. On the backend
   (src/index.ts), add a ws.Server attached to the HTTP server. When the server creates
   a notification (storage.createNotification), also broadcast it to connected clients
   filtered by userId. On the frontend, create a useWebSocket hook in
   src/hooks/use-websocket.ts that:
   - Connects to ws://localhost:5001 (or wss:// in production) on mount
   - Sends { type: "auth", token } on connect
   - Listens for { type: "notification", data: Notification } messages
   - Adds received notifications to the React Query cache via queryClient.setQueryData

2. Toast Notifications: When a new notification arrives via WebSocket, automatically show
   a toast in the bottom-right corner with the notification title, message, and a link
   button if notification.link exists.

3. Notification Center: Replace the simple dropdown in Header.tsx with a proper
   notification drawer (slides in from the right) containing:
   - Tabs: All | Unread
   - Grouped by date (Today, Yesterday, Earlier)
   - Mark all as read button
   - Each notification has an icon per type, title, message, relative timestamp, and
     a clickable link that navigates and closes the drawer

4. Notification Badge: Show the unread count on the browser tab favicon using
   a canvas-drawn badge (update document.title to "（3) Jar" when there are unread items).

Tech stack: React 18, TypeScript, @tanstack/react-query, wouter, lucide-react.
Backend: Express + ws package (already installed).
```

---

## 6. Properties & Units Management

```
You are improving the property and unit management UI in "Jar", a React 18 + TypeScript
+ TailwindCSS property management app.

Relevant files:
- src/pages/Properties.tsx
- src/pages/PropertyDetails.tsx

API endpoints:
- GET/POST/PATCH/DELETE /api/properties
- GET/POST/PATCH/DELETE /api/units
- GET/POST /api/leases

Improve these pages:

1. Property Cards: Redesign property cards to include:
   - A cover image with fallback gradient (use the property's city as a seed for the color)
   - Occupancy rate pill (e.g. "8/10 occupied" with a small progress bar)
   - Monthly revenue estimate (sum of occupied units' rentAmount)
   - Quick-action buttons: Edit, Add Unit, View Maintenance

2. Property Map View: Add a "Map" tab in Properties.tsx using react-leaflet. Plot each
   property as a marker using its latitude/longitude. Clicking a marker shows a popup
   with the property name, address, and a "View Details" link.

3. Unit Management Grid: In PropertyDetails.tsx, replace the units table with a visual
   floor plan grid. Each unit is a colored square:
   - Green = vacant, Red = occupied, Yellow = maintenance in progress
   - Clicking a unit shows a side panel with unit details, current tenant, and
     maintenance history

4. Lease Timeline: Add a Gantt-style timeline view in the Leases tab showing each lease
   as a horizontal bar across months, color-coded by active/expired status.

5. Bulk Actions: Add checkboxes to the units table. When units are selected, show a bulk
   action bar with options: "Assign Tenant", "Mark for Maintenance", "Export CSV".

6. Property Analytics: Add a mini-analytics card per property showing:
   - Maintenance cost this month vs last month (sparkline chart)
   - Average response time for maintenance requests
   - Tenant satisfaction score (average quote acceptance rate)
```

---

## 7. Mobile Responsiveness & PWA

```
You are making "Jar" (a React 18 + TypeScript + TailwindCSS + Vite app) fully mobile
responsive and installable as a Progressive Web App (PWA).

Current issues on mobile:
- Sidebar overlaps content and doesn't close on navigation
- Tables overflow on small screens
- Forms have fields that are too small to tap comfortably
- Dashboard charts are not readable on mobile

Fix all mobile issues and add PWA support:

1. Mobile Navigation: Replace the sidebar on mobile (<768px) with a bottom tab bar
   showing 5 main icons (Dashboard, Properties, Maintenance, Payments, Settings).
   The sidebar remains for desktop.

2. Responsive Tables: Wrap all <Table> components in a pattern that on mobile shows
   each row as a card instead of a table row. Use a CSS @media query or a custom
   useIsMobile hook to switch between the two layouts.

3. Touch-friendly Forms: On mobile, increase all input heights to h-12, use larger
   text (text-base instead of text-sm), and add proper inputMode attributes
   (inputMode="numeric" for number fields, inputMode="email" for email fields).

4. Responsive Charts: Make all Recharts charts responsive and simplify them on mobile
   (hide axes labels, reduce tick count, use smaller fonts).

5. PWA Setup:
   - Add a manifest.json in frontend/public/ with app name "Jar", icons (192x192,
     512x512), theme_color, background_color, display: "standalone"
   - Register a service worker using vite-plugin-pwa that caches the app shell
   - Add an "Install App" prompt banner that appears after the user's second visit
   - Add offline fallback page showing "You are offline" with cached data if available

6. Pull-to-Refresh: On the Maintenance list page on mobile, implement pull-to-refresh
   that calls queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] }).
```

---

## 8. Admin Panel Enhancement

```
You are improving the Admin panel (src/pages/Admin.tsx) in "Jar", a React 18 +
TypeScript + TailwindCSS app for a super_admin role.

API endpoints available:
- GET /api/admin/users?search=&role=&active=
- PATCH /api/admin/users/:id/activate|deactivate|role
- DELETE /api/admin/users/:id
- GET /api/admin/activity-logs?limit=&userId=&action=
- GET /api/admin/failed-logins
- GET /api/admin/settings, PUT /api/admin/settings/:key
- GET /api/admin/messages, POST/PATCH/DELETE /api/admin/messages/:id
- GET /api/admin/stats

Improve the admin panel with:

1. User Management Table: Add pagination (25 per page), column sorting, and an
   expandable row that shows the user's full details, recent activity, and quick
   action buttons without navigating away.

2. Real-time Stats: Make the 4 stats cards auto-refresh every 60 seconds. Add a
   "last updated" timestamp below each card. Add sparkline mini-charts showing the
   trend of each metric over the last 7 days.

3. Activity Log Filters: Add filter dropdowns for action type and date range.
   Add an "Export CSV" button that downloads the filtered activity logs as a CSV file
   using a client-side Blob download.

4. System Health Dashboard: Add a new "System Health" tab showing:
   - API response time (fetch /api/health and display dbResponseTime)
   - Memory usage bar (from /api/health memoryUsage)
   - Failed login attempts in the last 24 hours with a mini chart
   - A "Services" status grid showing Database and Stripe as green/red indicators

5. System Messages Builder: Replace the basic message form with a rich message builder:
   - Type selector with icons (info, warning, error, success)
   - Date range picker for startsAt/endsAt
   - Live preview of how the message will appear to users
   - Priority slider (0-10) that controls display order

6. Audit Log Timeline: Replace the flat activity log table with a grouped timeline
   view (grouped by day) with icons per action type and color-coded entries
   (red for deletions, green for activations, blue for updates).
```

---

## 9. Payments & Financial Features

```
You are improving the Payments page (src/pages/Payments.tsx) and adding financial
features to "Jar", a React 18 + TypeScript property management app.

API endpoints:
- GET /api/payments
- POST /api/payments
- GET /api/stripe/status
- POST /api/stripe/create-payment-intent
- POST /api/stripe/confirm-payment

Implement these improvements:

1. Payment Dashboard: Add a financial summary header with:
   - Total revenue this month (SAR) with trend vs last month
   - Outstanding payments count and total amount
   - A mini area chart of daily revenue for the last 30 days

2. Stripe Checkout Flow: Replace the basic payment form with a proper Stripe-powered flow:
   - When user clicks "Make Payment", open a dialog with amount, description, and payee fields
   - Call POST /api/stripe/create-payment-intent to get a clientSecret
   - Embed the Stripe Elements payment form using @stripe/react-stripe-js
   - On success, call POST /api/stripe/confirm-payment to record it in the database
   - Show a success animation (confetti or checkmark animation) on completion

3. Payment Receipt: After a successful payment, generate a downloadable PDF receipt
   using the browser's print API (window.print() with a print-specific CSS that formats
   a receipt layout). Include: payment ID, amount, date, payer, payee, description.

4. Payment Filters: Add filters for date range, status, and amount range.
   Add a search box that searches by description or payment ID.

5. Refund Flow: For completed payments (owner/admin role), add a "Request Refund" button
   that opens a dialog asking for refund amount (full or partial) and reason. Call
   POST /api/stripe/refund. Show the refund status in the payment row.

6. Export: Add an "Export" dropdown with options: CSV, PDF. CSV uses client-side Blob.
   PDF uses window.print() with a formatted table layout.
```

---

## 10. Accessibility & Internationalization Polish

```
You are improving accessibility (a11y) and internationalization (i18n) in "Jar",
a React 18 + TypeScript + TailwindCSS app that supports Arabic (RTL) and English (LTR).

i18n files: src/i18n/ar.json, src/i18n/en.json, src/i18n/index.ts
Direction is set on document.documentElement.dir based on i18n.language.

Fix and improve:

1. RTL Layout: Audit every page for RTL issues:
   - All flex rows must use space-x-reverse in RTL (or use gap instead of margin)
   - Icons that imply direction (ArrowLeft, ChevronRight) must be flipped in RTL
     using className={cn("", isRTL && "scale-x-[-1]")}
   - The sidebar must appear on the RIGHT in RTL mode
   - Form labels must align right in RTL
   - Chart axes must be mirrored in RTL

2. Keyboard Navigation: Ensure all interactive elements are reachable by Tab key.
   Add visible focus rings on all buttons, inputs, and links. Add keyboard shortcuts:
   - Alt+D → navigate to Dashboard
   - Alt+M → navigate to Maintenance
   - Alt+N → open notifications drawer
   Add a keyboard shortcuts help modal accessible via "?" key.

3. ARIA Labels: Add proper aria-label attributes to all icon-only buttons.
   Add aria-live="polite" regions for dynamic content (notifications, form errors).
   Add role="status" to loading indicators.

4. Missing Translations: Audit all hardcoded English strings in all page and component
   files. Move every hardcoded string into ar.json and en.json. Add translation keys for:
   - All error messages from API responses
   - All confirmation dialogs ("Are you sure?", "This action cannot be undone")
   - All date formats (use date-fns/locale with ar-SA and en-US locales)
   - All number formats (use Intl.NumberFormat with the current locale)

5. Number & Date Formatting: Replace all raw formatDate() and formatCurrency() calls with
   locale-aware versions:
   - Dates: use format(date, 'PPP', { locale: isRTL ? arSA : enUS }) from date-fns
   - Currency: use new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR' })
   - Numbers in Arabic should display as Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩)

6. Color Contrast: Audit all text/background color combinations against WCAG AA standard
   (4.5:1 ratio for normal text, 3:1 for large text). Fix any failures in the CSS variables
   in src/index.css.
```

---

## 11. Contractor Portal Experience

```
You are improving the contractor experience in "Jar", a React 18 + TypeScript property
management app. Contractors (role: "contractor") currently see a generic maintenance list.

Relevant pages: src/pages/Maintenance.tsx, src/pages/MaintenanceDetail.tsx,
src/pages/Contractors.tsx, src/pages/Dashboard.tsx

API endpoints:
- GET /api/maintenance-requests (filtered to assigned for contractor role)
- POST /api/quotes, PATCH /api/quotes/:id
- GET /api/contractors/:id, PATCH /api/contractors/:id

Build a dedicated contractor experience:

1. Contractor Dashboard: When role === "contractor", show a specialized dashboard with:
   - Active jobs card (assigned + in_progress requests)
   - Pending quotes card (quotes with status "pending")
   - Completed jobs this month
   - Total earnings (sum of accepted quotes)
   - A work schedule calendar showing scheduledDate for each assigned request

2. Job Browser: Add a "Browse Jobs" page (route: /jobs) visible only to contractors.
   Show all submitted maintenance requests that have no contractor assigned yet.
   Each job card shows: category, priority, property location, and a "Submit Quote" button.
   Filter by category (their specialties should be pre-selected by default).

3. Contractor Profile: Add a dedicated profile page at /contractor-profile where
   contractors can edit:
   - Company name, description
   - Specialties (multi-select checkboxes with the 8 maintenance categories)
   - License number, insurance info
   Display their current rating and total reviews prominently.

4. Quote Management: Add a "My Quotes" page at /my-quotes showing all quotes the
   contractor has submitted, grouped by status (pending/accepted/rejected), with the
   ability to see the full maintenance request details.

5. Job Completion Flow: In MaintenanceDetail.tsx for contractors, when status is
   "in_progress", add a "Mark as Complete" button that opens a dialog asking for:
   - Actual cost (number input)
   - Completion notes (textarea)
   - Photo uploads (use POST /api/upload/multiple)
   On submit, call PATCH /api/maintenance-requests/:id with status: "completed",
   actualCost, and the uploaded attachment IDs.
```

---

## 12. Search & Filtering

```
You are adding global search and advanced filtering to "Jar", a React 18 + TypeScript
+ TailwindCSS property management app.

Current state: Each page has its own basic filter. There is no global search.

Implement:

1. Global Search: Add a search bar in the Header.tsx that opens a command palette
   (similar to CMD+K in Linear or Notion). Use @radix-ui/react-dialog for the modal.
   The palette should search across:
   - Properties: GET /api/properties, filter by title/address
   - Maintenance Requests: GET /api/maintenance-requests, filter by title
   - Contractors: GET /api/contractors, filter by company name
   Show results grouped by type with icons. Clicking a result navigates to the detail page.
   Trigger with Cmd+K (Mac) or Ctrl+K (Windows).

2. Advanced Maintenance Filter: Replace the single status dropdown on Maintenance.tsx
   with a filter panel (collapsible, right side) containing:
   - Status (multi-select checkboxes)
   - Category (multi-select checkboxes)
   - Priority (multi-select checkboxes)
   - Date range (created between X and Y)
   - Show active filter count as a badge on the "Filter" button
   - "Clear all" button
   Persist filter state in URL query params so filters survive page refresh.

3. Saved Filters: Allow users to save a filter combination with a name. Store saved
   filters in localStorage. Show them as quick-access chips above the filter panel.

4. Sort Controls: Add sortable column headers to all tables (click to sort asc/desc).
   Show sort direction indicator (▲▼) on the active column. Persist sort state in URL.

5. URL State: Use URL search params (via wouter) to store all filter, sort, and page
   state. This allows sharing a filtered view via URL and preserves state on back navigation.
```

