import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { queryClient } from "@/lib/queryClient";

type OfflineContextType = {
  isOffline: boolean;
  isSyncing: boolean;
};

export const OfflineContext = createContext<OfflineContextType | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  useEffect(() => {
    // Handle online/offline status changes
    const handleOnline = () => {
      setIsOffline(false);
      // When coming back online, initiate data sync
      setIsSyncing(true);
      
      // Refetch all queries to sync data
      queryClient.refetchQueries().then(() => {
        setIsSyncing(false);
      }).catch(() => {
        setIsSyncing(false);
      });
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <OfflineContext.Provider value={{ isOffline, isSyncing }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return context;
}
