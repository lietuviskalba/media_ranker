// client/src/components/Navbar.js
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import SearchBar from "./SearchBar"; // Make sure this path is correct

// Container for the entire navbar, fixed to the top
const NavBarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgb(58, 58, 58);
  padding: 20px;
  display: flex;
  align-items: center;
  z-index: 1000;
`;

// Left container for Home and Ranking links
const NavLeft = styled.div`
  display: flex;
  gap: 20px;
`;

// Center container for the search bar
const NavCenter = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
`;

// Styled link
const StyledLink = styled(Link)`
  color: #eee;
  text-decoration: none;
  font-size: 1.2rem;
  &:hover {
    color: #fff;
  }
`;

const Navbar = ({ searchQuery, setSearchQuery }) => {
  return (
    <NavBarContainer>
      <NavLeft>
        <StyledLink to="/">Home</StyledLink>
        <StyledLink to="/ranking">Ranking</StyledLink>
        <StyledLink to="/admin">Admin</StyledLink>
      </NavLeft>
      <NavCenter>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </NavCenter>
    </NavBarContainer>
  );
};

export default Navbar;
