import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-white text-xl font-bold">
            Coder's Hub OJ
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/problems" className="text-white hover:text-blue-200">
              Problems
            </Link>
            
            {isAdmin() && (
              <div className="flex items-center space-x-4">
                <Link to="/admin/dashboard" className="text-white hover:text-blue-200">
                  Admin Panel
                </Link>
                <Link to="/admin/problems" className="text-white hover:text-blue-200">
                  Manage Problems
                </Link>
                <Link to="/admin/users" className="text-white hover:text-blue-200">
                  Manage Users
                </Link>
              </div>
            )}
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-white">
                  {user.firstname} {user.lastname}
                  {isAdmin() && <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded">ADMIN</span>}
                </span>
                <Link to="/profile" className="text-white hover:text-blue-200">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-white hover:text-blue-200 px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
