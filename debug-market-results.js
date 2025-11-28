import { db } from './server/db.js';
import { satamatkaMarkets } from './shared/schema.js';
import { eq, desc } from 'drizzle-orm';

async function debugMarketResults() {
  try {
    console.log('Testing direct database query...');
    
    // Test direct query
    const results = await db.select()
      .from(satamatkaMarkets)
      .where(eq(satamatkaMarkets.status, 'resulted'))
      .orderBy(desc(satamatkaMarkets.createdAt))
      .limit(3);
    
    console.log('Direct query results:', results.length);
    console.log('Sample data:', JSON.stringify(results.slice(0, 2), null, 2));
    
    // Test with different status values
    const allMarkets = await db.select().from(satamatkaMarkets).limit(3);
    console.log('All markets sample:', JSON.stringify(allMarkets, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

debugMarketResults();