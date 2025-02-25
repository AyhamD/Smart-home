// src/context/ImagesContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ImageProviderProps, ImagesContextType } from '../types';

const ImagesContext = createContext<ImagesContextType | undefined>(undefined);

export const useImageContext  = () => {
  const context = useContext(ImagesContext);
  if (!context) {
    throw new Error('useImages must be used within a ImagesProvider');
  }
  return context;
};

export const ImagesProvider: React.FC<ImageProviderProps> = ({ children }) => {
  const [userImages, setUserImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (userImages.length > 0) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === userImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [userImages]);

  return (
    <ImagesContext.Provider
      value={{ userImages, setUserImages, currentImageIndex, setCurrentImageIndex }}
    >
      {children}
    </ImagesContext.Provider>
  );
};