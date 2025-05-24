# Election Event Registration - Implementation Tasks

## Phase 1: Foundation & Database (Priority: High)

### 1.1 Database Setup
- [x] **Create migration script** in `lib/voter/election-events/migrations/`
  - [x] Create `001_create_election_events_tables.sql`
  - [x] Include `election_events` table creation
  - [x] Include `event_registrations` table creation
  - [x] Add all necessary indexes
  - [x] Test migration against voter database

- [x] **Insert sample event** 
  - [x] Create script to insert Georgia PSC Primary Forum event
  - [x] Verify event insertion works correctly
  - [x] Test foreign key relationships

- [x] **Database utilities**
  - [x] Create types for `election_events` and `event_registrations`
  - [x] Add database helper functions in `lib/voter/election-events/db/`

### 1.2 QR Code Library Setup
- [x] **Install QR code dependencies**
  - [x] Install `qrcode` package: `pnpm add qrcode`
  - [x] Install types: `pnpm add -D @types/qrcode`
  - [x] Test QR code generation

## Phase 2: Backend API Development (Priority: High)

### 2.1 Public API Endpoints
- [x] **Event Details API**: `GET /api/ga/election-events/[eventId]`
  - [x] Create route file: `app/api/ga/election-events/[eventId]/route.ts`
  - [x] Implement event fetching with postgres client
  - [x] Add error handling and validation
  - [x] Return proper TypeScript response format
  - [x] Test with sample event

- [x] **Counties API**: `GET /api/ga/counties`
  - [x] Create route file: `app/api/ga/counties/route.ts`
  - [x] Import existing `COUNTY_OPTIONS` from constants
  - [x] Return formatted county list
  - [x] Add caching headers

- [x] **Registration API**: `POST /api/ga/election-events/[eventId]/register`
  - [x] Create route file: `app/api/ga/election-events/[eventId]/register/route.ts`
  - [x] Implement registration form validation
  - [x] Add duplicate registration check
  - [x] Add rate limiting (5 per IP per hour)
  - [x] Capture IP address and timestamp
  - [x] Return success/error responses
  - [x] Test with various scenarios

### 2.2 QR Code API
- [x] **QR Code Generation**: `GET /api/ga/election-events/[eventId]/qr`
  - [x] Create route file: `app/api/ga/election-events/[eventId]/qr/route.ts`
  - [x] Generate QR code with full registration URL
  - [x] Return PNG image with proper headers
  - [x] Add caching for generated QR codes
  - [x] Store QR code data in database

### 2.3 Rate Limiting & Security
- [x] **Implement rate limiting middleware**
  - [x] Create rate limiting utility
  - [x] Apply to registration endpoint
  - [x] Add IP-based throttling
  - [x] Test rate limiting functionality

- [x] **Admin role verification (Future)**
  - [x] Create admin role check utility in `lib/auth/admin.ts`
  - [x] Implement role-based access control middleware
  - [x] Add admin role verification to future admin APIs
  - [x] Test admin access restrictions

## Phase 3: Frontend Development (Priority: High)

### 3.1 Page Structure
- [x] **Registration Form Page**: `/ga/election-events/[eventId]/[slug]`
  - [x] Create directory: `app/ga/election-events/[eventId]/[slug]/`
  - [x] Create `page.tsx` with mobile-first design
  - [x] Implement responsive layout
  - [x] Add dark/light theme support

- [ ] **Success Page**: `/ga/election-events/[eventId]/success`
  - [ ] Create directory: `app/ga/election-events/[eventId]/success/`
  - [ ] Create `page.tsx` with thank you message
  - [ ] Display event details

- [ ] **Preview Page**: `/ga/election-events/[eventId]/preview`
  - [ ] Create directory: `app/ga/election-events/[eventId]/preview/`
  - [ ] Create `page.tsx` for inactive events
  - [ ] Show event details without registration

### 3.2 Registration Form Component
- [x] **Create RegistrationForm component**
  - [x] Create `components/election-events/RegistrationForm.tsx`
  - [x] Use ShadCN form components
  - [x] Implement required field validation
  - [x] Add real-time validation feedback
  - [x] Phone number formatting and validation
  - [x] Email validation
  - [x] County dropdown with search
  - [x] Voter registration status selection
  - [x] Submit button state management

- [x] **Form validation and submission**
  - [x] Implement Zod schema for form validation
  - [x] Add client-side validation
  - [x] Handle form submission with loading states
  - [x] Display success/error messages
  - [x] Prevent duplicate submissions

### 3.3 Event Display Components
- [x] **Event Header component**
  - [x] Display event title prominently
  - [x] Show event description
  - [x] Display location and date
  - [x] Responsive design for mobile

- [ ] **QR Code Display component**
  - [ ] Create `components/election-events/QRCodeDisplay.tsx`
  - [ ] Fetch and display QR code image
  - [ ] Add download functionality
  - [ ] Responsive sizing

## Phase 4: Admin Interface Development (Priority: High)

