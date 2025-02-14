// client/src/components/SearchBar.js
import React from "react";
import styled from "styled-components";

// Container for the search bar with relative positioning
const SearchContainer = styled.div`
  position: relative;
  display: inline-block;
  width: 800px; /* Increased width */
`;

// The search input field
const SearchInput = styled.input`
  width: 100%;
  padding: 10px 40px 10px 10px; /* extra right padding for the clear button */
  font-size: 1rem;
  border-radius: 10px;
  border: 5px solid #555;
`;

// Clear button positioned inside the container on the right
const ClearButton = styled.button`
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #aaa;
  cursor: pointer;
  font-size: 1.2rem;
  &:hover {
    color: #eee;
  }
`;

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <SearchContainer>
      <SearchInput
        type="text"
        placeholder="Search by name or type..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {searchQuery && <ClearButton onClick={clearSearch}>×</ClearButton>}
    </SearchContainer>
  );
};

export default SearchBar;
