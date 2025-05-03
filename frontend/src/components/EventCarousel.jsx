import React, { useEffect, useState } from 'react';
import '../components/one.css';
import { useNavigate } from 'react-router-dom';

export default function EventCarousel() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:3000/events'); // Replace with your backend base URL
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  const handleBookingClick = (eventId) => {
    // Navigate to the booking page with the event ID
    navigate(`/book/${eventId}`);
  };

  return (
    <div className="carousel-container">
      <div id="eventCarousel" className="carousel slide" data-bs-ride="carousel">
        <div className="carousel-inner">
          {events.map((event, index) => (
            <div className={`carousel-item ${index === 0 ? 'active' : ''}`} key={event.id}>
              <img
                src={event.image_url}
                className="d-block w-100 carousel-image"
                alt={event.title}
              />
              <div className="carousel-caption text-shadow bg-blur rounded p-3">
                <h3>{event.title}</h3>
                <p>{new Date(event.date).toLocaleString()} - {event.location}</p>
                <button 
                  className="btn book-now-btn mt-3"
                  onClick={() => handleBookingClick(event.id)}
                >
                  Hurry UP!! Book Your Seats Now.
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="carousel-control-prev" type="button" data-bs-target="#eventCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon"></span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#eventCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon"></span>
        </button>
      </div>
    </div>
  );
}
