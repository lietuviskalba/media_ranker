// client/src/Ranking.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";

const Container = styled.div`
  background-color: rgb(47, 47, 47);
  color: rgb(183, 183, 183);
  min-height: 100vh;
  margin: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 4rem;
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

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  table-layout: fixed;
`;

const StyledTd = styled.td`
  padding: 10px;
  border: 1px solid #555;
  text-align: center;
`;

const StyledTr = styled.tr`
  background-color: ${(props) => (props.index % 2 === 0 ? "#333" : "#2a2a2a")};
  &:hover {
    background-color: #555;
  }
`;

const SynopsisTd = styled.td`
  padding: 10px;
  border: 1px solid #555;
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
  max-width: 300px;
`;

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

const ResizableTh = styled.th`
  position: relative;
  padding: 10px;
  background-color: #444;
  border: 1px solid #555;
  cursor: pointer;
  width: ${(props) => props.width}px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Resizer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  user-select: none;
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
    fetch("/api/records")
      .then((response) => response.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

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
    const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.date_added);
    const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.date_added);
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
      localStorage.setItem("columnWidths", JSON.stringify(columnWidths));
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleRowClick = (record) => {
    const confirmFinish = window.confirm(
      "Have you completed watching this series?"
    );
    if (!confirmFinish) return;
    const currentStatus = getField(record, "watchedStatus");
    const currentDate = new Date().toISOString().slice(0, 10);
    let newStatus = "";
    const regex = /^Completed\s*\((\d+)\)(?:\n(.*))?$/i;
    const match = currentStatus.match(regex);
    if (match) {
      const count = parseInt(match[1], 10) + 1;
      const dates = match[2] ? match[2] + ", " + currentDate : currentDate;
      newStatus = `Completed (${count})\n${dates}`;
    } else {
      newStatus = `Completed (1)\n${currentDate}`;
    }
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
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Title>Media Ranker</Title>
        </div>
        <StyledTable>
          <thead>
            <tr>
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
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((record, index) => (
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
