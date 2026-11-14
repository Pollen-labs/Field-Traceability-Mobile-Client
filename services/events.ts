// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

import { EventEmitter } from "expo-modules-core";

type QueueEvents = {
  queueUpdated: () => void;
};

export const queueEventEmitter = new EventEmitter<QueueEvents>();

export const QueueEvents = {
  UPDATED: "queueUpdated" as const,
};
