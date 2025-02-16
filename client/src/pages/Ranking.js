// client/src/Ranking.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";

// Container for the entire page
const Container = styled.div`
  background-color: rgb(47, 47, 47);
  color: rgb(183, 183, 183);
  min-height: 100vh;
  margin: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
`;

// (Optional) Header styling (not used directly in JSX)
const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

// Page title styling
const Title = styled.h1`
  font-size: 4rem;
`;

// Main content area with extra padding to avoid fixed Navbar overlap
const Main = styled.main`
  background-color: rgb(46, 46, 46);
  padding: 10px;
  padding-top: 100px; /* Extra padding for Navbar */
  padding-bottom: 10em;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
`;

// Table styling for displaying media records
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  table-layout: fixed;
`;

// Table cell styling with padding, border, and centered text
const StyledTd = styled.td`
  padding: 10px;
  border: 1px solid rgb(85, 85, 85);
  text-align: center;
`;

// Table row styling with alternating row colors and a hover effect
const StyledTr = styled.tr`
  background-color: ${(props) =>
    props.index % 2 === 0 ? "rgb(51, 51, 51)" : "rgb(42, 42, 42)"};
  &:hover {
    background-color: rgb(85, 85, 85);
  }
`;

// Cell styling for the synopsis; allows text wrapping with a maximum width
const SynopsisTd = styled.td`
  padding: 10px;
  border: 1px solid rgb(85, 85, 85);
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
  max-width: 300px;
`;

// Image thumbnail styling with a scaling effect on hover
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

// Resizable table header cell styling – displays the column header and allows resizing
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

// Resizer element used for dragging to adjust column width
const Resizer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  user-select: none;
`;

// Initial column widths (in pixels) for the table columns
const initialColumnWidths = {
  index: 10,
  title: 100,
  category: 100,
  type: 100,
  watchedStatus: 100,
  recommendations: 80,
  releaseYear: 100,
  lengthEpisodes: 100,
  synopsis: 300,
};

// Mapping from camelCase keys to the database/JSON keys
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

