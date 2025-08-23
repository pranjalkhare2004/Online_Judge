/**
 * CODE EDITOR PAGE
 * 
 * Dedicated page for the professional code editor component.
 * Provides a full-screen coding environment with Monaco Editor.
 */

'use client';

import React from 'react';
import CodeEditor from '@/components/CodeEditor/CodeEditor';

const CodeEditorPage: React.FC = () => {
  // Sample test cases for demonstration
  const sampleTestCases = [
    {
      input: '2 3',
      expectedOutput: '5'
    },
    {
      input: '10 20',
      expectedOutput: '30'
    },
    {
      input: '-5 7',
      expectedOutput: '2'
    }
  ];

  const handleSubmit = async (code: string, language: string) => {
    console.log('Code submitted:', { code, language });
    // Implementation would handle actual submission
  };

  return (
    <div className="h-screen">
      <CodeEditor
        sampleTestCases={sampleTestCases}
        onSubmit={handleSubmit}
        initialLanguage="cpp"
      />
    </div>
  );
};

export default CodeEditorPage;
