'use client';

import React from 'react';
import { ContentContainer } from './containers/ContentContainer';

interface ContentSectionProps {
  children: React.ReactNode;
}

export const ContentSection: React.FC<ContentSectionProps> = ({ children }) => {
  return <ContentContainer>{children}</ContentContainer>;
};
