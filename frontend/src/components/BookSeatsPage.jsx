import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';
import Modal from "./Modal.jsx";
import BookNowButton from './BookButtonNow';
import UserDetailsModal from './UserDetailsModal';
export default function BookSeatsPage() {
  const [showModal, setShowModal] = useState(false);
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seats, setSeats] = useState([]);
    const [seatNumbers, setSeatNumbers] = useState([]); // Store the actual seat numbers (A1, B2, etc.)
const [timeLeft, setTimeLeft] = useState(null); // null until timer starts

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
    const socket = new WebSocket(import.meta.env.VITE_WS_URL);
    socket.onopen = () => {
      console.log('WebSocket connected');
      socket.send(
        JSON.stringify({
          type: 'join_event',
          eventId,
          userId: userIdRef.current,
        })
      );
    };

    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    wsRef.current = socket;
    socket.onmessage = function (event) {
      const data = JSON.parse(event.data);
      console.log("Received WebSocket message:", data);  // Log the message for debugging
    };


    return () => {
      socket.close();
    };
  }, [eventId]);

useEffect(() => {
  const updatedSeatNumbers = selectedSeats.map((id) => {
    for (const row in seatsByRow) {
      const seat = seatsByRow[row].find((s) => s.id === id);
      if (seat) return seat.seat_number;
    }
    return id;
  });
  setSeatNumbers(updatedSeatNumbers);
}, [selectedSeats, seats]);
// Timer countdown effect
useEffect(() => {
  if (timeLeft === null) return;

  const timer = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev === 1) {
        clearInterval(timer);
        return null;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [timeLeft]);



  const toggleSeatSelection = (seatId) => {
    const seatElement = document.getElementById(seatId);
    // Prevent selecting if another user is already selecting this seat (yellow)

    const alreadySelected = selectedSeats.includes(seatId);
    const newSelectedSeats = alreadySelected
      ? selectedSeats.filter((id) => id !== seatId)
      : [...selectedSeats, seatId];
    setSelectedSeats(newSelectedSeats);

  };


  const scrollToSeats = () => {
    seatSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const seatsByRow = seats;

  if (loading) return <div className="text-center mt-5">Loading event details...</div>;
  if (error) return <div className="text-center mt-5 text-danger">Error: {error}</div>;

  const formattedDate = format(new Date(event.date), 'dd MMM, yyyy');
  const formattedTime = format(new Date(event.date), 'h:mm a');
  const handleBookNow = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/lock-seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdRef.current,
          eventId,
          selectedSeats
        })
      });

      const data = await response.json();

      if (data.success) {
        // Proceed to show form for user details
        console.log('Seats locked successfully');
        setTimeLeft(300); // start 5-minute timer (300 seconds)
  setShowModal(true); // show form
      } else {
        alert('Failed to lock seats');
      }
    } catch (err) {
      console.error('Error locking seats:', err);
      alert('Something went wrong while reserving your seats.');
    }
  };

  return (
    <div>
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
                  className={`btn btn-sm ${seat.status === 'booked'
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
                    //setSeatNumbers(seat.seat_number);...Chck is this workign or not 
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
        {timeLeft !== null && (
  <div style={{
    position: 'fixed',
    top: '20px',
    right: '20px', // Change to 'left' if you want left corner
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: '10px 20px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0,0,0,0.15)',
    zIndex: 9999
  }}>
    ⏳ Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
  </div>
)}

        <div className="book-now-container">
          <BookNowButton selectedSeats={selectedSeats} handleBookNow={handleBookNow} />
        </div>

      </div>
      {showModal && <UserDetailsModal seatsSelected={seatNumbers}  seatId={selectedSeats}eventId={eventId} userId={userIdRef.current} onClose={() => setShowModal(false)} />}
    </div>
  );
}
