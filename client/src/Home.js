// client/src/Home.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetch("/api/records")
      .then((response) => response.json())
      .then((data) => setRecords(data))
      .catch((err) => console.error("Error fetching records:", err));
  }, []);

  return (
    <div>
      <header>
        <h1>Media Ranker</h1>
        <nav>
          <Link to="/admin">Go to Admin Page</Link>
        </nav>
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

export default Home;
