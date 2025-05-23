# Election Event Registration System

Create a mobile-friendly registration system for election-related events in our community quickly for an upcoming event. This system will replace traditional paper sign-ups at events with a digital QR code-based registration process.

## Core Requirements

### Registration Features
- As an event host, I want attendees to register with their:
    - **Required Fields:**
        - Full name (validated, min 2 characters)
        - Email (validated format)
        - Mobile Number (US format validation)
    - **Optional Fields:**
        - Select Searchable Single Select List of GA Counties (List of FIPS) 
        - Indicate if they are registered to vote: Yes, No, Uncertain

### User Experience
- As a registrant, I want to scan a QR Code that takes me to a mobile-friendly page to capture my information as seamlessly as possible
- The registration shall provide a register button that's disabled until all required fields are captured and validated
- The registration form shall contain a valid phone number field with necessary US phone number validation (format: (xxx) xxx-xxxx)
- The registration form shall provide a valid email capture field with necessary email format validation
- The registration form shall provide a friendly thank you message for registering to the event with the event name
- The registration form should contain a title that is generated from the database
- **The registration form should display the event description to provide context and details about the event**
- The registration form should be tied to an event ID
- The system must capture the registration timestamp and IP address for security
- The system must display a preview of registrations when the event is inactive
- Prevent duplicate registrations by the same email for the same event
- Support both light and dark themes with proper contrast
- **Event description should be prominently displayed below the title to help users understand what they're registering for**

### QR Code Functionality
- Generate unique QR codes for each event that link to the registration form
- Store QR code data (base64 or URL) in the database for each event
- QR codes should be downloadable/printable for physical event signage
- QR code should encode the full registration URL: `/ga/election-events/[eventId]/[seo-friendly-name]`
- Admin interface to regenerate QR codes if needed

### Admin Features
- As an admin user, I should be presented with a form to select an event
- As an admin user, I should be allowed to select an event to view its registrations
- The Admin Registration Report should allow sorting by full name, email, phone number, and registration date
- The Admin Registration Report will paginate 12, 24, 36, 48, 60 at a time with responsive controls
- The Admin Registration Report will allow downloading registrants in a CSV file with proper formatting
- The Admin for Events shall provide a form to capture event date, event title, **event description**, location, and status (active, inactive) *(Not MVP - we can insert events directly in the database initially)*
- Admin dashboard should show registration statistics and real-time counts
- Admin should be able to toggle event status (active/inactive) quickly
- Admin should be able to view and download QR codes for events

### Security & Validation
- Rate limiting on registration endpoint (max 5 registrations per IP per hour)
- CSRF protection on all forms
- Input sanitization to prevent XSS attacks
- Email validation with domain verification
- Phone number normalization and validation

## Event Details
**First Event:** Georgia PSC Primary Forum Registration
- Title: "Georgia PSC Primary Forum Registration"
- **Description**: "Join us for an important forum discussing the Georgia Public Service Commission Primary. This event will cover key issues affecting Georgia's energy future, utility regulations, and consumer protection. Come prepared to learn about the candidates and their positions on critical energy policy matters."
- Location: TBD (to be provided)
- Event Date: TBD (to be provided)
- Status: Active (for immediate use)

## Technical Requirements

### Data Definition
```sql
-- Election Events Table
CREATE TABLE election_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(2048),
    event_date TIMESTAMP NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'cancelled')) DEFAULT 'inactive',
    max_capacity INTEGER DEFAULT NULL, -- NULL = unlimited
    qr_code_data TEXT, -- Base64 encoded QR code or URL
    qr_code_url TEXT, -- Direct URL to QR code image
    seo_slug VARCHAR(255), -- SEO-friendly URL slug
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Event Registrations Table
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES election_events(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(512) NOT NULL,
    phone_number VARCHAR(25) NOT NULL, -- stored as formatted string (xxx) xxx-xxxx
    county_code VARCHAR(10), -- GA FIPS code
    county_name VARCHAR(100),
    is_voter_registered CHAR(1) CHECK (is_voter_registered IN ('Y', 'N', 'U')),
    registration_ip INET,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(event_id, email) -- Prevent duplicate registrations
);

-- Indexes for performance
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_email ON event_registrations(email);
CREATE INDEX idx_event_registrations_created_at ON event_registrations(created_at);
CREATE INDEX idx_election_events_status ON election_events(status);
CREATE INDEX idx_election_events_event_date ON election_events(event_date);

-- Insert first event
INSERT INTO election_events (title, description, location, event_date, status, seo_slug) 
VALUES (
    'Georgia PSC Primary Forum Registration',
    'Join us for an important forum discussing the Georgia Public Service Commission Primary. This event will cover key issues affecting Georgia''s energy future, utility regulations, and consumer protection. Come prepared to learn about the candidates and their positions on critical energy policy matters.',
    'TBD - Location to be determined',
    '2024-03-15 18:00:00'::timestamp, -- Update with actual date
    'active',
    'georgia-psc-primary-forum'
);
```