function Ranking() {
  // State to store media records fetched from the backend
  const [records, setRecords] = useState([]);
  // State for the search query entered by the user
  const [searchQuery, setSearchQuery] = useState("");
  // States for sorting: which column and sort direction ("asc" or "desc")
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  // State for column widths (user-adjustable via drag, persisted to localStorage)
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);

  // On mount, load saved column widths from localStorage (if available)
  useEffect(() => {
    const savedWidths = localStorage.getItem("columnWidths");
    if (savedWidths) setColumnWidths(JSON.parse(savedWidths));
  }, []);

  // Fetch media records from the backend API (using PostgreSQL endpoint)
  useEffect(() => {
    fetch("/api/media_records")
      .then((response) => response.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

  // Filter records based on the search query (case-insensitive search)
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

  // Sort records. If no sort column is selected, sort by most recent (by updatedAt or date_added).
  // Otherwise, sort by the selected column. Implement a three-state toggle:
  // 1st click: ascending, 2nd click: descending, 3rd click: reset (default sorting)
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortColumn) {
      // Default sorting: most recent records at the top
      const dateA = a.updatedAt
        ? new Date(a.updatedAt)
        : new Date(a.date_added);
      const dateB = b.updatedAt
        ? new Date(b.updatedAt)
        : new Date(b.date_added);
      return dateB - dateA;
    } else {
      let valA = getField(a, sortColumn);
      let valB = getField(b, sortColumn);
      if (typeof valA === "string" && typeof valB === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }
  });

  // Handle column header click for sorting.
  // Toggles sorting order: ascending -> descending -> reset to default sort.
  const handleSort = (column) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handle mouse down on a column resizer to adjust column widths.
  // This function updates the columnWidths state and saves new widths to localStorage.
  const handleMouseDown = (e, column) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[column];
    const handleMouseMove = (e) => {
      const newWidth = startWidth + (e.clientX - startX);
      setColumnWidths((prev) => ({
        ...prev,
        [column]: newWidth > 20 ? newWidth : 20,
      }));
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      localStorage.setItem("columnWidths", JSON.stringify(columnWidths));
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle row click for updating the watched status.
  // Prompts the user to confirm if they have completed watching the series.
  // If confirmed, it updates the watched_status field accordingly.
  const handleRowClick = (record) => {
    const confirmFinish = window.confirm(
      "Have you completed watching this series?"
    );
    if (!confirmFinish) return;
    const currentStatus = getField(record, "watchedStatus");
    const currentDate = new Date().toISOString().slice(0, 10); // Format: yyyy-mm-dd
    let newStatus = "";
    const regex = /^Completed\s*\((\d+)\)(?:\n(.*))?$/i;
    const match = currentStatus.match(regex);
    if (match) {
      // If already marked as Completed, increment the counter and append the current date
      const count = parseInt(match[1], 10) + 1;
      const dates = match[2] ? match[2] + ", " + currentDate : currentDate;
      newStatus = `Completed (${count})\n${dates}`;
    } else {
      // Otherwise, set the initial Completed status
      newStatus = `Completed (1)\n${currentDate}`;
    }
    // Send a PUT request to update the watched_status and updatedAt timestamp
    fetch(`/api/media_records/${record.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watched_status: newStatus,
        updatedAt: new Date().toISOString(),
      }),
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
        alert(`Record "${data.title}" updated to:\n${data.watched_status}`);
        // Update local state with the updated record data
        setRecords((prevRecords) =>
          prevRecords.map((r) => (r.id === record.id ? data : r))
        );
      })
      .catch((err) => {
        console.error("Error updating record:", err);
        alert(`Error updating record: ${err.message}`);
      });
  };

  return (
    <Container>
      {/* Render the Navbar at the top */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Main>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Title>Media Ranker</Title>
        </div>
        {/* Render the media records table */}
        <StyledTable>
          <thead>
            <tr>
              {/* Column header for row numbers */}
              <ResizableTh width={columnWidths.index}>
                #
                <Resizer onMouseDown={(e) => handleMouseDown(e, "index")} />
              </ResizableTh>
              {/* Column header for Title with sorting behavior */}
              <ResizableTh
                width={columnWidths.title}
                onClick={() => handleSort("title")}
              >
                Title{" "}
                {sortColumn === "title"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
                <Resizer onMouseDown={(e) => handleMouseDown(e, "title")} />
              </ResizableTh>
              {/* Column header for Category */}
              <ResizableTh
                width={columnWidths.category}
                onClick={() => handleSort("category")}
              >
                Category{" "}
                {sortColumn === "category"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
                <Resizer onMouseDown={(e) => handleMouseDown(e, "category")} />
              </ResizableTh>
              {/* Column header for Type */}
              <ResizableTh
                width={columnWidths.type}
                onClick={() => handleSort("type")}
              >
                Type{" "}
                {sortColumn === "type"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
                <Resizer onMouseDown={(e) => handleMouseDown(e, "type")} />
              </ResizableTh>
              {/* Column header for Watched Status */}
              <ResizableTh
                width={columnWidths.watchedStatus}
                onClick={() => handleSort("watchedStatus")}
              >
                Watched Status{" "}
                {sortColumn === "watchedStatus"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
                <Resizer
                  onMouseDown={(e) => handleMouseDown(e, "watchedStatus")}
                />
              </ResizableTh>
              {/* Column header for Recommendations */}
              <ResizableTh
                width={columnWidths.recommendations}
                onClick={() => handleSort("recommendations")}
              >
                Recommendations{" "}
                {sortColumn === "recommendations"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
                <Resizer
                  onMouseDown={(e) => handleMouseDown(e, "recommendations")}
                />
              </ResizableTh>
              {/* Column header for Release Year */}
              <ResizableTh
                width={columnWidths.releaseYear}
                onClick={() => handleSort("releaseYear")}
              >
                Release Year{" "}
                {sortColumn === "releaseYear"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
                <Resizer
                  onMouseDown={(e) => handleMouseDown(e, "releaseYear")}
                />
              </ResizableTh>
              {/* Column header for Length/Episodes */}
              <ResizableTh
                width={columnWidths.lengthEpisodes}
                onClick={() => handleSort("lengthEpisodes")}
              >
                Length/Episodes{" "}
                {sortColumn === "lengthEpisodes"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
                <Resizer
                  onMouseDown={(e) => handleMouseDown(e, "lengthEpisodes")}
                />
              </ResizableTh>
              {/* Column header for Synopsis */}
              <ResizableTh width={columnWidths.synopsis}>
                Synopsis
                <Resizer onMouseDown={(e) => handleMouseDown(e, "synopsis")} />
              </ResizableTh>
              {/* Column header for Image thumbnails */}
              <ResizableTh width={100}>Image</ResizableTh>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record, index) => (
              // Each table row is clickable to trigger the series completion update prompt
              <StyledTr
                key={record.id}
                index={index}
                onClick={() => handleRowClick(record)}
              >
                <StyledTd>{index + 1}</StyledTd>
                <StyledTd>{getField(record, "title")}</StyledTd>
                <StyledTd>{getField(record, "category")}</StyledTd>
                <StyledTd>{getField(record, "type")}</StyledTd>
                <StyledTd>{getField(record, "watchedStatus")}</StyledTd>
                <StyledTd>{getField(record, "recommendations")}</StyledTd>
                <StyledTd>{getField(record, "releaseYear")}</StyledTd>
                <StyledTd>{getField(record, "lengthEpisodes")}</StyledTd>
                <SynopsisTd title={getField(record, "synopsis")}>
                  {getField(record, "synopsis")}
                </SynopsisTd>
                <StyledTd style={{ overflow: "visible" }}>
                  {record.image ? (
                    <Image src={record.image} alt={getField(record, "title")} />
                  ) : (
                    "No Image"
                  )}
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

export default Ranking;
