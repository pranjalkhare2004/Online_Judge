/**
 * MAIN APPLICATION COMPONENT
 * 
 * Purpose: The root component of the React application that sets up routing,
 * authentication context, and overall application layout. This component serves
 * as the entry point that orchestrates all other components.
 * 
 * Key Responsibilities:
 * - Configure React Router for client-side navigation
 * - Provide authentication context to all components
 * - Define protected and public routes
 * - Set up the main application layout with navigation
 * - Handle route-based component rendering
 * 
 * Why this exists: Every React application needs a root component that defines
 * the overall structure and routing. This App component establishes the foundation
 * for the entire user interface and manages the global application state.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Problems from './pages/Problems';
import ProblemDetail from './pages/ProblemDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/problems" element={<Problems />} />
              <Route path="/problems/:id" element={<ProblemDetail />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Add more admin routes as needed */}
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
