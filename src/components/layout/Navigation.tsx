// components/layout/Navigation.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  color: string;
}

interface NavigationProps {
  items: NavigationItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ items, activeItem, onItemClick }) => {
  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;
        
        return (
          <motion.button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`nav-item w-full ${isActive ? 'active' : ''}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-5 h-5" />
            <div className="flex-1 text-left">
              <div className="font-medium">{item.label}</div>
              <div className="text-xs opacity-75">{item.description}</div>
            </div>
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="w-2 h-2 bg-current rounded-full"
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};

export default Navigation;