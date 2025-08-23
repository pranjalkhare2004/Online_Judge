"use client"

import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

// Simplified providers - removing NextAuth SessionProvider to avoid conflicts with custom auth
export default function Providers({ children }: ProvidersProps) {
  return (
    <>
      {children}
    </>
  )
}
