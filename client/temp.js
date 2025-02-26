//
//
//
const handleSubmit = (e) => {
  e.preventDefault();
  let finalWatchedStatus = watchedStatus;
  if (category.toLowerCase() === "series") {
    finalWatchedStatus = `${watchedStatus} (S${season} E${episode})`;
  }
  const payload = {
    title,
    category,
    type,
    watched_status: finalWatchedStatus,
    recommendations,
    release_year: Number(releaseYear),
    length_or_episodes: Number(lengthEpisodes),
    synopsis,
    comment,
    image: imageData || null,
  };
  if (editMode && editId) {
    const updatedPayload = {
      ...payload,
      updated_at: new Date().toISOString(),
    };
    fetch(`/api/media_records/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(updatedPayload),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Error updating record");
          });
        }
        return res.json();
      })
      .then((data) => {
        const index = records.findIndex((r) => r.id === editId);
        setMessage(
          `Record #${index + 1} "${data.title}" updated successfully.`
        );
        clearForm();
      })
      .catch((err) => {
        console.error("Error updating record:", err);
        setMessage(`Error updating record: ${err.message}`);
      });
  } else {
    fetch("/api/media_records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Error creating record");
          });
        }
        return res.json();
      })
      .then((data) => {
        setMessage(`Record added successfully with ID: ${data.id}`);
        clearForm();
      })
      .catch((err) => {
        console.error("Error adding record:", err);
        setMessage(`Error adding record: ${err.message}`);
      });
  }
};
