import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar2';
import Footer from './components/Footer';
import EventCarousel from './components/EventCarousel';
import BookSeatsPage from './components/BookSeatsPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="max-w-7xl mx-auto py-4 px-4">
        <Routes>
          <Route path="/" element={<EventCarousel />} />
          <Route path="/book/:eventId" element={<BookSeatsPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}


export default App;
