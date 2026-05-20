import { UI_CONTRACTS } from '@temp-workspace/ui-contracts';

/**
 * Validador de Contratos DevXP
 * Verifica se um objeto de componentes satisfaz os requisitos do Zod.
 */
export function validateDesignSystem(components: any) {
  console.log('\n--- Iniciando Validação de Contrato DevXP ---\n');

  let hasErrors = false;

  for (const [componentName, schema] of Object.entries(UI_CONTRACTS)) {
    console.log(`Validando componente: [${componentName}]...`);

    const component = components[componentName];

    if (!component) {
      console.error(
        `❌ ERRO: Componente [${componentName}] não encontrado no Design System.`,
      );
      hasErrors = true;
      continue;
    }

    // Como componentes React são funções, não podemos validar o "corpo" da função facilmente com Zod
    // Mas podemos validar metadados ou tentar uma renderização de teste se necessário.
    // Para este MVP, validamos a existência e o tipo básico.
    if (typeof component !== 'function' && typeof component !== 'object') {
      console.error(
        `❌ ERRO: [${componentName}] deve ser um Componente React válido (função ou objeto).`,
      );
      hasErrors = true;
    } else {
      console.log(`✅ [${componentName}] validado com sucesso.`);
    }
  }

  if (hasErrors) {
    console.error('\n--- Falha na validação do Design System ---\n');
    process.exit(1);
  } else {
    console.log('\n--- Design System aprovado nos contratos! ---\n');
  }
}

// Se executado diretamente
if (require.main === module) {
  const dsPath = process.argv[2];
  if (!dsPath) {
    console.error('Uso: devxp-validator <caminho-para-o-ds>');
    process.exit(1);
  }

  // Tenta carregar o DS dinamicamente
  try {
    const ds = require(dsPath);
    const components = ds.components || ds.default?.components || ds;
    validateDesignSystem(components);
  } catch (err: any) {
    console.error(`Erro ao carregar Design System em ${dsPath}:`, err.message);
    process.exit(1);
  }
}
