import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EventCarousel() {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/events`
        );
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  const handleBookingClick = (eventId) => {
    navigate(`/book/${eventId}`);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? events.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev === events.length - 1 ? 0 : prev + 1
    );
  };

  if (!events.length) return null;

  const event = events[currentIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-lg">
      {/* Image */}
      <img
        src={event.image_url}
        alt={event.title}
        className="w-full h-[420px] object-cover"
      />

      <div className=" bg-black/90 flex items-end">
        <div className="p-6 text-white max-w-xl">
          <h3 className="text-2xl font-bold mb-2">
            {event.title}
          </h3>
          <p className="text-sm opacity-90">
            {new Date(event.date).toLocaleString()} — {event.location}
          </p>

          <button
            onClick={() => handleBookingClick(event.id)}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold "
          >
            Hurry UP!! Book Your Seats Now.
          </button>
        </div>
      </div>

      {/* Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center"
      >
        ‹
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center"
      >
        ›
      </button>
    </div>
  );
}
