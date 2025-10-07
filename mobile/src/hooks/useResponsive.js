import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;
  const isSmallDevice = Math.min(width, height) < 375;

  // Breakpoints
  const breakpoints = {
    xs: width < 375,    // Extra small phones
    sm: width >= 375 && width < 768,  // Phones
    md: width >= 768 && width < 1024, // Tablets portrait
    lg: width >= 1024,  // Tablets landscape
  };

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isSmallDevice,
    breakpoints,
    // Helper functions
    wp: (percentage) => (width * percentage) / 100,
    hp: (percentage) => (height * percentage) / 100,
  };
};
