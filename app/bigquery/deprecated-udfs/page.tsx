"use client";

import React, { useEffect, useState } from 'react';

export default function DeprecatedUDFsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Replace with your actual jobId logic
    const jobId = typeof window !== 'undefined' ? localStorage.getItem('lastAuditJobId') : null;
    if (!jobId) {
      setError('No audit job found.');
      setLoading(false);
      return;
    }
    fetch(`/api/audits/status?id=${jobId}`)
      .then(res => res.json())
      .then(res => {
        setData(res.bigqueryResults?.bigquery?.deprecatedUDFs || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch audit results.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main>
      <h1>BigQuery: Deprecated SQL UDFs</h1>
      {data.length === 0 ? (
        <div>No deprecated UDFs found.</div>
      ) : (
        <ul>
          {data.map((item, idx) => (
            <li key={idx}>
              Dataset: {item.dataset}, Table: {item.table}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
} 