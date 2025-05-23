# Event Registration System

Create a mobile-friendly registration system for local events in our community quickly for an upcoming event. This system will replace traditional paper sign-ups at events with a digital QR code-based registration process.

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
- The registration shall provide a friendly thank you message for registering to the event with the event name
- The registration form should contain a title that is generated from the database
- The registration form should be tied to an event ID
- The system must capture the registration timestamp and IP address for security
- The system must display a preview of registrations when the event is inactive
- Prevent duplicate registrations by the same email for the same event
- Support both light and dark themes with proper contrast

### QR Code Functionality
- Generate unique QR codes for each event that link to the registration form
- Store QR code data (base64 or URL) in the database for each event
- QR codes should be downloadable/printable for physical event signage
- QR code should encode the full registration URL: `/events/[eventId]/[seo-friendly-name]`
- Admin interface to regenerate QR codes if needed

### Admin Features
- As an admin user, I should be presented with a form to select an event
- As an admin user, I should be allowed to select an event to view its registrations
- The Admin Registration Report should allow sorting by full name, email, phone number, and registration date
- The Admin Registration Report will paginate 12, 24, 36, 48, 60 at a time with responsive controls
- The Admin Registration Report will allow downloading registrants in a CSV file with proper formatting
- The Admin for Events shall provide a form to capture event date, event title, location, and status (active, inactive) *(Not MVP - we can insert events directly in the database initially)*
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
- Location: TBD (to be provided)
- Event Date: TBD (to be provided)
- Status: Active (for immediate use)

## Technical Requirements

### Data Definition
```sql
-- Events Table
CREATE TABLE events (
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
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
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
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_date ON events(event_date);

-- Insert first event
INSERT INTO events (title, description, location, event_date, status, seo_slug) 
VALUES (
    'Georgia PSC Primary Forum Registration',
    'Registration for the Georgia Public Service Commission Primary Forum',
    'TBD - Location to be determined',
    '2024-03-15 18:00:00'::timestamp, -- Update with actual date
    'active',
    'georgia-psc-primary-forum'
);
```

### API Endpoints

#### Public APIs
- `GET /api/events/[eventId]` - Get event details for registration form
- `POST /api/events/[eventId]/register` - Submit registration (rate limited)
- `GET /api/ga-counties` - Get list of GA counties for dropdown
- `GET /api/events/[eventId]/qr` - Get QR code image for event

#### Admin APIs (Protected)
- `GET /admin/api/events` - List all events with stats
- `POST /admin/api/events` - Create new event
- `PUT /admin/api/events/[eventId]` - Update event
- `GET /admin/api/events/[eventId]/registrations` - Get registrations with pagination/sorting
- `GET /admin/api/events/[eventId]/export` - Export registrations as CSV
- `PATCH /admin/api/events/[eventId]/status` - Toggle event status
- `POST /admin/api/events/[eventId]/generate-qr` - Generate/regenerate QR code

### Pages & Routes

#### Public Pages
- `/events/[eventId]/[seo-friendly-name]` - Registration form (mobile-optimized)
- `/events/[eventId]/success` - Registration success page
- `/events/[eventId]/preview` - Registration preview (when event inactive)

#### Admin Pages (Protected)
- `/admin/events` - Events dashboard with statistics
- `/admin/events/[eventId]` - Registration report with advanced filtering
- `/admin/events/create` - Create new event form *(Future)*
- `/admin/events/[eventId]/edit` - Edit event details *(Future)*
- `/admin/events/[eventId]/qr` - View and download QR code

### Security & Protection
- All `/admin` routes will be protected using the existing NextAuth architecture
- Implement role-based access control (admin role required)
- Use the existing authentication middleware
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

### Backend Requirements
- Use the existing `PG_VOTERDATA_URL` database connection string
- **NO DRIZZLE ORM** - Use raw SQL queries with proper parameterization to prevent SQL injection
- Create a new database connection pool specifically for events
- Implement proper connection pooling and error handling using `pg` library directly
- Provide migration scripts in the `lib/voter/events/migrations` folder
- Implement database transactions for data consistency
- Add proper indexes for performance (email, event_id, created_at)
- Use prepared statements for all database operations

### QR Code Generation
- Use a QR code generation library (e.g., `qrcode` npm package)
- Generate QR codes that encode the full registration URL
- Store both the QR code data and generated image URL in the database
- Provide downloadable QR code images in multiple formats (PNG, SVG)
- QR codes should be regenerable if URLs change

### Database Connection Pattern
```typescript
// Example connection pattern (no Drizzle)
import { Pool } from 'pg';

const voterPool = new Pool({
  connectionString: process.env.PG_VOTERDATA_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use parameterized queries for security
const result = await voterPool.query(
  'SELECT * FROM events WHERE id = $1',
  [eventId]
);
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



