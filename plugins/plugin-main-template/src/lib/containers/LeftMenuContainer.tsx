'use client';

import React from 'react';
import { useLeftMenuData } from '../hooks/useLeftMenuData';
import { LeftMenuView } from '../views/LeftMenuView';

export const LeftMenuContainer: React.FC = () => {
  const { menuRoutes } = useLeftMenuData();

  // This is a simple presentational component that doesn't need loading state
  // since the data is already available from pluginLoader
  return <LeftMenuView menuRoutes={menuRoutes} />;
};