### API Endpoints

#### Public APIs
- `GET /api/ga/election-events/[eventId]` - Get event details for registration form (includes title, description, location, date, status)
- `POST /api/ga/election-events/[eventId]/register` - Submit registration (rate limited)
- `GET /api/ga/counties` - Get list of GA counties (use existing COUNTY_OPTIONS from constants)
- `GET /api/ga/election-events/[eventId]/qr` - Get QR code image for event

#### API Response Example:
```typescript
// GET /api/ga/election-events/[eventId] response
{
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  status: 'active' | 'inactive' | 'cancelled';
  seo_slug: string;
  max_capacity: number | null;
  qr_code_url: string | null;
  registration_count?: number; // For admin views
}
```

#### Admin APIs (Protected - Future)
- `GET /api/ga/admin/election-events` - List all events with stats
- `POST /api/ga/admin/election-events` - Create new event
- `PUT /api/ga/admin/election-events/[eventId]` - Update event
- `GET /api/ga/admin/election-events/[eventId]/registrations` - Get registrations with pagination/sorting
- `GET /api/ga/admin/election-events/[eventId]/export` - Export registrations as CSV
- `PATCH /api/ga/admin/election-events/[eventId]/status` - Toggle event status
- `POST /api/ga/admin/election-events/[eventId]/generate-qr` - Generate/regenerate QR code

### Pages & Routes

#### Public Pages
- `/ga/election-events/[eventId]/[seo-friendly-name]` - Registration form (mobile-optimized)
- `/ga/election-events/[eventId]/success` - Registration success page
- `/ga/election-events/[eventId]/preview` - Registration preview (when event inactive)

#### Admin Pages (Future - Follow existing voter-management pattern)
- `/(voter-management)/election-events` - Events dashboard with statistics
- `/(voter-management)/election-events/[eventId]` - Registration report with advanced filtering
- `/(voter-management)/election-events/create` - Create new event form
- `/(voter-management)/election-events/[eventId]/edit` - Edit event details
- `/(voter-management)/election-events/[eventId]/qr` - View and download QR code

### Security & Protection
- **Admin routes will be protected in future phases** - For MVP, events will be inserted directly into database
- Use the existing NextAuth architecture when admin features are implemented
- Follow the existing authentication middleware pattern
- CSRF tokens on all forms
- Rate limiting using IP-based throttling

### Frontend Requirements
- Continue to use the site's styling via Tailwind CSS and ShadCN components
- Must support both dark and light themes with proper contrast ratios
- Mobile-first responsive design (280px minimum width)
- Progressive enhancement for JavaScript-disabled browsers
- Accessibility compliance (WCAG 2.1 AA)
- Loading states and error handling for all interactions
- Form validation with real-time feedback
- QR code display and download functionality
- **Use existing COUNTY_OPTIONS from `app/ga/voter/list/constants.ts`** for GA counties dropdown
- **Google Analytics tracking using existing `useGoogleAnalytics` hook**

### Google Analytics Tracking (MVP)
- **Use existing `useGoogleAnalytics` hook** from `hooks/useGoogleAnalytics.ts`
- Track key user interactions for MVP analytics and optimization

#### Events to Track:
```typescript
// Registration Form Events
trackEvent('Election Event Registration', 'Form Viewed', eventTitle, eventId);
trackEvent('Election Event Registration', 'Form Started', eventTitle, eventId); // On first field interaction
trackEvent('Election Event Registration', 'Form Completed', eventTitle, eventId); // On successful submission
trackEvent('Election Event Registration', 'Form Abandoned', eventTitle, eventId); // On page leave without submission

// Field-level Tracking
trackEvent('Election Event Registration', 'County Selected', countyName, eventId);
trackEvent('Election Event Registration', 'Voter Status Selected', voterStatus, eventId); // Y, N, U

// QR Code Tracking
trackEvent('Election Event Registration', 'QR Code Scanned', eventTitle, eventId); // Based on referrer or utm params

// Error Tracking
trackEvent('Election Event Registration', 'Validation Error', fieldName, eventId);
trackEvent('Election Event Registration', 'Submission Error', errorType, eventId);

// Success Tracking
trackEvent('Election Event Registration', 'Registration Success', eventTitle, eventId);
trackEvent('Election Event Registration', 'Thank You Viewed', eventTitle, eventId);
```

