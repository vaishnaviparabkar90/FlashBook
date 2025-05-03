import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
<nav
  className="navbar navbar-expand-lg navbar-dark shadow-sm px-4 py-3"
  style={{ backgroundColor: '#333333' }}>
          <div className="container-fluid">
        <Link className="navbar-brand fw-bold fs-4" to="/">BookingApp</Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarContent">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/events">Events</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about">About</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/contact">Contact</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
