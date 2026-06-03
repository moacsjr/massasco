'use client';

import React from 'react';
import { useUI } from '@temp-workspace/ui-registry';
import { MainTemplateProps } from '@temp-workspace/plugin-loader';
import { HeaderSection } from './HeaderSection';
import { LeftMenuContainer } from './containers/LeftMenuContainer';
import { ContentSection } from './ContentSection';
import { FooterSection } from './FooterSection';
import { BottomNavBarContainer } from './containers/BottomNavBarContainer';
import { RightMenuContainer } from './containers/RightMenuContainer';

import { usePathname } from 'next/navigation';


const AdminTemplate: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-background">
      <HeaderSection />
      <div className="flex flex-1 relative">
        {/* Left menu — desktop only (hidden on mobile) */}
        <div className="hidden md:block">
          <LeftMenuContainer />
        </div>
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
          <ContentSection>{children}</ContentSection>
        </div>
        <RightMenuContainer />
      </div>
      <FooterSection />

      {/* Mobile bottom navigation — strictly hidden on md+ screens */}
      <div className="md:hidden">
        <BottomNavBarContainer />
      </div>
    </div>
);

const PortalTemplate: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-background">
      <HeaderSection />
      <div className="flex flex-1 relative">        
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 pb-14 md:pb-0">
          <ContentSection>{children}</ContentSection>
        </div>
        <RightMenuContainer />
      </div>
      <FooterSection />

      {/* Mobile bottom navigation — strictly hidden on md+ screens */}
      <div className="md:hidden">
        <BottomNavBarContainer layout='portal' />
      </div>
    </div>
);


export const MainTemplate: React.FC<MainTemplateProps> = ({ children }) => {
  const pathname = usePathname();

  if (pathname === '/plugins/login') {
    return <>{children}</>;
  }

  if (pathname.startsWith('/plugins/customer-portal')){
    return <PortalTemplate>{children}</PortalTemplate>;
  }

  return <AdminTemplate>{children}</AdminTemplate>;
};
