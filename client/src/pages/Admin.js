// client/src/Admin.js
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import styled from "styled-components";
import ScrollToTop from "../components/ScrollToTop";
import MediaTable from "../components/MediaTable";

// Mapping from camelCase keys to the underscore keys used in the database
const fieldMapping = {
  releaseYear: "release_year",
  lengthEpisodes: "length_or_episodes",
  watchedStatus: "watched_status",
  dateAdded: "date_added",
};

// Helper function to get a field value from a record using our mapping
function getField(record, field) {
  if (record[field] !== undefined) return record[field];
  if (fieldMapping[field] && record[fieldMapping[field]] !== undefined)
    return record[fieldMapping[field]];
  return record[field.charAt(0).toUpperCase() + field.slice(1)] || "";
}

// ----- Styled Components for Layout and Styling -----
const Container = styled.div`
  background-color: rgb(197, 7, 231);
  color: rgb(183, 183, 183);
  min-height: 100vh;
  margin: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
  padding-top: 80px; /* Leaves space for the fixed Navbar */
`;

const Main = styled.main`
  background-color: rgb(46, 46, 46);
  padding: 10px;
  padding-bottom: 10em;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
`;

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

const SectionTitles = styled.div`
  color: rgb(192, 73, 248);
  font-size: 2em;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

const NestedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  grid-column: ${(props) => (props.span ? props.span : "auto")};
  outline: 1px dashed rgba(255, 0, 0, 0.5);
`;

const StyledInput = styled.input`
  padding: 6px;
  font-size: 1rem;
  border: 1px solid rgb(80, 80, 80);
  border-radius: 4px;
  background-color: rgb(58, 58, 58);
  color: rgb(58, 58, 58);
`;

const StyledSelect = styled.select`
  padding: 6px;
  font-size: 1rem;
  border: 1px solid rgb(80, 80, 80);
  border-radius: 4px;
  background-color: rgb(58, 58, 58);
  color: rgb(238, 238, 238);
`;

const StyledTextarea = styled.textarea`
  padding: 6px;
  font-size: 1rem;
  border: 1px solid rgb(80, 80, 80);
  border-radius: 4px;
  background-color: rgb(58, 58, 58);
  color: rgb(238, 238, 238);
`;

const SubmitButton = styled.button`
  padding: 8px 16px;
  font-size: 1.1rem;
  background-color: rgb(68, 68, 68);
  color: rgb(238, 238, 238);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  &:hover {
    background-color: rgb(65, 113, 203);
  }
`;

const DummyButton = styled.button`
  padding: 8px 16px;
  font-size: 1.1rem;
  background-color: rgb(80, 80, 80);
  color: rgb(238, 238, 238);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  margin-left: 10px;
  &:hover {
    background-color: rgb(65, 113, 203);
  }
`;

const Message = styled.p`
  font-size: 1rem;
  color: rgb(255, 255, 0);
  margin-top: 10px;
`;

// ----- Table Styled Components (for displaying records) -----
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  table-layout: fixed;
`;

const StyledTd = styled.td`
  padding: 10px;
  border: 1px solid rgb(85, 85, 85);
  text-align: center;
`;

const StyledTr = styled.tr`
  background-color: ${(props) => (props.index % 2 === 0 ? "#333" : "#2a2a2a")};
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    background-color: #777;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
`;

const SynopsisTd = styled.td`
  padding: 10px;
  border: 1px solid rgb(85, 85, 85);
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
  max-width: 300px;
`;

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

const Resizer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  user-select: none;
`;

// ----- Initial Column Widths for the MediaTable Component -----
const initialColumnWidths = {
  index: 10,
  title: 120,
  category: 20,
  type: 20,
  watchedStatus: 50,
  recommendations: 50,
  releaseYear: 20,
  lengthEpisodes: 20,
  synopsis: 100,
  comment: 150,
};

