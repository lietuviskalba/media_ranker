// client/src/Ranking.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";
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
  background-color: rgb(47, 47, 47);
  color: rgb(183, 183, 183);
  min-height: 100vh;
  margin: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
`;

const Main = styled.main`
  background-color: rgb(46, 46, 46);
  padding: 10px;
  padding-top: 100px;
  padding-bottom: 10em;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
`;

const Title = styled.h1`
  font-size: 4rem;
  text-align: center;
`;

// Default column widths
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

function Ranking() {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);

  // Load saved column widths from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("columnWidths");
    if (saved) setColumnWidths(JSON.parse(saved));
  }, []);

  // Fetch all records (public endpoint)
  useEffect(() => {
    fetch("/api/media_records")
      .then((res) => res.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

  // Filter records based on the search query
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

  // Sort records (if no sort column is selected, sort by most recent update or addition)
  const sortedRecords =
    sortColumn === null
      ? [...filteredRecords].sort((a, b) => {
          const dateA = a.updated_at
            ? new Date(a.updated_at)
            : new Date(a.date_added);
          const dateB = b.updated_at
            ? new Date(b.updated_at)
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

  const handleSort = (column, direction) => {
    if (column === null) {
      setSortColumn(null);
      setSortDirection("asc");
    } else {
      setSortColumn(column);
      setSortDirection(direction);
    }
  };

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
      localStorage.setItem("columnWidths", JSON.stringify(columnWidths));
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handler for clicking a record row to update its watched status
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
      const count = parseInt(match[1], 10) + 1;
      const dates = match[2] ? `${match[2]}, ${currentDate}` : currentDate;
      newStatus = `Completed (${count})\n${dates}`;
    } else {
      newStatus = `Completed (1)\n${currentDate}`;
    }

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

    fetch(`/api/public/media_records/${record.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.text())
      .then((text) => {
        try {
          const data = JSON.parse(text);
          alert(`Record "${data.title}" updated to:\n${data.watched_status}`);
          setRecords((prev) =>
            prev.map((r) => (r.id === record.id ? data : r))
          );
        } catch (error) {
          console.error("Raw response:", text);
          alert("Error updating record: Invalid JSON in response");
        }
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
