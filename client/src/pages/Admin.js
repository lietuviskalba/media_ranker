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
  const [type, setType] = useState("Standard");
  const [watchedStatus, setWatchedStatus] = useState("");
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

  // Fetch existing records (re-fetch when a new record is added or updated)
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

  // Clear form fields and reset edit mode
  const clearForm = () => {
    setTitle("");
    setCategory("");
    setType("Standard");
    setWatchedStatus("");
    setRecommendations("");
    setReleaseYear("");
    setLengthEpisodes("");
    setSynopsis("");
    setImageData(null);
    setEditMode(false);
    setEditId(null);
  };

  // Submit handler: either add or update record
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
    setWatchedStatus(getField(record, "watchedStatus"));
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
