// client/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Import your page components
import Ranking from "./pages/Ranking";
import Admin from "./pages/Admin";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="app-content">
        <Routes>
          {/* For now, you can have Home ("/") render Ranking or a placeholder */}
          <Route path="/" element={<Ranking />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
