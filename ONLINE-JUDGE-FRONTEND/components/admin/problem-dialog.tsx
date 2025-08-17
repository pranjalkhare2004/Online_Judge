'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  description: z.string().min(1, 'Description is required').max(10000, 'Description too long'),
  constraints: z.array(z.string()).default([]),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })).default([]),
  tags: z.array(z.string()).default([]),
  timeLimit: z.number().min(100).max(10000).default(1000),
  memoryLimit: z.number().min(64).max(1024).default(256),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  tags: string[];
  timeLimit: number;
  memoryLimit: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  isActive: boolean;
  isFeatured: boolean;
  createdBy: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProblemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  problem?: Problem | null;
  onSuccess: () => void;
}

export function ProblemDialog({ isOpen, onClose, problem, onSuccess }: ProblemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [constraintInput, setConstraintInput] = useState('');
  const [exampleInput, setExampleInput] = useState('');
  const [exampleOutput, setExampleOutput] = useState('');
  const [exampleExplanation, setExampleExplanation] = useState('');

  const form = useForm<z.infer<typeof problemSchema>>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      slug: '',
      difficulty: 'Easy',
      description: '',
      constraints: [],
      examples: [],
      tags: [],
      timeLimit: 1000,
      memoryLimit: 256,
      isActive: true,
      isFeatured: false,
    },
  });

  const isEditing = !!problem;

  useEffect(() => {
    if (problem) {
      form.reset({
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        description: problem.description,
        constraints: problem.constraints || [],
        examples: problem.examples || [],
        tags: problem.tags || [],
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        isActive: problem.isActive,
        isFeatured: problem.isFeatured,
      });
    } else {
      form.reset({
        title: '',
        slug: '',
        difficulty: 'Easy',
        description: '',
        constraints: [],
        examples: [],
        tags: [],
        timeLimit: 1000,
        memoryLimit: 256,
        isActive: true,
        isFeatured: false,
      });
    }
  }, [problem, form]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    form.setValue('title', value);
    if (!isEditing) {
      const slug = generateSlug(value);
      form.setValue('slug', slug);
    }
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues('tags');
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue('tags', [...currentTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const addConstraint = () => {
    if (constraintInput.trim()) {
      const currentConstraints = form.getValues('constraints');
      form.setValue('constraints', [...currentConstraints, constraintInput.trim()]);
      setConstraintInput('');
    }
  };

  const removeConstraint = (index: number) => {
    const currentConstraints = form.getValues('constraints');
    form.setValue('constraints', currentConstraints.filter((_, i) => i !== index));
  };

  const addExample = () => {
    if (exampleInput.trim() && exampleOutput.trim()) {
      const currentExamples = form.getValues('examples');
      form.setValue('examples', [...currentExamples, {
        input: exampleInput.trim(),
        output: exampleOutput.trim(),
        explanation: exampleExplanation.trim() || undefined,
      }]);
      setExampleInput('');
      setExampleOutput('');
      setExampleExplanation('');
    }
  };

  const removeExample = (index: number) => {
    const currentExamples = form.getValues('examples');
    form.setValue('examples', currentExamples.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: z.infer<typeof problemSchema>) => {
    setLoading(true);
    try {
      const url = isEditing ? `/admin/problems/${problem._id}` : '/admin/problems';
      const method = isEditing ? 'put' : 'post';
      
      const response = await api[method](url, values);
      
      if (response.data.success) {
        toast({
          title: isEditing ? 'Problem Updated' : 'Problem Created',
          description: response.data.message,
        });
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      console.error('Failed to save problem:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error && 'response' in error && 
          typeof error.response === 'object' && error.response !== null &&
          'data' in error.response && typeof error.response.data === 'object' &&
          error.response.data !== null && 'message' in error.response.data
          ? String(error.response.data.message)
          : 'Failed to save problem',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-2xl">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Problem' : 'Create New Problem'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-gray-900">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Problem title"
                        onChange={(e) => {
                          field.onChange(e);
                          handleTitleChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="problem-slug" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (ms) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="memoryLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Memory Limit (MB) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 256)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Detailed problem description..."
                      rows={8}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags Section */}
            <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white">Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.watch('tags').map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Constraints Section */}
            <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white">Constraints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={constraintInput}
                    onChange={(e) => setConstraintInput(e.target.value)}
                    placeholder="Add constraint..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConstraint())}
                  />
                  <Button type="button" onClick={addConstraint} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.watch('constraints').map((constraint, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <span className="flex-1">{constraint}</span>
                      <Button
                        type="button"
                        onClick={() => removeConstraint(index)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Examples Section */}
            <Card className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-900 dark:text-white">Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Input</label>
                    <Textarea
                      value={exampleInput}
                      onChange={(e) => setExampleInput(e.target.value)}
                      placeholder="Example input..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Output</label>
                    <Textarea
                      value={exampleOutput}
                      onChange={(e) => setExampleOutput(e.target.value)}
                      placeholder="Example output..."
                      rows={3}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Explanation (Optional)</label>
                  <Textarea
                    value={exampleExplanation}
                    onChange={(e) => setExampleExplanation(e.target.value)}
                    placeholder="Explanation..."
                    rows={2}
                  />
                </div>
                <Button type="button" onClick={addExample} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Example
                </Button>
                
                <div className="space-y-4">
                  {form.watch('examples').map((example, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Example {index + 1}</CardTitle>
                          <Button
                            type="button"
                            onClick={() => removeExample(index)}
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <strong>Input:</strong>
                          <pre className="text-sm bg-muted p-2 rounded mt-1">{example.input}</pre>
                        </div>
                        <div>
                          <strong>Output:</strong>
                          <pre className="text-sm bg-muted p-2 rounded mt-1">{example.output}</pre>
                        </div>
                        {example.explanation && (
                          <div>
                            <strong>Explanation:</strong>
                            <p className="text-sm text-muted-foreground mt-1">{example.explanation}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-6">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0">
                    <FormLabel>Active Problem</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0">
                    <FormLabel>Featured Problem</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isEditing ? 'Update Problem' : 'Create Problem'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
