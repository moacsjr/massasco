'use client';

import React, { useState } from 'react';
import { useRightMenuData } from '../hooks/useRightMenuData';
import { RightMenuView } from '../views/RightMenuView';

export const RightMenuContainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const { tabs, triggerIcon } = useRightMenuData();

  return (
    <RightMenuView
      tabs={tabs}
      triggerIcon={triggerIcon}
      isOpen={isOpen}
      activeTab={activeTab}
      onOpenChange={setIsOpen}
      onActiveTabChange={setActiveTab}
    />
  );
};
