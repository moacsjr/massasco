'use client';

import { useUI } from '@temp-workspace/ui-registry';
import { useRouter } from 'next/navigation';

export default function FeaturePage() {
  const { resolve } = useUI();
  const router = useRouter();

  const Card = resolve('Card');
  const Button = resolve('Button');

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <h1>Listagem de Feature</h1>
        <Button
          variant="primary"
          size="md"
          onClick={() => router.push('/feature/new')}
        >
          Novo Feature
        </Button>
      </div>

      <Card title="Exemplo de Registro" padding="md">
        <p>
          Este é um exemplo de como os dados da entidade Feature serão listados.
        </p>
        <Button variant="outline" size="sm">
          Ver detalhes
        </Button>
      </Card>
    </div>
  );
}
