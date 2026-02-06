import React, { useState } from "react";

const BookNowButton = ({ selectedSeats, handleBookNow }) => {
  const [showAlert, setShowAlert] = useState(false);

  const onClickHandler = () => {
    if (selectedSeats.length === 0) {
      setShowAlert(true);
    } else {
      handleBookNow();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {showAlert && (
        <div className="flex items-center justify-between gap-4 bg-red-100 text-red-700 px-4 py-3 rounded-lg shadow-md w-full max-w-md">
          <p className="text-sm font-medium">
            Hey there!
            Please select at least one seat to book.
          </p>
          <button
            onClick={() => setShowAlert(false)}
            className="text-red-700 font-bold hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      <button
        onClick={onClickHandler}
        className="bg-green-600 hover:bg-green-700 active:scale-95 transition
                   text-white font-semibold px-8 py-3 rounded-xl shadow-lg"
      >
        Book Now
      </button>
    </div>
  );
};

export default BookNowButton;
