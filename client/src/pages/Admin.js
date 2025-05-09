// client/src/Admin.js
import React, { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import Navbar from "../components/Navbar";
import styled from "styled-components";
import ScrollToTop from "../components/ScrollToTop";
import MediaTable from "../components/MediaTable";
import { API_BASE_URL } from "../utils/api"; // Import the base URL

// Mapping from camelCase keys to the underscore keys used in the database
const fieldMapping = {
  releaseYear: "release_year",
  lengthEpisodes: "length_or_episodes",
  watchedStatus: "watched_status",
  dateAdded: "date_added",
};

// Helper function to get field value from record
function getField(record, field) {
  if (record[field] !== undefined) return record[field];
  if (fieldMapping[field] && record[fieldMapping[field]] !== undefined)
    return record[fieldMapping[field]];
  return record[field.charAt(0).toUpperCase() + field.slice(1)] || "";
}

// Helper function for episode dropdown options
function getEpisodeOptions() {
  const options = ["26+"];
  for (let i = 26; i >= 1; i--) {
    options.push(i);
  }
  return options;
}

// Generate year options from current year down to 2001 then add a special "2000>" option.
function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 2001; y--) {
    years.push(y);
  }
  years.push("2000>");
  return years;
}

// Generate episode count options for series
function getEpisodeCountOptions(max = 29) {
  const options = ["30+"];
  for (let i = max; i >= 1; i--) {
    options.push(i);
  }
  return options;
}

// Helper for season dropdown (1 to max)
const getNumberOptions = (max, currentValue) => {
  let options = [];
  for (let i = 1; i <= max; i++) {
    options.push(i);
  }
  if (currentValue > max && !options.includes(currentValue)) {
    options.push(currentValue);
    options.sort((a, b) => a - b);
  }
  return options;
};

// Styled Components
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
  color: rgb(238, 238, 238);
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

// Styled Components for Login
const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: rgb(197, 7, 231);
`;

const LoginForm = styled.form`
  background-color: rgb(46, 46, 46);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const LoginInput = styled.input`
  padding: 10px;
  margin-bottom: 10px;
  width: 300px;
  border: 1px solid rgb(80, 80, 80);
  border-radius: 4px;
  background-color: rgb(58, 58, 58);
  color: rgb(238, 238, 238);
`;

const LoginButton = styled.button`
  padding: 10px;
  width: 320px;
  background-color: rgb(68, 68, 68);
  color: rgb(238, 238, 238);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: rgb(65, 113, 203);
  }
`;

