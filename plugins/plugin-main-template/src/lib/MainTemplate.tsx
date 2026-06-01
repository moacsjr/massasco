'use client';

import React from 'react';
import { useUI } from '@temp-workspace/ui-registry';
import { MainTemplateProps } from '@temp-workspace/plugin-loader';
import { HeaderSection } from './HeaderSection';
import { LeftMenuSection } from './LeftMenuSection';
import { RightMenuSection } from './RightMenuSection';
import { ContentSection } from './ContentSection';
import { FooterSection } from './FooterSection';
import { BottomNavBar } from './BottomNavBar';

import { usePathname } from 'next/navigation';

export const MainTemplate: React.FC<MainTemplateProps> = ({ children }) => {
  const pathname = usePathname();

  if (pathname === '/plugins/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <HeaderSection />
      <div className="flex flex-1 relative">
        {/* Left menu — desktop only (hidden on mobile) */}
        <div className="hidden md:block">
          <LeftMenuSection />
        </div>
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
          <ContentSection>{children}</ContentSection>
        </div>
        <RightMenuSection />
      </div>
      <FooterSection />

      {/* Mobile bottom navigation — strictly hidden on md+ screens */}
      <div className="md:hidden">
        <BottomNavBar />
      </div>
    </div>
  );
};
