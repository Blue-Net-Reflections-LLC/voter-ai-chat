import { CalendarIcon, MapPinIcon, UsersIcon } from 'lucide-react';

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

interface EventDetailsCardProps {
  event: ElectionEvent;
}

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function EventDetailsCard({ event }: EventDetailsCardProps) {
  return (
    <div className="bg-card shadow-sm border border-border">
      {/* Content */}
      <div className="px-6 py-6">
        {event.description && (
          <div className="prose prose-sm max-w-none">
            <div className="text-muted-foreground whitespace-pre-wrap">
              {event.description}
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-md font-semibold text-foreground mb-3">
            Event Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-foreground">Date & Time:</span>
              <p className="text-muted-foreground">{formatEventDate(event.event_date)}</p>
            </div>
            <div>
              <span className="font-medium text-foreground">Location:</span>
              <p className="text-muted-foreground">{event.location}</p>
            </div>
            {event.max_capacity && (
              <div>
                <span className="font-medium text-foreground">Capacity:</span>
                <p className="text-muted-foreground">
                  {event.registration_count} / {event.max_capacity} registered
                </p>
              </div>
            )}
            <div>
              <span className="font-medium text-foreground">Status:</span>
              <p className={`${
                event.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
              }`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 