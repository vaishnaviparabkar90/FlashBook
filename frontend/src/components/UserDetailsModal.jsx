import React, { useState } from "react";
import ReactDOM from "react-dom";

export default function UserDetailsModal({
  onClose,
  seatsSelected,
  eventId,
  userId,
  seatId,
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/submit-user-data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            seats: seatId,
            userId,
            eventId,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setPaymentReady(true);
        setTotalAmount(data.totalAmount);
      } else {
        alert("Submission failed: " + data.message);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Something went wrong!");
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
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  const handlePayment = async () => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert("Razorpay SDK failed to load.");
      return;
    }

    const orderRes = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api2/create-order`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      }
    );

    const order = await orderRes.json();

    const options = {
      key: "rzp_test_2kBWWxBdzBeiXX",
      amount: order.amount,
      currency: "INR",
      name: "Event Booking",
      description: "Seat Booking Payment",
      order_id: order.id,
      handler: async function (response) {
        const verifyRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api2/finalize-payment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
          }
        );

        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          alert("✅ Payment Successful and Booking Confirmed!");
          window.location.reload();
          onClose();
        } else {
          alert("❌ Payment verification failed.");
        }
      },
      prefill: {
        name: formData.name,
        email: formData.email,
        contact: formData.phone,
      },
      theme: { color: "#22c55e" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Enter Your Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Seats */}
        <div className="mb-4">
          <h3 className="font-medium mb-2">Seats Selected</h3>
          <div className="flex flex-wrap gap-2">
            {seatsSelected.map((seat, index) => (
              <span
                key={index}
                className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                🎟️ {seat}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
          />

          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email Address"
            required
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
          />

          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            required
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
          />

          {!paymentReady ? (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePayment}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition"
            >
              Pay ₹{totalAmount}
            </button>
          )}
        </form>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}
