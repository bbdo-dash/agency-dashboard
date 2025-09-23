"use client";

import { useCallback, useEffect, useState } from 'react';

interface SocialRSSFeed {
  id: string;
  url: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocialRSSFeedManagerProps {
  onClose: () => void;
  initialFeed?: SocialRSSFeed | null;
}

export default function SocialRSSFeedManager({ onClose, initialFeed = null }: SocialRSSFeedManagerProps) {
  const [feeds, setFeeds] = useState<SocialRSSFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState<SocialRSSFeed | null>(null);

  const [formData, setFormData] = useState({ url: '', title: '', description: '' });

  const loadFeeds = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/social-rss-feeds');
      if (response.ok) {
        const data = await response.json();
        setFeeds(data.feeds || []);
      } else {
        setFeeds([]);
      }
    } catch (error) {
      console.error('Error loading social RSS feeds:', error);
      setFeeds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadFeeds(); }, [loadFeeds]);

  // Open directly in edit mode if initialFeed provided
  useEffect(() => {
    if (initialFeed) {
      setFormData({ url: initialFeed.url, title: initialFeed.title, description: initialFeed.description || '' });
      setEditingFeed(initialFeed);
      setShowAddForm(true);
    }
  }, [initialFeed]);

  const handleAddFeed = () => {
    setFormData({ url: '', title: '', description: '' });
    setEditingFeed(null);
    setShowAddForm(true);
  };

  const handleEditFeed = (feed: SocialRSSFeed) => {
    setFormData({ url: feed.url, title: feed.title, description: feed.description || '' });
    setEditingFeed(feed);
    setShowAddForm(true);
  };

  const handleSaveFeed = async () => {
    if (!formData.url.trim() || !formData.title.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    try { new URL(formData.url); } catch { alert('Please enter a valid URL'); return; }

    try {
      setIsSaving(true);
      const method = editingFeed ? 'PUT' : 'POST';
      const url = editingFeed ? `/api/admin/social-rss-feeds/${editingFeed.id}` : '/api/admin/social-rss-feeds';
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error saving');
      }
      await loadFeeds();
      setShowAddForm(false);
      setEditingFeed(null);
      setFormData({ url: '', title: '', description: '' });
      alert(editingFeed ? 'Social RSS feed updated!' : 'Social RSS feed added!');
    } catch (error) {
      console.error('Error saving social RSS feed:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFeed = async (feedId: string, feedTitle: string) => {
    if (!confirm(`Delete feed "${feedTitle}"?`)) return;
    try {
      const response = await fetch(`/api/admin/social-rss-feeds/${feedId}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Delete failed');
      }
      await loadFeeds();
    } catch (error) {
      console.error('Error deleting social RSS feed:', error);
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const toggleActive = async (feed: SocialRSSFeed) => {
    try {
      const response = await fetch(`/api/admin/social-rss-feeds/${feed.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !feed.isActive }) });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Update failed');
      }
      await loadFeeds();
    } catch (error) {
      console.error('Error toggling social RSS feed:', error);
      alert(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Social RSS Feeds</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300">Close</button>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">Manage social media RSS feeds used for Instagram section.</p>
        <button onClick={handleAddFeed} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Add Feed</button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-600 dark:text-gray-300">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feeds.map(feed => (
            <div key={feed.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{feed.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{feed.url}</p>
                  {feed.description ? <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{feed.description}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditFeed(feed)} className="px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white">Edit</button>
                  <button onClick={() => handleDeleteFeed(feed.id, feed.title)} className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white">Delete</button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs ${feed.isActive ? 'text-green-600' : 'text-gray-500'}`}>{feed.isActive ? 'Active' : 'Inactive'}</span>
                <button onClick={() => toggleActive(feed)} className={`px-3 py-1 rounded ${feed.isActive ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-green-600 text-white'}`}>{feed.isActive ? 'Deactivate' : 'Activate'}</button>
              </div>
            </div>
          ))}
          {feeds.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-600 dark:text-gray-400">No feeds configured.</div>
          )}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10002]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editingFeed ? 'Edit Social RSS Feed' : 'Add Social RSS Feed'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">RSS Feed URL *</label>
                <input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://example.com/feed.xml" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Porsche Motorsport" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Optional description" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">Cancel</button>
                <button onClick={handleSaveFeed} disabled={isSaving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">{isSaving ? 'Saving…' : (editingFeed ? 'Save changes' : 'Add feed')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