function Admin() {
  // ----- Form State: Holds data for creating/updating a record -----
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
  // NEW: State for Comment field
  const [comment, setComment] = useState("");
  const [imageData, setImageData] = useState(null);
  const [message, setMessage] = useState("");

  // ----- Table State: Holds fetched records and controls search/sort functionality -----
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);

  // ----- Load Saved Column Widths from localStorage -----
  useEffect(() => {
    const savedWidths = localStorage.getItem("adminColumnWidths");
    if (savedWidths) setColumnWidths(JSON.parse(savedWidths));
  }, []);

  // ----- Persist Column Widths to localStorage when changed -----
  useEffect(() => {
    localStorage.setItem("adminColumnWidths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  // ----- Fetch Records from PostgreSQL API Endpoint -----
  useEffect(() => {
    fetch("/api/media_records")
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, [message]);

  // ----- Handler for Resizing Table Columns -----
  const handleMouseDown = (e, column) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[column];
    const handleMouseMove = (moveEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      setColumnWidths((prev) => ({
        ...prev,
        [column]: newWidth > 20 ? newWidth : 20,
      }));
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // ----- Handler for File Input Changes (Image Upload) -----
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageData(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ----- Handler for Pasting an Image from the Clipboard -----
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

  // ----- Handler to Remove the Preview Image -----
  const handleRemoveImage = () => setImageData(null);

  // ----- Handler to Fill the Form with Dummy Data (for testing) -----
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
    // Set a dummy comment as well
    setComment("Great movie!");
    setImageData(null);
    setSeason(1);
    setEpisode(1);
  };

  // ----- Clears the Form and Resets Edit Mode -----
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
    setComment(""); // Clear the comment field
    setImageData(null);
    setEditMode(false);
    setEditId(null);
  };

  // ----- Handler for Form Submission (Create or Update Record) -----
  const handleSubmit = (e) => {
    e.preventDefault();
    let finalWatchedStatus = watchedStatus;
    // Append season and episode info if category is "series"
    if (category.toLowerCase() === "series") {
      finalWatchedStatus = `${watchedStatus} (S${season} E${episode})`;
    }
    // Include the comment in the payload
    const payload = {
      title,
      category,
      type,
      watched_status: finalWatchedStatus,
      recommendations,
      release_year: Number(releaseYear),
      length_or_episodes: Number(lengthEpisodes),
      synopsis,
      comment, // NEW: comment field added
      image: imageData || null,
    };
    if (editMode && editId) {
      // Include updated_at timestamp in snake_case to match DB column
      const updatedPayload = {
        ...payload,
        updated_at: new Date().toISOString(),
      };
      // Send a PUT request to update the record
      fetch(`/api/media_records/${editId}`, {
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
      // Send a POST request to create a new record
      fetch("/api/media_records", {
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

  // ----- Handler to Populate the Form with an Existing Record for Editing -----
  const handleEdit = (record) => {
    setEditMode(true);
    setEditId(record.id);
    setTitle(getField(record, "title"));
    setCategory(getField(record, "category"));
    setType(getField(record, "type"));
    const ws = getField(record, "watchedStatus");
    // If the category is "series" and watchedStatus contains season/episode info, extract it
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
    // NEW: Populate the comment field for editing
    setComment(getField(record, "comment"));
  };

  // ----- Handler for Deleting a Record after User Confirmation -----
  const handleDelete = (record) => {
    const proceed =
      skipConfirm ||
      window.confirm(
        `Are you sure you want to delete record #${
          records.findIndex((r) => r.id === record.id) + 1
        } "${getField(record, "title")}"?`
      );
    if (!proceed) return;
    fetch(`/api/media_records/${record.id}`, { method: "DELETE" })
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

  // ----- Filter Records Based on the Search Query (Case-Insensitive) -----
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

  // ----- Sort Records so that the Most Recent (by updated_at or date_added) Appears at the Top -----
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const dateA = a.updated_at
      ? new Date(a.updated_at)
      : new Date(a.date_added);
    const dateB = b.updated_at
      ? new Date(b.updated_at)
      : new Date(b.date_added);
    return dateB - dateA;
  });

  // ----- Handler for Sorting When Clicking on Table Header Cells -----
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // ----- Render the Admin Page -----
  return (
    <Container>
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Main>
        <CreationFormContainer>
          <form onSubmit={handleSubmit}>
            <SectionTitles>Create/Update Record</SectionTitles>
            {message && <Message>{message}</Message>}
            <FormGrid>
              {/* Title Field */}
              <FormGroup>
                <label>Title:</label>
                <StyledInput
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </FormGroup>
              {/* Category Field */}
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
              {/* Type Field */}
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
              {/* Recommendations Field */}
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
              {/* Watched Status Field */}
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
              {/* Season & Episode Fields */}
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
              {/* Release Year, Length/Episodes, and Action Buttons */}
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
              {/* Synopsis and Comment Fields in the Same Grid Block */}
              <FormGroup span="2">
                <label>Synopsis:</label>
                <StyledTextarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  required
                  rows="2"
                />
                {/* NEW: Comment Text Area */}
                <label>Comment:</label>
                <StyledTextarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="2"
                />
              </FormGroup>
              {/* Image Upload / Paste Field */}
              <FormGroup>
                <label>Image Upload / Paste:</label>
                <StyledInput
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div
                  style={{
                    border: "1px dashed rgb(204,204,204)",
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
                        background: "rgb(255,0,0)",
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
        {/* Render MediaTable with action buttons on both sides for Admin */}
        <MediaTable
          records={sortedRecords}
          columnWidths={columnWidths}
          setColumnWidths={setColumnWidths}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          handleSort={handleSort}
          getField={getField}
          handleMouseDown={handleMouseDown}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          doubleActions={true} // Action buttons appear on both left and right in Admin view
          handleRowClick={() => {}} // No row click action in Admin view
        />
      </Main>
      <ScrollToTop />
    </Container>
  );
}

export default Admin;
