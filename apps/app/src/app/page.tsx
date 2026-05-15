'use client';

import { useUI } from '@temp-workspace/ui-registry';

export default function WelcomePage() {
  const { resolve } = useUI();
  const Card = resolve('Card');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <Card title="Bem-vindo ao DevXP Portal v2.2" padding="xl">
        <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#444' }}>
          O sistema foi atualizado para uma arquitetura puramente baseada em <strong>Plugins</strong>.
        </p>
        <div style={{ marginTop: '32px' }}>
          <h3>O que mudou?</h3>
          <ul style={{ lineHeight: '2' }}>
            <li><strong>Entities Removidas:</strong> O conceito de entidades foi removido para simplificar o core.</li>
            <li><strong>Features:</strong> Plugins que adicionam interface visual por meio de <em>Extension Points</em>.</li>
            <li><strong>Services:</strong> Plugins que fornecem APIs de backend para outros plugins.</li>
          </ul>
        </div>
        <div style={{ marginTop: '32px', padding: '16px', background: '#f0f7ff', borderRadius: '8px', border: '1px solid #cce3ff' }}>
          <p style={{ margin: 0, color: '#0056b3' }}>
            💡 Explore o menu lateral para ver as funcionalidades instaladas via plugins.
          </p>
        </div>
      </Card>
    </div>
  );
}

