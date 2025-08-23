'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Settings, 
  LogOut, 
  Filter, 
  Code2, 
  ChevronDown, 
  Palette,
  Check
} from 'lucide-react'

export function DropdownShowcase() {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium')

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
  ]

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' },
  ]

  return (
    <Card className="w-full max-w-4xl mx-auto m-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Enhanced Dropdown Showcase
        </CardTitle>
        <CardDescription>
          Demonstrating improved dropdown, select, and popover components with solid backgrounds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* User Dropdown Menu */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">User Profile Dropdown</h3>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">JD</span>
                  </div>
                  <span>John Doe</span>
                  <Badge variant="secondary">1250</Badge>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="bg-gray-50 dark:bg-gray-900 m-1 rounded-md">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">John Doe</p>
                    <p className="text-xs text-muted-foreground">john.doe@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Language Select */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Language Selector</h3>
          <div className="flex items-center gap-4">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-48">
                <Code2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      <span>{lang.label}</span>
                      {selectedLanguage === lang.value && <Check className="h-4 w-4 ml-auto" />}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">Current: {selectedLanguage}</p>
          </div>
        </div>

        {/* Difficulty Filter Select */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Difficulty Filter</h3>
          <div className="flex items-center gap-4">
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((diff) => (
                  <SelectItem key={diff.value} value={diff.value}>
                    <div className="flex items-center gap-2">
                      <Badge className={`${diff.color} text-xs px-2 py-1`}>
                        {diff.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">Selected: {selectedDifficulty}</p>
          </div>
        </div>

        {/* Popover Example */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Popover Component</h3>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open Filter Options</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Advanced Filters</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Customize your search with advanced filtering options.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Problem Type
                      </label>
                      <Select defaultValue="algorithm">
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="algorithm">Algorithm</SelectItem>
                          <SelectItem value="data-structure">Data Structure</SelectItem>
                          <SelectItem value="math">Mathematics</SelectItem>
                          <SelectItem value="string">String Processing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">Array</Badge>
                        <Badge variant="secondary" className="text-xs">Hash Table</Badge>
                        <Badge variant="secondary" className="text-xs">Dynamic Programming</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">Apply Filters</Button>
                    <Button size="sm" variant="outline">Reset</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">Dropdown Improvements Applied</h4>
          </div>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Solid backgrounds with proper opacity</li>
            <li>• Enhanced shadow and border styling</li>
            <li>• Improved hover and focus states</li>
            <li>• Consistent spacing and typography</li>
            <li>• Better contrast and readability</li>
            <li>• Backdrop blur effects for modern look</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
