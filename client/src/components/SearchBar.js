// client/src/components/SearchBar.js
import React from "react";

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div>
      <input
        type="text"
        placeholder="Search by name or type..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: "10px", padding: "5px", width: "300px" }}
      />
    </div>
  );
};

export default SearchBar;
