import { NextResponse } from 'next/server';
import { migrateAllDataToKV } from '@/lib/migration';

// POST - Migrate all data to KV Storage
export async function POST() {
  try {
    // Only allow migration in production
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        success: false, 
        error: 'Migration only available in production' 
      }, { status: 400 });
    }

    await migrateAllDataToKV();
    
    return NextResponse.json({ 
      success: true, 
      message: 'All data migrated successfully to KV Storage' 
    });
  } catch (error) {
    console.error('Error migrating data:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to migrate data' 
    }, { status: 500 });
  }
}