### 4.1 Admin API Endpoints (Protected)
- [x] **Events List API**: `GET /api/ga/admin/election-events`
  - [x] Create route file: `app/api/ga/admin/election-events/route.ts`
  - [x] List all events with registration counts and statistics
  - [x] Add admin authentication middleware
  - [x] Return paginated results with sorting
  - [x] Include event status and capacity information

- [x] **Registration Report API**: `GET /api/ga/admin/election-events/[eventId]/registrations`
  - [x] Create route file: `app/api/ga/admin/election-events/[eventId]/registrations/route.ts`
  - [x] Fetch all registrations for specific event
  - [x] Support pagination, sorting, and filtering
  - [x] Include registration statistics and analytics
  - [x] Add search functionality (name, email, phone)

- [x] **CSV Export API**: `GET /api/ga/admin/election-events/[eventId]/export`
  - [x] Create route file: `app/api/ga/admin/election-events/[eventId]/export/route.ts`
  - [x] Generate CSV with all registration data
  - [x] Include proper headers and formatting
  - [x] Add UTF-8 BOM for Excel compatibility
  - [x] Return file download response

### 4.2 Admin Frontend Interface
- [x] **Admin Events List Page**: `app/(voter-management)/admin/election-events/page.tsx`
  - [x] Create main admin dashboard page
  - [x] Implement AG-Grid for events table
  - [x] Add server-side pagination and sorting
  - [x] Include filtering by status and search
  - [x] Add action buttons (view registrations, export)
  - [x] Show registration counts and event status

- [x] **Event Registrations Detail Page**: `app/(voter-management)/admin/election-events/[eventId]/registrations/page.tsx`
  - [x] Create detailed registration view for specific event
  - [x] Implement AG-Grid with advanced filtering
  - [x] Add export functionality with download
  - [x] Include event details header
  - [x] Support search by name, email, mobile number
  - [x] Filter by county and voter registration status

- [ ] **Event Creation/Edit Pages**
  - [ ] Create event creation form page
  - [ ] Add form validation with Zod schemas  
  - [ ] Include rich text editor for descriptions
  - [ ] Add capacity management and QR code generation
  - [ ] Implement event status management (active/inactive/cancelled)

### 4.3 Admin Components
- [ ] **EventsDataTable component** (AG-Grid)
  - [ ] Create `components/admin/election-events/EventsDataTable.tsx`
  - [ ] Configure AG-Grid with event data
  - [ ] Add custom cell renderers for status, dates, actions
  - [ ] Implement sorting and filtering
  - [ ] Include pagination controls
  - [ ] Add row selection for bulk actions

- [ ] **RegistrationsDataTable component** (AG-Grid)
  - [ ] Create `components/admin/election-events/RegistrationsDataTable.tsx`
  - [ ] Configure AG-Grid with registration data
  - [ ] Add sortable columns (name, email, phone, county, date)
  - [ ] Include custom cell renderers
  - [ ] Add export functionality
  - [ ] Implement search across all fields

- [ ] **EventForm component**
  - [ ] Create `components/admin/election-events/EventForm.tsx`
  - [ ] Build reusable form for create/edit
  - [ ] Use ShadCN form components
  - [ ] Include validation with Zod
  - [ ] Add real-time slug preview
  - [ ] Include rich text editor for description

- [ ] **EventStatusBadge component**
  - [ ] Create `components/admin/election-events/EventStatusBadge.tsx`
  - [ ] Display status with appropriate colors
  - [ ] Include status toggle functionality
  - [ ] Add confirmation dialogs for changes

- [ ] **QRCodeDisplay component**
  - [ ] Create `components/admin/election-events/QRCodeDisplay.tsx`
  - [ ] Display QR code with download options
  - [ ] Include size selection for different use cases
  - [ ] Add regeneration functionality
  - [ ] Show QR code URL and metadata

### 4.4 Admin Authentication & Security
- [ ] **Admin middleware setup**
  - [ ] Use existing `lib/auth/admin.ts` utilities
  - [ ] Protect all admin routes with authentication
  - [ ] Add role-based access control
  - [ ] Include CSRF protection

- [ ] **Admin layout integration**
  - [ ] Follow existing voter-management layout pattern
  - [ ] Add election events to admin navigation
  - [ ] Include breadcrumbs for nested pages
  - [ ] Use consistent styling with existing admin pages

### 4.5 Data Export & Reporting
- [ ] **CSV Export functionality**
  - [ ] Generate properly formatted CSV files
  - [ ] Include all registration fields
  - [ ] Add timestamp and event information
  - [ ] Handle special characters and encoding
  - [ ] Optimize for large datasets

- [ ] **Registration statistics**
  - [ ] Calculate registration metrics
  - [ ] Show registration trends over time
  - [ ] Include county distribution
  - [ ] Display voter registration status breakdown
  - [ ] Add completion rate analytics

## Phase 5: Google Analytics Integration (Priority: Medium)

