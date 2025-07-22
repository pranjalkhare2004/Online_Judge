import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  // Mock user stats - replace with real data from API
  const userStats = {
    problemsSolved: 23,
    totalProblems: 150,
    easyProblems: 15,
    mediumProblems: 6,
    hardProblems: 2,
    submissions: 45,
    acceptanceRate: 68,
    ranking: 1245
  };

  const recentSubmissions = [
    { id: 1, problem: "Two Sum", status: "Accepted", language: "C++", time: "2 hours ago" },
    { id: 2, problem: "Valid Parentheses", status: "Accepted", language: "Python", time: "1 day ago" },
    { id: 3, problem: "Binary Tree", status: "Wrong Answer", language: "Java", time: "2 days ago" },
    { id: 4, problem: "Maximum Subarray", status: "Accepted", language: "C++", time: "3 days ago" }
  ];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Profile</h1>
        <p className="text-gray-600">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{user.username}</h1>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-sm text-gray-500">Ranking: #{userStats.ranking}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Problems Solved</span>
              <span className="font-semibold">{userStats.problemsSolved}/{userStats.totalProblems}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${(userStats.problemsSolved / userStats.totalProblems) * 100}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{userStats.easyProblems}</div>
                <div className="text-sm text-gray-600">Easy</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600">{userStats.mediumProblems}</div>
                <div className="text-sm text-gray-600">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{userStats.hardProblems}</div>
                <div className="text-sm text-gray-600">Hard</div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-gray-600">Total Submissions</span>
              <span className="font-semibold">{userStats.submissions}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Acceptance Rate</span>
              <span className="font-semibold">{userStats.acceptanceRate}%</span>
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          
          <div className="space-y-3">
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{submission.problem}</div>
                  <div className="text-sm text-gray-600">{submission.language} • {submission.time}</div>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    submission.status === 'Accepted' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {submission.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Problem Categories</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { category: 'Array', solved: 8, total: 25 },
            { category: 'String', solved: 5, total: 20 },
            { category: 'Dynamic Programming', solved: 3, total: 15 },
            { category: 'Tree', solved: 4, total: 18 },
            { category: 'Graph', solved: 2, total: 12 },
            { category: 'Sorting', solved: 6, total: 10 },
            { category: 'Hash Table', solved: 7, total: 14 },
            { category: 'Two Pointers', solved: 4, total: 8 }
          ].map((skill, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-semibold">{skill.solved}/{skill.total}</div>
              <div className="text-sm text-gray-600 mb-2">{skill.category}</div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-600 h-1 rounded-full" 
                  style={{ width: `${(skill.solved / skill.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
