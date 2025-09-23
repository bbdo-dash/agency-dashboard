/**
 * Automatic dashboard updates without manual refresh
 */

/**
 * Dashboard update strategies
 */
export enum UpdateStrategy {
  IMMEDIATE = 'immediate',     // Force refresh immediately
  OPTIMISTIC = 'optimistic',   // Update UI first, then sync with server
  BACKGROUND = 'background'    // Update in background without UI disruption
}

/**
 * Dashboard update manager
 */
export class DashboardUpdater {
  private static instance: DashboardUpdater;
  private updateCallbacks: Set<() => void> = new Set();
  private isUpdating = false;

  static getInstance(): DashboardUpdater {
    if (!DashboardUpdater.instance) {
      DashboardUpdater.instance = new DashboardUpdater();
    }
    return DashboardUpdater.instance;
  }

  /**
   * Register a callback for dashboard updates
   */
  onUpdate(callback: () => void): () => void {
    this.updateCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Trigger dashboard update
   */
  async update(strategy: UpdateStrategy = UpdateStrategy.IMMEDIATE): Promise<boolean> {
    if (this.isUpdating) {
      console.log('🔄 Dashboard update already in progress, skipping...');
      return false;
    }

    this.isUpdating = true;

    try {
      switch (strategy) {
        case UpdateStrategy.IMMEDIATE:
          return await this.immediateUpdate();
        case UpdateStrategy.OPTIMISTIC:
          return await this.optimisticUpdate();
        case UpdateStrategy.BACKGROUND:
          return await this.backgroundUpdate();
        default:
          return await this.immediateUpdate();
      }
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Immediate update - force refresh all data
   */
  private async immediateUpdate(): Promise<boolean> {
    try {
      console.log('🔄 Starting immediate dashboard update...');
      
      // Force refresh dashboard data
      const response = await fetch('/api/dashboard?refresh=true', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Dashboard update failed: ${response.status}`);
      }

      // Notify all registered callbacks
      this.updateCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in dashboard update callback:', error);
        }
      });

      console.log('✅ Dashboard updated immediately');
      return true;
    } catch (error) {
      console.error('❌ Immediate dashboard update failed:', error);
      return false;
    }
  }

  /**
   * Optimistic update - update UI first, then sync
   */
  private async optimisticUpdate(): Promise<boolean> {
    try {
      console.log('🔄 Starting optimistic dashboard update...');
      
      // Notify callbacks immediately for instant UI update
      this.updateCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in optimistic update callback:', error);
        }
      });

      // Then fetch fresh data in background
      const response = await fetch('/api/dashboard?refresh=true', { 
        cache: 'no-store' 
      });

      if (!response.ok) {
        console.warn('Background sync failed, but UI was updated optimistically');
        return false;
      }

      console.log('✅ Dashboard updated optimistically');
      return true;
    } catch (error) {
      console.error('❌ Optimistic dashboard update failed:', error);
      return false;
    }
  }

  /**
   * Background update - update without UI disruption
   */
  private async backgroundUpdate(): Promise<boolean> {
    try {
      console.log('🔄 Starting background dashboard update...');
      
      // Fetch fresh data without triggering UI updates
      const response = await fetch('/api/dashboard?refresh=true', { 
        cache: 'no-store' 
      });

      if (!response.ok) {
        throw new Error(`Background update failed: ${response.status}`);
      }

      console.log('✅ Dashboard updated in background');
      return true;
    } catch (error) {
      console.error('❌ Background dashboard update failed:', error);
      return false;
    }
  }

  /**
   * Schedule periodic updates
   */
  scheduleUpdates(intervalMs: number = 5 * 60 * 1000): () => void {
    const intervalId = setInterval(() => {
      this.update(UpdateStrategy.BACKGROUND);
    }, intervalMs);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }
}

/**
 * Convenience functions
 */
export const dashboardUpdater = DashboardUpdater.getInstance();

/**
 * React hook for dashboard updates
 */
export function useDashboardUpdater() {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const unsubscribe = dashboardUpdater.onUpdate(() => {
      setIsUpdating(false);
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, []);

  const updateDashboard = React.useCallback(async (strategy?: UpdateStrategy) => {
    setIsUpdating(true);
    const success = await dashboardUpdater.update(strategy);
    if (!success) {
      setIsUpdating(false);
    }
    return success;
  }, []);

  return {
    updateDashboard,
    isUpdating,
    lastUpdate
  };
}

// Import React for the hook
import React from 'react';
