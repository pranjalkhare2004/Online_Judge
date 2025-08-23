"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { NotificationsPanel } from "@/components/notifications-panel"
import { Moon, Sun, Menu, X, Code, User, LogOut, Settings, BarChart3, Shield, Trophy, Zap, Star } from "lucide-react"
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"

// Simple inline RatingBadge component
const RatingBadge = ({ rating, size = "sm" }: { rating: number; size?: "xs" | "sm" | "md" }) => {
  const getRatingColor = (rating: number) => {
    if (rating >= 2400) return "bg-red-500 text-white" // Grandmaster
    if (rating >= 2100) return "bg-orange-500 text-white" // Master
    if (rating >= 1900) return "bg-purple-500 text-white" // Expert
    if (rating >= 1600) return "bg-blue-500 text-white" // Specialist
    if (rating >= 1400) return "bg-green-500 text-white" // Pupil
    return "bg-gray-500 text-white" // Newbie
  }

  const getRatingTitle = (rating: number) => {
    if (rating >= 2400) return "GM"
    if (rating >= 2100) return "M"
    if (rating >= 1900) return "E"
    if (rating >= 1600) return "S"
    if (rating >= 1400) return "P"
    return "N"
  }

  const sizeClasses = {
    xs: "text-xs px-1.5 py-0.5 min-w-[24px] h-5",
    sm: "text-xs px-2 py-1 min-w-[28px] h-6",
    md: "text-sm px-2.5 py-1 min-w-[32px] h-7"
  }

  return (
    <div className={cn(
      "inline-flex items-center justify-center rounded-full font-bold",
      getRatingColor(rating),
      sizeClasses[size]
    )}>
      {getRatingTitle(rating)}
    </div>
  )
}

