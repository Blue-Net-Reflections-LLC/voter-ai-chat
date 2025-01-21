'use client';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { ThemeToggle } from "@/components/theme-toggle";
import Link from 'next/link';

export function ChatHeader({ selectedModelId }: { selectedModelId: string }) {
  return (
    <div className="flex items-center justify-between p-2 px-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/original-logo.svg" alt="Voter AI Logo" className="h-8" />
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
}
