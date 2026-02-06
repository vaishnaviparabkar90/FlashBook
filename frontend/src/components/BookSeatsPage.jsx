import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import BookNowButton from "./BookButtonNow";
import UserDetailsModal from "./UserDetailsModal";

export default function BookSeatsPage() {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [seatsByRow, setSeatsByRow] = useState({});
  const [seatLocks, setSeatLocks] = useState({}); // only reflects backend locks
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatNumbers, setSeatNumbers] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isLockPhase, setIsLockPhase] = useState(false); // 🔐 HARD LOCK PHASE

  const seatSectionRef = useRef(null);
  const wsRef = useRef(null);
  const userIdRef = useRef(null);

  /* ------------------ USER + DATA FETCH ------------------ */
  useEffect(() => {
    let userId = sessionStorage.getItem("userId");
    if (!userId) {
      userId = `user_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem("userId", userId);
    }
    userIdRef.current = userId;

    const fetchEvent = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/events/${eventId}`
        );
        if (!res.ok) throw new Error("Event not found");
        setEvent(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchSeats = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/events/${eventId}/seats`
      );
      const data = await res.json();
      setSeatsByRow(data.seats);
    };

    fetchEvent();
    fetchSeats();

    const socket = new WebSocket(import.meta.env.VITE_WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: "join_event",
          eventId,
          userId: userIdRef.current,
        })
      );
    };

    socket.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type !== "seat_update") return;

      setSeatLocks((prev) => {
        const next = { ...prev };
        if (data.action === "locked") {
          next[data.seatId] =
            data.userId === userIdRef.current ? "mine" : "locked";
        } else if (data.action === "unlocked") {
          delete next[data.seatId];
        } else if (data.action === "booked") {
          next[data.seatId] = "booked";
        }
        return next;
      });
    };

    return () => socket.close();
  }, [eventId]);

  /* ------------------ SEAT NUMBERS ------------------ */
  useEffect(() => {
    const nums = selectedSeats.map((id) => {
      for (const row in seatsByRow) {
        const seat = seatsByRow[row].find((s) => s.id === id);
        if (seat) return seat.seat_number;
      }
      return id;
    });
    setSeatNumbers(nums);
  }, [selectedSeats, seatsByRow]);

  /* ------------------ TIMER (ONLY AFTER BOOK NOW) ------------------ */
  useEffect(() => {
    if (!isLockPhase || timeLeft === null) return;

    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          clearInterval(t);
          handleTimerEnd();
          return 0;
        }
        return p - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [isLockPhase, timeLeft]);

  const handleTimerEnd = () => {
    alert("⏰ Seat lock expired!");
    setIsLockPhase(false);
    setSelectedSeats([]);
    setSeatNumbers([]);
    setShowModal(false);
    setTimeLeft(null);
    window.location.reload();
  };

  /* ------------------ BLOCK BACK / REFRESH / CLOSE ------------------ */
  useEffect(() => {
    if (!isLockPhase) return;

    const block = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const blockBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("beforeunload", block);
    window.addEventListener("popstate", blockBack);
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", block);
      window.removeEventListener("popstate", blockBack);
    };
  }, [isLockPhase]);

  /* ------------------ ACTIONS ------------------ */
  const toggleSeatSelection = (id) => {
    if (isLockPhase) return; // 🔒 NO CHANGES AFTER BOOK NOW
    if (seatLocks[id] === "locked" || seatLocks[id] === "booked") return;

    setSelectedSeats((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  };

  const handleBookNow = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/lock-seats`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userIdRef.current,
          eventId,
          selectedSeats,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      setIsLockPhase(true);
      setTimeLeft(300); // ⏳ START ONCE
      setShowModal(true);
    } else {
      alert(data.message || "Failed to lock seats");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  const formattedDate = format(new Date(event.date), "dd MMM, yyyy");
  const formattedTime = format(new Date(event.date), "h:mm a");

  return (
    <div>
      {/* HERO */}
      <div className="relative h-[380px] mb-10 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center brightness-50 rounded-b-xl"
          style={{ backgroundImage: `url(${event.image_url})` }}
        />
        <div className="relative z-10 max-w-6xl mx-auto p-6">
          <div className="bg-black/70 rounded-xl p-6 flex gap-6">
            <img
              src={event.image_url}
              className="w-[200px] h-[300px] object-cover rounded"
            />
            <div>
              <h2 className="text-3xl font-bold mb-3">{event.title}</h2>
              <p className="text-sm mb-2">
                🕒 {formattedTime} • {formattedDate}
              </p>
              <p className="text-sm mb-4">📍 {event.location}</p>
              <button
                onClick={() =>
                  seatSectionRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold"
              >
                Book Tickets
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEATS */}
      <h3 ref={seatSectionRef} className="text-center text-xl font-bold mb-6">
        Select Your Seats
      </h3>

      <div className="flex flex-col items-center gap-5">
        {Object.keys(seatsByRow)
          .sort()
          .map((row) => (
            <div key={row} className="flex gap-2">
              {seatsByRow[row].map((seat) => {
                const state = seatLocks[seat.id];

                const styles =
                  seat.status === "booked"
                    ? "bg-gray-400 text-white"
                    : state === "locked"
                    ? "bg-yellow-400 text-white"
                    : selectedSeats.includes(seat.id)
                    ? "bg-green-600 text-white"
                    : "border border-green-600 text-green-600 hover:bg-green-100";

                const disabled =
                  seat.status === "booked" || state === "locked" || isLockPhase;

                return (
                  <button
                    key={seat.id}
                    disabled={disabled}
                    onClick={() => toggleSeatSelection(seat.id)}
                    className={`w-10 h-10 rounded text-sm font-semibold transition ${styles} ${
                      disabled ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {seat.seat_number}
                  </button>
                );
              })}
            </div>
          ))}
      </div>

      {/* TIMER */}
      {isLockPhase && timeLeft !== null && (
        <div className="fixed top-5 right-5 bg-yellow-100 text-yellow-800 px-4 py-2 rounded shadow">
          ⏳ {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <BookNowButton
          selectedSeats={selectedSeats}
          handleBookNow={handleBookNow}
        />
      </div>

      {showModal && (
        <UserDetailsModal
          seatsSelected={seatNumbers}
          seatId={selectedSeats}
          eventId={eventId}
          userId={userIdRef.current}
          onClose={() => {}} // ❌ cannot close
        />
      )}
    </div>
  );
}
