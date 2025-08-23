'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { RatingBadge } from '@/components/ui/rating-badge'
import { NotificationsPanel } from '@/components/notifications-panel'
import {
  Code,
  Menu,
  X,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  Shield,
  LayoutDashboard,
  Trophy,
  Star,
  Zap,
  BarChart3,
} from 'lucide-react'

interface NavigationItem {
  label: string
  shortLabel?: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  description?: string
}

export default function ModernHeader() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Dynamic navigation based on user role
  const getNavigationItems = (): NavigationItem[] => {
    if (user?.role === 'admin') {
      return [
        { 
          label: 'Dashboard', 
          shortLabel: 'Dash',
          href: '/admin', 
          icon: LayoutDashboard,
          description: 'Admin dashboard overview'
        },
        { 
          label: 'Users', 
          href: '/admin?tab=users', 
          icon: User,
          description: 'Manage platform users'
        },
        { 
          label: 'Problems', 
          href: '/admin?tab=problems', 
          icon: Code,
          description: 'Manage coding problems'
        },
        { 
          label: 'System', 
          shortLabel: 'Sys',
          href: '/admin?tab=system', 
          icon: Settings,
          description: 'System configuration'
        },
      ]
    }

    return [
      { 
        label: 'Problems', 
        href: '/problems', 
        icon: Code,
        description: 'Browse coding challenges'
      },
      { 
        label: 'Contests', 
        href: '/contests', 
        icon: Trophy,
        description: 'Competitive programming'
      },
      { 
        label: 'Leaderboard', 
        shortLabel: 'Rankings',
        href: '/leaderboard', 
        icon: BarChart3,
        description: 'View global rankings'
      },
    ]
  }

  const navigationItems = getNavigationItems()

  const isActive = (href: string) => {
    if (typeof window === 'undefined') return false
    const pathname = window.location.pathname
    const searchParams = window.location.search
    
    if (href.includes('?')) {
      return `${pathname}${searchParams}`.includes(href)
    }
    
    return pathname === href || (href !== '/' && pathname.startsWith(href))
  }

  const handleLogout = async () => {
    try {
      await logout()
      setMobileMenuOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
        
        {/* Modern Brand Logo */}
        <Link 
          href={user?.role === 'admin' ? '/admin' : '/'} 
          className="group flex items-center space-x-3 hover:opacity-90 transition-all duration-300 flex-shrink-0 min-w-0 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 ">
          <div className="relative flex-shrink-0 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
            {/* Enhanced logo with gradient background */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
              <Code className="h-5 w-5 text-white bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
              
              {/* Animated status indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-sm backdrop-blur-xl border-b border-white/20">
                <div className="absolute inset-0.5 bg-white rounded-full bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
              </div>
              
              {/* Admin indicator */}
              {user?.role === 'admin' && (
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border-b border-white/20">
                  <Shield className="h-2.5 w-2.5 text-white bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col min-w-0 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
              <span className="font-bold text-xl truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent backdrop-blur-xl border-b border-white/20">
                CodeJudge
              </span>
              {user?.role === 'admin' && (
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full whitespace-nowrap shadow-sm backdrop-blur-xl border-b border-white/20">
                  ADMIN
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground -mt-1 truncate hidden sm:block bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
              {user?.role === 'admin' ? 'Administration Panel' : 'Online Judge'}
            </span>
          </div>
        </Link>

        {/* Modern Desktop Navigation */}
        <nav className={cn(
          "hidden md:flex items-center",
          user?.role === 'admin' 
            ? "space-x-1 bg-gradient-to-r from-orange-50/90 to-red-50/90 dark:from-orange-950/40 dark:to-red-950/40 px-4 sm:px-6 lg:px-8 py-2.5 rounded-xl border border-orange-200/50 dark:border-orange-800/50 backdrop-blur-sm shadow-lg ring-1 ring-orange-100/50 dark:ring-orange-900/50" 
            : "space-x-1 bg-muted/30 px-3 py-2 rounded-xl backdrop-blur-sm border border-border/50"
        )}>
          {user?.role === 'admin' && (
            <div className="flex items-center mr-3 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/60 dark:to-red-900/60 rounded-lg border border-orange-200 dark:border-orange-700 shadow-sm backdrop-blur-xl border-b border-white/20">
              <Shield className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400 mr-1.5 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
              <span className="text-xs font-bold text-orange-700 dark:text-orange-300 tracking-wide bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                ADMIN PANEL
              </span>
            </div>
          )}
          
          {/* Enhanced Navigation Items */}
          <div className="flex items-center space-x-1 max-w-none overflow-hidden bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
            {navigationItems.map((item, index) => (
              <Link
                key={`${item.href}-${index}`}
                href={item.href}
                className={cn(
                  "group flex items-center space-x-2 px-4 sm:px-6 lg:px-8 py-2.5 text-sm font-medium rounded-lg transition-all duration-300",
                  "hover:scale-105 whitespace-nowrap min-w-0 flex-shrink-0 relative",
                  isActive(item.href)
                    ? user?.role === 'admin'
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg ring-2 ring-orange-300/50 dark:ring-orange-700/50"
                      : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg ring-2 ring-primary/20"
                    : user?.role === 'admin'
                      ? "text-orange-800 dark:text-orange-200 hover:text-orange-900 dark:hover:text-orange-100 hover:bg-gradient-to-r hover:from-orange-100/80 hover:to-red-100/80 dark:hover:from-orange-900/50 dark:hover:to-red-900/50 hover:shadow-lg transition-shadow duration-300-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/80 hover:to-accent/50 hover:shadow-lg transition-shadow duration-300-md"
                )}
                title={item.description || item.label}
              >
                {/* Modern active indicator */}
                {isActive(item.href) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-lg pointer-events-none backdrop-blur-xl border-b border-white/20 /">
                )}
                
                {item.icon && (
                  <item.icon className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                    isActive(item.href) && "text-white"
                  )} />
                )}
                
                <span className="hidden lg:inline transition-all duration-300 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">{item.label}</span>
                <span className="lg:hidden transition-all duration-300 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">{item.shortLabel || item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Modern Desktop Actions */}
        <div className="hidden md:flex items-center space-x-3 xl:space-x-4 flex-shrink-0 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
          
          {/* Modern Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:from-muted/70 hover:to-muted/50 group bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl ">
            <div className="relative bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 group-hover:rotate-12 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
              ) : (
                <Moon className="h-4 w-4 text-blue-500 transition-transform duration-300 group-hover:-rotate-12 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
              )}
              {/* Animated glow effect */}
              <div className={cn(
                "absolute inset-0 rounded-full opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-40",
                theme === "dark" ? "bg-amber-400" : "bg-blue-400"
              )} />
            </div>
          </Button>

          {/* Notifications for authenticated users */}
          {user && <NotificationsPanel />}

          {user ? (
            <div className="flex items-center space-x-3 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
              {/* Modern User Stats Display for Regular Users */}
              {user.role !== 'admin' && (
                <div className="hidden lg:flex items-center space-x-3 px-4 sm:px-6 lg:px-8 py-2 bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 rounded-xl border border-blue-200/60 dark:border-blue-800/50 shadow-sm backdrop-blur-sm backdrop-blur-xl">
                  {/* Enhanced Rating Badge */}
                  <div className="flex items-center space-x-2 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-lg bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 animate-pulse bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                    <RatingBadge rating={user.rating || 1200} size="sm" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">{user.rating || 1200}</span>
                  </div>
                  
                  {/* Solved Problems Count */}
                  <div className="flex items-center space-x-2 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-lg bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                    <Trophy className="h-3.5 w-3.5 text-emerald-500 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">{user.solvedProblems?.length || 0}</span>
                    <span className="text-xs text-muted-foreground bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">solved</span>
                  </div>
                  
                  {/* Active Streak */}
                  <div className="flex items-center space-x-2 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-lg bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                    <Zap className="h-3.5 w-3.5 text-orange-500 animate-pulse bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">{user.streak || 0}</span>
                    <span className="text-xs text-muted-foreground bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">streak</span>
                  </div>
                </div>
              )}

              {/* Modern User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-border/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:from-blue-500/20 hover:via-indigo-500/20 hover:to-purple-500/20 group bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl ">
                    <Avatar className="h-8 w-8 ring-2 ring-gradient-to-r from-blue-400 to-purple-400 group-hover:ring-4 transition-all duration-300 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                        {user.username?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online status indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background shadow-sm animate-pulse bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl /">
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-64 p-2 bg-background/95 backdrop-blur-lg border border-border/50 shadow-xl rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl"
                  align="end"
                  forceMount
                >
                  {/* Enhanced User Info Header */}
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50/90 to-purple-50/90 dark:from-blue-950/40 dark:to-purple-950/40 rounded-lg mb-2 backdrop-blur-xl border-b border-white/20">
                    <Avatar className="h-10 w-10 ring-2 ring-blue-400/50 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 font-bold bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                        {user.username?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                      <p className="text-sm font-semibold text-foreground truncate bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">{user.username}</p>
                      <p className="text-xs text-muted-foreground truncate bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">{user.email}</p>
                      {user.role === 'admin' && (
                        <Badge variant="default" className="text-xs mt-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white backdrop-blur-xl border-b border-white/20">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-border/50 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                  
                  {/* Enhanced Navigation Links */}
                  <div className="space-y-1 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:bg-hover:bg- transition-colors duration-200blue-50/80 dark:hover:bg-hover:bg- transition-colors duration-200blue-950/30 group bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                        <LayoutDashboard className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                        <span className="font-medium bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:bg-hover:bg- transition-colors duration-200emerald-50/80 dark:hover:bg-hover:bg- transition-colors duration-200emerald-950/30 group bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                        <User className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                        <span className="font-medium bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:bg-hover:bg- transition-colors duration-200purple-50/80 dark:hover:bg-hover:bg- transition-colors duration-200purple-950/30 group bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                        <Settings className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                        <span className="font-medium bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:bg-hover:bg- transition-colors duration-200amber-50/80 dark:hover:bg-hover:bg- transition-colors duration-200amber-950/30 group bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                          <Shield className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                          <span className="font-medium bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </div>
                  
                  <DropdownMenuSeparator className="bg-border/50 my-2 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                  
                  {/* Enhanced Logout Button */}
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 hover:bg-hover:bg- transition-colors duration-200red-50/80 dark:hover:bg-hover:bg- transition-colors duration-200red-950/30 text-red-600 dark:text-red-400 group cursor-pointer bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 ">
                    <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                    <span className="font-medium bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-3 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
              {/* Modern Authentication Buttons */}
              <Button 
                asChild 
                variant="ghost" 
                size="sm"
                className="hidden sm:inline-flex transition-all duration-300 hover:scale-105 hover:bg-hover:bg- transition-colors duration-200blue-50/80 dark:hover:bg-hover:bg- transition-colors duration-200blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200/50 dark:hover:border-blue-800/50 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl ">
                <Link href="/login" className="font-medium px-4 sm:px-6 lg:px-8 py-2 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">Sign in</Link>
              </Button>
              <Button 
                asChild 
                size="sm"
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-lg transition-shadow duration-300-xl transition-all duration-300 hover:scale-105 rounded-xl border-0 font-medium px-6 py-2 backdrop-blur-xl border-b border-white/20 ">
                <Link href="/register" className="flex items-center space-x-2 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                  <span>Get Started</span>
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Modern Mobile Menu Button */}
        <div className="flex items-center space-x-3 md:hidden bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
          {/* Enhanced Mobile Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 transition-all duration-300 hover:scale-105 hover:shadow-lg transition-shadow duration-300-md group bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl ">
            <div className="relative bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 group-hover:rotate-12 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
              ) : (
                <Moon className="h-4 w-4 text-blue-500 transition-transform duration-300 group-hover:-rotate-12 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
              )}
            </div>
          </Button>
          
          {/* Enhanced Mobile Menu Toggle */}
          <Button
            variant="ghost"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border/50 transition-all duration-300 hover:scale-105 hover:shadow-lg transition-shadow duration-300-md hover:from-primary/20 hover:to-primary/10 group bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl ">
            <div className="relative bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
              {mobileMenuOpen ? (
                <X className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
              ) : (
                <Menu className="h-5 w-5 transition-transform duration-300 group-hover:scale-110 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
              )}
            </div>
          </Button>
        </div>
      </div>

      {/* Enhanced Modern Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg shadow-xl bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl">
          <div className="container px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-4 max-h-[85vh] overflow-y-auto bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
            
            {/* Mobile Navigation Links */}
            <div className="space-y-2 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
              {navigationItems.map((item, index) => (
                <Link
                  key={`mobile-${item.href}-${index}`}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 group",
                    isActive(item.href)
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                      : "hover:bg-gradient-to-r hover:from-muted/80 hover:to-accent/50 hover:shadow-lg transition-shadow duration-300-md"
                  )}
                >
                  {item.icon && (
                    <item.icon className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                  )}
                  <span className="font-medium bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile User Section */}
            {user ? (
              <div className="space-y-3 pt-3 border-t border-border/50 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl">
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50/90 to-purple-50/90 dark:from-blue-950/40 dark:to-purple-950/40 rounded-xl backdrop-blur-xl border-b border-white/20">
                  <Avatar className="h-10 w-10 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-700 dark:text-blue-300 font-bold bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                      {user.username?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                    <p className="font-semibold text-foreground truncate bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">{user.email}</p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full justify-start space-x-2 text-red-600 border-red-200 hover:bg-hover:bg- transition-colors duration-200red-50 dark:hover:bg-hover:bg- transition-colors duration-200red-950/30 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 ">
                  <LogOut className="h-4 w-4 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20 /">
                  <span>Sign out</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 pt-3 border-t border-border/50 bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl">
                <Button asChild variant="ghost" className="w-full justify-start bg-gradient-to-r from-primary-50 to-accent-50 backdrop-blur-xl border-b border-white/20">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white backdrop-blur-xl border-b border-white/20">
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
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
