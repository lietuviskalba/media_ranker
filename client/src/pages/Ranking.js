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

// Header styling (if needed, currently not used in JSX)
const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

// Title styling for the page title
const Title = styled.h1`
  font-size: 4rem;
`;

// Main content area styling
const Main = styled.main`
  background-color: rgb(46, 46, 46);
  padding: 10px;
  padding-top: 100px; /* Extra padding to avoid content under fixed navbar */
  padding-bottom: 10em;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
`;

// Table styling for the records table
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  table-layout: fixed;
`;

// Table cell styling
const StyledTd = styled.td`
  padding: 10px;
  border: 1px solid #555;
  text-align: center;
`;

// Table row styling with alternating row colors and hover effect
const StyledTr = styled.tr`
  background-color: ${(props) => (props.index % 2 === 0 ? "#333" : "#2a2a2a")};
  &:hover {
    background-color: #555;
  }
`;

// Cell for synopsis with text wrapping
const SynopsisTd = styled.td`
  padding: 10px;
  border: 1px solid #555;
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

// Resizable table header cell styling
const ResizableTh = styled.th`
  position: relative;
  padding: 10px;
  background-color: rgb(68, 68, 68);
  border: 1px solid #555;
  cursor: pointer;
  width: ${(props) => props.width}px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Resizer element for dragging column widths
const Resizer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  user-select: none;
`;

// Initial widths for each table column (in pixels)
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

function Ranking() {
  // State to store records fetched from the server
  const [records, setRecords] = useState([]);
  // State for the search query entered by the user
  const [searchQuery, setSearchQuery] = useState("");
  // States for sorting
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  // State for user-adjusted column widths
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);

  // On mount, load saved column widths from localStorage (if available)
  useEffect(() => {
    const savedWidths = localStorage.getItem("columnWidths");
    if (savedWidths) setColumnWidths(JSON.parse(savedWidths));
  }, []);

  // Fetch records from the API endpoint
  useEffect(() => {
    fetch("/api/records")
      .then((response) => response.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

  // Mapping from camelCase keys to the JSON underscore keys
  const fieldMapping = {
    releaseYear: "release_year",
    lengthEpisodes: "length_or_episodes",
    watchedStatus: "watched_status",
    dateAdded: "date_added",
  };

  // Helper function to retrieve a field's value from a record using the mapping
  function getField(record, field) {
    if (record[field] !== undefined) return record[field];
    if (fieldMapping[field] && record[fieldMapping[field]] !== undefined)
      return record[fieldMapping[field]];
    return record[field.charAt(0).toUpperCase() + field.slice(1)] || "";
  }

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

  // Sort records so that the most recent (updated or added) record appears at the top
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.date_added);
    const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.date_added);
    return dateB - dateA;
  });

  // Handler for sorting when clicking on table headers
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Handler for resizing table columns by dragging the resizer element
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
      // Save the adjusted column widths to localStorage
      localStorage.setItem("columnWidths", JSON.stringify(columnWidths));
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handler for row click which asks if the series is completed.
  // If confirmed, it updates the watched status to "Completed" along with a counter and finish date(s).
  const handleRowClick = (record) => {
    const confirmFinish = window.confirm(
      "Have you completed watching this series?"
    );
    if (!confirmFinish) return;
    const currentStatus = getField(record, "watchedStatus");
    const currentDate = new Date().toISOString().slice(0, 10); // Format yyyy-mm-dd
    let newStatus = "";
    const regex = /^Completed\s*\((\d+)\)(?:\n(.*))?$/i;
    const match = currentStatus.match(regex);
    if (match) {
      // Increment the counter and append the current date
      const count = parseInt(match[1], 10) + 1;
      const dates = match[2] ? match[2] + ", " + currentDate : currentDate;
      newStatus = `Completed (${count})\n${dates}`;
    } else {
      newStatus = `Completed (1)\n${currentDate}`;
    }
    // Send update request to the server with the new watched status and update timestamp
    fetch(`/api/records/${record.id}`, {
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
        // Update local state to reflect the updated record
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
      {/* Navigation bar at the top */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Main>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Title>Media Ranker</Title>
        </div>
        <StyledTable>
          <thead>
            <tr>
              {/* Table header for each column with resizable widths */}
              <ResizableTh width={columnWidths.index}>
                #
                <Resizer onMouseDown={(e) => handleMouseDown(e, "index")} />
              </ResizableTh>
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
              // Each row is clickable to trigger the series completion update prompt
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
