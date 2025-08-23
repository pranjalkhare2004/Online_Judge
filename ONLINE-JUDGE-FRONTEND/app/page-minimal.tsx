'use client';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Online Judge Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Practice coding problems, participate in contests, and improve your programming skills
          </p>
        </div>
      </div>
    </div>
  );
}
