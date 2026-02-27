import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-in fade-in zoom-in duration-500">
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-6">
        Welcome to <span className="text-primary">SwiftTrack</span>
      </h1>
      <p className="max-w-[600px] text-lg text-muted-foreground mb-8">
        The lightweight, modern project tracker for hobbyists and indie hackers.
        Stay organized without the clutter in a clean, dark-mode friendly interface.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/projects">Get Started</Link>
        </Button>
        <Button variant="outline" size="lg" asChild className="rounded-full px-8">
          <Link href="/about">Learn More</Link>
        </Button>
      </div>
    </div>
  );
}
