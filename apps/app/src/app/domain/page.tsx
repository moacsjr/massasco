'use client';

import { useUI } from '@temp-workspace/ui-registry';

export default function DomainPage() {
  const { resolve } = useUI();
  const Card = resolve('Card');
  const Button = resolve('Button');

  return (
    <Card>
      <h1>Entidade: Domain</h1>
      <p>Gerada automaticamente pela Skill.</p>
      <Button variant="primary">Ação de Exemplo</Button>
    </Card>
  );
}
