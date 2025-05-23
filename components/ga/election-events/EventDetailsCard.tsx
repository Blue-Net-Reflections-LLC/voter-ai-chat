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
    <div className="bg-white shadow-sm">
      {/* Content */}
      <div className="px-6 py-6">
        {event.description && (
          <div className="prose prose-sm max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap">
              {event.description}
            </div>
          </div>
        )}

        {/* Additional Details */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-3">
            Event Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Date & Time:</span>
              <p className="text-gray-600">{formatEventDate(event.event_date)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Location:</span>
              <p className="text-gray-600">{event.location}</p>
            </div>
            {event.max_capacity && (
              <div>
                <span className="font-medium text-gray-700">Capacity:</span>
                <p className="text-gray-600">
                  {event.registration_count} / {event.max_capacity} registered
                </p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <p className={`${
                event.status === 'active' ? 'text-green-600' : 'text-gray-500'
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