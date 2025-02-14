// client/src/Ranking.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";

// Mapping helper for converting camelCase keys to underscore keys
const fieldMapping = {
  releaseYear: "release_year",
  lengthEpisodes: "length_or_episodes",
  watchedStatus: "watched_status",
  dateAdded: "date_added",
};

const getField = (record, field) => {
  if (record[field] !== undefined) return record[field];
  if (fieldMapping[field] && record[fieldMapping[field]] !== undefined)
    return record[fieldMapping[field]];
  return record[field.charAt(0).toUpperCase() + field.slice(1)] || "";
};

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

  // Sort the filtered records if a sort column is selected
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortColumn) return 0;
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
                onClick={() => handleSort("watchedStatus")}
                style={{ cursor: "pointer" }}
              >
                Watched Status{" "}
                {sortColumn === "watchedStatus"
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
                onClick={() => handleSort("releaseYear")}
                style={{ cursor: "pointer" }}
              >
                Release Year{" "}
                {sortColumn === "releaseYear"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("lengthEpisodes")}
                style={{ cursor: "pointer" }}
              >
                Length/Episodes{" "}
                {sortColumn === "lengthEpisodes"
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
                <td>{getField(record, "title")}</td>
                <td>{getField(record, "category")}</td>
                <td>{getField(record, "type")}</td>
                <td>{getField(record, "watchedStatus")}</td>
                <td>{getField(record, "recommendations")}</td>
                <td>{getField(record, "releaseYear")}</td>
                <td>{getField(record, "lengthEpisodes")}</td>
                <td>
                  {(getField(record, "synopsis") + "").length > 50
                    ? (getField(record, "synopsis") + "").substring(0, 50) +
                      "..."
                    : getField(record, "synopsis")}
                </td>
                <td>
                  {record.image ? (
                    <img
                      src={record.image}
                      alt={getField(record, "title")}
                      style={{ width: "100px" }}
                    />
                  ) : (
                    "No Image"
                  )}
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
