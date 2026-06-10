'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  commitHash: string;
  imageTag: string;
  imageDigest: string;
  deployedAt: string;
}

export default function VersionPage() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/version')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: VersionInfo) => {
        setVersion(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h1>Version Info</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h1>Version Info</h1>
        <p style={{ color: 'red' }}>Error loading version info: {error}</p>
      </div>
    );
  }

  if (!version) return null;

  const deployedDate =
    version.deployedAt !== 'unknown'
      ? new Date(version.deployedAt).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'full',
          timeStyle: 'long',
        })
      : 'unknown';

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Version Info</h1>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem',
        }}
      >
        <tbody>
          <Row label="Commit Hash" value={version.commitHash} mono />
          <Row label="Image Tag" value={version.imageTag} mono />
          <Row label="Image Digest" value={version.imageDigest} mono />
          <Row label="Deployed At" value={deployedDate} />
        </tbody>
      </table>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <tr>
      <td
        style={{
          padding: '0.5rem 1rem 0.5rem 0',
          fontWeight: 'bold',
          verticalAlign: 'top',
          whiteSpace: 'nowrap',
          borderBottom: '1px solid #333',
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: '0.5rem 0',
          fontFamily: mono ? 'monospace' : undefined,
          wordBreak: 'break-all',
          borderBottom: '1px solid #333',
        }}
      >
        {value}
      </td>
    </tr>
  );
}