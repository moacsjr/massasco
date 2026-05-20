/* eslint-disable @typescript-eslint/no-empty-object-type */
import { ComponentType, ReactNode } from 'react';

// ============================================================================
// Tipagem Segura por Ponto de Extensão (Safe Extension Point Typing)
// ============================================================================
//
// Este é o contrato central que garante type-safety entre host (Portal) e
// plugins. O mecanismo funciona assim:
//
// 1. MAPA DE CONTRATOS — Declare aqui CADA ponto de extensão existente e o
//    formato exato das props que ele exige. As CHAVES (string literals) se
//    tornam tipos, não strings soltas.
//
// 2. GENERICS VINCULADOS — `register()`, `ExtensionPoint<K>`, `getExtensions<K>`
//    usam `K extends keyof ExtensionPoints` para que TypeScript verifique em
//    COMPILE TIME que:
//    - O nome do ponto de extensão é válido (existe no mapa)
//    - As props passadas correspondem EXATAMENTE ao tipo declarado
//
// 3. VALIDAÇÃO EM COMPILE TIME — Se um plugin tentar registrar uma contribuição
//    com props erradas ou usar um ID inexistente, o build QUEBRA antes do
//    runtime. Zero overhead, máxima segurança.
//
// Exemplo de uso:
//   // ✅ Correto — TypeScript valida que 'app:layout:header' existe e aceita {}
//   pluginLoader.register({
//     id: 'my-plugin',
//     contributions: [{ point: 'app:layout:header', component: MyHeader }]
//   });
//
//   // ❌ Erro — 'sidebar-menu' não existe em ExtensionPoints
//   pluginLoader.register({
//     contributions: [{ point: 'sidebar-menu', component: X }]  // TS ERROR
//   });
// ============================================================================

/**
 * Props for left-menu extension point contributors.
 * Each contribution renders as a destination in the nav rail.
 * Clicking opens a drawer showing the contribution's component.
 */
export interface LeftMenuItemProps {
  /** Display name for the navigation destination */
  name: string;
  /** Icon identifier (resolved via useUI Icon component) */
  icon: string;
}

/**
 * Props for right-menu extension point contributors.
 * Each contribution renders as a tab in the right-side drawer.
 */
export interface RightMenuItemProps {
  /** Display name for the tab */
  tabName: string;
  /** Icon identifier (resolved via useUI Icon component) */
  tabIcon: string;
}

/**
 * Props for the main-template extension point.
 * Receives page content as children.
 */
export interface MainTemplateProps {
  children: ReactNode;
}

/**
 * Registry of all available Extension Points in the Portal.
 *
 * Key: Extension Point ID (string literal type — NOT a loose string)
 * Value: The props interface that ANY component contributing to this point MUST accept.
 *
 * To add a new extension point:
 *   1. Add a new key with JSDoc describing the area
 *   2. Define the props shape (use {} if no props needed)
 *   3. Plugins contributing to this point will be type-checked against it
 */
export interface ExtensionPoints {
  /**
   * Main application header area.
   * Rendered at the top of the layout in RootLayout.
   * @deprecated Use 'app:main-template' instead. Kept for backward compatibility.
   */
  'app:layout:header': {};

  /**
   * Top menu bar items area.
   * Used by menubarPlugin to render navigation items.
   */
  'menubar:items': {};

  /**
   * Root main template slot. Renders the full page layout.
   * Receives page content as children.
   */
  'app:main-template': MainTemplateProps;

  // Header sub-points
  /** Header menu area (inside the top bar, after app icon/name) */
  'main-template:header-menu': {};

  /** Header footer left area (below main header bar) */
  'main-template:header-footer-left': {};

  /** Header footer center area */
  'main-template:header-footer-center': {};

  /** Header footer right area */
  'main-template:header-footer-right': {};

  // Left menu (nav rail + drawer destinations)
  /** Left navigation menu items. Each provides a name + icon for the rail, and a component for the drawer. */
  'main-template:left-menu': LeftMenuItemProps;

  // Right menu (tab-based drawer)
  /** Right side panel tabs. Each provides a tabName + tabIcon, and a component for the tab content. */
  'main-template:right-menu': RightMenuItemProps;

  // Content areas
  /** Content area above the main page content */
  'main-template:content-top': {};

  /** Content area to the left of the main page content */
  'main-template:content-left': {};

  /** Content area to the right of the main page content */
  'main-template:content-right': {};

  /** Content area below the main page content */
  'main-template:content-bottom': {};

  // Footer areas
  /** Footer left area */
  'main-template:footer-left': {};

  /** Footer center area */
  'main-template:footer-center': {};

  /** Footer right area */
  'main-template:footer-right': {};
}

/**
 * Helper type to extract props of an extension point
 */
export type ExtensionPointProps<K extends keyof ExtensionPoints> =
  ExtensionPoints[K];

/**
 * Helper type for components that contribute to an extension point
 */
export type ExtensionContributionComponent<K extends keyof ExtensionPoints> =
  ComponentType<ExtensionPointProps<K>>;
