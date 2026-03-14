import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/admin">Admin</Link> | 
      <Link to="/doctor">Doctor</Link> | 
      <Link to="/patient">Patient</Link>
    </nav>
  );
}

export default Navbar;
