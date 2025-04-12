import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UnsupportedStatePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <h1 className="text-4xl font-bold mb-4">State Not Yet Supported</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        We are working hard to bring VoterAI insights to more states soon.
        Currently, the state you requested is not available.
      </p>
      <p className="text-md text-muted-foreground mb-4">
        Interested in sponsoring your state or have questions?
      </p>
      <p className="text-lg font-medium mb-8">
        Contact us at: <a href="mailto:sales@voterai.chat" className="text-primary hover:underline">sales@voterai.chat</a>
      </p>
      <Link href="/chat"> 
        {/* 
          Redirecting to /chat which will trigger the state selection overlay again, 
          allowing the user to select a supported state (like GA) or see the overlay.
          Alternatively, could link to a specific supported state like /ga/chat if desired.
        */}
        <Button>Return to State Selection</Button>
      </Link>
    </div>
  );
} 