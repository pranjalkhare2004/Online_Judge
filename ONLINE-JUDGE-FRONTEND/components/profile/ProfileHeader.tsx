'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Camera, 
  User, 
  Mail, 
  TrendingUp,
  Shield
} from 'lucide-react'
import { RatingBadge } from './RatingBadge'

interface User {
  id: string
  FullName: string
  Email: string
  username?: string
  avatarUrl?: string
  rating: number
  rank?: number
  role?: string
  joinDate?: string
}

interface ProfileHeaderProps {
  user: User
  loading?: boolean
  onAvatarUpdate?: (newAvatarUrl: string) => void
  editable?: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileHeader({ 
  user, 
  loading, 
  onAvatarUpdate, 
  editable = true 
}: ProfileHeaderProps) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '')
  const [isEditing, setIsEditing] = useState(false)

  const handleAvatarSave = () => {
    if (onAvatarUpdate && avatarUrl !== user.avatarUrl) {
      onAvatarUpdate(avatarUrl)
    }
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="h-8 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 bg-muted rounded w-24 animate-pulse" />
              <div className="h-6 bg-muted rounded w-16 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar Section */}
        <div className="relative group">
          <Avatar className="w-24 h-24 ring-4 ring-background shadow-lg">
            <AvatarImage 
              src={user.avatarUrl} 
              alt={`${user.FullName}'s avatar`}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
              {getInitials(user.FullName)}
            </AvatarFallback>
          </Avatar>
          
          {editable && (
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Edit avatar"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Update Avatar</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="avatar-url">Avatar URL</Label>
                    <Input
                      id="avatar-url"
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-center">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={avatarUrl} alt="Preview" />
                      <AvatarFallback>
                        {getInitials(user.FullName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAvatarSave}>
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* User Info Section */}
        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-3xl font-bold">{user.FullName}</h1>
            {user.username && (
              <p className="text-lg text-muted-foreground">@{user.username}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{user.Email}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RatingBadge rating={user.rating} />
            
            {user.rank && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Rank #{user.rank.toLocaleString()}
              </Badge>
            )}
            
            {user.role === 'admin' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>

          {user.joinDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>
                Member since {new Date(user.joinDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long'
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
