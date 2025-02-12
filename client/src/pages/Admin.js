// client/src/Admin.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

function Admin() {
  const [name, setName] = useState("");
  const [type, setType] = useState("movie"); // Default value
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error creating record");
        }
        return res.json();
      })
      .then((data) => {
        setMessage(`Record added successfully with ID: ${data.id}`);
        setName("");
        setType("movie");
      })
      .catch((err) => {
        console.error("Error adding record:", err);
        setMessage("Error adding record.");
      });
  };

  return (
    <div>
      <header>
        <h1>Admin Page</h1>
        <nav>
          <Link to="/">Back to Home</Link>
        </nav>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name: </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Type: </label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="movie">Movie</option>
              <option value="cartoon">Cartoon</option>
              <option value="anime">Anime</option>
            </select>
          </div>
          <button type="submit">Add Record</button>
        </form>
        {message && <p>{message}</p>}
      </main>
    </div>
  );
}

export default Admin;
