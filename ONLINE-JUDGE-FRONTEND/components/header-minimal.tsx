'use client';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Online Judge</h1>
        </div>
        <nav className="flex items-center space-x-4">
          <a href="/" className="text-sm font-medium hover:text-primary">Home</a>
          <a href="/problems" className="text-sm font-medium hover:text-primary">Problems</a>
          <a href="/contests" className="text-sm font-medium hover:text-primary">Contests</a>
        </nav>
      </div>
    </header>
  );
}
