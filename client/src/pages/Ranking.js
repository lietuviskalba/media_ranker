// client/src/Ranking.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";
import MediaTable from "../components/MediaTable";

// Mapping from camelCase to underscore keys used in the database
const fieldMapping = {
  releaseYear: "release_year",
  lengthEpisodes: "length_or_episodes",
  watchedStatus: "watched_status",
  dateAdded: "date_added",
};

// Helper function to get a field value from a record
function getField(record, field) {
  if (record[field] !== undefined) return record[field];
  if (fieldMapping[field] && record[fieldMapping[field]] !== undefined)
    return record[fieldMapping[field]];
  return record[field.charAt(0).toUpperCase() + field.slice(1)] || "";
}

// Styled container for the page
const Container = styled.div`
  background-color: rgb(47, 47, 47);
  color: rgb(183, 183, 183);
  min-height: 100vh;
  margin: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
`;

// Main content area styling with padding for the fixed Navbar
const Main = styled.main`
  background-color: rgb(46, 46, 46);
  padding: 10px;
  padding-top: 100px;
  padding-bottom: 10em;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
`;

// Styled title centered on the page
const Title = styled.h1`
  font-size: 4rem;
  text-align: center;
`;

// Initial column widths for the MediaTable
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
  // State declarations for records, search query, sorting, and column widths
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);

  // Load saved column widths from localStorage on mount
  useEffect(() => {
    const savedWidths = localStorage.getItem("columnWidths");
    if (savedWidths) setColumnWidths(JSON.parse(savedWidths));
  }, []);

  // Fetch records from the PostgreSQL endpoint
  useEffect(() => {
    fetch("/api/media_records")
      .then((response) => response.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

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

  // Sort records: if no sort column is selected, sort by updatedAt (or date_added) descending
  const sortedRecords =
    sortColumn === null
      ? [...filteredRecords].sort((a, b) => {
          const dateA = a.updatedAt
            ? new Date(a.updatedAt)
            : new Date(a.date_added);
          const dateB = b.updatedAt
            ? new Date(b.updatedAt)
            : new Date(b.date_added);
          return dateB - dateA;
        })
      : [...filteredRecords].sort((a, b) => {
          let valA = getField(a, sortColumn);
          let valB = getField(b, sortColumn);
          if (typeof valA === "string") valA = valA.toLowerCase();
          if (typeof valB === "string") valB = valB.toLowerCase();
          if (valA < valB) return sortDirection === "asc" ? -1 : 1;
          if (valA > valB) return sortDirection === "asc" ? 1 : -1;
          return 0;
        });

  // Updated handleSort: accepts two parameters and resets when both are null.
  const handleSort = (column, direction) => {
    if (column === null) {
      setSortColumn(null);
      setSortDirection("asc");
    } else {
      setSortColumn(column);
      setSortDirection(direction);
    }
  };

  // Handler for column resizing; saves new widths to localStorage
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

  // Updated row click handler:
  // When a row is clicked, update the record's watched_status by incrementing the counter and appending the current date (yyyy-mm-dd).
  // The payload includes all current record fields so that the PUT query in the backend works correctly.
  const handleRowClick = (record) => {
    // Ask the user if they have completed watching the series
    const confirmFinish = window.confirm(
      "Have you completed watching this series?"
    );
    if (!confirmFinish) return;

    // Get the current watched status and the current date (formatted yyyy-mm-dd)
    const currentStatus = getField(record, "watchedStatus");
    const currentDate = new Date().toISOString().slice(0, 10);

    // Determine the new watched status by checking if it already has a "Completed" entry
    let newStatus = "";
    const regex = /^Completed\s*\((\d+)\)(?:\n(.*))?$/i;
    const match = currentStatus.match(regex);
    if (match) {
      // Increment the counter and append the new date
      const count = parseInt(match[1], 10) + 1;
      const dates = match[2] ? `${match[2]}, ${currentDate}` : currentDate;
      newStatus = `Completed (${count})\n${dates}`;
    } else {
      newStatus = `Completed (1)\n${currentDate}`;
    }

    // Build the payload with all required fields from the record,
    // using "updated_at" (underscore) as the column name for the timestamp.
    const payload = {
      title: record.title,
      category: record.category,
      type: record.type,
      watched_status: newStatus,
      recommendations: record.recommendations,
      release_year: record.release_year || record.releaseYear,
      length_or_episodes: record.length_or_episodes || record.lengthEpisodes,
      synopsis: record.synopsis,
      image: record.image || null,
      updated_at: new Date().toISOString(),
    };

    // Send the PUT request to update the record in the database
    fetch(`/api/media_records/${record.id}`, {
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
        alert(`Record "${data.title}" updated to:\n${data.watched_status}`);
        // Update the local state so the table reflects the change
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
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Main>
        <Title>Media Ranker</Title>
        {/* Render MediaTable with no action buttons (Ranking view) */}
        <MediaTable
          records={sortedRecords}
          columnWidths={columnWidths}
          setColumnWidths={setColumnWidths}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          handleSort={handleSort}
          getField={getField}
          handleMouseDown={handleMouseDown}
          doubleActions={false}
          handleRowClick={handleRowClick}
        />
      </Main>
      <ScrollToTop />
    </Container>
  );
}

export default Ranking;
