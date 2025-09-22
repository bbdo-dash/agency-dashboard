import fs from 'fs';
import path from 'path';
import { CalendarEvent } from '@/types/dashboard';

/**
 * Parse a date string in German format (DD.MM.YYYY or DD.–DD.MM.YYYY)
 * @param dateStr - Date string like "06.–09.10.2025" or "20.10.2025"
 * @returns Parsed Date object
 */
function parseGermanDate(dateStr: string): Date {
  // Remove any extra characters and normalize
  const cleaned = dateStr.trim().replace(/[^\d.–]/g, '');
  
  // Handle date ranges like "06.–09.10.2025"
  if (cleaned.includes('.–')) {
    const [startPart, endPart] = cleaned.split('.–');
    const endDateStr = endPart; // Use the end date for the event
    
    // Parse end date format "09.10.2025"
    const parts = endDateStr.split('.');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
  
  // Handle single date format "20.10.2025"
  const parts = cleaned.split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Handle special cases like "September 2026" or "Dezember 2025"
  const monthNames = {
    'januar': 0, 'februar': 1, 'märz': 2, 'april': 3, 'mai': 4, 'juni': 5,
    'juli': 6, 'august': 7, 'september': 8, 'oktober': 9, 'november': 10, 'dezember': 11
  };
  
  const lowerStr = dateStr.toLowerCase();
  for (const [monthName, monthIndex] of Object.entries(monthNames)) {
    if (lowerStr.includes(monthName)) {
      const yearMatch = lowerStr.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        // Use the first day of the month
        return new Date(parseInt(yearMatch[1]), monthIndex, 1);
      }
    }
  }
  
  throw new Error(`Unable to parse date: ${dateStr}`);
}

/**
 * Parse CSV file and convert to CalendarEvent array
 * @param csvContent - Raw CSV content
 * @returns Array of CalendarEvent objects
 */
export function parseCSVToEvents(csvContent: string): CalendarEvent[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return [];
  }
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  const events: CalendarEvent[] = [];
  
  dataLines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) return;
    
    // Parse CSV line (handle quoted fields)
    const fields = parseCSVLine(line);
    
    if (fields.length >= 3) {
      const [name, dateStr, location] = fields;
      
      // Skip if any field is empty
      if (!name.trim() || !dateStr.trim() || !location.trim()) {
        console.warn(`Skipping incomplete event at line ${index + 2}: ${line}`);
        return;
      }
      
      try {
        const startDate = parseGermanDate(dateStr);
        
        // Validate the parsed date
        if (isNaN(startDate.getTime())) {
          throw new Error('Invalid date');
        }
        
        // Create end date (same day for single day events, or next day for multi-day)
        let endDate = new Date(startDate);
        if (dateStr.includes('.–')) {
          // For multi-day events, add one day to the end date
          endDate.setDate(endDate.getDate() + 1);
        }
        
        const event: CalendarEvent = {
          id: `csv-event-${index + 1}`,
          title: name.trim(),
          description: `Advertising and marketing event in ${location.trim()}`,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          location: location.trim().replace(/"/g, '') // Remove quotes from location
        };
        
        events.push(event);
      } catch (error) {
        console.warn(`Failed to parse date for event "${name}" with date "${dateStr}":`, error);
      }
    } else {
      console.warn(`Skipping malformed CSV line ${index + 2}: ${line}`);
    }
  });
  
  return events;
}

/**
 * Parse a CSV line handling quoted fields
 * @param line - CSV line to parse
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  fields.push(current);
  return fields;
}

/**
 * Load events from CSV file
 * @param filePath - Path to the CSV file
 * @returns Array of CalendarEvent objects
 */
export function loadEventsFromCSV(filePath: string): CalendarEvent[] {
  try {
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    return parseCSVToEvents(csvContent);
  } catch (error) {
    console.error('Error loading CSV file:', error);
    return [];
  }
}

/**
 * Get the path to the events CSV file
 * @returns Path to the CSV file
 */
export function getEventsCSVPath(): string {
  return path.join(process.cwd(), 'docs', 'werbe_events_2025_2026.csv');
}
