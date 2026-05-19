import React from "react";

function Dashboard() {
  const role = localStorage.getItem("role");

  if (role === "doctor") {
    return <h2>Doctor Dashboard – manage appointments</h2>;
  } else if (role === "patient") {
    return <h2>Patient Dashboard – book appointments</h2>;
  } else {
    return <h2>Unknown role</h2>;
  }
}

export default Dashboard;
