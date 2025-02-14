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
  const [imageData, setImageData] = useState(null); // For file upload or pasted image (Base64)
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

  // Handle paste event to capture an image from the clipboard
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageData(reader.result);
        };
        reader.readAsDataURL(file);
        break; // Only handle the first image
      }
    }
  };

  // Handler to remove the preview image
  const handleRemoveImage = () => {
    setImageData(null);
  };

  // Handler to populate dummy data into the form fields
  const handleFillDummy = () => {
    setTitle("Apocalypse Now");
    setCategory("Movie");
    setType("Standard");
    setWatchedStatus("Not finished");
    setRecommendations("Me no like");
    setReleaseYear("1979");
    setLengthEpisodes("153");
    setSynopsis(
      "Apocalypse Now is an engaging film that tells a compelling story with rich characters and dramatic moments."
    );
    setImageData(null);
  };

  // On form submission, log the payload and send all field values with underscore keys
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title,
      category,
      type,
      watched_status: watchedStatus,
      recommendations,
      release_year: Number(releaseYear),
      length_or_episodes: Number(lengthEpisodes),
      synopsis,
      image: imageData || null,
    };

    console.log("Submitting payload:", payload);

    fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Error creating record");
          });
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
      })
      .catch((err) => {
        console.error("Error adding record:", err);
        setMessage(`Error adding record: ${err.message}`);
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
        <button onClick={handleFillDummy}>Fill Dummy Data</button>
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
            <label>Or Paste Image (optional): </label>
            {/* This div listens for a paste event to capture an actual image from the clipboard */}
            <div
              onPaste={handlePaste}
              style={{
                border: "1px dashed #ccc",
                padding: "10px",
                marginTop: "10px",
                cursor: "text",
              }}
            >
              Click here and press Ctrl+V to paste an image
            </div>
          </div>
          {imageData && (
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginTop: "10px",
              }}
            >
              <img
                src={imageData}
                alt="Preview"
                style={{ maxWidth: "200px", display: "block" }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                }}
              >
                X
              </button>
            </div>
          )}
          <button type="submit">Add Record</button>
        </form>
        {message && <p>{message}</p>}
      </main>
    </div>
  );
};

export default Admin;
