// client/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// Import your page components
import Ranking from "./pages/Ranking";
import Admin from "./pages/Admin";

function App() {
  return (
    // Set basename to "/media_ranker" so that all routes are relative to it
    <Router basename="/media_ranker">
      <Navbar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Ranking />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
