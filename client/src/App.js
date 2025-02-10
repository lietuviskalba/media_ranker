// client/src/App.js
import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  // State to hold the records data
  const [records, setRecords] = useState([]);

  // Fetch the records when the component mounts
  useEffect(() => {
    fetch("/api/records")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

  return (
    <div className="App">
      <header>
        <h1>Media Ranker</h1>
      </header>
      <main>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
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

export default App;
