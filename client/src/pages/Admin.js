// client/src/pages/Admin.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

const Admin = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState("movie"); // Default value
  const [imageData, setImageData] = useState(null); // For file upload (Base64)
  const [imageURL, setImageURL] = useState(""); // For pasted URL
  const [message, setMessage] = useState("");

  // Handle file input change: convert file to Base64 string
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // When the form is submitted, decide which image to send
  const handleSubmit = (e) => {
    e.preventDefault();
    // Use the uploaded image (Base64) if available; otherwise, use the URL (if provided)
    const image = imageData || imageURL || null;

    fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, image }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error creating record");
        }
        return res.json();
      })
      .then((data) => {
        setMessage(`Record added successfully with ID: ${data.id}`);
        // Reset form fields
        setName("");
        setType("movie");
        setImageData(null);
        setImageURL("");
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
          <div>
            <label>Upload Image (optional): </label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <div>
            <label>Or Paste Image URL (optional): </label>
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              value={imageURL}
              onChange={(e) => setImageURL(e.target.value)}
            />
          </div>
          <div>
            {/* Optional: Display image preview if available */}
            {(imageData || imageURL) && (
              <img
                src={imageData || imageURL}
                alt="Preview"
                style={{ maxWidth: "200px", marginTop: "10px" }}
              />
            )}
          </div>
          <button type="submit">Add Record</button>
        </form>
        {message && <p>{message}</p>}
      </main>
    </div>
  );
};

export default Admin;
