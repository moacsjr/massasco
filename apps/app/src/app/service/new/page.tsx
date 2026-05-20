'use client';

import { useUI } from '@temp-workspace/ui-registry';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewServicePage() {
  const { resolve } = useUI();
  const router = useRouter();
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  const Card = resolve('Card');
  const Button = resolve('Button');
  const Input = resolve('Input');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeName: 'Service',
          name: `service-${Date.now()}`, // Slug básico
          title: formData.title,
          description: formData.description,
          customFields: {}, // Podem ser adicionados campos dinâmicos aqui
        }),
      });

      if (response.ok) {
        router.push('/service');
      } else {
        const error = await response.json();
        alert(`Erro ao salvar: ${error.error}`);
      }
    } catch (err) {
      alert('Erro de conexão');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <Card title="Criar Novo Service" padding="md">
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          <Input
            name="title"
            label="Título"
            type="text"
            placeholder="Digite o título do Service"
            value={formData.title}
            onChange={(e: any) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
          <Input
            name="description"
            label="Descrição"
            type="text"
            placeholder="Opcional"
            value={formData.description}
            onChange={(e: any) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => router.push('/service')}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
