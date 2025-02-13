// client/src/Ranking.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";

function Ranking() {
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState(null); // "name" or "type"
  const [sortDirection, setSortDirection] = useState("asc"); // "asc" or "desc"

  useEffect(() => {
    fetch("/api/records")
      .then((response) => response.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

  // Filter records by search query (case-insensitive)
  const filteredRecords = records.filter((record) => {
    const query = searchQuery.toLowerCase();
    return (
      record.name.toLowerCase().includes(query) ||
      record.type.toLowerCase().includes(query)
    );
  });

  // Sort the filtered records if a sort column is selected
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (!sortColumn) return 0; // No sorting applied if no column is chosen

    let valA = a[sortColumn];
    let valB = b[sortColumn];

    // Compare strings case-insensitively
    if (typeof valA === "string" && typeof valB === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Toggle sorting when a column header is clicked
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle the sort direction if the same column is clicked
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
                onClick={() => handleSort("name")}
                style={{ cursor: "pointer" }}
              >
                Name{" "}
                {sortColumn === "name"
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
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record, index) => (
              <tr key={record.id}>
                <td>{index + 1}</td>
                <td>{record.name}</td>
                <td>{record.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default Ranking;
