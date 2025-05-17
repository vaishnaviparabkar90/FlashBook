import React, { useState } from 'react';

export default function Navbar() {
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <nav
        className="navbar navbar-expand-lg navbar-dark shadow-sm px-4 py-3"
        style={{ backgroundColor: '#333333' }}
      >
        <div className="container-fluid">
          <a className="navbar-brand fw-bold fs-4" href="#">
            BookingApp
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="navbarContent">
            <ul className="navbar-nav gap-3 fs-5">
              <li className="nav-item">
                <button
                  className="btn btn-link nav-link"
                  onClick={() => setShowAbout(true)}
                  style={{ cursor: 'pointer' }}
                >
                  About
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="btn btn-link nav-link"
                  onClick={() => setShowContact(true)}
                  style={{ cursor: 'pointer' }}
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* About Modal */}
      {showAbout && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          role="dialog"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="modal-dialog"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ backgroundColor: '#2c2c2c', color: '#f5f5f5', borderRadius: '10px' }}>
  <div className="modal-header border-0">
    <h5 className="modal-title">About BookingApp</h5>
    <button
      type="button"
      className="btn-close btn-close-white"
      aria-label="Close"
      onClick={() => setShowAbout(false)}
    ></button>
  </div>
  <div className="modal-body">
    <p>This is a demo booking app built by Vaishnavi Parabkar.</p>
    <p>For development use only, not production ready.</p>
  </div>
</div>

          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          role="dialog"
          onClick={() => setShowContact(false)}
        >
          <div
            className="modal-dialog"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content" style={{ backgroundColor: '#2c2c2c', color: '#f5f5f5', borderRadius: '10px' }}>
  <div className="modal-header border-0">
    <h5 className="modal-title">Contact Us</h5>
    <button
      type="button"
      className="btn-close btn-close-white"
      aria-label="Close"
      onClick={() => setShowContact(false)}
    ></button>
  </div>
  <div className="modal-body">
    <p>Email: parabkarvaishnavi24@gmail.com</p>
    <p>Phone: +91 7499258458</p>
  </div>
</div>

          </div>
        </div>
      )}
    </>
  );
}
