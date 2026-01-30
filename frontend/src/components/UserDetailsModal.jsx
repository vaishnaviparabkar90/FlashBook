import React, { useState } from 'react';
import ReactDOM from 'react-dom';

export default function UserDetailsModal({ onClose, seatsSelected, eventId, userId, seatId }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [paymentReady, setPaymentReady] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/submit-user-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          seats: seatId,
          userId,
          eventId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPaymentReady(true);
        setTotalAmount(data.totalAmount);
        console.log(`✅ Ready to pay ₹${data.totalAmount}`);
      } else {
        alert('Submission failed: ' + data.message);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };
  function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

  const handlePayment = async () => {
    // Create order on backend
    const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    alert('Razorpay SDK failed to load. Please check your internet connection.');
    return;
  }
    const orderRes = await fetch('/api2/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: totalAmount }),
    });
    const order = await orderRes.json();
  
    const options = {
      key: 'rzp_test_2kBWWxBdzBeiXX', // Your Razorpay key_id
      amount: order.amount,
      currency: 'INR',
      name: 'Event Booking',
      description: 'Seat Booking Payment',
      order_id: order.id,
      handler: async function (response) {
        // Send payment details to backend for verification and finalization
        const verifyRes = await fetch('/api2/finalize-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            seats: seatId,
            eventId,
            userId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            amount: totalAmount,
          }),
        });
        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          alert('✅ Payment Successful and Booking Confirmed!');
          onClose();
        } else {
          alert('❌ Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      theme: {
        color: '#3399cc',
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return ReactDOM.createPortal(
    <div
      className="modal fade show"
      style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Enter Your Details</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body">
            <h6 className="mb-3">Seats Selected:</h6>
            <ul className="list-group list-group-flush mb-3">
              {seatsSelected.map((seat, index) => (
                <li
                  key={index}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  🎟️ Seat
                  <span className="badge bg-success rounded-pill">{seat}</span>
                </li>
              ))}
            </ul>

            <div className="mb-3">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                required
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                type="email"
                required
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                type="tel"
                required
                className="form-control"
              />
            </div>

            {!paymentReady ? (
              <button type="submit" className="btn btn-success w-100" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            ) : (
              <button type="button" className="btn btn-success w-100" onClick={handlePayment}>
                Pay ₹{totalAmount}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
