// client/src/Admin.js
import React, { useState, useEffect } from "react";
import jwtDecode from "jwt-decode"; // Import as default
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

function getField(record, field) {
  if (record[field] !== undefined) return record[field];
  if (fieldMapping[field] && record[fieldMapping[field]] !== undefined)
    return record[fieldMapping[field]];
  return record[field.charAt(0).toUpperCase() + field.slice(1)] || "";
}

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

  // Form State for Record Management
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
  const [comment, setComment] = useState("");
  const [imageData, setImageData] = useState(null);
  const [message, setMessage] = useState("");

  // Table State for Records
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [skipConfirm, setSkipConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [columnWidths, setColumnWidths] = useState({
    index: 30,
    title: 100,
    category: 100,
    type: 100,
    watchedStatus: 100,
    recommendations: 80,
    releaseYear: 100,
    lengthEpisodes: 100,
    synopsis: 300,
    comment: 50,
  });

  // Persist Column Widths
  useEffect(() => {
    const savedWidths = localStorage.getItem("adminColumnWidths");
    if (savedWidths) setColumnWidths(JSON.parse(savedWidths));
  }, []);
  useEffect(() => {
    localStorage.setItem("adminColumnWidths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Fetch Records (requires valid token)
  useEffect(() => {
    if (token) {
      fetch("/api/media_records", {
        headers: { Authorization: "Bearer " + token },
      })
        .then((res) => res.json())
        .then((data) => setRecords(data))
        .catch((err) => console.error("Error fetching records:", err));
    }
  }, [message, token]);

  // Helper: Check authentication in response
  const checkAuthResponse = (res) => {
    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error("Session expired, please log in again.");
    }
    return res.json();
  };

  // Handlers for column resizing, image upload, dummy data, clearing form...
  const handleMouseDown = (e, column) => {
    /* ... as before ... */
  };
  const handleFileChange = (e) => {
    /* ... as before ... */
  };
  const handlePaste = (e) => {
    /* ... as before ... */
  };
  const handleRemoveImage = () => setImageData(null);
  const handleFillDummy = () => {
    /* ... as before ... */
  };
  const clearForm = () => {
    /* ... as before ... */
  };

  // Handler for Submitting a Record (Create or Update)
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
      comment,
      image: imageData || null,
    };
    if (editMode && editId) {
      const updatedPayload = {
        ...payload,
        updated_at: new Date().toISOString(),
      };
      fetch(`/api/media_records/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(updatedPayload),
      })
        .then(checkAuthResponse)
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
      fetch("/api/media_records", {
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
        })
        .catch((err) => {
          console.error("Error adding record:", err);
          setMessage(`Error adding record: ${err.message}`);
        });
    }
  };

  // Handler for Editing a Record
  const handleEdit = (record) => {
    /* ... as before ... */
  };

  // Handler for Deleting a Record
  const handleDelete = (record) => {
    const proceed =
      skipConfirm ||
      window.confirm(
        `Are you sure you want to delete record #${
          records.findIndex((r) => r.id === record.id) + 1
        } "${getField(record, "title")}"?`
      );
    if (!proceed) return;
    fetch(`/api/media_records/${record.id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
      .then(checkAuthResponse)
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

  // Handler for Login
  const handleLogin = (e) => {
    e.preventDefault();
    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid credentials");
        }
        return res.json();
      })
      .then((data) => {
        setToken(data.token);
        localStorage.setItem("adminToken", data.token);
        setMessage("");
      })
      .catch((err) => {
        setMessage("Login failed: " + err.message);
      });
  };

  // Handler for Logout
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("adminToken");
  };

  // Filter and Sort Records
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
              {/* ... Render your form fields as shown above ... */}
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
        <div style={{ marginTop: "20px" }}>
          <button onClick={handleLogout}>Log Out</button>
        </div>
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
          required
        />
        <LoginInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <LoginButton type="submit">Log In</LoginButton>
      </LoginForm>
    </LoginContainer>
  );
}

export default Admin;
