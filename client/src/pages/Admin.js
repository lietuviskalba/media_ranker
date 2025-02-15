// client/src/Admin.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import styled from "styled-components";
import ScrollToTop from "../components/ScrollToTop";

// Mapping from camelCase to underscore keys as used in our JSON data
const fieldMapping = {
  releaseYear: "release_year",
  lengthEpisodes: "length_or_episodes",
  watchedStatus: "watched_status",
  dateAdded: "date_added",
};

// Helper function to retrieve a field value from a record using our mapping
function getField(record, field) {
  if (record[field] !== undefined) return record[field];
  if (fieldMapping[field] && record[fieldMapping[field]] !== undefined)
    return record[fieldMapping[field]];
  return record[field.charAt(0).toUpperCase() + field.slice(1)] || "";
}

// ---------------- Styled Components ----------------

// Overall page container
const Container = styled.div`
  background-color: rgb(197, 7, 231);
  color: rgb(183, 183, 183);
  min-height: 100vh;
  margin: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
  padding-top: 80px; /* Leaves space for the fixed Navbar */
`;

// Main content area styling
const Main = styled.main`
  background-color: rgb(46, 46, 46);
  padding: 10px;
  padding-bottom: 10em;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
`;

// Container for the record creation/update form; uses sticky positioning so it stays in view
const CreationFormContainer = styled.div`
  position: sticky;
  top: 80px;
  background-color: rgb(46, 46, 46);
  padding: 10px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  z-index: 900;
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

// Section titles (for form header and table header)
const SectionTitles = styled.div`
  color: rgb(192, 73, 248);
  font-size: 2em;
`;

// Grid layout for the form (three columns)
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

// Nested grid for grouping smaller fields in two columns
const NestedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

// Form group wrapper for individual fields (can span multiple grid columns)
const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: ${(props) => (props.span ? props.span : "auto")};
  outline: 1px dashed rgba(255, 0, 0, 0.5);
`;

// Styled text input field
const StyledInput = styled.input`
  padding: 6px;
  font-size: 1rem;
  border: 1px solid rgb(80, 80, 80);
  border-radius: 4px;
  background-color: rgb(58, 58, 58);
  color: rgb(58, 58, 58);
`;

// Styled select dropdown
const StyledSelect = styled.select`
  padding: 6px;
  font-size: 1rem;
  border: 1px solid rgb(80, 80, 80);
  border-radius: 4px;
  background-color: rgb(58, 58, 58);
  color: #eee;
`;

// Styled textarea field
const StyledTextarea = styled.textarea`
  padding: 6px;
  font-size: 1rem;
  border: 1px solid rgb(80, 80, 80);
  border-radius: 4px;
  background-color: rgb(58, 58, 58);
  color: #eee;
`;

// Button for form submission
const SubmitButton = styled.button`
  padding: 8px 16px;
  font-size: 1.1rem;
  background-color: rgb(68, 68, 68);
  color: #eee;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  &:hover {
    background-color: rgb(65, 113, 203);
  }
`;

// Button to fill dummy data for testing
const DummyButton = styled.button`
  padding: 8px 16px;
  font-size: 1.1rem;
  background-color: rgb(80, 80, 80);
  color: #eee;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  margin-left: 10px;
  &:hover {
    background-color: rgb(65, 113, 203);
  }
`;

// Message display styling
const Message = styled.p`
  font-size: 1rem;
  color: #ff0;
  margin-top: 10px;
`;

// ---------------- Table Styled Components ----------------

// Table styling
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  table-layout: fixed;
`;

// Table cell styling
const StyledTd = styled.td`
  padding: 10px;
  border: 1px solid rgb(85, 85, 85);
  text-align: center;
`;

// Table row styling with alternating colors and a hover effect
const StyledTr = styled.tr`
  background-color: ${(props) => (props.index % 2 === 0 ? "#333" : "#2a2a2a")};
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    background-color: #777;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
`;

// Table cell for the synopsis, with text wrapping
const SynopsisTd = styled.td`
  padding: 10px;
  border: 1px solid rgb(85, 85, 85);
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
  max-width: 300px;
`;

// Image thumbnail with hover scaling effect
const Image = styled.img`
  width: 100px;
  height: 100px;
  transition: transform 0.3s ease;
  transform-origin: center center;
  &:hover {
    transform: scale(5) translateX(-50%);
    z-index: 10;
    position: relative;
  }
