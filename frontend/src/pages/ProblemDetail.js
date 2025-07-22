import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { oneDark } from '@codemirror/theme-one-dark';

const ProblemDetail = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const languageExtensions = {
    javascript: javascript(),
    python: python(),
    cpp: cpp(),
    java: java()
  };

  const defaultCode = {
    cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
    python: `def solution():
    # Your code here
    pass

if __name__ == "__main__":
    solution()`,
    java: `public class Solution {
    public static void main(String[] args) {
        // Your code here
    }
}`,
    javascript: `function solution() {
    // Your code here
}

solution();`
  };

  useEffect(() => {
    // Mock API call to get problem details
    setTimeout(() => {
      setProblem({
        id: parseInt(id),
        title: "Two Sum",
        difficulty: "Easy",
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
          },
          {
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]"
          }
        ],
        constraints: [
          "2 <= nums.length <= 10^4",
          "-10^9 <= nums[i] <= 10^9",
          "-10^9 <= target <= 10^9",
          "Only one valid answer exists."
        ]
      });
      setCode(defaultCode.cpp);
      setLoading(false);
    }, 500);
  }, [id, defaultCode.cpp]);

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    setCode(defaultCode[newLanguage]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Mock submission - replace with actual API call
    setTimeout(() => {
      setTestResults({
        status: 'Accepted',
        runtime: '4 ms',
        memory: '39.2 MB',
        testCases: [
          { input: '[2,7,11,15], 9', output: '[0,1]', expected: '[0,1]', passed: true },
          { input: '[3,2,4], 6', output: '[1,2]', expected: '[1,2]', passed: true },
          { input: '[3,3], 6', output: '[0,1]', expected: '[0,1]', passed: true }
        ]
      });
      setSubmitting(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading problem...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Problem Description */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
          
          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
              problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {problem.difficulty}
            </span>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-line">{problem.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Examples</h3>
            {problem.examples.map((example, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="mb-2">
                  <strong>Example {index + 1}:</strong>
                </div>
                <div className="mb-2">
                  <strong>Input:</strong> <code className="bg-gray-200 px-1 rounded">{example.input}</code>
                </div>
                <div className="mb-2">
                  <strong>Output:</strong> <code className="bg-gray-200 px-1 rounded">{example.output}</code>
                </div>
                {example.explanation && (
                  <div>
                    <strong>Explanation:</strong> {example.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Constraints</h3>
            <ul className="list-disc list-inside text-gray-700">
              {problem.constraints.map((constraint, index) => (
                <li key={index}>{constraint}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Code Editor */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Code Editor</h2>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>

          <div className="mb-4">
            <CodeMirror
              value={code}
              height="400px"
              extensions={[languageExtensions[language]]}
              theme={oneDark}
              onChange={(value) => setCode(value)}
            />
          </div>

          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Solution'}
            </button>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Submission Results</h3>
              <div className={`p-4 rounded-md mb-4 ${
                testResults.status === 'Accepted' ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg">{testResults.status}</span>
                  <div className="text-sm text-gray-600">
                    Runtime: {testResults.runtime} | Memory: {testResults.memory}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {testResults.testCases.map((testCase, index) => (
                  <div key={index} className={`p-3 rounded border ${
                    testCase.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Test Case {index + 1}</span>
                      <span className={testCase.passed ? 'text-green-600' : 'text-red-600'}>
                        {testCase.passed ? '✓ Passed' : '✗ Failed'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Input: {testCase.input}
                    </div>
                    <div className="text-sm text-gray-600">
                      Output: {testCase.output} | Expected: {testCase.expected}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;
