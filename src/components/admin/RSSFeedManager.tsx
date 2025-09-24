"use client";

import { useState, useEffect, useCallback } from "react";

interface RSSFeed {
  id: string;
  url: string;
  title: string;
  description?: string;
  isActive: boolean;
  lastChecked?: string;
  itemCount?: number;
}

interface RSSFeedManagerProps {
  onClose: () => void;
}

export default function RSSFeedManager({ onClose }: RSSFeedManagerProps) {
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState<RSSFeed | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: ''
  });

  const loadFeeds = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/rss-feeds');
      if (response.ok) {
        const data = await response.json();
        setFeeds(data.feeds || []);
      } else {
        console.error('Failed to load RSS feeds');
        setFeeds([]);
      }
    } catch (error) {
      console.error('Error loading RSS feeds:', error);
      setFeeds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load feeds on mount
  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  const handleAddFeed = () => {
    setFormData({ url: '', title: '', description: '' });
    setEditingFeed(null);
    setShowAddForm(true);
  };

  const handleEditFeed = (feed: RSSFeed) => {
    setFormData({
      url: feed.url,
      title: feed.title,
      description: feed.description || ''
    });
    setEditingFeed(feed);
    setShowAddForm(true);
  };

  const handleSaveFeed = async () => {
    if (!formData.url.trim() || !formData.title.trim()) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    // Validate URL format
    try {
      new URL(formData.url);
    } catch {
      alert('Please enter a valid URL (e.g. https://example.com/feed.xml)');
      return;
    }

    try {
      setIsSaving(true);
      const method = editingFeed ? 'PUT' : 'POST';
      const url = editingFeed ? `/api/admin/rss-feeds/${editingFeed.id}` : '/api/admin/rss-feeds';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadFeeds();
        setShowAddForm(false);
        setEditingFeed(null);
        setFormData({ url: '', title: '', description: '' });
        setStatus({ type: 'success', message: editingFeed ? 'RSS feed successfully updated.' : 'RSS feed successfully added.' });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving');
      }
    } catch (error) {
      console.error('Error saving RSS feed:', error);
      setStatus({ type: 'error', message: `Error saving: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFeed = async (feedId: string, feedTitle: string) => {
    try {
      const response = await fetch(`/api/admin/rss-feeds/${feedId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadFeeds();
        setStatus({ type: 'success', message: `RSS feed "${feedTitle}" deleted.` });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting');
      }
    } catch (error) {
      console.error('Error deleting RSS feed:', error);
      setStatus({ type: 'error', message: `Error deleting: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const handleToggleActive = async (feedId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/rss-feeds/${feedId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await loadFeeds();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating');
      }
    } catch (error) {
      console.error('Error toggling RSS feed status:', error);
      setStatus({ type: 'error', message: `Error updating: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const handleRefreshFeeds = async () => {
    try {
      setIsLoading(true);
      // Trigger a refresh of the news API to reload and remix articles
      const response = await fetch('/api/news?refresh=true', {
        method: 'GET',
        cache: 'no-store'
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'RSS feeds updated. Reloading…' });
        // Ensure UI reflects latest news immediately
        window.location.reload();
      } else {
        throw new Error('Error updating RSS feeds');
      }
    } catch (error) {
      console.error('Error refreshing RSS feeds:', error);
      setStatus({ type: 'error', message: `Error updating: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading RSS feeds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {status && (
        <div className={`fixed top-4 right-4 z-[10010] px-4 py-2 rounded shadow text-sm ${status.type === 'success' ? 'bg-green-600 text-white' : status.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'}`}>{status.message}</div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          RSS Feed Management
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleRefreshFeeds}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          title="Reloads all RSS feeds and shuffles articles"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Updating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Update RSS Feeds
            </>
          )}
        </button>
        
        <button
          onClick={handleAddFeed}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          title="Adds a new RSS feed to the collection"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New RSS Feed
        </button>
      </div>

      {/* Feeds List */}
      <div className="space-y-4">
        {feeds.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No RSS feeds configured.</p>
            <p className="text-sm">Click "Add New RSS Feed" to get started.</p>
          </div>
        ) : (
          feeds.map((feed) => (
            <div
              key={feed.id}
              className={`border rounded-lg p-4 ${
                feed.isActive 
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {feed.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        feed.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {feed.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {feed.url}
                  </p>
                  
                  {feed.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                      {feed.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    {feed.itemCount && (
                      <span>{feed.itemCount} articles</span>
                    )}
                    {feed.lastChecked && (
                      <span>Last checked: {new Date(feed.lastChecked).toLocaleDateString('en-US')}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEditFeed(feed)}
                    className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => handleToggleActive(feed.id, feed.isActive)}
                    className={`${
                      feed.isActive
                        ? 'text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200'
                        : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200'
                    }`}
                    title={feed.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {feed.isActive ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setConfirmDelete({ id: feed.id, title: feed.title })}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10002]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingFeed ? 'Edit RSS Feed' : 'Add New RSS Feed'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RSS Feed URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/feed.xml"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. HORIZONT News"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description of the RSS feed"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingFeed(null);
                  setFormData({ url: '', title: '', description: '' });
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeed}
                disabled={isSaving || !formData.url.trim() || !formData.title.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isSaving ? 'Saving...' : (editingFeed ? 'Update' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline confirm dialog for delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10020]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4 p-5">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Delete RSS feed?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete "{confirmDelete.title}"? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">Cancel</button>
              <button onClick={async () => { const id = confirmDelete.id; const title = confirmDelete.title; setConfirmDelete(null); await handleDeleteFeed(id, title); }} className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
