// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { QueueItem, QueueItemStatus, ServiceStatus, PROCESSING_TIMEOUT, MAX_RETRIES } from "@/types/queue";
import { filterQueueItems } from "@/utils/queue";

interface QueueMetrics {
  totalItems: number;
  activeItems: number;
  stuckItems: number;
  failedItems: number;
  completedItems: number;
  averageProcessingTime: number;
  retryStats: {
    totalRetries: number;
    manualRetries: number;
  };
}

export class QueueDebugMonitor {
  private static instance: QueueDebugMonitor;
  private debugEnabled: boolean = true;
  private lastMetrics: QueueMetrics | null = null;
  private lastNotificationTime: { [key: string]: number } = {};
  private NOTIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): QueueDebugMonitor {
    if (!QueueDebugMonitor.instance) {
      QueueDebugMonitor.instance = new QueueDebugMonitor();
    }
    return QueueDebugMonitor.instance;
  }

  enableDebug(enabled: boolean = true) {
    this.debugEnabled = enabled;
  }

  disableDebug() {
    this.debugEnabled = false;
  }

  private log(message: string, data?: any) {
    if (this.debugEnabled) {
      console.log(`[QueueMonitor] ${message}`, data ? data : '');
    }
  }

  private isItemStuck(item: QueueItem): boolean {
    return Boolean(
      item.status === QueueItemStatus.PROCESSING &&
      item.lastAttempt &&
      Date.now() - new Date(item.lastAttempt).getTime() > PROCESSING_TIMEOUT
    );
  }

  private getRetryInfo(item: QueueItem) {
    const now = new Date();
    const lastAttempt = item.lastAttempt ? new Date(item.lastAttempt) : null;
    const timeSinceLastAttempt = lastAttempt ? 
      `${Math.round((now.getTime() - lastAttempt.getTime()) / 1000)}s` : 
      'N/A';

    return {
      retryCount: item.totalRetryCount || 0,
      maxRetries: MAX_RETRIES,
      timeSinceLastAttempt
    };
  }

  private calculateMetrics(items: QueueItem[]): QueueMetrics {
    const now = Date.now();
    let totalProcessingTime = 0;
    let completedCount = 0;

    const metrics = items.reduce((acc, item) => {
      // Count total items
      acc.totalItems++;

      // Count by status
      if (item.status === QueueItemStatus.PROCESSING) {
        acc.activeItems++;
      } else if (item.status === QueueItemStatus.FAILED) {
        acc.failedItems++;
      } else if (item.status === QueueItemStatus.COMPLETED) {
        acc.completedItems++;
        // Calculate processing time for completed items
        if (item.lastAttempt) {
          const processingTime = new Date(item.lastAttempt).getTime() - new Date(item.date).getTime();
          totalProcessingTime += processingTime;
          completedCount++;
        }
      }

      // Check for stuck items
      if (this.isItemStuck(item)) {
        acc.stuckItems++;
      }

      // Track retry stats
      if (item.totalRetryCount > 0) {
        acc.retryStats.totalRetries++;
      }

      return acc;
    }, {
      totalItems: 0,
      activeItems: 0,
      stuckItems: 0,
      failedItems: 0,
      completedItems: 0,
      averageProcessingTime: 0,
      retryStats: {
        totalRetries: 0,
        manualRetries: 0
      }
    });

    // Calculate average processing time
    metrics.averageProcessingTime = completedCount > 0 ? 
      Math.round(totalProcessingTime / completedCount / 1000) : 0;

    return metrics;
  }

  logQueueMetrics(items: QueueItem[]) {
    const currentMetrics = this.calculateMetrics(items);

    // Only log if metrics have changed
    if (!this.lastMetrics || 
        JSON.stringify(this.lastMetrics) !== JSON.stringify(currentMetrics)) {
      
      this.log(`Queue Stats:
  Total: ${currentMetrics.totalItems}
  Active: ${currentMetrics.activeItems}
  Stuck: ${currentMetrics.stuckItems}
  Failed: ${currentMetrics.failedItems}
  Completed: ${currentMetrics.completedItems}
  Avg Processing: ${currentMetrics.averageProcessingTime}s
  Retries: ${currentMetrics.retryStats.totalRetries} total, ${currentMetrics.retryStats.manualRetries} manual`);
      
      this.lastMetrics = currentMetrics;
    }
  }

  logItemStateChange(item: QueueItem, updates: Partial<QueueItem>) {
    const oldStatus = item.status;
    const newStatus = updates.status || item.status;
    
    // Only log state changes that are relevant to retries or stuck items
    if (newStatus === QueueItemStatus.PROCESSING || 
        newStatus === QueueItemStatus.FAILED) {
      const retryInfo = this.getRetryInfo(item);
      this.log(`[${item.localId}] ${oldStatus} → ${newStatus} | #${retryInfo.retryCount}/${retryInfo.maxRetries}`);
    }
  }

  logProcessingStart(item: QueueItem) {
    const retryInfo = this.getRetryInfo(item);
    this.log(`[${item.localId}] Processing | #${retryInfo.retryCount}/${retryInfo.maxRetries}`);
  }

  logProcessingComplete(item: QueueItem, success: boolean, error?: string) {
    const duration = item.lastAttempt ? 
      `${Math.round((Date.now() - new Date(item.lastAttempt).getTime()) / 1000)}s` : 
      'unknown';
    
    const retryInfo = this.getRetryInfo(item);
    this.log(`${success ? '✓' : '✗'} [${item.localId}] ${duration} | #${retryInfo.retryCount}/${retryInfo.maxRetries}${error ? ` | ${error}` : ''}`);
  }

  logRetryAttempt(item: QueueItem, service?: "directus" | "eas", isManual: boolean = false) {
    const retryInfo = this.getRetryInfo(item);
    const serviceIndicator = service ? `[${service}]` : '';
    
    // Update manual retry count if it's a manual retry
    if (isManual && this.lastMetrics) {
      this.lastMetrics.retryStats.manualRetries++;
    }
    
    this.log(`${isManual ? '🔄' : '↻'} [${item.localId}] ${serviceIndicator} #${retryInfo.retryCount}/${retryInfo.maxRetries} | ${retryInfo.timeSinceLastAttempt} ago`);
  }

  logStuckItem(item: QueueItem) {
    const retryInfo = this.getRetryInfo(item);
    this.log(`⚠️ [${item.localId}] Stuck | #${retryInfo.retryCount}/${retryInfo.maxRetries} | ${retryInfo.timeSinceLastAttempt} since last attempt`);
  }

  logNetworkStatus(isConnected: boolean, isInternetReachable: boolean) {
    this.log(`Network: ${isConnected ? '✓' : '✗'} Connected | ${isInternetReachable ? '✓' : '✗'} Internet`);
  }
} 