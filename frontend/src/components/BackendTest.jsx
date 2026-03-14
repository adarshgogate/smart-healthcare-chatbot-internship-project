import React, { useState } from "react";
import api from "../api/axios"; // your axios setup

function BackendTest() {
  const [result, setResult] = useState("");

  const checkBackend = async () => {
    try {
      const res = await api.get("/patients"); // call backend
      setResult(res.data.map(p => `${p.name} (${p.age})`).join(", "));
    } catch (err) {
      setResult("Error connecting to backend");
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={checkBackend}>Test Backend Connection</button>
      <p>{result}</p>
    </div>
  );
}

export default BackendTest;
