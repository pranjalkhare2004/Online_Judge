"use client"

import type React from "react"

import { createContext, useContext, useEffect } from "react"

const SmoothScrollContext = createContext({})

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let lenis: any

    const initLenis = async () => {
      const Lenis = (await import("@studio-freight/lenis")).default

      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })

      function raf(time: number) {
        lenis.raf(time)
        requestAnimationFrame(raf)
      }

      requestAnimationFrame(raf)
    }

    initLenis()

    return () => {
      if (lenis) {
        lenis.destroy()
      }
    }
  }, [])

  return <SmoothScrollContext.Provider value={{}}>{children}</SmoothScrollContext.Provider>
}

export function useSmoothScroll() {
  return useContext(SmoothScrollContext)
}
