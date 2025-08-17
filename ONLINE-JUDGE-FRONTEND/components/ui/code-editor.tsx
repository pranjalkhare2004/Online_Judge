'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from './skeleton';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] border rounded-md">
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
});

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
  height?: string;
  theme?: 'vs-dark' | 'light' | 'vs';
  readOnly?: boolean;
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  value,
  onChange,
  height = '400px',
  theme = 'vs-dark',
  readOnly = false,
  className = ''
}) => {
  return (
    <div className={`font-mono border rounded-md overflow-hidden ${className}`}>
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        theme={theme}
        options={{
          ariaLabel: 'Solution code editor',
          ariaDescription: 'Write your solution code here',
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          folding: true,
          bracketMatching: 'always',
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          renderWhitespace: 'boundary',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          contextmenu: true,
          mouseWheelZoom: true,
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          },
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          accessibilitySupport: 'auto',
        }}
      />
    </div>
  );
};

// Language templates for different programming languages
export const getLanguageTemplate = (language: string): string => {
  const templates: Record<string, string> = {
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Your code here
    
    return 0;
}`,
    
    java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        
        // Your code here
        
        br.close();
    }
}`,
    
    python: `# Your code here
def solve():
    pass

if __name__ == "__main__":
    solve()`,
    
    javascript: `// Your code here
function solve() {
    // Read input
    const input = require('fs').readFileSync('/dev/stdin', 'utf8').trim();
    const lines = input.split('\\n');
    
    // Your solution logic
    
}

solve();`,
    
    c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Your code here
    
    return 0;
}`
  };
  
  return templates[language] || '// Start coding here...';
};

export default CodeEditor;