### 5.1 Analytics Setup
- [ ] **Implement tracking in RegistrationForm**
  - [ ] Import existing `useGoogleAnalytics` hook
  - [ ] Track form view events
  - [ ] Track form start events (first interaction)
  - [ ] Track field-level interactions
  - [ ] Track form completion
  - [ ] Track form abandonment
  - [ ] Track validation errors

- [ ] **Event-specific tracking**
  - [ ] Track county selections
  - [ ] Track voter status selections
  - [ ] Track QR code scans (via URL parameters)
  - [ ] Track success page views

### 5.2 Analytics Testing
- [ ] **Test all tracking events**
  - [ ] Verify events appear in Google Analytics
  - [ ] Test on mobile devices
  - [ ] Verify event parameters are correct

## Phase 6: Testing & Quality Assurance (Priority: Medium)

### 6.1 Unit Testing
- [ ] **API endpoint tests**
  - [ ] Test event fetching
  - [ ] Test registration submission
  - [ ] Test validation logic
  - [ ] Test rate limiting
  - [ ] Test QR code generation

- [ ] **Component tests**
  - [ ] Test RegistrationForm component
  - [ ] Test form validation
  - [ ] Test analytics tracking
  - [ ] Test responsive behavior

### 6.2 Integration Testing
- [ ] **End-to-end registration flow**
  - [ ] Test complete registration process
  - [ ] Test error scenarios
  - [ ] Test mobile experience
  - [ ] Test QR code scanning

### 6.3 Accessibility Testing
- [ ] **WCAG 2.1 AA compliance**
  - [ ] Test with screen readers
  - [ ] Verify keyboard navigation
  - [ ] Check color contrast ratios
  - [ ] Test form labels and ARIA attributes

## Phase 7: Performance & Optimization (Priority: Low)

### 7.1 Performance Optimization
- [ ] **Database optimization**
  - [ ] Verify indexes are working
  - [ ] Test query performance with large datasets
  - [ ] Optimize registration queries

- [ ] **Frontend optimization**
  - [ ] Optimize bundle size
  - [ ] Add image optimization for QR codes
  - [ ] Test loading times on 3G

### 7.2 Caching Strategy
- [ ] **Implement caching**
  - [ ] Cache QR code generation
  - [ ] Cache county data
  - [ ] Add appropriate cache headers

## Phase 8: Deployment & Monitoring (Priority: Medium)

### 8.1 Environment Setup
- [ ] **Environment variables**
  - [ ] Ensure `PG_VOTERDATA_URL` is configured
  - [ ] Verify Google Analytics tracking ID
  - [ ] Test in staging environment

### 8.2 Migration Deployment
- [ ] **Run database migrations**
  - [ ] Execute migration in staging
  - [ ] Verify tables created correctly
  - [ ] Insert sample event
  - [ ] Test full functionality in staging

### 8.3 Production Deployment
- [ ] **Deploy to production**
  - [ ] Run migrations in production
  - [ ] Verify all APIs work
  - [ ] Test registration flow
  - [ ] Monitor error logs

### 8.4 Post-Deployment Monitoring
- [ ] **Set up monitoring**
  - [ ] Monitor registration submission rates
  - [ ] Watch for errors in logs
  - [ ] Track Google Analytics events
  - [ ] Monitor database performance

## Phase 9: Documentation & Handoff (Priority: Low)

### 9.1 Documentation
- [ ] **Create user documentation**
  - [ ] Document QR code usage
  - [ ] Create admin guide for event management
  - [ ] Document analytics insights

- [ ] **Technical documentation**
  - [ ] API documentation
  - [ ] Database schema documentation
  - [ ] Deployment procedures

### 9.2 Future Enhancement Setup
- [ ] **Prepare for admin features**
  - [ ] Plan admin interface structure
  - [ ] Design event management workflows
  - [ ] Consider bulk registration features

## Dependencies & Notes

### Critical Path
1. Database setup → Backend APIs → Frontend forms → Testing → Deployment

### External Dependencies
- [ ] Confirm actual event date and location for Georgia PSC Primary Forum
- [ ] Obtain Google Analytics tracking ID if needed
- [ ] Coordinate with design team for any custom styling needs

### Risk Mitigation
- [ ] Test thoroughly with voter database connection
- [ ] Validate rate limiting works correctly
- [ ] Ensure mobile experience is optimized
- [ ] Plan for high registration volume scenarios

## Definition of Done

### MVP Requirements
- [ ] Users can scan QR code and register for events
- [ ] Registration data is stored in voter database
- [ ] Google Analytics tracks key metrics
- [ ] Mobile-friendly responsive design
- [ ] Basic error handling and validation
- [ ] Rate limiting prevents abuse

### Success Metrics
- [ ] Registration form loads in < 2 seconds on 3G
- [ ] < 5% form abandonment rate
- [ ] 0 security vulnerabilities
- [ ] 100% mobile accessibility compliance
- [ ] All Google Analytics events firing correctly

---

**Estimated Timeline: 2-3 weeks for MVP completion**
**Recommended Team Size: 1-2 developers** 