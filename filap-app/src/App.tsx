import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { Home, Queue, Contact } from './pages';
import './services/apiConfig'; // Initialize API configuration

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/queues/:queueId" element={<Queue />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