export function Header() {
  const { user, loading, logout: authLogout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const logout = () => {
    authLogout()
    router.push('/auth')
  }

  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname.startsWith("/admin")
    }
    return pathname === path
  }

  // Enhanced admin navigation with better organization
  const adminNavigationItems = [
    { 
      href: "/admin", 
      label: "Dashboard", 
      icon: BarChart3, 
      description: "System Overview",
      shortLabel: "Dashboard"
    },
    { 
      href: "/admin?tab=problems", 
      label: "Problems", 
      icon: Code, 
      description: "Manage Problems",
      shortLabel: "Problems"
    },
    { 
      href: "/admin?tab=users", 
      label: "Users", 
      icon: User, 
      description: "User Management",
      shortLabel: "Users"
    },
    { 
      href: "/contests", 
      label: "Contests", 
      icon: Trophy, 
      description: "Contest Management",
      shortLabel: "Contests"
    },
    { 
      href: "/", 
      label: "Public Site", 
      icon: null, 
      description: "View Public Site",
      shortLabel: "Public"
    },
  ]

  // Regular user navigation
  const regularNavigationItems = [
    { href: "/", label: "Home", icon: null, shortLabel: "Home" },
    ...(user ? [{ href: "/dashboard", label: "Dashboard", icon: BarChart3, shortLabel: "Dashboard" }] : []),
    { href: "/problems", label: "Problems", icon: Code, shortLabel: "Problems" },
    { href: "/contests", label: "Contests", icon: Trophy, shortLabel: "Contests" },
  ]

  // Choose navigation based on user role
  const navigationItems = user?.role === 'admin' ? adminNavigationItems : regularNavigationItems

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 lg:px-6 xl:px-8 max-w-none">
        {/* Brand Logo - Responsive Width Management */}
        <Link 
          href={user?.role === 'admin' ? '/admin' : '/'} 
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity flex-shrink-0 min-w-0"
        >
          <div className="relative flex-shrink-0">
            <Code className="h-6 w-6 text-primary" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {user?.role === 'admin' && (
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                <Shield className="h-2 w-2 text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl truncate">
                CodeJudge
              </span>
              {user?.role === 'admin' && (
                <span className="text-xs font-normal px-2 py-0.5 bg-orange-500 text-white rounded-full whitespace-nowrap">
                  ADMIN
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground -mt-1 truncate hidden sm:block">
              {user?.role === 'admin' ? 'Administration Panel' : 'Online Judge'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation - Enhanced Admin Layout */}
        <nav className={cn(
          "hidden md:flex items-center",
          user?.role === 'admin' 
            ? "space-x-1 bg-gradient-to-r from-orange-50/80 to-red-50/80 dark:from-orange-950/30 dark:to-red-950/30 px-3 py-2 rounded-lg border border-orange-200/50 dark:border-orange-800/50 backdrop-blur-sm" 
            : "space-x-1"
        )}>
          {user?.role === 'admin' && (
            <div className="flex items-center mr-3 px-2 py-1 bg-orange-100/80 dark:bg-orange-900/50 rounded-md border border-orange-200 dark:border-orange-700">
              <Shield className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 mr-1.5" />
              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 tracking-wide">
                ADMIN
              </span>
            </div>
          )}
          
          {/* Responsive Navigation Items */}
          <div className="flex items-center space-x-1 max-w-none overflow-hidden">
            {navigationItems.map((item, index) => (
              <Link
                key={`${item.href}-${index}`}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground whitespace-nowrap",
                  "min-w-0 flex-shrink-0", // Prevent text wrap and allow shrinking
                  isActive(item.href)
                    ? user?.role === 'admin'
                      ? "bg-orange-500 text-white shadow-md ring-1 ring-orange-300"
                      : "bg-primary text-primary-foreground shadow-md"
                    : user?.role === 'admin'
                      ? "text-orange-800 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100 hover:bg-orange-100/60 dark:hover:bg-orange-900/40"
                      : "text-muted-foreground hover:text-foreground"
                )}
                title={item.description || item.label}
              >
                {item.icon && (
                  <item.icon className={cn(
                    "h-4 w-4 flex-shrink-0",
                    user?.role === 'admin' && isActive(item.href) && "text-white"
                  )} />
                )}
                {/* Use shortLabel on smaller screens, full label on larger */}
                <span className="hidden lg:inline">{item.label}</span>
                <span className="lg:hidden">{item.shortLabel || item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Desktop Actions - Enhanced Admin Panel */}
        <div className="hidden md:flex items-center space-x-2 xl:space-x-3 flex-shrink-0">
          {/* Enhanced Admin Quick Stats & Actions */}
          {user?.role === 'admin' && (
            <div className="flex items-center space-x-2">
              {/* Admin Status Indicator */}
              <div className="flex items-center space-x-2 px-2.5 py-1.5 bg-orange-50/80 dark:bg-orange-950/40 rounded-lg border border-orange-200/60 dark:border-orange-800/60">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                    System Online
                  </span>
                </div>
              </div>

              {/* Admin Quick Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-9 px-2.5 bg-orange-100/60 hover:bg-orange-200/80 dark:bg-orange-900/40 dark:hover:bg-orange-900/60 border border-orange-200/60 dark:border-orange-800/60 transition-all duration-200"
                  >
                    <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400 mr-1.5" />
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 hidden lg:inline">
                      Quick Actions
                    </span>
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 lg:hidden">
                      Actions
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="px-3 py-2 bg-orange-50/80 dark:bg-orange-950/40 border-b">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Admin Tools</span>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/admin?action=add-problem" className="flex items-center cursor-pointer">
                      <Code className="mr-3 h-4 w-4 text-green-600" />
                      <div className="flex flex-col">
                        <span className="font-medium">Add Problem</span>
                        <span className="text-xs text-muted-foreground">Create new problem</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin?action=add-contest" className="flex items-center cursor-pointer">
                      <Trophy className="mr-3 h-4 w-4 text-blue-600" />
                      <div className="flex flex-col">
                        <span className="font-medium">Create Contest</span>
                        <span className="text-xs text-muted-foreground">Setup new contest</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin?tab=users&action=bulk" className="flex items-center cursor-pointer">
                      <User className="mr-3 h-4 w-4 text-purple-600" />
                      <div className="flex flex-col">
                        <span className="font-medium">Bulk User Actions</span>
                        <span className="text-xs text-muted-foreground">Manage multiple users</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin?tab=system" className="flex items-center cursor-pointer">
                      <Settings className="mr-3 h-4 w-4 text-gray-600" />
                      <div className="flex flex-col">
                        <span className="font-medium">System Settings</span>
                        <span className="text-xs text-muted-foreground">Configure platform</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 transition-all duration-200 hover:scale-105 hover:bg-accent"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4 text-blue-500" />
            )}
          </Button>

          {/* Notifications for authenticated users */}
          {user && <NotificationsPanel />}

          {user ? (
            <div className="flex items-center space-x-3">
              {/* User Stats Display */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-accent/50">
                <RatingBadge rating={user.rating} size="sm" />
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{user.rating}</span>
                </div>
              </div>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "relative h-10 w-10 rounded-full ring-2 transition-all duration-200",
                      user.role === 'admin' 
                        ? "ring-orange-500/20 hover:ring-orange-500/40" 
                        : "ring-primary/10 hover:ring-primary/20"
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className={cn(
                        "font-semibold",
                        user.role === 'admin'
                          ? "bg-gradient-to-br from-orange-500 to-red-500 text-white"
                          : "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"
                      )}>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user.isVerified && (
                      <div className="absolute -bottom-0 -right-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                    {user.role === 'admin' && (
                      <div className="absolute -top-1 -left-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <Shield className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  {/* User Info Header */}
                  <div className={cn(
                    "flex items-center justify-start gap-3 p-3",
                    user.role === 'admin' && "bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20"
                  )}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className={cn(
                        "font-semibold text-lg",
                        user.role === 'admin'
                          ? "bg-gradient-to-br from-orange-500 to-red-500 text-white"
                          : "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"
                      )}>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-sm">{user.name}</p>
                        {user.role === 'admin' && (
                          <Badge className="text-xs px-1.5 py-0.5 bg-orange-500 text-white">
                            <Shield className="h-3 w-3 mr-1" />
                            ADMIN
                          </Badge>
                        )}
                        {user.isVerified && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            <Zap className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {user.email}
                      </p>
                      <div className="flex items-center space-x-2">
                        <RatingBadge rating={user.rating} size="xs" />
                        <span className="text-xs text-muted-foreground">Rating: {user.rating}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Menu Items - Different for Admin vs Regular Users */}
                  {user.role === 'admin' ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center cursor-pointer">
                          <Shield className="mr-3 h-4 w-4 text-orange-500" />
                          <span className="text-orange-600 font-medium">Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin?tab=users" className="flex items-center cursor-pointer">
                          <User className="mr-3 h-4 w-4" />
                          User Management
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin?tab=problems" className="flex items-center cursor-pointer">
                          <Code className="mr-3 h-4 w-4" />
                          Problem Management
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin?tab=system" className="flex items-center cursor-pointer">
                          <Settings className="mr-3 h-4 w-4" />
                          System Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center cursor-pointer">
                          <User className="mr-3 h-4 w-4" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/" className="flex items-center cursor-pointer">
                          <Code className="mr-3 h-4 w-4" />
                          Public Site
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center cursor-pointer">
                          <User className="mr-3 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center cursor-pointer">
                          <BarChart3 className="mr-3 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center cursor-pointer">
                          <Settings className="mr-3 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout} 
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild className="hover:bg-accent transition-colors">
                <Link href="/auth">Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200">
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 md:hidden">
          {/* Mobile Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="transition-all duration-200 hover:scale-105"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4 text-blue-500" />
            )}
          </Button>
          
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="transition-transform duration-200 hover:scale-105"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Enhanced Mobile Menu with Better Admin Support */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-sm">
          <div className="container px-4 py-3 space-y-3 max-h-[80vh] overflow-y-auto">
            {/* Admin Mode Indicator (Mobile) */}
            {user?.role === 'admin' && (
              <div className="flex items-center justify-center space-x-2 p-2 bg-orange-50 dark:bg-orange-950/40 rounded-lg border border-orange-200 dark:border-orange-800">
                <Shield className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                  ADMINISTRATOR MODE
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-2"></div>
              </div>
            )}

            {/* User Profile Section (Mobile) */}
            {user && (
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg",
                user.role === 'admin' 
                  ? "bg-gradient-to-r from-orange-50/80 to-red-50/80 dark:from-orange-950/30 dark:to-red-950/30 border border-orange-200/50 dark:border-orange-800/50"
                  : "bg-accent/50"
              )}>
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className={cn(
                      "font-semibold text-lg",
                      user.role === 'admin'
                        ? "bg-gradient-to-br from-orange-500 to-red-500 text-white"
                        : "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"
                    )}>
                      {user.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {user.role === 'admin' && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <Shield className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <p className="font-semibold text-base truncate">{user.name}</p>
                    {user.role === 'admin' && (
                      <Badge className="text-xs px-1.5 py-0.5 bg-orange-500 text-white">
                        <Shield className="h-2.5 w-2.5 mr-1" />
                        ADMIN
                      </Badge>
                    )}
                    {user.isVerified && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        <Zap className="h-2.5 w-2.5 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <RatingBadge rating={user.rating} size="sm" />
                    <span className="text-sm text-muted-foreground">Rating: {user.rating}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links with Enhanced Admin Styling */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1">
                {user?.role === 'admin' ? 'Administration' : 'Navigation'}
              </div>
              {navigationItems.map((item, index) => (
                <Link
                  key={`mobile-${item.href}-${index}`}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive(item.href)
                      ? user?.role === 'admin'
                        ? "bg-orange-500 text-white shadow-md border border-orange-400"
                        : "bg-primary text-primary-foreground shadow-md"
                      : user?.role === 'admin'
                        ? "text-orange-700 dark:text-orange-300 hover:bg-orange-100/60 dark:hover:bg-orange-900/40"
                        : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon && (
                    <item.icon className={cn(
                      "h-5 w-5 flex-shrink-0",
                      user?.role === 'admin' && isActive(item.href) && "text-white"
                    )} />
                  )}
                  <div className="flex-1">
                    <span className="block">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground mt-0.5 block">
                        {item.description}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Admin Quick Actions (Mobile) */}
            {user?.role === 'admin' && (
              <div className="space-y-1.5 pt-2 border-t border-orange-200 dark:border-orange-800">
                <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide px-2 py-1">
                  Quick Actions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/admin?action=add-problem"
                    className="flex flex-col items-center space-y-1 p-3 bg-green-50 dark:bg-green-950/40 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/60 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Code className="h-5 w-5 text-green-600" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Add Problem</span>
                  </Link>
                  <Link
                    href="/admin?action=add-contest"
                    className="flex flex-col items-center space-y-1 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Trophy className="h-5 w-5 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Create Contest</span>
                  </Link>
                </div>
              </div>
            )}

            {/* User Actions (Mobile) */}
            {user ? (
              <div className="space-y-1 pt-3 border-t">
                <Link
                  href="/profile"
                  className="flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full justify-start px-3 py-2.5 text-sm font-medium text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pt-3 border-t">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
                <Button className="w-full justify-start bg-gradient-to-r from-primary to-primary/80" asChild>
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Star className="mr-2 h-4 w-4" />
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
