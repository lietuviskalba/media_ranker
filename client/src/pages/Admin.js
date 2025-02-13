// client/src/Admin.js
import React, { useState } from "react";
import { Link } from "react-router-dom";

const Admin = () => {
  // Form state for all fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("Standard"); // Default value
  const [watchedStatus, setWatchedStatus] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [lengthEpisodes, setLengthEpisodes] = useState("");
  const [synopsis, setSynopsis] = useState("");
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

  // On form submission, send all field values with underscore keys
  const handleSubmit = (e) => {
    e.preventDefault();
    // Use uploaded image (Base64) if available; otherwise, use the URL (if provided)
    const image = imageData || imageURL || null;

    fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        type,
        watched_status: watchedStatus, // Modified key
        recommendations,
        release_year: Number(releaseYear), // Modified key
        length_or_episodes: Number(lengthEpisodes), // Modified key
        synopsis,
        image,
      }),
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
        setTitle("");
        setCategory("");
        setType("Standard");
        setWatchedStatus("");
        setRecommendations("");
        setReleaseYear("");
        setLengthEpisodes("");
        setSynopsis("");
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
          <Link to="/">Back to Ranking</Link>
        </nav>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Title: </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Category: </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Type: </label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Standard">Standard</option>
              <option value="Unknown">Unknown</option>
              {/* Add more options as needed */}
            </select>
          </div>
          <div>
            <label>Watched Status: </label>
            <input
              type="text"
              value={watchedStatus}
              onChange={(e) => setWatchedStatus(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Recommendations: </label>
            <input
              type="text"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
            />
          </div>
          <div>
            <label>Release Year: </label>
            <input
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Length/Episodes: </label>
            <input
              type="number"
              value={lengthEpisodes}
              onChange={(e) => setLengthEpisodes(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Synopsis: </label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              required
            />
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
            {/* Display image preview if available */}
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
