import { storage } from "./storage";
import { MarketStatus } from "@shared/schema";

const CHECK_INTERVAL_MS = 60 * 1000;

let autoCloseInterval: NodeJS.Timeout | null = null;

async function checkAndCloseMarkets(): Promise<void> {
  try {
    const openMarketsPastCloseTime = await storage.getOpenMarketsPastCloseTime();
    
    if (openMarketsPastCloseTime.length === 0) {
      return;
    }
    
    console.log(`[Market Auto-Close] Found ${openMarketsPastCloseTime.length} market(s) to auto-close`);
    
    for (const market of openMarketsPastCloseTime) {
      try {
        await storage.updateSatamatkaMarketStatus(market.id, MarketStatus.CLOSED);
        
        const now = new Date().toISOString();
        console.log(`[Market Auto-Close] ${now} - Auto-closed market: "${market.name}" (ID: ${market.id})`);
        console.log(`  - Market Type: ${market.type}`);
        console.log(`  - Scheduled Close Time: ${market.closeTime}`);
        console.log(`  - Status changed: ${MarketStatus.OPEN} -> ${MarketStatus.CLOSED}`);
        
      } catch (marketError) {
        console.error(`[Market Auto-Close] Failed to auto-close market ${market.id}:`, marketError);
      }
    }
    
  } catch (error) {
    console.error("[Market Auto-Close] Error checking markets:", error);
  }
}

export function startMarketAutoCloseScheduler(): void {
  if (autoCloseInterval) {
    console.log("[Market Auto-Close] Scheduler already running");
    return;
  }
  
  console.log("[Market Auto-Close] Starting scheduler - checking every minute for markets to auto-close");
  
  checkAndCloseMarkets();
  
  autoCloseInterval = setInterval(checkAndCloseMarkets, CHECK_INTERVAL_MS);
}

export function stopMarketAutoCloseScheduler(): void {
  if (autoCloseInterval) {
    clearInterval(autoCloseInterval);
    autoCloseInterval = null;
    console.log("[Market Auto-Close] Scheduler stopped");
  }
}
