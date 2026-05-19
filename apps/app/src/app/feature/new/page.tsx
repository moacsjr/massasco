'use client';

import { useUI } from '@temp-workspace/ui-registry';
import { useRouter } from 'next/navigation';

export default function NewFeaturePage() {
  const { resolve } = useUI();
  const router = useRouter();

  const Card = resolve('Card');
  const Button = resolve('Button');
  const Input = resolve('Input');

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <Card title="Criar Novo Feature" padding="md">
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <Input
            name="title"
            label="Título"
            type="text"
            placeholder="Digite o título do Feature"
          />
          <Input name="description" label="Descrição" type="text" placeholder="Opcional" />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button variant="primary" size="md" onClick={() => router.push('/feature')}>Salvar</Button>
            <Button variant="outline" size="md" onClick={() => router.push('/feature')}>
              Cancelar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
