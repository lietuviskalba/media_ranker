// client/src/Ranking.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";

function Ranking() {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null); // e.g. "title", "category", etc.
  const [sortDirection, setSortDirection] = useState("asc"); // "asc" or "desc"

  useEffect(() => {
    fetch("/api/records")
      .then((response) => response.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

  // Filter records by checking several fields (case-insensitive)
  const filteredRecords = records.filter((record) => {
    const query = searchQuery.toLowerCase();
    return (
      record.title.toLowerCase().includes(query) ||
      record.category.toLowerCase().includes(query) ||
      record.type.toLowerCase().includes(query) ||
      record.watched_status.toLowerCase().includes(query) ||
      record.recommendations.toLowerCase().includes(query) ||
      record.synopsis.toLowerCase().includes(query) ||
      record.release_year.toString().includes(query) ||
      record.length_or_episodes.toString().includes(query)
    );
  });

  // Helper function to get a field's value (for sorting)
  const getValue = (record, column) => {
    return record[column];
  };

  // Sort the filtered records if a sort column is selected
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortColumn) return 0;

    let valA = getValue(a, sortColumn);
    let valB = getValue(b, sortColumn);

    // For string values, compare case-insensitively
    if (typeof valA === "string" && typeof valB === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Handler to toggle sorting when clicking a column header
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <div>
      <header>
        <h1>Media Ranker</h1>
        <nav>
          <Link to="/admin">Go to Admin Page</Link>
        </nav>
      </header>
      <main>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th
                onClick={() => handleSort("title")}
                style={{ cursor: "pointer" }}
              >
                Title{" "}
                {sortColumn === "title"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("category")}
                style={{ cursor: "pointer" }}
              >
                Category{" "}
                {sortColumn === "category"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("type")}
                style={{ cursor: "pointer" }}
              >
                Type{" "}
                {sortColumn === "type"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("watched_status")}
                style={{ cursor: "pointer" }}
              >
                Watched Status{" "}
                {sortColumn === "watched_status"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("recommendations")}
                style={{ cursor: "pointer" }}
              >
                Recommendations{" "}
                {sortColumn === "recommendations"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("release_year")}
                style={{ cursor: "pointer" }}
              >
                Release Year{" "}
                {sortColumn === "release_year"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("length_or_episodes")}
                style={{ cursor: "pointer" }}
              >
                Length/Episodes{" "}
                {sortColumn === "length_or_episodes"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th>Synopsis</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record, index) => (
              <tr key={record.id}>
                <td>{index + 1}</td>
                <td>{record.title}</td>
                <td>{record.category}</td>
                <td>{record.type}</td>
                <td>{record.watched_status}</td>
                <td>{record.recommendations}</td>
                <td>{record.release_year}</td>
                <td>{record.length_or_episodes}</td>
                <td>
                  {record.synopsis.length > 50
                    ? record.synopsis.substring(0, 50) + "..."
                    : record.synopsis}
                </td>
                <td>
                  <img
                    src={record.image || "/images/default.png"}
                    alt={record.title}
                    style={{ width: "100px" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default Ranking;
