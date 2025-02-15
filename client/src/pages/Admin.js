// client/src/Admin.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import styled from "styled-components";
import ScrollToTop from "../components/ScrollToTop";

const fieldMapping = {
  releaseYear: "release_year",
  lengthEpisodes: "length_or_episodes",
  watchedStatus: "watched_status",
  dateAdded: "date_added",
};

function getField(record, field) {
  if (record[field] !== undefined) return record[field];
  if (fieldMapping[field] && record[fieldMapping[field]] !== undefined)
    return record[fieldMapping[field]];
  return record[field.charAt(0).toUpperCase() + field.slice(1)] || "";
}

const Container = styled.div`
  background-color: rgb(197, 7, 231);
  color: rgb(183, 183, 183);
  min-height: 100vh;
  margin: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
  padding-top: 80px;
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
  color: #eee;
`;

const StyledTextarea = styled.textarea`
  padding: 6px;
  font-size: 1rem;
  border: 1px solid rgb(80, 80, 80);
  border-radius: 4px;
  background-color: rgb(58, 58, 58);
  color: #eee;
`;

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

const Message = styled.p`
  font-size: 1rem;
  color: #ff0;
  margin-top: 10px;
`;

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
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);

  useEffect(() => {
    const savedWidths = localStorage.getItem("adminColumnWidths");
    if (savedWidths) setColumnWidths(JSON.parse(savedWidths));
  }, []);

  useEffect(() => {
    localStorage.setItem("adminColumnWidths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    fetch("/api/records")
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, [message]);

  const handleMouseDown = (e, column) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[column];
    const handleMouseMove = (e) => {
      const newWidth = startWidth + (e.clientX - startX);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageData(reader.result);
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
        reader.onloadend = () => setImageData(reader.result);
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  const handleRemoveImage = () => setImageData(null);

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
    if (!sortColumn) {
      const dateA = a.updatedAt
        ? new Date(a.updatedAt)
        : new Date(a.date_added);
      const dateB = b.updatedAt
        ? new Date(b.updatedAt)
        : new Date(b.date_added);
      return dateB - dateA;
    }
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
    <Container>
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Main>
        <CreationFormContainer>
          <form onSubmit={handleSubmit}>
            <SectionTitles>Create/Update Record</SectionTitles>
            {message && <Message>{message}</Message>}
            <FormGrid>
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
                    border: "1px dashed #ccc",
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
