// client/src/Ranking.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import SearchBar from "../components/SearchBar";
import ScrollToTop from "../components/ScrollToTop.js";

// =================== Styled Components ===================

const Container = styled.div`
  background-color: rgb(197, 7, 231);
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

const Nav = styled.nav`
  a {
    color: #eee;
    text-decoration: none;
    margin-left: 20px;
  }
`;

const Main = styled.main`
  background-color: rgb(46, 46, 46);
  padding: 10px;
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

// Resizable Header Cell Components
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

// =================== End Styled Components ===================

// Initial column widths (in pixels)
const initialColumnWidths = {
  index: 10,
  title: 150,
  category: 150,
  type: 150,
  watchedStatus: 100,
  recommendations: 100,
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
    if (savedWidths) {
      setColumnWidths(JSON.parse(savedWidths));
    }
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

  const getField = (record, field) => {
    if (record[field] !== undefined) return record[field];
    if (fieldMapping[field] && record[fieldMapping[field]] !== undefined)
      return record[fieldMapping[field]];
    return record[field.charAt(0).toUpperCase() + field.slice(1)] || "";
  };

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

  return (
    <Container>
      <Main>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Title>Media Ranker</Title>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
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
              <StyledTr key={record.id} index={index}>
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
