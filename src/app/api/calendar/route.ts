import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (!apiKey || !calendarId) {
      throw new Error('Missing Google Calendar API credentials');
    }

    // Get events for the next 30 days
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Google Calendar API endpoint
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
      new URLSearchParams({
        key: apiKey,
        timeMin,
        timeMax,
        maxResults: '10',
        singleEvents: 'true',
        orderBy: 'startTime'
      }),
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Google Calendar API');
    }

    const data = await response.json();
    
    // Transform the data to match your CalendarEvent type
    const events = data.items.map((event: unknown) => ({
      id: event.id,
      title: event.summary,
      description: event.description || '',
      location: event.location || 'TBD',
      startDate: event.start.dateTime || event.start.date,
      endDate: event.end.dateTime || event.end.date
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
} 