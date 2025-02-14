// client/src/Admin.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";

// Mapping helper: converts camelCase keys to underscore keys if needed
const fieldMapping = {
  releaseYear: "release_year",
  lengthEpisodes: "length_or_episodes",
  watchedStatus: "watched_status",
  dateAdded: "date_added",
};

const getField = (record, field) => {
  if (record[field] !== undefined) return record[field];
  if (fieldMapping[field] && record[fieldMapping[field]] !== undefined)
    return record[fieldMapping[field]];
  return record[field.charAt(0).toUpperCase() + field.slice(1)] || "";
};

const Admin = () => {
  // Form state for adding/updating a record
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("Live action");
  const [watchedStatus, setWatchedStatus] = useState("");
  const [season, setSeason] = useState(1); // For series only
  const [episode, setEpisode] = useState(1); // For series only
  const [recommendations, setRecommendations] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [lengthEpisodes, setLengthEpisodes] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [imageData, setImageData] = useState(null);
  const [message, setMessage] = useState("");

  // State for the existing records table
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [skipConfirm, setSkipConfirm] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // Fetch existing records (re-fetch when a new record is added/updated)
  useEffect(() => {
    fetch("/api/records")
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, [message]);

  // Handlers for image upload and paste events
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
        break;
      }
    }
  };

  const handleRemoveImage = () => {
    setImageData(null);
  };

  const handleFillDummy = () => {
    setTitle("Apocalypse Now");
    setCategory("movie");
    setType("Live action");
    setWatchedStatus("Not Started");
    setRecommendations("Me no like");
    setReleaseYear("1979");
    setLengthEpisodes("153");
    setSynopsis(
      "Apocalypse Now is an engaging film that tells a compelling story with rich characters and dramatic moments."
    );
    setImageData(null);
    // For series, you might also fill season and episode here.
    setSeason(1);
    setEpisode(1);
  };

  // Clear form fields and reset edit mode
  const clearForm = () => {
    setTitle("");
    setCategory("");
    setType("Live action");
    setWatchedStatus("");
    setSeason(1);
    setEpisode(1);
    setRecommendations("");
    setReleaseYear("");
    setLengthEpisodes("");
    setSynopsis("");
    setImageData(null);
    setEditMode(false);
    setEditId(null);
  };

  // Submit handler: either add or update record.
  // If category is "series", include season and episode in watched_status.
  const handleSubmit = (e) => {
    e.preventDefault();
    let finalWatchedStatus = watchedStatus;
    if (category.toLowerCase() === "series") {
      finalWatchedStatus = `${watchedStatus} (S${season} E${episode})`;
    }
    const payload = {
      title,
      category,
      type,
      watched_status: finalWatchedStatus,
      recommendations,
      release_year: Number(releaseYear),
      length_or_episodes: Number(lengthEpisodes),
      synopsis,
      image: imageData || null,
    };

    if (editMode && editId) {
      // Update record
      fetch(`/api/records/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) {
            return res.json().then((data) => {
              throw new Error(data.error || "Error updating record");
            });
          }
          return res.json();
        })
        .then((data) => {
          const index = records.findIndex((r) => r.id === editId);
          setMessage(
            `Record #${index + 1} "${data.title}" updated successfully.`
          );
          clearForm();
        })
        .catch((err) => {
          console.error("Error updating record:", err);
          setMessage(`Error updating record: ${err.message}`);
        });
    } else {
      // Add new record
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
          clearForm();
        })
        .catch((err) => {
          console.error("Error adding record:", err);
          setMessage(`Error adding record: ${err.message}`);
        });
    }
  };

  // Handler to populate form for updating a record
  const handleEdit = (record) => {
    setEditMode(true);
    setEditId(record.id);
    setTitle(getField(record, "title"));
    setCategory(getField(record, "category"));
    setType(getField(record, "type"));
    // Extract watchedStatus, and if it contains season/episode info, parse it.
    const ws = getField(record, "watchedStatus");
    if (
      getField(record, "category").toLowerCase() === "series" &&
      ws.includes("S")
    ) {
      // Expected format: "In Progress (S2 E14)" for example.
      const match = ws.match(
        /(Not Started|In Progress|Completed)\s*\(S(\d+)\s*E(\d+)\)/i
      );
      if (match) {
        setWatchedStatus(match[1]);
        setSeason(Number(match[2]));
        setEpisode(Number(match[3]));
      } else {
        setWatchedStatus(ws);
        setSeason(1);
        setEpisode(1);
      }
    } else {
      setWatchedStatus(ws);
    }
    setRecommendations(getField(record, "recommendations"));
    setReleaseYear(getField(record, "releaseYear"));
    setLengthEpisodes(getField(record, "lengthEpisodes"));
    setSynopsis(getField(record, "synopsis"));
    setImageData(record.image || null);
  };

  // Handler for deleting a record
  const handleDelete = (record) => {
    const proceed =
      skipConfirm ||
      window.confirm(
        `Are you sure you want to delete record #${
          records.findIndex((r) => r.id === record.id) + 1
        } "${getField(record, "title")}"?`
      );
    if (!proceed) return;

    fetch(`/api/records/${record.id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Error deleting record");
          });
        }
        return res.json();
      })
      .then(() => {
        setMessage(
          `Record "${getField(record, "title")}" deleted successfully.`
        );
      })
      .catch((err) => {
        console.error("Error deleting record:", err);
        setMessage(`Error deleting record: ${err.message}`);
      });
  };

  // Filtering and sorting for the existing records table
  const filteredRecords = records.filter((record) => {
    const query = searchQuery.toLowerCase();
    return (
      (getField(record, "title") + "").toLowerCase().includes(query) ||
      (getField(record, "category") + "").toLowerCase().includes(query) ||
      (getField(record, "type") + "").toLowerCase().includes(query) ||
      (getField(record, "watchedStatus") + "").toLowerCase().includes(query) ||
      (getField(record, "recommendations") + "")
        .toLowerCase()
        .includes(query) ||
      (getField(record, "synopsis") + "").toLowerCase().includes(query) ||
      (getField(record, "releaseYear") + "").toString().includes(query) ||
      (getField(record, "lengthEpisodes") + "").toString().includes(query)
    );
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortColumn) return 0;
    let valA = getField(a, sortColumn);
    let valB = getField(b, sortColumn);
    if (typeof valA === "string" && typeof valB === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
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
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="Movie">movie</option>
              <option value="Series">series</option>
              <option value="Game">game</option>
              <option value="Other">other</option>
            </select>
          </div>
          <div>
            <label>Type: </label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Live action">Live action</option>
              <option value="Cartoon">Cartoon</option>
              <option value="Anime">Anime</option>
              <option value="3D Animation">3D Animation</option>
              <option value="Mix">Mix</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label>Watched Status: </label>
            <select
              value={watchedStatus}
              onChange={(e) => setWatchedStatus(e.target.value)}
              required
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          {category.toLowerCase() === "series" && (
            <div>
              <label>Season: </label>
              <input
                type="number"
                value={season}
                min="1"
                onChange={(e) => setSeason(e.target.value)}
              />
              <label>Episode: </label>
              <input
                type="number"
                value={episode}
                min="1"
                onChange={(e) => setEpisode(e.target.value)}
              />
            </div>
          )}
          <div>
            <label>Recommendations: </label>
            <select
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
            >
              <option value="-">-</option>
              <option value="El Epico">El Epico</option>
              <option value="Good; liked it">Good; liked it</option>
              <option value="Good; did not like">Good; did not like</option>
              <option value="Mixed">Mixed</option>
              <option value="Bad; liked it">Bad; liked it</option>
              <option value="Bad; did not like">Bad; did not like</option>
              <option value="Utter trash">Utter trash</option>
            </select>
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
          <button type="submit">
            {editMode ? "Update Record" : "Add Record"}
          </button>
        </form>
        {message && <p>{message}</p>}
        <hr />
        <h2>Existing Media</h2>
        <div>
          <label>
            <input
              type="checkbox"
              checked={skipConfirm}
              onChange={(e) => setSkipConfirm(e.target.checked)}
            />
            Delete without confirmation
          </label>
        </div>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <table>
          <thead>
            <tr>
              <th>Actions</th>
              <th>#</th>
              <th
                onClick={() => handleSort("title")}
                style={{ cursor: "pointer" }}
              >
                Title{" "}
                {sortColumn === "title"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("category")}
                style={{ cursor: "pointer" }}
              >
                Category{" "}
                {sortColumn === "category"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("type")}
                style={{ cursor: "pointer" }}
              >
                Type{" "}
                {sortColumn === "type"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("watchedStatus")}
                style={{ cursor: "pointer" }}
              >
                Watched Status{" "}
                {sortColumn === "watchedStatus"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("recommendations")}
                style={{ cursor: "pointer" }}
              >
                Recommendations{" "}
                {sortColumn === "recommendations"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("releaseYear")}
                style={{ cursor: "pointer" }}
              >
                Release Year{" "}
                {sortColumn === "releaseYear"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("lengthEpisodes")}
                style={{ cursor: "pointer" }}
              >
                Length/Episodes{" "}
                {sortColumn === "lengthEpisodes"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th>Synopsis</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record, index) => (
              <tr key={record.id}>
                {/* Left-side Actions */}
                <td>
                  <button onClick={() => handleEdit(record)}>Update</button>
                  <button onClick={() => handleDelete(record)}>Delete</button>
                </td>
                <td>{index + 1}</td>
                <td>{getField(record, "title")}</td>
                <td>{getField(record, "category")}</td>
                <td>{getField(record, "type")}</td>
                <td>{getField(record, "watchedStatus")}</td>
                <td>{getField(record, "recommendations")}</td>
                <td>{getField(record, "releaseYear")}</td>
                <td>{getField(record, "lengthEpisodes")}</td>
                <td>
                  {(getField(record, "synopsis") + "").length > 50
                    ? (getField(record, "synopsis") + "").substring(0, 50) +
                      "..."
                    : getField(record, "synopsis")}
                </td>
                <td>
                  {record.image ? (
                    <img
                      src={record.image}
                      alt={getField(record, "title")}
                      style={{ width: "100px" }}
                    />
                  ) : (
                    "No Image"
                  )}
                </td>
                {/* Right-side Actions */}
                <td>
                  <button onClick={() => handleEdit(record)}>Update</button>
                  <button onClick={() => handleDelete(record)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default Admin;
