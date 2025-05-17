import React, { useState } from 'react';
import './BookNowButton.css'; // Import the CSS file for the button

const BookNowButton = ({ selectedSeats, handleBookNow }) => {
  const [showAlert, setShowAlert] = useState(false);

  const onClickHandler = () => {
    if (selectedSeats.length === 0) {
      // Show the alert if no seat is selected
      setShowAlert(true);
    } else {
      // Proceed to book if seats are selected
      handleBookNow();
    }
  };

  return (
    <div>
      {showAlert && (
        <div className="alert">
          <p>Please select at least one seat to book.</p>
          <button onClick={() => setShowAlert(false)} className="alert-close-btn">X</button>
        </div>
      )}

      <button className="book-now-btn" onClick={onClickHandler}>
        Book Now
      </button>
    </div>
  );
};

export default BookNowButton;
