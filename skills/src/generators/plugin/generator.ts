import {
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nx/devkit';
import * as path from 'path';

export interface PluginGeneratorSchema {
  name: string;
}

export default async function (tree: Tree, options: PluginGeneratorSchema) {
  const projectRoot = `plugins/plugin-${options.name}`;

  // 1. Gera os arquivos base do plugin
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);

  // 2. Registra o plugin no portal (plugins-registry.ts)
  const registryPath = 'apps/app/src/plugins-registry.ts';
  if (tree.exists(registryPath)) {
    let content = tree.read(registryPath, 'utf-8') || '';

    // Adiciona o import
    const importStatement = `import { ${options.name}Plugin } from '@temp-workspace/plugin-${options.name}';\n`;
    content = importStatement + content;

    // Adiciona o registro no final da função initializePlugins
    content = content.replace(
      'initializePlugins() {',
      `initializePlugins() {\n  pluginLoader.register(${options.name}Plugin);`,
    );

    tree.write(registryPath, content);
  }

  await formatFiles(tree);
}
