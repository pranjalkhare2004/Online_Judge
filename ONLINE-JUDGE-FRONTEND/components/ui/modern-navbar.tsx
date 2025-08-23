'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { 
  Code2, 
  Trophy, 
  BarChart3, 
  Search, 
  Bell, 
  Settings, 
  User, 
  Sun, 
  Moon, 
  LogOut,
  ChevronDown,
  Zap,
  Target,
  History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Navigation items configuration
const navigationItems = [
  {
    name: 'Problems',
    href: '/problems',
    icon: Code2,
    description: 'Solve coding challenges'
  },
  {
    name: 'Submissions',
    href: '/submissions',
    icon: History,
    description: 'View your submission history'
  },
  {
    name: 'Contests',
    href: '/contests',
    icon: Trophy,
    description: 'Competitive programming'
  },
  {
    name: 'Leaderboard',
    href: '/leaderboard',
    icon: BarChart3,
    description: 'Global rankings'
  }
]

interface ModernNavbarProps {
  className?: string
}

export function ModernNavbar({ className }: ModernNavbarProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/auth')
  }

  if (!mounted) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16" />
      </nav>
    )
  }

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left Section - Logo & Navigation */}
          <div className="flex items-center space-x-8">
            
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center space-x-2 font-bold text-xl hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:inline-block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CodeJudge
              </span>
            </Link>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "hover:bg-muted hover:text-foreground",
                      isActive 
                        ? "bg-primary/10 text-primary border border-primary/20" 
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="w-1 h-1 rounded-full bg-primary" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center space-x-2">
            
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="w-4 h-4" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0"
              onClick={() => {
                toggleTheme();
              }}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="w-9 h-9 p-0 relative"
              >
                <Bell className="w-4 h-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                >
                  2
                </Badge>
                <span className="sr-only">Notifications</span>
              </Button>
            )}

            {/* User Menu or Auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-3 py-2 h-9"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">
                        {user.username?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden sm:inline-block text-sm font-medium max-w-20 truncate">
                      {user.username || user.name}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {user.rating || 1200}
                      </Badge>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-xl">
                  <DropdownMenuLabel className="font-normal bg-gray-50 dark:bg-gray-900 m-1 rounded-md">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.username || user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center space-x-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center space-x-2 cursor-pointer">
                      <Target className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center space-x-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t">
          <div className="flex items-center justify-around py-2">
            {navigationItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-background border-b p-4">
          <div className="container mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search problems, contests, or users..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">Quick Actions</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  Two Sum
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  Weekly Contest
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                  Dynamic Programming
                </Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
