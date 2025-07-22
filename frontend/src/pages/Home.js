import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Coder's Hub Online Judge
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Practice algorithmic problems, improve your coding skills, and compete with others!
        </p>
        
        {!user && (
          <div className="space-x-4">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
            >
              Get Started
            </Link>
            <Link
              to="/problems"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 inline-block"
            >
              Browse Problems
            </Link>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Diverse Problems</h3>
          <p className="text-gray-600">
            Solve problems ranging from basic algorithms to advanced data structures.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Multiple Languages</h3>
          <p className="text-gray-600">
            Code in C++, Python, Java, JavaScript and more programming languages.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">Real-time Feedback</h3>
          <p className="text-gray-600">
            Get instant feedback on your submissions with detailed test results.
          </p>
        </div>
      </div>

      {user && (
        <div className="mt-12 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Welcome back, {user.username}!</h2>
          <div className="flex space-x-4">
            <Link
              to="/problems"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Continue Solving
            </Link>
            <Link
              to="/profile"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300"
            >
              View Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
