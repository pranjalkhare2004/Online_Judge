import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      /* === MODERN COLOR SYSTEM === */
      colors: {
        /* CSS Variable Integration */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        /* Primary Brand Colors */
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "rgb(var(--primary-50))",
          100: "rgb(var(--primary-100))",
          200: "rgb(var(--primary-200))",
          300: "rgb(var(--primary-300))",
          400: "rgb(var(--primary-400))",
          500: "rgb(var(--primary-500))",
          600: "rgb(var(--primary-600))",
          700: "rgb(var(--primary-700))",
          800: "rgb(var(--primary-800))",
          900: "rgb(var(--primary-900))",
          950: "rgb(var(--primary-950))",
        },
        
        /* Secondary Neutral Colors */
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: "rgb(var(--secondary-50))",
          100: "rgb(var(--secondary-100))",
          200: "rgb(var(--secondary-200))",
          300: "rgb(var(--secondary-300))",
          400: "rgb(var(--secondary-400))",
          500: "rgb(var(--secondary-500))",
          600: "rgb(var(--secondary-600))",
          700: "rgb(var(--secondary-700))",
          800: "rgb(var(--secondary-800))",
          900: "rgb(var(--secondary-900))",
          950: "rgb(var(--secondary-950))",
        },
        
        /* Accent Purple Colors */
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50: "rgb(var(--accent-50))",
          100: "rgb(var(--accent-100))",
          200: "rgb(var(--accent-200))",
          300: "rgb(var(--accent-300))",
          400: "rgb(var(--accent-400))",
          500: "rgb(var(--accent-500))",
          600: "rgb(var(--accent-600))",
          700: "rgb(var(--accent-700))",
          800: "rgb(var(--accent-800))",
          900: "rgb(var(--accent-900))",
          950: "rgb(var(--accent-950))",
        },
        
        /* Semantic Colors */
        success: {
          50: "rgb(var(--success-50))",
          500: "rgb(var(--success-500))",
          600: "rgb(var(--success-600))",
          700: "rgb(var(--success-700))",
        },
        warning: {
          50: "rgb(var(--warning-50))",
          500: "rgb(var(--warning-500))",
          600: "rgb(var(--warning-600))",
          700: "rgb(var(--warning-700))",
        },
        error: {
          50: "rgb(var(--error-50))",
          500: "rgb(var(--error-500))",
          600: "rgb(var(--error-600))",
          700: "rgb(var(--error-700))",
        },
        info: {
          50: "rgb(var(--info-50))",
          500: "rgb(var(--info-500))",
          600: "rgb(var(--info-600))",
          700: "rgb(var(--info-700))",
        },
        
        /* Admin Theme Colors */
        admin: {
          primary: "rgb(var(--admin-primary))",
          secondary: "rgb(var(--admin-secondary))",
          background: "rgb(var(--admin-background))",
          foreground: "rgb(var(--admin-foreground))",
        },
        
        /* Additional UI Colors */
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        /* Chart Colors */
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        
        /* Sidebar Colors */
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      
      /* === MODERN TYPOGRAPHY === */
      fontFamily: {
        primary: ["var(--font-family-primary)", "system-ui", "sans-serif"],
        mono: ["var(--font-family-mono)", "Consolas", "Monaco", "monospace"],
        sans: ["var(--font-family-primary)", "system-ui", "sans-serif"],
      },
      
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      
      /* === MODERN SPACING === */
      spacing: {
        "container": "var(--container-padding)",
        "section": "var(--section-spacing)",
        "component": "var(--component-spacing)",
      },
      
      /* === BORDER RADIUS === */
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      
      /* === MODERN SHADOWS === */
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        modern: "var(--shadow-lg)",
        glow: "0 0 20px rgb(59 130 246 / 0.3)",
        "glow-accent": "0 0 20px rgb(168 85 247 / 0.3)",
        "glow-admin": "0 0 20px rgb(249 115 22 / 0.3)",
      },
      
      /* === ANIMATIONS === */
      animation: {
        "fade-in": "fadeIn var(--duration-normal) var(--easing-ease-out)",
        "slide-up": "slideUp var(--duration-normal) var(--easing-ease-out)",
        "scale-in": "scaleIn var(--duration-fast) var(--easing-ease-out)",
        "gradient-xy": "gradient-xy 3s ease infinite",
        "bounce-soft": "bounce 2s infinite",
        "pulse-soft": "pulse 3s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      
      /* === TRANSITION DURATIONS === */
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
      
      /* === TRANSITION TIMING === */
      transitionTimingFunction: {
        default: "var(--easing-default)",
        "ease-in": "var(--easing-ease-in)",
        "ease-out": "var(--easing-ease-out)",
      },
      
      /* === BACKDROP BLUR === */
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        "3xl": "40px",
      },
      
      /* === GRADIENT STOPS === */
      gradientColorStops: {
        "primary-gradient": "var(--primary-600), var(--primary-500), var(--accent-500)",
        "admin-gradient": "var(--admin-primary), var(--admin-secondary)",
      },
      
      /* === KEYFRAMES === */
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "gradient-xy": {
          "0%, 100%": {
            "background-size": "400% 400%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
      },
      
      /* === SCREENS (Responsive Breakpoints) === */
      screens: {
        xs: "475px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
        "3xl": "1600px",
      },
      
      /* === Z-INDEX === */
      zIndex: {
        dropdown: "1000",
        sticky: "1020",
        fixed: "1030",
        modal: "1040",
        popover: "1050",
        tooltip: "1060",
        toast: "1070",
      },
      
      /* === GRID === */
      gridTemplateColumns: {
        "auto-fit": "repeat(auto-fit, minmax(0, 1fr))",
        "auto-fill": "repeat(auto-fill, minmax(0, 1fr))",
      },
    },
  },
  plugins: [
    // Add custom plugin for utilities
    function({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      const newUtilities = {
        ".text-gradient": {
          background: "linear-gradient(to right, #2563eb, #a855f7)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".text-gradient-admin": {
          background: "linear-gradient(to right, #f97316, #ea580c)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".bg-glass": {
          "background-color": "rgba(255, 255, 255, 0.1)",
          "backdrop-filter": "blur(12px)",
          "border": "1px solid rgba(255, 255, 255, 0.2)",
        },
        ".bg-grid-pattern": {
          "background-image": "radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.15) 1px, transparent 0)",
          "background-size": "20px 20px",
        },
      }
      addUtilities(newUtilities)
    }
  ],
}

export default config
