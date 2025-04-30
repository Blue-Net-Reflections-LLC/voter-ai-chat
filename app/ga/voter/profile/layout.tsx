import React from 'react';

// This layout simply passes children through, preventing the
// parent /ga/voter/layout.tsx structure (with the sidebar)
// from applying to routes within /profile/*
export default function ProfileSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 