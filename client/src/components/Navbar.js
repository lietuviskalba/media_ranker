// client/src/components/Navbar.js
import React from "react";
import { Link } from "react-router-dom";
//import "./Navbar.css"; // Optional: create and import your CSS styles

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul className="navbar-list">
        {/* For now, both Home and Ranking direct to the ranking page */}
        <li className="navbar-item">
          <Link to="/">Home</Link>
        </li>
        <li className="navbar-item">
          <Link to="/ranking">Ranking</Link>
        </li>
        <li className="navbar-item">
          <Link to="/admin">Admin</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
