// client/src/Ranking.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";
import MediaTable from "../components/MediaTable";

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
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);

  useEffect(() => {
    const savedWidths = localStorage.getItem("columnWidths");
    if (savedWidths) setColumnWidths(JSON.parse(savedWidths));
  }, []);

  useEffect(() => {
    fetch("/api/media_records")
      .then((response) => response.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

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

  // If no sort column is selected, sort by updated_at (or date_added) descending.
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

  // When a row is clicked, update the record's watched_status.
  const handleRowClick = (record) => {
    const confirmFinish = window.confirm(
      "Have you completed watching this series?"
    );
    if (!confirmFinish) return;
    const currentStatus = getField(record, "watchedStatus");
    const currentDate = new Date().toISOString().slice(0, 10); // yyyy-mm-dd format
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
    // Use the correct endpoint for updating a record in the media_records table
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
