import React, { useState } from 'react';

export default function Navbar() {
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      {/* Navbar */}
      <nav className="bg-[#333333] shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <a className="text-white no-underline text-2xl font-bold">
            BookingApp
          </a>
          <div className="flex gap-6 text-lg">
            <button
              onClick={() => setShowAbout(true)}
              className="text-gray-300 hover:text-white"
            >
              About
            </button>

            <button
              onClick={() => setShowContact(true)}
              className="text-gray-200 hover:text-white "
            >
              Contact
            </button>
          </div>
        </div>
      </nav>

      {/* About Modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          
        >
          <div
            className="bg-[#2c2c2c] text-gray-100 rounded-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-yellow-300">About BookingApp</h2>
              <button
                onClick={() => setShowAbout(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <p>This is a demo booking app built by Vaishnavi Parabkar.</p>
              <p>For development use only, not production ready.</p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          
        >
          <div
            className="bg-[#2c2c2c] text-gray-100 rounded-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-yellow-300">Contact Us</h2>
              <button
                onClick={() => setShowContact(false)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <p>Email: parabkarvaishnavi24@gmail.com</p>
              <p>Phone: +91 7499258458</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
