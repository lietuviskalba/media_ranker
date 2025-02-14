// client/src/components/ScrollToTop.js
import React, { useState, useEffect } from "react";
import styled from "styled-components";

const BackToTopButton = styled.button`
  width: 200px;
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #444;
  color: #eee;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 1.5rem;
  cursor: pointer;
  opacity: ${(props) => (props.$visible ? "1" : "0")};
  transition: opacity 0.3s ease;
  z-index: 1000;
  &:hover {
    background-color: rgb(65, 113, 203);
  }
`;

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <BackToTopButton $visible={visible} onClick={scrollToTop}>
      Top
    </BackToTopButton>
  );
};

export default ScrollToTop;
