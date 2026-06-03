'use client';

import React from 'react';
import { useBottomNavBarData } from '../hooks/useBottomNavBarData';
import { BottomNavBarView } from '../views/BottomNavBarView';

interface BottomNavBarContainerProps {
  layout?: 'portal' | 'admin';
}

export const BottomNavBarContainer: React.FC<BottomNavBarContainerProps> = ({
  layout = 'admin',
}) => {
  const { menuRoutes } = useBottomNavBarData(layout);

  return <BottomNavBarView menuRoutes={menuRoutes} />;
};
