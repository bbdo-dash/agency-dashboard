import DashboardLayout from '@/components/layout/DashboardLayout';
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import type { CalendarEvent } from '@/types/dashboard';

async function getCalendarData() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : '';
      
  const res = await fetch(`${baseUrl}/api/dashboard`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch calendar data');
  }
  
  const data = await res.json();
  return data.events;
}

export default async function CalendarPage() {
  const events = await getCalendarData();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-6 w-6 text-gray-400 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Culture Calendar</h1>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Upcoming media-related events and local happenings
            </p>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          {events.map((event: CalendarEvent) => (
            <div key={event.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {event.description}
                  </p>
                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>{event.location}</span>
                    </div>
                    {/* Attendees not available in current CalendarEvent interface */}
                  </div>
                </div>
                <div className="ml-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Event
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 