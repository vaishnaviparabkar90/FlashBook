import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function BookSeatsPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const seatSectionRef = useRef(null);
  const wsRef = useRef(null); // WebSocket ref for stable WebSocket instance
  const userIdRef = useRef(null); // Store userId persistently

  useEffect(() => {
    // Generate or retrieve unique user ID
    let userId = sessionStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('userId', userId);
    }
    userIdRef.current = userId;
    console.log("Generated/Retrieved User ID:", userIdRef.current);

    const fetchEvent = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/events/${eventId}`);
        if (!response.ok) throw new Error('Event not found');
        const data = await response.json();
        console.log("Fetched event data:", data);
        setEvent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchSeats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/events/${eventId}/seats`);
        const data = await response.json();
        console.log("Fetched seats data:", data.seats);
        // Check if seats data is correctly structured
        
        setSeats(data.seats);
      } catch (error) {
        console.error('Error fetching seats:', error);
      }
    };

    fetchEvent();
    fetchSeats();

    // WebSocket setup
    const socket = new WebSocket(`import.meta.env.VITE_WS_URL`);
    socket.onopen = () => {
      console.log('✅ WebSocket connected');
      socket.send(
        JSON.stringify({
          type: 'join_event',
          eventId,
          userId: userIdRef.current,
        })
      );
    };

    socket.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
    };

    wsRef.current = socket;
  socket.onmessage = function (event) {
  const data = JSON.parse(event.data);
  console.log("Received WebSocket message:", data);  // Log the message for debugging

  if (data.type === "seat_update") {
    handleSeatSelectionMessage(data);
  }
};


    return () => {
      socket.close();
    };
  }, [eventId]);

  function handleSeatSelectionMessage(data) {
    const { action, seatId, userId } = data;
    const currentUserId = sessionStorage.getItem("userId");
    console.log("Handling seat selection:", data);

    const seatElement = document.getElementById(seatId);
    if (!seatElement) return;

    if (action === "select") {
      if (userId === currentUserId) {
        seatElement.classList.remove('btn-outline-success');
        seatElement.classList.add('btn-success');
        console.log(`User ${userId} selected seat ${seatId}`);
      } else {
        seatElement.classList.remove('btn-outline-success');
        seatElement.classList.add('btn-warning');
        console.log(`Seat ${seatId} selected by another user`);
      }
    }
    if (action === "deselect") {
      seatElement.classList.remove('btn-success', 'btn-warning');
      seatElement.classList.add('btn-outline-success');
      console.log(`Seat ${seatId} deselected`);
    }
  }

  const toggleSeatSelection = (seatId) => {
    const alreadySelected = selectedSeats.includes(seatId);
    const newSelectedSeats = alreadySelected
      ? selectedSeats.filter((id) => id !== seatId)
      : [...selectedSeats, seatId];
    console.log("Toggling seat selection:", seatId, alreadySelected, newSelectedSeats);
    setSelectedSeats(newSelectedSeats);

    // Send WebSocket message to notify others
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'seat_selection',
          action: alreadySelected ? 'deselect' : 'select',
          eventId,
          seatId,
          userId: userIdRef.current,
        })
      );
      console.log("Sent WebSocket message:", {
        type: 'seat_selection',
        action: alreadySelected ? 'deselect' : 'select',
        eventId,
        seatId,
        userId: userIdRef.current,
      });
    }
  };

  const scrollToSeats = () => {
    seatSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const seatsByRow = seats;

  if (loading) return <div className="text-center mt-5">Loading event details...</div>;
  if (error) return <div className="text-center mt-5 text-danger">Error: {error}</div>;

  const formattedDate = format(new Date(event.date), 'dd MMM, yyyy');
  const formattedTime = format(new Date(event.date), 'h:mm a');

  return (
    <div>
      {/* Hero Section */}
      <div className="event-hero position-relative text-white mb-5">
        <div
          className="event-background"
          style={{
            backgroundImage: `url(${event.image_url})`,
            position: 'absolute',
            top: 0,
            left: 0,
            height: '450px',
            width: '100%',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.4)',
            zIndex: 1,
          }}
        />

        <div className="container position-relative z-2 py-5 d-flex flex-wrap align-items-start">
          <div className="event-card bg-dark bg-opacity-75 p-4 rounded shadow-lg d-flex flex-row align-items-start">
            <img
              src={event.image_url}
              alt={event.title}
              className="event-poster rounded me-4"
              style={{ width: '200px', height: '300px', objectFit: 'cover' }}
            />
            <div>
              <h2 className="fw-bold mb-3">{event.title}</h2>
              <div className="mb-3">
                <button className="btn btn-light btn-sm">Rate Now</button>
              </div>
              <div className="mb-3">
                <span className="badge bg-secondary me-2">2D</span>
                <span className="badge bg-secondary me-2">{event.language || 'Hindi'}</span>
              </div>
              <div className="text-light small mb-2">
                🕒 {formattedTime} • {event.certificate || 'A'} • {formattedDate}
              </div>
              <div className="text-light small mb-3">📍 {event.location}</div>
              <button className="btn btn-success px-4" onClick={scrollToSeats}>Book Tickets Now!!</button>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Layout */}
      <h4 ref={seatSectionRef} className="text-center mb-4 mt-5 font-weight-bold">
        Select Your Seats
      </h4>

      <div className="d-flex flex-column align-items-center gap-3 mb-5">
        {Object.keys(seatsByRow).sort().map((row) => (
          <div className="d-flex gap-3 mb-2" key={row}>
            {seatsByRow[row].map((seat) => (
              <button
                id={seat.id}
                key={seat.id}
                disabled={seat.status === 'booked'}
                className={`btn btn-sm ${
                  seat.status === 'booked'
                    ? 'btn-secondary'
                    : selectedSeats.includes(seat.id)
                    ? 'btn-success'
                    : 'btn-outline-success'
                } seat-btn`}
                onClick={() => {
                  if (seat.status !== 'booked') {
                    toggleSeatSelection(seat.id);
                  }
                }}
                aria-label={`Seat ${seat.seat_number} - ${seat.status === 'booked' ? 'Booked' : 'Available'}`}
              >
                {seat.seat_number}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Selected Seats Display */}
      <div className="text-center mt-5">
        <h5>Selected Seats:</h5>
        <div className="d-flex flex-wrap justify-content-center gap-2">
          {selectedSeats.length > 0
            ? selectedSeats
                .map((id) => {
                  for (const row in seatsByRow) {
                    const seat = seatsByRow[row].find((s) => s.id === id);
                    if (seat) return seat.seat_number;
                  }
                  return id;
                })
                .map((seat, index) => (
                  <span key={index} className="badge bg-success p-2">
                    {seat}
                  </span>
                ))
            : <span className="badge bg-secondary p-2">None</span>}
        </div>
      </div>
    </div>
  );
}
