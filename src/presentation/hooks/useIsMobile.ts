import { useState, useEffect } from 'react';

export const useIsMobile = (
  breakpoint: number = 768
): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    return window.innerWidth < breakpoint || isMobileUA;
  });

  useEffect(() => {
    const handleResize = () => {
      const userAgent = navigator.userAgent || '';
      const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(window.innerWidth < breakpoint || isMobileUA);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};
