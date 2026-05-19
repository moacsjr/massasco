'use client';

import { useUI } from '@temp-workspace/ui-registry';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ServicePage() {
  const { resolve } = useUI();
  const router = useRouter();
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const Card = resolve('Card');
  const Button = resolve('Button');

  useEffect(() => {
    fetch('/api/entities?type=Service')
      .then((res) => res.json())
      .then((data) => {
        setEntities(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <h1>Listagem de Service</h1>
        <Button variant="primary" size="md" onClick={() => router.push('/service/new')}>
          Novo Service
        </Button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : entities.length === 0 ? (
        <p>Nenhum registro encontrado.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {entities.map((entity) => (
            <Card key={entity.id} title={entity.title} padding="md">
              <p>{entity.description || 'Sem descrição'}</p>
              <Button variant="outline" size="sm">
                Ver detalhes
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
