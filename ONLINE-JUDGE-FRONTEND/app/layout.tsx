/**
 * ROOT LAYOUT COMPONENT - APP WRAPPER
 * 
 * DESCRIPTION:
 * This is the main layout component for the Online Judge frontend application.
 * It wraps the entire application with necessary providers, global styles, and
 * shared components. Manages theme, authentication, smooth scrolling, and
 * provides the global navigation header and toast notifications.
 * 
 * FUNCTIONALITY:
 * - Global app wrapper with consistent layout structure
 * - Provider composition for state management
 * - SEO optimization with metadata configuration
 * - Global styling and font loading
 * - Toast notification system integration
 * - Responsive design foundation
 * 
 * COMPONENTS USED:
 * - ThemeProvider: Dark/light theme management
 * - AuthProvider: User authentication state
 * - SmoothScrollProvider: Smooth scrolling behavior
 * - Header: Global navigation component
 * - Toaster: Toast notification system
 * - Providers: Additional provider wrappers
 * 
 * UI ELEMENTS:
 * - Global navigation header
 * - Theme toggle capability
 * - User authentication status
 * - Toast notifications overlay
 * - Responsive layout container
 * 
 * API INTEGRATION:
 * - No direct API calls (managed by child components)
 * - Authentication context provides user state
 * - Theme preferences persistence
 * 
 * USED BY:
 * - Next.js App Router: Automatic layout wrapping
 * - All page components: Inherit layout structure
 * - Global state management: Provider access
 * 
 * FEATURES:
 * - SEO optimization with Open Graph and Twitter Card metadata
 * - Responsive design with Inter font
 * - Global CSS and Tailwind styling
 * - Accessibility improvements with proper HTML structure
 * - Hydration suppression for theme consistency
 */

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/contexts/auth-context"
import { SmoothScrollProvider } from "@/contexts/smooth-scroll-context"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import Providers from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    template: '%s | CodeJudge',
    default: 'CodeJudge - Online Programming Platform'
  },
  description: 'Compete. Solve. Grow.',
  keywords: ['coding', 'programming', 'algorithms', 'competitive programming', 'online judge'],
  authors: [{ name: 'CodeJudge Team' }],
  openGraph: {
    title: 'CodeJudge',
    description: 'Compete. Solve. Grow.',
    url: process.env.NEXT_PUBLIC_FRONTEND_URL,
    siteName: 'CodeJudge',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeJudge',
    description: 'Compete. Solve. Grow.',
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: 'Next.js'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider>
            <AuthProvider>
              <SmoothScrollProvider>
                <Header />
                <main className="min-h-screen">
                  {children}
                </main>
                <Toaster />
              </SmoothScrollProvider>
            </AuthProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
