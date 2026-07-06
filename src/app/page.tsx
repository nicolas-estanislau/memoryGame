import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4 text-center">
        <div className="space-y-4 max-w-lg">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Memory Game
          </h1>
          <p className="text-lg text-muted-foreground">
            A real-time multiplayer memory card game. Flip cards, match pairs,
            and beat your opponent in this classic brain teaser.
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/create"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Create Room
          </Link>
          <Link
            href="/join"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
          >
            Join Room
          </Link>
        </div>
      </main>
    </div>
  );
}
