
import React from 'react';
import { Member } from './types';

export const RADIUS_CLASS = "rounded-[24px]"; // Slightly sharper corners for modern look
export const BENTO_CARD_STYLE = `bg-white ${RADIUS_CLASS} border border-black/5 shadow-sm`;

// Hover effect: Pop up, strong shadow, Neon Yellow border hint
export const BENTO_CARD_HOVER = "hover:border-[#eaff00] hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]";

// Adjusted center for the larger 3000x3000px container
export const CANVAS_CENTER_X = 1500;
export const CANVAS_CENTER_Y = 1500;

// Increased radii to prevent overlap
export const CANVAS_RADIUS_L1 = 420; // Distance for main projects
export const CANVAS_RADIUS_L2_OFFSET = 280; // Additional distance for sub-projects

export const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: '王小明', color: 'bg-[#e5e5e5] text-[#1a1a1a]' },
  { id: 'm2', name: '李佳玲', color: 'bg-[#d4d4d4] text-[#1a1a1a]' },
  { id: 'm3', name: '張建國', color: 'bg-[#a3a3a3] text-white' },
  { id: 'm4', name: '陳美君', color: 'bg-[#737373] text-white' },
  { id: 'm5', name: '劉志豪', color: 'bg-[#404040] text-white' },
];

// Grayscale palette for members to fit the monochrome theme
export const MEMBER_COLORS = [
  'bg-[#f5f5f5] text-[#1a1a1a]',
  'bg-[#e5e5e5] text-[#1a1a1a]',
  'bg-[#d4d4d4] text-[#1a1a1a]',
  'bg-[#a3a3a3] text-white',
  'bg-[#737373] text-white',
  'bg-[#525252] text-white',
  'bg-[#262626] text-white',
];
