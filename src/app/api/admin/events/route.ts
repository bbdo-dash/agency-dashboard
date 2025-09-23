import { NextRequest, NextResponse } from 'next/server';
import { loadEventsFromCSV, getEventsCSVPath } from '@/lib/csvParser';
import { writeFile } from 'fs/promises';
import { CalendarEvent } from '@/types/dashboard';
import { kv } from '@vercel/kv';
import { ensureEventsInKV, ensureRSSFeedsInKV } from '@/lib/migration';
import { invalidateAdminCaches } from '@/lib/cache-invalidation';

// Helper function to check if we're in development mode
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

// GET - Load all events
export async function GET() {
  try {
    if (isDevelopment()) {
      // Fallback to CSV in development
      const csvPath = getEventsCSVPath();
      const events = loadEventsFromCSV(csvPath);
      
      // Sort events by start date (earliest first)
      const sortedEvents = events.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      return NextResponse.json({ 
        success: true, 
        events: sortedEvents
      });
    } else {
      // Use Vercel KV Storage in production
      // Ensure events and RSS feeds are migrated if needed
      await Promise.all([
        ensureEventsInKV(),
        ensureRSSFeedsInKV()
      ]);
      
      const events = await kv.get<CalendarEvent[]>('calendar_events') || [];
      
      // Sort events by start date (earliest first)
      const sortedEvents = events.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      return NextResponse.json({ 
        success: true, 
        events: sortedEvents
      });
    }
  } catch (error) {
    console.error('Error loading events:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load events' 
    }, { status: 500 });
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const { title, description, startDate, endDate, location } = await request.json();
    
    // Validate required fields
    if (!title || !startDate || !endDate || !location) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title, start date, end date, and location are required' 
      }, { status: 400 });
    }
    
    if (isDevelopment()) {
      // Fallback to CSV in development
      const csvPath = getEventsCSVPath();
      const existingEvents = loadEventsFromCSV(csvPath);
      
      // Create new event with a unique ID
      const existingEventIds = existingEvents.map(e => e.id);
      let newEventId = `manual-event-1`;
      let counter = 1;
      while (existingEventIds.includes(newEventId)) {
        counter++;
        newEventId = `manual-event-${counter}`;
      }
      
      const newEvent: CalendarEvent = {
        id: newEventId,
        title: title.trim(),
        description: description?.trim() || `Event in ${location.trim()}`,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        location: location.trim()
      };
      
      // Add to existing events
      existingEvents.push(newEvent);
      
      // Sort by start date (earliest first)
      existingEvents.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      // Convert back to CSV format
      const csvContent = convertEventsToCSV(existingEvents);
      
      // Write back to file
      await writeFile(csvPath, csvContent, 'utf-8');
      
      return NextResponse.json({ 
        success: true, 
        event: newEvent,
        message: 'Event created successfully' 
      });
    } else {
      // Use Vercel KV Storage in production
      const existingEvents = await kv.get<CalendarEvent[]>('calendar_events') || [];
      
      // Create new event with a unique ID
      const existingEventIds = existingEvents.map(e => e.id);
      let newEventId = `manual-event-1`;
      let counter = 1;
      while (existingEventIds.includes(newEventId)) {
        counter++;
        newEventId = `manual-event-${counter}`;
      }
      
      const newEvent: CalendarEvent = {
        id: newEventId,
        title: title.trim(),
        description: description?.trim() || `Event in ${location.trim()}`,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        location: location.trim()
      };
      
      // Add to existing events
      existingEvents.push(newEvent);
      
      // Sort by start date (earliest first)
      existingEvents.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      // Save to KV storage
      await kv.set('calendar_events', existingEvents);
      
      return NextResponse.json({ 
        success: true, 
        event: newEvent,
        message: 'Event created successfully' 
      });
    }
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create event' 
    }, { status: 500 });
  }
}

