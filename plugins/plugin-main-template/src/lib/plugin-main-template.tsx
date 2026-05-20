'use client';

import React from 'react';
import {
  FeaturePlugin,
  ExtensionPointDefinition,
  ExtensionContribution,
} from '@temp-workspace/plugin-loader';
import { MainTemplate } from './MainTemplate';

const extensionPoints: ExtensionPointDefinition[] = [
  {
    name: 'main-template:header-menu',
    title: 'Header Menu',
    description:
      'Items displayed in the main header bar, next to the app name.',
  },
  {
    name: 'main-template:header-footer-left',
    title: 'Header Footer Left',
    description: 'Left area below the main header bar.',
  },
  {
    name: 'main-template:header-footer-center',
    title: 'Header Footer Center',
    description: 'Center area below the main header bar.',
  },
  {
    name: 'main-template:header-footer-right',
    title: 'Header Footer Right',
    description: 'Right area below the main header bar.',
  },
  {
    name: 'main-template:left-menu',
    title: 'Left Menu',
    description:
      'Navigation rail + drawer destinations. Provide name, icon, and component.',
  },
  {
    name: 'main-template:right-menu',
    title: 'Right Menu',
    description:
      'Right-side drawer tabs. Provide tabName, tabIcon, and component.',
  },
  {
    name: 'main-template:content-top',
    title: 'Content Top',
    description: 'Area above the main page content.',
  },
  {
    name: 'main-template:content-left',
    title: 'Content Left',
    description: 'Sidebar to the left of the main page content.',
  },
  {
    name: 'main-template:content-right',
    title: 'Content Right',
    description: 'Sidebar to the right of the main page content.',
  },
  {
    name: 'main-template:content-bottom',
    title: 'Content Bottom',
    description: 'Area below the main page content.',
  },
  {
    name: 'main-template:footer-left',
    title: 'Footer Left',
    description: 'Left area of the page footer.',
  },
  {
    name: 'main-template:footer-center',
    title: 'Footer Center',
    description: 'Center area of the page footer.',
  },
  {
    name: 'main-template:footer-right',
    title: 'Footer Right',
    description: 'Right area of the page footer.',
  },
];

const contributions = [
  {
    point: 'app:main-template' as const,
    component: MainTemplate,
  },
] as ExtensionContribution[];

export const mainTemplatePlugin: FeaturePlugin = {
  id: 'main-template',
  name: 'Main Template',
  type: 'feature',
  extensionPoints,
  contributions,
};
