// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { Platform } from 'react-native';

class QueueDebugMonitor {
  private static instance: QueueDebugMonitor;
  private isEnabled: boolean = true;

  private constructor() {}

  static getInstance(): QueueDebugMonitor {
    if (!QueueDebugMonitor.instance) {
      QueueDebugMonitor.instance = new QueueDebugMonitor();
    }
    return QueueDebugMonitor.instance;
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  log(...args: any[]) {
    if (this.isEnabled) {
      if (Platform.OS === 'web') {
        console.log(...args);
      } else {
        console.log('[Queue]', ...args);
      }
    }
  }

  error(...args: any[]) {
    if (this.isEnabled) {
      if (Platform.OS === 'web') {
        console.error(...args);
      } else {
        console.error('[Queue Error]', ...args);
      }
    }
  }

  warn(...args: any[]) {
    if (this.isEnabled) {
      if (Platform.OS === 'web') {
        console.warn(...args);
      } else {
        console.warn('[Queue Warning]', ...args);
      }
    }
  }
}

export const queueDebugMonitor = QueueDebugMonitor.getInstance(); 