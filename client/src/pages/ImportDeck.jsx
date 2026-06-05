import { useState } from 'react';

export default function ImportDeck() {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('deck', file);

    const response = await fetch('/api/import/apkg', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    console.log(data);
  };

  return (
    <div>
      <h2>Import APKG</h2>

      <input
        type="file"
        accept=".apkg"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload}>
        Import
      </button>
    </div>
  );
}