// PUT - Update existing event
export async function PUT(request: NextRequest) {
  try {
    const { id, title, description, startDate, endDate, location } = await request.json();
    
    // Validate required fields
    if (!id || !title || !startDate || !endDate || !location) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID, title, start date, end date, and location are required' 
      }, { status: 400 });
    }
    
    if (isDevelopment()) {
      // Fallback to CSV in development
      const csvPath = getEventsCSVPath();
      const existingEvents = loadEventsFromCSV(csvPath);
      
      // Find and update event
      const eventIndex = existingEvents.findIndex(event => event.id === id);
      if (eventIndex === -1) {
        return NextResponse.json({ 
          success: false, 
          error: 'Event not found' 
        }, { status: 404 });
      }
      
      // Update event
      existingEvents[eventIndex] = {
        ...existingEvents[eventIndex],
        title: title.trim(),
        description: description?.trim() || existingEvents[eventIndex].description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        location: location.trim()
      };
      
      // Sort by start date (earliest first)
      existingEvents.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      // Convert back to CSV format
      const csvContent = convertEventsToCSV(existingEvents);
      
      // Write back to file
      await writeFile(csvPath, csvContent, 'utf-8');
      
      return NextResponse.json({ 
        success: true, 
        event: existingEvents[eventIndex],
        message: 'Event updated successfully' 
      });
    } else {
      // Use Vercel KV Storage in production
      const existingEvents = await kv.get<CalendarEvent[]>('calendar_events') || [];
      
      // Find and update event
      const eventIndex = existingEvents.findIndex(event => event.id === id);
      if (eventIndex === -1) {
        return NextResponse.json({ 
          success: false, 
          error: 'Event not found' 
        }, { status: 404 });
      }
      
      // Update event
      existingEvents[eventIndex] = {
        ...existingEvents[eventIndex],
        title: title.trim(),
        description: description?.trim() || existingEvents[eventIndex].description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        location: location.trim()
      };
      
      // Sort by start date (earliest first)
      existingEvents.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      // Save to KV storage
      await kv.set('calendar_events', existingEvents);
      
      return NextResponse.json({ 
        success: true, 
        event: existingEvents[eventIndex],
        message: 'Event updated successfully' 
      });
    }
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update event' 
    }, { status: 500 });
  }
}

// DELETE - Delete event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }
    
    if (isDevelopment()) {
      // Fallback to CSV in development
      const csvPath = getEventsCSVPath();
      const existingEvents = loadEventsFromCSV(csvPath);
      
      // Find and remove event
      const eventIndex = existingEvents.findIndex(event => event.id === id);
      if (eventIndex === -1) {
        return NextResponse.json({ 
          success: false, 
          error: 'Event not found' 
        }, { status: 404 });
      }
      
      const deletedEvent = existingEvents[eventIndex];
      existingEvents.splice(eventIndex, 1);
      
      // Sort by start date (earliest first) after deletion
      existingEvents.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      // Convert back to CSV format
      const csvContent = convertEventsToCSV(existingEvents);
      
      // Write back to file
      await writeFile(csvPath, csvContent, 'utf-8');
      
      return NextResponse.json({ 
        success: true, 
        event: deletedEvent,
        message: 'Event deleted successfully' 
      });
    } else {
      // Use Vercel KV Storage in production
      const existingEvents = await kv.get<CalendarEvent[]>('calendar_events') || [];
      
      // Find and remove event
      const eventIndex = existingEvents.findIndex(event => event.id === id);
      if (eventIndex === -1) {
        return NextResponse.json({ 
          success: false, 
          error: 'Event not found' 
        }, { status: 404 });
      }
      
      const deletedEvent = existingEvents[eventIndex];
      existingEvents.splice(eventIndex, 1);
      
      // Sort by start date (earliest first) after deletion
      existingEvents.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      
      // Save to KV storage
      await kv.set('calendar_events', existingEvents);
      
      return NextResponse.json({ 
        success: true, 
        event: deletedEvent,
        message: 'Event deleted successfully' 
      });
    }
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete event' 
    }, { status: 500 });
  }
}

// Helper function to convert events back to CSV format
function convertEventsToCSV(events: CalendarEvent[]): string {
  const header = 'Name,Datum,Ort\n';
  
  const csvRows = events.map(event => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    // Format date based on whether it's a multi-day event
    let dateStr;
    if (startDate.toDateString() === endDate.toDateString()) {
      // Single day event
      dateStr = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getFullYear()}`;
    } else {
      // Multi-day event
      dateStr = `${startDate.getDate().toString().padStart(2, '0')}.–${endDate.getDate().toString().padStart(2, '0')}.${(endDate.getMonth() + 1).toString().padStart(2, '0')}.${endDate.getFullYear()}`;
    }
    
    return `"${event.title}","${dateStr}","${event.location}"`;
  });
  
  return header + csvRows.join('\n');
}
