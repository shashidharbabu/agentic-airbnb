import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import PropertyDetails from './pages/PropertyDetails';
import Bookings from './pages/Bookings';
import Favorites from './pages/Favorites';
import History from './pages/History';
import AIAgentButton from './components/AIAgentButton';
import AIAgentPanel from './components/AIAgentPanel';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [hostModalOpen, setHostModalOpen] = useState(false);

  const handleOpenAI = () => {
    setIsAIPanelOpen(true);
  };

  const handleCloseAI = () => {
    setIsAIPanelOpen(false);
  };

  const handleOpenHostModal = () => {
    setHostModalOpen(true);
  };

  const handleCloseHostModal = () => {
    setHostModalOpen(false);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={
              <>
                <Header isHomePage={true} onHostModalOpen={handleOpenHostModal} />
                <Home onHostModalOpen={handleOpenHostModal} hostModalOpen={hostModalOpen} onCloseHostModal={handleCloseHostModal} />
              </>
            } />
            <Route path="/login" element={
              <>
                <Header />
                <main className="main-content">
                  <Login />
                </main>
              </>
            } />
            <Route path="/signup" element={
              <>
                <Header />
                <main className="main-content">
                  <Signup />
                </main>
              </>
            } />
            <Route path="/profile" element={
              <>
                <Header />
                <main className="main-content">
                  <Profile />
                </main>
              </>
            } />
            <Route path="/dashboard" element={
              <>
                <Header />
                <main className="main-content">
                  <Dashboard />
                </main>
              </>
            } />
            <Route path="/property/:id" element={
              <>
                <Header />
                <main className="main-content">
                  <PropertyDetails />
                </main>
              </>
            } />
            <Route path="/bookings" element={
              <>
                <Header />
                <main className="main-content">
                  <Bookings />
                </main>
              </>
            } />
            <Route path="/favorites" element={
              <>
                <Header />
                <main className="main-content">
                  <Favorites />
                </main>
              </>
            } />
            <Route path="/history" element={
              <>
                <Header />
                <main className="main-content">
                  <History />
                </main>
              </>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* AI Agent Components */}
          <AIAgentButton onClick={handleOpenAI} />
          <AIAgentPanel 
            isOpen={isAIPanelOpen}
            onClose={handleCloseAI}
            bookingId={null}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;