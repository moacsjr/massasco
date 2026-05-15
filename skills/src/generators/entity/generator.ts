import {
  Tree,
  formatFiles,
  generateFiles,
} from '@nx/devkit';
import * as path from 'path';

export interface EntityGeneratorSchema {
  name: string;
}

export default async function (tree: Tree, options: EntityGeneratorSchema) {
  const nameLower = options.name.toLowerCase();
  
  // 1. A partir da v2.1, não geramos mais modelos estáticos no Prisma.
  // As entidades são dinâmicas e usam a tabela genérica 'Entity'.

  // 2. Gera os arquivos de UI e Actions no app principal
  const appRoot = `apps/app/src/app/${nameLower}`;
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    appRoot,
    options
  );

  await formatFiles(tree);
}