#### Implementation Pattern:
```typescript
// In registration form component
import useGoogleAnalytics from '@/hooks/useGoogleAnalytics';

const { trackEvent } = useGoogleAnalytics();

// Track form view
useEffect(() => {
  trackEvent('Election Event Registration', 'Form Viewed', event.title, event.id);
}, [event]);

// Track form interactions
const handleFieldInteraction = (fieldName: string) => {
  if (!hasStartedForm) {
    trackEvent('Election Event Registration', 'Form Started', event.title, event.id);
    setHasStartedForm(true);
  }
};

// Track successful submission
const handleSubmissionSuccess = () => {
  trackEvent('Election Event Registration', 'Form Completed', event.title, event.id);
  trackEvent('Election Event Registration', 'Registration Success', event.title, event.id);
};
```

#### Custom Dimensions (Future Enhancement):
- Event Type
- Registration Source (QR Code, Direct Link, Social Media)
- County Selection Rate
- Voter Registration Status Distribution
- Form Completion Time
- Mobile vs Desktop Usage

### Backend Requirements
- Use the existing `PG_VOTERDATA_URL` database connection string
- **Use `postgres` client library** (same as existing voter data queries) - NOT pg library
- Follow the existing pattern: `import postgres from "postgres"` and `sql = postgres(connectionString)`
- Create a shared database connection in `lib/voter/db/index.ts` (already exists)
- Implement proper connection pooling and error handling using the existing `postgres` client
- Provide migration scripts in the `lib/voter/election-events/migrations` folder
- Implement database transactions for data consistency
- Add proper indexes for performance (email, event_id, created_at)
- Use parameterized queries with the `postgres` client for security

### QR Code Generation
- Use a QR code generation library (e.g., `qrcode` npm package)
- Generate QR codes that encode the full registration URL
- Store both the QR code data and generated image URL in the database
- Provide downloadable QR code images in multiple formats (PNG, SVG)
- QR codes should be regenerable if URLs change

### Database Connection Pattern
```typescript
// Use existing connection from lib/voter/db/index.ts
import { sql } from '@/lib/voter/db';

// Parameterized queries with postgres client
const result = await sql`
  SELECT * FROM election_events WHERE id = ${eventId}
`;

// For inserts with returning
const newRegistration = await sql`
  INSERT INTO event_registrations (
    event_id, full_name, email, phone_number, county_code, county_name, 
    is_voter_registered, registration_ip
  ) VALUES (
    ${eventId}, ${fullName}, ${email}, ${phoneNumber}, ${countyCode}, 
    ${countyName}, ${isVoterRegistered}, ${registrationIp}
  ) RETURNING id, created_at
`;

// Get event with registration count
const eventWithStats = await sql`
  SELECT e.*, COUNT(r.id) as registration_count 
  FROM election_events e 
  LEFT JOIN event_registrations r ON e.id = r.event_id 
  WHERE e.id = ${eventId}
  GROUP BY e.id
`;
```

### Performance Requirements
- Registration form should load in < 2 seconds on 3G
- Admin dashboard should handle 10,000+ registrations efficiently
- CSV export should work for up to 50,000 registrations
- Database queries should be optimized with proper indexes
- QR code generation should complete in < 1 second

### Error Handling
- Graceful degradation for network failures
- User-friendly error messages for all failure scenarios
- Admin notification system for critical errors
- Automatic retry logic for transient failures
- Comprehensive logging for debugging

### Testing Requirements
- Unit tests for all utility functions
- Integration tests for API endpoints
- End-to-end tests for registration flow
- Load testing for expected traffic volumes
- Accessibility testing with screen readers

### Deployment & Monitoring
- Health check endpoints for load balancers
- Metrics collection for registration patterns
- Error tracking and alerting
- Database backup strategy for event data
- CDN optimization for static assets

### Privacy & Compliance
- GDPR compliance for data collection and storage
- Clear privacy policy integration
- Data retention policy (default: 7 years for events)
- Secure data deletion capabilities
- Audit trail for admin actions

### Future Enhancements (Post-MVP)
- Event capacity management with waitlists
- Email confirmation and reminders
- Calendar integration (Google Calendar, Outlook)
- Multiple event types and categories
- Event analytics and reporting dashboard
- Bulk registration import capabilities
- Integration with voter registration verification
- QR code analytics (scan tracking) 