"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuthToken, validateToken } from '@/lib/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for login page and public paths
      if (pathname === '/login' || pathname.startsWith('/api/')) {
        return;
      }

      const token = getAuthToken();
      if (!token) {
        // No token, redirect to login
        router.push('/login');
        return;
      }

      // Validate token with server
      const isValid = await validateToken();
      if (!isValid) {
        // Invalid token, redirect to login
        router.push('/login');
        return;
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Inject auth headers into fetch requests
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const token = getAuthToken();
      
      if (token && typeof input === 'string' && !input.startsWith('/api/auth/')) {
        // Add Authorization header to API requests
        const headers = new Headers(init?.headers);
        headers.set('Authorization', `Bearer ${token}`);
        
        init = {
          ...init,
          headers,
        };
      }
      
      return originalFetch(input, init);
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}
