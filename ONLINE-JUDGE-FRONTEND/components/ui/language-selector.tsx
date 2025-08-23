'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

interface Language {
  value: string;
  label: string;
  extension: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { value: 'cpp', label: 'C++', extension: '.cpp' },
  { value: 'java', label: 'Java', extension: '.java' },
  { value: 'python', label: 'Python', extension: '.py' },
  { value: 'javascript', label: 'JavaScript', extension: '.js' },
  { value: 'c', label: 'C', extension: '.c' },
  { value: 'typescript', label: 'TypeScript', extension: '.ts' },
  { value: 'go', label: 'Go', extension: '.go' },
  { value: 'rust', label: 'Rust', extension: '.rs' },
];

interface LanguageSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onValueChange,
  className = '',
  disabled = false
}) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`w-40 ${className}`}>
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((language) => (
          <SelectItem key={language.value} value={language.value}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{language.label}</span>
              <span className="text-xs text-muted-foreground">
                {language.extension}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { SUPPORTED_LANGUAGES };
export type { Language };
