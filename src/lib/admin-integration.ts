/**
 * Enhanced admin integration with automatic dashboard updates
 */

import { dashboardUpdater, UpdateStrategy } from './dashboard-updater';

/**
 * Admin operation result
 */
export interface AdminOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Enhanced admin operations with automatic dashboard updates
 */
export class AdminIntegration {
  private static instance: AdminIntegration;

  static getInstance(): AdminIntegration {
    if (!AdminIntegration.instance) {
      AdminIntegration.instance = new AdminIntegration();
    }
    return AdminIntegration.instance;
  }

  /**
   * Execute admin operation with automatic dashboard update
   */
  async executeOperation<T>(
    operation: () => Promise<T>,
    options: {
      updateStrategy?: UpdateStrategy;
      showSuccessMessage?: boolean;
      showErrorMessage?: boolean;
      successMessage?: string;
    } = {}
  ): Promise<AdminOperationResult> {
    const {
      updateStrategy = UpdateStrategy.IMMEDIATE,
      showSuccessMessage = true,
      showErrorMessage = true,
      successMessage = 'Operation completed successfully'
    } = options;

    try {
      console.log('🔧 Executing admin operation...');
      
      // Execute the operation
      const result = await operation();
      
      // Update dashboard automatically
      const updateSuccess = await dashboardUpdater.update(updateStrategy);
      
      if (updateSuccess) {
        console.log('✅ Admin operation completed and dashboard updated');
        
        if (showSuccessMessage) {
          // Show success notification
          this.showNotification(successMessage, 'success');
        }
        
        return {
          success: true,
          message: successMessage,
          data: result
        };
      } else {
        console.warn('⚠️ Admin operation completed but dashboard update failed');
        
        return {
          success: true,
          message: 'Operation completed, but dashboard update failed. Please refresh manually.',
          data: result
        };
      }
    } catch (error) {
      console.error('❌ Admin operation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (showErrorMessage) {
        this.showNotification(errorMessage, 'error');
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * RSS Feed operations
   */
  rssFeeds = {
    async create(url: string, title: string, description?: string): Promise<AdminOperationResult> {
      return await this.executeOperation(
        async () => {
          const response = await fetch('/api/admin/rss-feeds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, title, description })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create RSS feed');
          }

          return await response.json();
        },
        { successMessage: 'RSS feed created and dashboard updated' }
      );
    },

    async update(id: string, updates: { url?: string; title?: string; description?: string }): Promise<AdminOperationResult> {
      return await this.executeOperation(
        async () => {
          const response = await fetch(`/api/admin/rss-feeds/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update RSS feed');
          }

          return await response.json();
        },
        { successMessage: 'RSS feed updated and dashboard refreshed' }
      );
    },

    async toggleStatus(id: string, isActive: boolean): Promise<AdminOperationResult> {
      return await this.executeOperation(
        async () => {
          const response = await fetch(`/api/admin/rss-feeds/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update RSS feed status');
          }

          return await response.json();
        },
        { 
          successMessage: `RSS feed ${isActive ? 'activated' : 'deactivated'} and dashboard updated`,
          updateStrategy: UpdateStrategy.OPTIMISTIC
        }
      );
    },

    async delete(id: string): Promise<AdminOperationResult> {
      return await this.executeOperation(
        async () => {
          const response = await fetch(`/api/admin/rss-feeds/${id}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete RSS feed');
          }

          return await response.json();
        },
        { successMessage: 'RSS feed deleted and dashboard updated' }
      );
    }
  };

  /**
   * Social RSS Feed operations
   */
  socialRssFeeds = {
    async create(url: string, title: string, description?: string): Promise<AdminOperationResult> {
      return await this.executeOperation(
        async () => {
          const response = await fetch('/api/admin/social-rss-feeds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, title, description })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create social RSS feed');
          }

          return await response.json();
        },
        { successMessage: 'Social RSS feed created and dashboard updated' }
      );
    },

    async update(id: string, updates: { url?: string; title?: string; description?: string }): Promise<AdminOperationResult> {
      return await this.executeOperation(
        async () => {
          const response = await fetch(`/api/admin/social-rss-feeds/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update social RSS feed');
          }

          return await response.json();
        },
        { successMessage: 'Social RSS feed updated and dashboard refreshed' }
      );
    },

    async toggleStatus(id: string, isActive: boolean): Promise<AdminOperationResult> {
      return await this.executeOperation(
        async () => {
          const response = await fetch(`/api/admin/social-rss-feeds/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update social RSS feed status');
          }

          return await response.json();
        },
        { 
          successMessage: `Social RSS feed ${isActive ? 'activated' : 'deactivated'} and dashboard updated`,
          updateStrategy: UpdateStrategy.OPTIMISTIC
        }
      );
    },

    async delete(id: string): Promise<AdminOperationResult> {
      return await this.executeOperation(
        async () => {
          const response = await fetch(`/api/admin/social-rss-feeds/${id}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete social RSS feed');
          }

          return await response.json();
        },
        { successMessage: 'Social RSS feed deleted and dashboard updated' }
      );
    }
  };

  /**
   * Manual dashboard refresh
   */
  async refreshDashboard(): Promise<AdminOperationResult> {
    return await this.executeOperation(
      async () => {
        const response = await fetch('/api/dashboard?refresh=true', { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error('Failed to refresh dashboard');
        }

        return await response.json();
      },
      { 
        successMessage: 'Dashboard refreshed successfully',
        updateStrategy: UpdateStrategy.IMMEDIATE
      }
    );
  }

  /**
   * Show notification to user
   */
  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    
    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

/**
 * Convenience instance
 */
export const adminIntegration = AdminIntegration.getInstance();
