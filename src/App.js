import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Shop from './components/Shop';
import PurchaseHistory from './components/PurchaseHistory';
import AdminDashboard from './components/AdminDashboard';
import AdminGrant from './components/AdminGrant';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import PerformanceMonitor from './components/PerformanceMonitor';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/purchase-history" element={<PurchaseHistory />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/grant" element={<AdminGrant />} />
                <Route path="/login" element={<SignIn />} />
                <Route path="/register" element={<SignUp />} />
              </Routes>
            </main>
            <PerformanceMonitor />
          </div>
        </Router>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App; 