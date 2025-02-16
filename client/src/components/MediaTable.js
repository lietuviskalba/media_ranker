// client/src/components/MediaTable.js
import React from "react";
import styled from "styled-components";

// ----- Table Styled Components -----
// Table container with fixed layout and full width
const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  table-layout: fixed;
`;
// Table cell styling with padding and border
const StyledTd = styled.td`
  padding: 10px;
  border: 1px solid rgb(85, 85, 85);
  text-align: center;
`;
// Table row with alternating background colors and a hover effect
const StyledTr = styled.tr`
  background-color: ${(props) =>
    props.index % 2 === 0 ? "rgb(51,51,51)" : "rgb(42,42,42)"};
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    background-color: rgb(119, 119, 119);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
`;
// Synopsis cell with word wrapping and a maximum width
const SynopsisTd = styled.td`
  padding: 10px;
  border: 1px solid rgb(85, 85, 85);
  text-align: left;
  white-space: normal;
  word-wrap: break-word;
  max-width: 300px;
`;
// Image thumbnail with a hover scaling effect
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
  border: 1px solid rgb(85, 85, 85);
  cursor: pointer;
  width: ${(props) => props.width}px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
// The resizer element displayed within each header cell
const Resizer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  user-select: none;
`;
// ----- End Styled Components -----

// MediaTable component – renders the table header and rows
// Props:
// • records: array of record objects to display
// • columnWidths: object with widths for each column
// • setColumnWidths: function to update column widths
// • sortColumn, sortDirection, handleSort: sorting props and callback
// • getField: helper function to extract a field from a record
// • handleMouseDown: callback for resizing columns
// • handleEdit, handleDelete: callbacks for the action buttons
// • handleRowClick: callback when a row is clicked (e.g. for updating series status)
// • doubleActions: if true, render an extra Actions column at the left (and/or right)
const MediaTable = ({
  records,
  columnWidths,
  setColumnWidths,
  sortColumn,
  sortDirection,
  handleSort,
  getField,
  handleMouseDown,
  handleEdit,
  handleDelete,
  handleRowClick,
  doubleActions,
}) => {
  return (
    <StyledTable>
      <thead>
        <tr>
          {doubleActions && (
            <ResizableTh width={50}>
              Actions
              <Resizer onMouseDown={(e) => handleMouseDown(e, "actionsLeft")} />
            </ResizableTh>
          )}
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
            {sortColumn === "type" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
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
            <Resizer onMouseDown={(e) => handleMouseDown(e, "watchedStatus")} />
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
            <Resizer onMouseDown={(e) => handleMouseDown(e, "releaseYear")} />
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
          {doubleActions && (
            <ResizableTh width={50}>
              Actions
              <Resizer
                onMouseDown={(e) => handleMouseDown(e, "actionsRight")}
              />
            </ResizableTh>
          )}
        </tr>
      </thead>
      <tbody>
        {records.map((record, index) => (
          <StyledTr
            key={record.id}
            index={index}
            onClick={() => handleRowClick && handleRowClick(record)}
          >
            {doubleActions && (
              <StyledTd>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(record);
                  }}
                >
                  Update
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(record);
                  }}
                >
                  Delete
                </button>
              </StyledTd>
            )}
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
            {!doubleActions && (
              <StyledTd>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(record);
                  }}
                >
                  Update
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(record);
                  }}
                >
                  Delete
                </button>
              </StyledTd>
            )}
          </StyledTr>
        ))}
      </tbody>
    </StyledTable>
  );
};

export default MediaTable;