`;

// Resizable table header cell styling
const ResizableTh = styled.th`
  position: relative;
  padding: 10px;
  background-color: rgb(68, 68, 68);
  border: 1px solid rgb(85, 85, 85);
  cursor: pointer;
  width: ${(props) => props.width}px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Resizer element for column resizing
const Resizer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  user-select: none;
`;
// ---------------- End Table Styled Components ----------------

// Initial widths for table columns
const initialColumnWidths = {
  index: 30,
  title: 100,
  category: 100,
  type: 100,
  watchedStatus: 100,
  recommendations: 80,
  releaseYear: 100,
  lengthEpisodes: 100,
  synopsis: 300,
};

function Admin() {
  // Form state variables
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("Live action");
  const [watchedStatus, setWatchedStatus] = useState("");
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [recommendations, setRecommendations] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [lengthEpisodes, setLengthEpisodes] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [imageData, setImageData] = useState(null);
  const [message, setMessage] = useState("");

  // Table state and search/sort functionality
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);

  // Load saved column widths from localStorage (persisting user-adjusted sizes)
  useEffect(() => {
    const savedWidths = localStorage.getItem("adminColumnWidths");
    if (savedWidths) setColumnWidths(JSON.parse(savedWidths));
  }, []);

  // Save updated column widths to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("adminColumnWidths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Fetch records from the server; re-fetch when message changes (after add/update/delete)
  useEffect(() => {
    fetch("/api/records")
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, [message]);

  // Handler for resizing columns by dragging the resizer element
  const handleMouseDown = (e, column) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[column];
    const handleMouseMove = (moveEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      setColumnWidths((prev) => {
        const updated = { ...prev, [column]: newWidth > 20 ? newWidth : 20 };
        return updated;
      });
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handler for image file changes
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageData(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handler for pasting an image from the clipboard
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onloadend = () => setImageData(reader.result);
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // Handler to remove the preview image
  const handleRemoveImage = () => setImageData(null);

  // Fills the form with dummy data (for testing)
  const handleFillDummy = () => {
    setTitle("Apocalypse Now");
    setCategory("Movie");
    setType("Live action");
    setWatchedStatus("Not Started");
    setRecommendations("Me no like");
    setReleaseYear("1979");
    setLengthEpisodes("153");
    setSynopsis(
      "Apocalypse Now is an engaging film that tells a compelling story with rich characters and dramatic moments."
    );
    setImageData(null);
    setSeason(1);
    setEpisode(1);
  };

  // Clears the form and resets edit mode
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

  // Handles form submission for creating or updating a record
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
      // Add updatedAt timestamp for recent updates
      const updatedPayload = {
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      fetch(`/api/records/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
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

  // Populates the form with an existing record's data for editing
  const handleEdit = (record) => {
    setEditMode(true);
    setEditId(record.id);
    setTitle(getField(record, "title"));
    setCategory(getField(record, "category"));
    setType(getField(record, "type"));
    const ws = getField(record, "watchedStatus");
    if (
      getField(record, "category").toLowerCase() === "series" &&
      ws.includes("S")
    ) {
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

  // Handles deletion of a record after confirmation
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

  // Filter records based on the search query (case-insensitive)
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

  // Sort records so that the most recently updated (or added) record appears at the top
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.date_added);
    const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.date_added);
    return dateB - dateA;
  });

  // Handler for sorting by clicking on table headers (if needed to override default sorting)
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <Container>
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Main>
        {/* Record Creation / Update Form */}
        <CreationFormContainer>
          <form onSubmit={handleSubmit}>
            <SectionTitles>Create/Update Record</SectionTitles>
            {message && <Message>{message}</Message>}
            <FormGrid>
              {/* Column 1: Title, Category, Type, Recommendations */}
              <FormGroup>
                <label>Title:</label>
                <StyledInput
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup>
                <label>Category:</label>
                <StyledSelect
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="Movie">Movie</option>
                  <option value="Series">Series</option>
                  <option value="Game">Game</option>
                  <option value="Other">Other</option>
                </StyledSelect>
              </FormGroup>
              <FormGroup>
                <label>Type:</label>
                <StyledSelect
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Live action">Live action</option>
                  <option value="Cartoon">Cartoon</option>
                  <option value="Anime">Anime</option>
                  <option value="3D Animation">3D Animation</option>
                  <option value="Mix">Mix</option>
                  <option value="Other">Other</option>
                </StyledSelect>
              </FormGroup>
              <FormGroup>
                <label>Recommendations:</label>
                <StyledSelect
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="El Epico">El Epico</option>
                  <option value="Good; liked it">Good; liked it</option>
                  <option value="Good; did not like">Good; did not like</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Fell off">Fell off</option>
                  <option value="Bad; liked it">Bad; liked it</option>
                  <option value="Bad; did not like">Bad; did not like</option>
                  <option value="Utter trash">Utter trash</option>
                </StyledSelect>
              </FormGroup>
              {/* Column 2: Watched Status; Nested grid for Season/Episode and Release Year/Length/Episodes */}
              <FormGroup>
                <label>Watched Status:</label>
                <StyledSelect
                  value={watchedStatus}
                  onChange={(e) => setWatchedStatus(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </StyledSelect>
              </FormGroup>
              <FormGroup>
                <NestedGrid>
                  <div>
                    <label>Season:</label>
                    <StyledInput
                      type="number"
                      value={season}
                      min="1"
                      onChange={(e) => setSeason(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Episode:</label>
                    <StyledInput
                      type="number"
                      value={episode}
                      min="1"
                      onChange={(e) => setEpisode(e.target.value)}
                    />
                  </div>
                </NestedGrid>
              </FormGroup>
              <FormGroup>
                <NestedGrid>
                  <div>
                    <label>Release Year:</label>
                    <StyledInput
                      type="number"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label>Length/Episodes:</label>
                    <StyledInput
                      type="number"
                      value={lengthEpisodes}
                      onChange={(e) => setLengthEpisodes(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <SubmitButton type="submit">
                      {editMode ? "Update Record" : "Add Record"}
                    </SubmitButton>
                    <DummyButton type="button" onClick={handleFillDummy}>
                      Fill Dummy Data
                    </DummyButton>
                  </div>
                </NestedGrid>
              </FormGroup>
              {/* Column 3: Synopsis and Image Upload/Paste */}
              <FormGroup span="2">
                <label>Synopsis:</label>
                <StyledTextarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  required
                  rows="2"
                />
              </FormGroup>
              <FormGroup>
                <label>Image Upload / Paste:</label>
                <StyledInput
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div
                  style={{
                    border: "1px dashed rgb(204, 204, 204)",
                    padding: "10px",
                    marginTop: "10px",
                    cursor: "text",
                  }}
                  onPaste={handlePaste}
                >
                  Click here and press Ctrl+V to paste an image
                </div>
                {imageData && (
                  <div style={{ position: "relative", marginTop: "10px" }}>
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
                        background: "rgb(255, 0, 0)",
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
              </FormGroup>
            </FormGrid>
          </form>
        </CreationFormContainer>
        <SectionTitles>Existing Media</SectionTitles>
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="checkbox"
              checked={skipConfirm}
              onChange={(e) => setSkipConfirm(e.target.checked)}
            />
            Delete without confirmation
          </label>
        </div>
        <StyledTable>
          <thead>
            <tr>
              <ResizableTh width={50}>Actions</ResizableTh>
              <ResizableTh width={columnWidths.index}>
                #
                <Resizer onMouseDown={(e) => handleMouseDown(e, "index")} />
              </ResizableTh>
              <ResizableTh
                width={columnWidths.title}
                onClick={() => handleSort("title")}
              >
                Title{" "}
                {sortColumn === "title" && sortDirection === "asc"
                  ? "▲"
                  : sortColumn === "title" && sortDirection === "desc"
                  ? "▼"
                  : ""}
                <Resizer onMouseDown={(e) => handleMouseDown(e, "title")} />
              </ResizableTh>
              <ResizableTh
                width={columnWidths.category}
                onClick={() => handleSort("category")}
              >
                Category{" "}
                {sortColumn === "category" && sortDirection === "asc"
                  ? "▲"
                  : sortColumn === "category" && sortDirection === "desc"
                  ? "▼"
                  : ""}
                <Resizer onMouseDown={(e) => handleMouseDown(e, "category")} />
              </ResizableTh>
              <ResizableTh
                width={columnWidths.type}
                onClick={() => handleSort("type")}
              >
                Type{" "}
                {sortColumn === "type" && sortDirection === "asc"
                  ? "▲"
                  : sortColumn === "type" && sortDirection === "desc"
                  ? "▼"
                  : ""}
                <Resizer onMouseDown={(e) => handleMouseDown(e, "type")} />
              </ResizableTh>
              <ResizableTh
                width={columnWidths.watchedStatus}
                onClick={() => handleSort("watchedStatus")}
              >
                Watched Status{" "}
                {sortColumn === "watchedStatus" && sortDirection === "asc"
                  ? "▲"
                  : sortColumn === "watchedStatus" && sortDirection === "desc"
                  ? "▼"
                  : ""}
                <Resizer
                  onMouseDown={(e) => handleMouseDown(e, "watchedStatus")}
                />
              </ResizableTh>
              <ResizableTh
                width={columnWidths.recommendations}
                onClick={() => handleSort("recommendations")}
              >
                Recommendations{" "}
                {sortColumn === "recommendations" && sortDirection === "asc"
                  ? "▲"
                  : sortColumn === "recommendations" && sortDirection === "desc"
                  ? "▼"
                  : ""}
                <Resizer
                  onMouseDown={(e) => handleMouseDown(e, "recommendations")}
                />
              </ResizableTh>
              <ResizableTh
                width={columnWidths.releaseYear}
                onClick={() => handleSort("releaseYear")}
              >
                Release Year{" "}
                {sortColumn === "releaseYear" && sortDirection === "asc"
                  ? "▲"
                  : sortColumn === "releaseYear" && sortDirection === "desc"
                  ? "▼"
                  : ""}
                <Resizer
                  onMouseDown={(e) => handleMouseDown(e, "releaseYear")}
                />
              </ResizableTh>
              <ResizableTh
                width={columnWidths.lengthEpisodes}
                onClick={() => handleSort("lengthEpisodes")}
              >
                Length/Episodes{" "}
                {sortColumn === "lengthEpisodes" && sortDirection === "asc"
                  ? "▲"
                  : sortColumn === "lengthEpisodes" && sortDirection === "desc"
                  ? "▼"
                  : ""}
                <Resizer
                  onMouseDown={(e) => handleMouseDown(e, "lengthEpisodes")}
                />
              </ResizableTh>
              <ResizableTh width={columnWidths.synopsis}>
                Synopsis
                <Resizer onMouseDown={(e) => handleMouseDown(e, "synopsis")} />
              </ResizableTh>
              <ResizableTh width={100}>Image</ResizableTh>
              <ResizableTh width={50}>Actions</ResizableTh>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record, index) => (
              <StyledTr key={record.id} index={index}>
                {/* Left-side action buttons */}
                <StyledTd>
                  <button onClick={() => handleEdit(record)}>Update</button>
                  <button onClick={() => handleDelete(record)}>Delete</button>
                </StyledTd>
                <StyledTd>{index + 1}</StyledTd>
                <StyledTd>{getField(record, "title")}</StyledTd>
                <StyledTd>{getField(record, "category")}</StyledTd>
                <StyledTd>{getField(record, "type")}</StyledTd>
                <StyledTd>{getField(record, "watchedStatus")}</StyledTd>
                <StyledTd>{getField(record, "recommendations")}</StyledTd>
                <StyledTd>{getField(record, "releaseYear")}</StyledTd>
                <StyledTd>{getField(record, "lengthEpisodes")}</StyledTd>
                <SynopsisTd title={getField(record, "synopsis")}>
                  {(getField(record, "synopsis") + "").length > 50
                    ? (getField(record, "synopsis") + "").substring(0, 50) +
                      "..."
                    : getField(record, "synopsis")}
                </SynopsisTd>
                <StyledTd style={{ overflow: "visible" }}>
                  {record.image ? (
                    <Image src={record.image} alt={getField(record, "title")} />
                  ) : (
                    "No Image"
                  )}
                </StyledTd>
                {/* Right-side action buttons */}
                <StyledTd>
                  <button onClick={() => handleEdit(record)}>Update</button>
                  <button onClick={() => handleDelete(record)}>Delete</button>
                </StyledTd>
              </StyledTr>
            ))}
          </tbody>
        </StyledTable>
      </Main>
      <ScrollToTop />
    </Container>
  );
}

export default Admin;