function Admin() {
  // Authentication State
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || null
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Persistent fields state
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState(
    localStorage.getItem("lastCategory") || ""
  );
  const [type, setType] = useState(
    localStorage.getItem("lastType") || "Live action"
  );
  const [watchedStatus, setWatchedStatus] = useState(
    localStorage.getItem("lastWatchedStatus") || ""
  );
  const [season, setSeason] = useState(
    Number(localStorage.getItem("lastSeason")) || 1
  );
  const [episode, setEpisode] = useState(
    Number(localStorage.getItem("lastEpisode")) || 1
  );
  const [releaseYear, setReleaseYear] = useState(
    localStorage.getItem("lastReleaseYear") || ""
  );
  const [lengthEpisodes, setLengthEpisodes] = useState(
    localStorage.getItem("lastLengthEpisodes") || ""
  );

  // Reset fields state
  const [title, setTitle] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [comment, setComment] = useState("");
  const [imageData, setImageData] = useState("");

  // New state for manual inputs
  const [manualReleaseYear, setManualReleaseYear] = useState("");
  const [manualEpisode, setManualEpisode] = useState("");

  // Additional state for the Episode Count dropdown (if needed)
  const [episodeCount, setEpisodeCount] = useState("");
  const [manualEpisodeCount, setManualEpisodeCount] = useState("");

  // Table and UI state
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [columnWidths, setColumnWidths] = useState({
    index: 30,
    title: 40,
    category: 30,
    type: 20,
    watchedStatus: 30,
    recommendations: 30,
    releaseYear: 20,
    lengthEpisodes: 20,
    synopsis: 300,
    comment: 300,
  });

  // Persist persistent fields to localStorage
  useEffect(() => {
    localStorage.setItem("lastCategory", category);
  }, [category]);
  useEffect(() => {
    localStorage.setItem("lastType", type);
  }, [type]);
  useEffect(() => {
    localStorage.setItem("lastWatchedStatus", watchedStatus);
  }, [watchedStatus]);
  useEffect(() => {
    localStorage.setItem("lastSeason", season);
  }, [season]);
  useEffect(() => {
    localStorage.setItem("lastEpisode", episode);
  }, [episode]);
  useEffect(() => {
    localStorage.setItem("lastReleaseYear", releaseYear);
  }, [releaseYear]);
  useEffect(() => {
    localStorage.setItem("lastLengthEpisodes", lengthEpisodes);
  }, [lengthEpisodes]);

  // Check token expiration on mount
  useEffect(() => {
    if (token) {
      try {
        const payload = jwtDecode(token);
        if (payload.exp * 1000 < Date.now()) {
          setToken(null);
          localStorage.removeItem("adminToken");
        }
      } catch (err) {
        console.error("Error decoding token:", err);
        setToken(null);
        localStorage.removeItem("adminToken");
      }
    }
  }, [token]);

  // Function to fetch records
  const fetchRecords = useCallback(() => {
    if (token) {
      fetch(`${API_BASE_URL}/media_records`, {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => res.json())
        .then((data) => setRecords(data))
        .catch((err) => console.error("Error fetching records:", err));
    }
  }, [token]);

  // Initial fetch
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Helper: Check auth response and auto-logout if session expired
  const checkAuthResponse = (res) => {
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error("Session expired, please log in again.");
    }
    return res.json();
  };

  // New Dropdown Options
  const yearOptions = getYearOptions();
  const seasonOptions = getNumberOptions(10, season);

  // --- Handlers for Column Resizing ---
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

  // --- Handlers for File Upload/Paste ---
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

  const handleRemoveImage = () => setImageData("");

  const handleFillDummy = () => {
    setTitle("Apocalypse Now");
    setRecommendations("Me no like");
    setReleaseYear("1979");
    setLengthEpisodes("153");
    setSynopsis(
      "Apocalypse Now is an engaging film that tells a compelling story with rich characters and dramatic moments."
    );
    setComment("Great movie!");
    setImageData("");
    setEpisodeCount("");
    setManualEpisodeCount("");
    setManualReleaseYear("");
    setManualEpisode("");
  };

  const clearForm = () => {
    setTitle("");
    setRecommendations("");
    setSynopsis("");
    setComment("");
    setImageData("");
    setEpisodeCount("");
    setManualEpisodeCount("");
    setManualReleaseYear("");
    setManualEpisode("");
    setEditMode(false);
    setEditId(null);
  };

  // Handler for submitting a record
  const handleSubmit = (e) => {
    e.preventDefault();
    // Determine final episode value:
    const finalEpisode =
      episode === "26+" ? Number(manualEpisode) : Number(episode);
    // Process watched status for series
    let finalStatus = watchedStatus;
    if (
      (category.toLowerCase() === "series" ||
        category.toLowerCase() === "one off series") &&
      watchedStatus.toLowerCase() === "in progress"
    ) {
      finalStatus = `${watchedStatus} (S${season} E${finalEpisode})`;
    }
    // Append season to title for series (only for "series", not "one off series")
    let finalTitle = title;
    if (category.toLowerCase() === "series") {
      finalTitle = `${title} - Season ${season}`;
    }
    // Determine final length/episodes count
    let finalLength;
    if (category.toLowerCase() === "movie") {
      finalLength = Number(lengthEpisodes);
    } else {
      if (episodeCount === "30+") {
        finalLength = Number(manualEpisodeCount);
      } else {
        finalLength = Number(episodeCount) || Number(lengthEpisodes);
      }
    }
    // Determine final release year:
    const finalReleaseYear =
      releaseYear === "2000>" ? Number(manualReleaseYear) : Number(releaseYear);

    const payload = {
      title: finalTitle,
      category,
      type,
      watched_status: finalStatus,
      recommendations,
      release_year: finalReleaseYear,
      length_or_episodes: finalLength,
      synopsis,
      comment,
      image: imageData || null,
    };

    if (editMode && editId) {
      const updatedPayload = {
        ...payload,
        updated_at: new Date().toISOString(),
      };
      fetch(`${API_BASE_URL}/media_records/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(updatedPayload),
      })
        .then(checkAuthResponse)
        .then((data) => {
          setMessage(`Record "${data.title}" updated successfully.`);
          clearForm();
          fetchRecords();
        })
        .catch((err) => {
          console.error("Error updating record:", err);
          setMessage(`Error updating record: ${err.message}`);
        });
    } else {
      fetch(`${API_BASE_URL}/media_records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      })
        .then(checkAuthResponse)
        .then((data) => {
          setMessage(`Record added successfully with ID: ${data.id}`);
          clearForm();
          fetchRecords();
        })
        .catch((err) => {
          console.error("Error adding record:", err);
          setMessage(`Error adding record: ${err.message}`);
        });
    }
  };

  // Handler for editing a record
  const handleEdit = (record) => {
    setEditMode(true);
    setEditId(record.id);
    // Remove appended season text from title if present.
    const currentTitle = getField(record, "title");
    setTitle(currentTitle.replace(/ - Season\s*\d+$/, ""));
    setCategory(getField(record, "category"));
    setType(getField(record, "type"));
    const ws = getField(record, "watchedStatus");
    if (
      (getField(record, "category").toLowerCase() === "series" ||
        getField(record, "category").toLowerCase() === "one off series") &&
      ws.toLowerCase().includes("in progress")
    ) {
      const match = ws.match(/(In Progress)\s*\(S(\d+)\s*E(\d+)\)/i);
      if (match) {
        setWatchedStatus(match[1]);
        setSeason(Number(match[2]));
        const ep = Number(match[3]);
        if (ep > 25) {
          setEpisode("26+");
          setManualEpisode(ep.toString());
        } else {
          setEpisode(ep);
          setManualEpisode("");
        }
      } else {
        setWatchedStatus(ws);
        setSeason(1);
        setEpisode(1);
        setManualEpisode("");
      }
    } else {
      setWatchedStatus(ws);
    }
    // For release year, if the value is less than 2001, use manual input.
    const ry = Number(getField(record, "releaseYear"));
    if (ry < 2001) {
      setReleaseYear("2000>");
      setManualReleaseYear(ry.toString());
    } else {
      setReleaseYear(ry.toString());
      setManualReleaseYear("");
    }
    setRecommendations(getField(record, "recommendations"));
    setLengthEpisodes(getField(record, "lengthEpisodes"));
    setSynopsis(getField(record, "synopsis"));
    setImageData(record.image || "");
    setComment(getField(record, "comment"));
    // Reset dropdown states for episode count/release year if applicable
    setEpisodeCount("");
    setManualEpisodeCount("");
  };

  // Handler for deleting a record
  const handleDelete = (record) => {
    if (!skipConfirm) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete record "${getField(record, "title")}"?`
      );
      if (!confirmDelete) return;
    }
    fetch(`${API_BASE_URL}/media_records/${record.id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
      .then(checkAuthResponse)
      .then(() => {
        setMessage(
          `Record "${getField(record, "title")}" deleted successfully.`
        );
        fetchRecords();
      })
      .catch((err) => {
        console.error("Error deleting record:", err);
        setMessage(`Error deleting record: ${err.message}`);
      });
  };

  // Handler for logging in
  const handleLogin = (e) => {
    e.preventDefault();
    fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid credentials");
        return res.json();
      })
      .then((data) => {
        setToken(data.token);
        localStorage.setItem("adminToken", data.token);
        setMessage("");
        fetchRecords();
      })
      .catch((err) => {
        setMessage("Login failed: " + err.message);
      });
  };

  // Handler for logging out
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("adminToken");
  };

  // Filter and sort records
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
    const dateA = a.updated_at
      ? new Date(a.updated_at)
      : new Date(a.date_added);
    const dateB = b.updated_at
      ? new Date(b.updated_at)
      : new Date(b.date_added);
    return dateB - dateA;
  });

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return token ? (
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
                />
              </FormGroup>
              <FormGroup>
                <label>Category:</label>
                <StyledSelect
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Movie">Movie</option>
                  <option value="Series">Series</option>
                  <option value="One off series">One off series</option>
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
                    <StyledSelect
                      value={season}
                      onChange={(e) => setSeason(Number(e.target.value))}
                    >
                      {seasonOptions.map((num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>
                  <div>
                    <label>Episode:</label>
                    <StyledSelect
                      value={episode}
                      onChange={(e) => setEpisode(e.target.value)}
                    >
                      <option value="">Select Episode</option>
                      {getEpisodeOptions().map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </StyledSelect>
                    {episode === "26+" && (
                      <StyledInput
                        type="number"
                        placeholder="Enter episode number"
                        value={manualEpisode}
                        onChange={(e) => setManualEpisode(e.target.value)}
                      />
                    )}
                  </div>
                </NestedGrid>
              </FormGroup>
              <FormGroup>
                <NestedGrid>
                  <div>
                    <label>Release Year:</label>
                    <StyledSelect
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(e.target.value)}
                    >
                      <option value="">Select Year</option>
                      {yearOptions.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </StyledSelect>
                    {releaseYear === "2000>" && (
                      <StyledInput
                        type="number"
                        placeholder="Enter release year"
                        value={manualReleaseYear}
                        onChange={(e) => setManualReleaseYear(e.target.value)}
                      />
                    )}
                  </div>
                  <div>
                    <label>
                      {category.toLowerCase() === "movie"
                        ? "Length (minutes):"
                        : "Episodes Count:"}
                    </label>
                    {category.toLowerCase() === "movie" ? (
                      <StyledInput
                        type="number"
                        value={lengthEpisodes}
                        onChange={(e) => setLengthEpisodes(e.target.value)}
                      />
                    ) : (
                      <>
                        <StyledSelect
                          value={episodeCount}
                          onChange={(e) => setEpisodeCount(e.target.value)}
                        >
                          <option value="">Select Episodes</option>
                          {getEpisodeCountOptions().map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </StyledSelect>
                        {episodeCount === "30+" && (
                          <StyledInput
                            type="number"
                            placeholder="Enter total episodes"
                            value={manualEpisodeCount}
                            onChange={(e) =>
                              setManualEpisodeCount(e.target.value)
                            }
                          />
                        )}
                      </>
                    )}
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
                  rows="2"
                />
                <label>Comment:</label>
                <StyledTextarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
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
        <div style={{ marginTop: "20px" }}>
          <button onClick={handleLogout}>Log Out</button>
        </div>
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
          doubleActions={true}
          handleRowClick={() => {}}
        />
      </Main>
      <ScrollToTop />
    </Container>
  ) : (
    <LoginContainer>
      <LoginForm onSubmit={handleLogin}>
        <h2>Admin Login</h2>
        {message && <Message>{message}</Message>}
        <LoginInput
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <LoginInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <LoginButton type="submit">Log In</LoginButton>
      </LoginForm>
    </LoginContainer>
  );
}

export default Admin;
