import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    // Mock API call to get problems - replace with real API
    setTimeout(() => {
      setProblems([
        {
          id: 1,
          title: "Two Sum",
          difficulty: "Easy",
          acceptance: "49.2%",
          tags: ["Array", "Hash Table"],
          solved: true
        },
        {
          id: 2,
          title: "Add Two Numbers",
          difficulty: "Medium",
          acceptance: "38.5%",
          tags: ["Linked List", "Math"],
          solved: false
        },
        {
          id: 3,
          title: "Longest Substring Without Repeating Characters",
          difficulty: "Medium",
          acceptance: "33.8%",
          tags: ["Hash Table", "String", "Sliding Window"],
          solved: true
        },
        {
          id: 4,
          title: "Median of Two Sorted Arrays",
          difficulty: "Hard",
          acceptance: "35.2%",
          tags: ["Array", "Binary Search", "Divide and Conquer"],
          solved: false
        },
        {
          id: 5,
          title: "Longest Palindromic Substring",
          difficulty: "Medium",
          acceptance: "32.8%",
          tags: ["String", "Dynamic Programming"],
          solved: false
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredProblems = problems.filter(problem => 
    filter === 'All' || problem.difficulty === filter
  );

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'Hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading problems...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Problems</h1>
        
        <div className="flex space-x-2">
          {['All', 'Easy', 'Medium', 'Hard'].map((difficulty) => (
            <button
              key={difficulty}
              onClick={() => setFilter(difficulty)}
              className={`px-4 py-2 rounded-md ${
                filter === difficulty
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {difficulty}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acceptance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProblems.map((problem) => (
                <tr key={problem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {problem.solved ? (
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/problems/${problem.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {problem.id}. {problem.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {problem.acceptance}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {problem.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
        <div>
          Showing {filteredProblems.length} problems
        </div>
        <div>
          Solved: {problems.filter(p => p.solved).length} / {problems.length}
        </div>
      </div>
    </div>
  );
};

export default Problems;
