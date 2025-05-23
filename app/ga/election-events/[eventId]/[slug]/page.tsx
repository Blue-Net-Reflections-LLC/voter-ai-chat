import { notFound } from 'next/navigation';
import EventDetailsCard from '@/components/ga/election-events/EventDetailsCard';
import RegistrationForm from '@/components/ga/election-events/RegistrationForm';

interface ElectionEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  status: string;
  seo_slug: string;
  max_capacity: number | null;
  qr_code_url: string | null;
  registration_count: number;
  created_at: string;
  updated_at: string;
}

interface PageProps {
  params: Promise<{
    eventId: string;
    slug: string;
  }>;
}

async function getEventDetails(eventId: string): Promise<ElectionEvent | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/ga/election-events/${eventId}`, {
      cache: 'no-store' // Always fetch fresh data for registration counts
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch event details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching event details:', error);
    return null;
  }
}

export default async function EventRegistrationPage({ params }: PageProps) {
  const { eventId, slug } = await params;
  
  // Fetch event details
  const event = await getEventDetails(eventId);
  
  if (!event) {
    notFound();
  }

  // Verify slug matches (optional: redirect if slug is wrong)
  if (event.seo_slug !== slug) {
    notFound();
  }

  // Check if event is active
  const isEventActive = event.status === 'active';
  const isCapacityReached = event.max_capacity && event.registration_count >= event.max_capacity;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Registration Form */}
          {isEventActive && !isCapacityReached ? (
            <div className="bg-card shadow-sm p-6 border border-border">
              <RegistrationForm eventId={event.id} eventTitle={event.title} />
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-6 border border-yellow-200 dark:border-yellow-800">
              <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Check-in Not Available
              </h2>
              <p className="text-yellow-700 dark:text-yellow-300">
                {!isEventActive 
                  ? 'This event is not currently accepting check-ins.'
                  : 'This event has reached its maximum capacity.'
                }
              </p>
            </div>
          )}

          {/* Event Details Card */}
          <EventDetailsCard event={event} />
        </div>
      </div>
    </div>
  );
} 