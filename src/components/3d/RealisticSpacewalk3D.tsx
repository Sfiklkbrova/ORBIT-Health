// ============================================================================
// ORBIT HEALTH — CLEAN & PROFESSIONAL SPACE BACKGROUND WRAPPER
// Lightweight, vector-based, high performance, zero image dependencies
// ============================================================================

import React from 'react';
import { SpaceBackground } from '../SpaceBackground';

interface RealisticSpacewalk3DProps {
  children?: React.ReactNode;
}

export const RealisticSpacewalk3D: React.FC<RealisticSpacewalk3DProps> = ({ children }) => {
  return <SpaceBackground>{children}</SpaceBackground>;
};
