"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarEvent } from "@/types/dashboard";

interface EventEditorProps {
  onClose: () => void;
}

interface EventFormData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
}

export default function EventEditor({ onClose }: EventEditorProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    startDate: '',
    endDate: '',
    location: ''
  });
  const [saving, setSaving] = useState(false);
  const [editingRowData, setEditingRowData] = useState<{ [key: string]: EventFormData }>({});

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded events:', data.events?.map((e: any) => ({ id: e.id, title: e.title })));
        
        // Sort events by start date (earliest first)
        const sortedEvents = (data.events || []).sort((a: CalendarEvent, b: CalendarEvent) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        
        setEvents(sortedEvents);
      } else {
        console.error('Failed to load events');
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const startInlineEdit = (event: CalendarEvent) => {
    console.log('Starting inline edit for event:', { id: event.id, title: event.title });
    setEditingEventId(event.id);
    setEditingRowData({
      [event.id]: {
        title: event.title,
        description: '',
        startDate: event.startDate.split('T')[0],
        endDate: event.endDate.split('T')[0],
        location: event.location
      }
    });
  };

  const cancelInlineEdit = (eventId: string) => {
    setEditingEventId(null);
    setEditingRowData(prev => {
      const newData = { ...prev };
      delete newData[eventId];
      return newData;
    });
  };

  const updateInlineField = (eventId: string, field: keyof EventFormData, value: string) => {
    setEditingRowData(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [field]: value
      }
    }));
  };

  const handleAddNew = () => {
    setEditingEventId(null);
    setFormData({
      title: '',
      startDate: '',
      endDate: '',
      location: ''
    });
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate || !formData.location) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/events';
      const method = 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          startDate: formData.startDate,
          endDate: formData.endDate,
          location: formData.location
        }),
      });

      if (response.ok) {
        // Reload and sort events
        await loadEvents();
        setEditingEventId(null);
        // Keep the add form open for multiple entries; clear inputs
        setShowAddForm(true);
        setFormData({
          title: '',
          startDate: '',
          endDate: '',
          location: ''
        });
        setStatus({ type: 'success', message: 'Event successfully added.' });
        // Refresh dashboard data and reload the page
        try { await fetch('/api/dashboard?refresh=true', { cache: 'no-store' }); } catch {}
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setStatus({ type: 'error', message: `Error saving: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleInlineSave = async (eventId: string) => {
    const rowData = editingRowData[eventId];
    if (!rowData || !rowData.title || !rowData.startDate || !rowData.endDate || !rowData.location) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    // Find the original event to compare
    const originalEvent = events.find(event => event.id === eventId);
    if (!originalEvent) {
      console.error('Original event not found for ID:', eventId);
      console.log('Available events:', events.map(e => ({ id: e.id, title: e.title })));
      console.log('Editing row data:', rowData);
      setStatus({ type: 'error', message: 'Error: Event not found. Please try again.' });
      // Cancel edit mode and reload events
      setEditingEventId(null);
      setEditingRowData(prev => {
        const newData = { ...prev };
        delete newData[eventId];
        return newData;
      });
      await loadEvents();
      return;
    }

    // Check if any changes were made
    const hasChanges = 
      originalEvent.title !== rowData.title ||
      originalEvent.startDate !== new Date(rowData.startDate).toISOString() ||
      originalEvent.endDate !== new Date(rowData.endDate).toISOString() ||
      originalEvent.location !== rowData.location;

    // If no changes, just exit edit mode without saving
    if (!hasChanges) {
      setEditingEventId(null);
      setEditingRowData(prev => {
        const newData = { ...prev };
        delete newData[eventId];
        return newData;
      });
      return; // Exit without showing any message
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: eventId,
          title: rowData.title,
          startDate: rowData.startDate,
          endDate: rowData.endDate,
          location: rowData.location
        }),
      });

      if (response.ok) {
        // Reload and sort events
        await loadEvents();
        setEditingEventId(null);
        setEditingRowData(prev => {
          const newData = { ...prev };
          delete newData[eventId];
          return newData;
        });
        setStatus({ type: 'success', message: 'Event successfully updated.' });
        // Refresh dashboard data and reload the page
        try { await fetch('/api/dashboard?refresh=true', { cache: 'no-store' }); } catch {}
        window.location.reload();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error saving');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setStatus({ type: 'error', message: `Error saving: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/events?id=${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload and sort events
        await loadEvents();
        setStatus({ type: 'success', message: 'Event successfully deleted.' });
        // Background refresh of dashboard API
        fetch('/api/dashboard?refresh=true', { cache: 'no-store' }).catch(() => {});
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setStatus({ type: 'error', message: `Error deleting: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inline status toast */}
      {status && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-sm ${
            status.type === 'success' ? 'bg-green-600 text-white' : status.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'
          }`}
          onAnimationEnd={() => {
            /* no-op */
          }}
        >
          {status.message}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Edit Events
        </h3>
        <div className="flex space-x-3">
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Event
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
            Add New Event
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Event Name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Location"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            
            {/* Description removed as it's not used on dashboard */}
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => {
                setEditingEventId(null);
                setShowAddForm(false);
                setFormData({
                  title: '',
                  description: '',
                  startDate: '',
                  endDate: '',
                  location: ''
                });
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                    No events found
                  </td>
                </tr>
              ) : (
                events.map((event) => {
                  const isEditing = editingEventId === event.id;
                  const rowData = editingRowData[event.id];
                  
                  return (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {/* Name */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={rowData?.title || ''}
                            onChange={(e) => updateInlineField(event.id, 'title', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Event Name"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </div>
                        )}
                      </td>
                      
                      {/* Startdatum */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="date"
                            value={rowData?.startDate || ''}
                            onChange={(e) => updateInlineField(event.id, 'startDate', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(event.startDate)}
                          </div>
                        )}
                      </td>
                      
                      {/* Enddatum */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="date"
                            value={rowData?.endDate || ''}
                            onChange={(e) => updateInlineField(event.id, 'endDate', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(event.endDate)}
                          </div>
                        )}
                      </td>
                      
                      {/* Ort */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={rowData?.location || ''}
                            onChange={(e) => updateInlineField(event.id, 'location', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Location"
                          />
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {event.location}
                          </div>
                        )}
                      </td>
                      
                      {/* Description column removed */}
                      
                      {/* Aktionen */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleInlineSave(event.id)}
                              disabled={saving}
                              className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded-md transition-colors"
                              title="Save"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Save
                            </button>
                            <button
                              onClick={() => cancelInlineEdit(event.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-md transition-colors"
                              title="Cancel"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startInlineEdit(event)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                              title="Edit"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors"
                              title="Delete"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
