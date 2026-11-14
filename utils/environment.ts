// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2024-2026 Pollen Labs and contributors
// Additional attribution terms apply under AGPL Section 7(b); see NOTICE.md.

type Environment = "development" | "production" | "preview";

/**
 * Gets the normalized environment name
 * @returns The normalized environment name (development, production, or preview)
 */
export const getEnvironment = (): Environment => {
  const env = (process.env.NODE_ENV || "development") as string;
  return env === "production" ? "production" : "development";
}; 