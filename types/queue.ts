import { EventFormType } from "@/app/attest/new/[slug]";
import { MaterialDetail } from "@/types/material";

export const PROCESSING_TIMEOUT = 45 * 1000;  // 15 seconds per attempt
export const MAX_RETRIES = 5; // Maximum total retries before completely failing
export const LIST_RETRY_INTERVAL = 5 * 60 * 1000; // 1 minute in milliseconds

export enum ServiceStatus {
  "COMPLETED" = "COMPLETED",
  "INCOMPLETE" = "INCOMPLETE"
}

export enum QueueItemStatus {
  "PENDING" = "PENDING",
  "PROCESSING" = "PROCESSING",
  "COMPLETED" = "COMPLETED",
  "FAILED" = "FAILED"
}

export interface ServiceState {
  status: ServiceStatus;
  error?: string;
  eventId?: number;
  txHash?: string;
}

export interface QueueItem {
  localId: string;
  actionId: number;
  actionName: string;
  type: string;
  date: string;
  collectorId?: string;
  location?: {
    coords: {
      latitude: number;
      longitude: number;
    };
  };
  manufacturing?: {
    product?: number;
    quantity?: number;
    weightInKg?: number;
  };
  incomingMaterials?: MaterialDetail[];
  outgoingMaterials?: MaterialDetail[];
  status: QueueItemStatus;
  totalRetryCount: number;
  lastAttempt?: string;
  lastError?: string;
  deleted?: boolean;
  skipRetryIncrement?: boolean;
  directus?: {
    status: ServiceStatus;
    error?: string;
    eventId?: number;
    linked?: boolean;
    company?: number;
  };
  eas?: {
    status: ServiceStatus;
    error?: string;
    txHash?: string;
  };
  linking?: {
    status: ServiceStatus;
    error?: string;
  };
  company?: number;
  selectedPort?: {
    id: number;
    name: string;
    coordinates: string;
  };
}

export function shouldAutoRetry(item: QueueItem): boolean {
  // Don't retry if item is completed or has exceeded max retries
  if (item.status === QueueItemStatus.COMPLETED || item.totalRetryCount >= MAX_RETRIES) {
    return false;
  }

  // Retry if any service is incomplete
  return item.directus?.status === ServiceStatus.INCOMPLETE || 
         item.eas?.status === ServiceStatus.INCOMPLETE;
}

export function getOverallStatus(item: QueueItem): QueueItemStatus {
  // If max retries reached, always return FAILED
  if (item.totalRetryCount >= MAX_RETRIES) {
    return QueueItemStatus.FAILED;
  }

  // If item is explicitly set to PROCESSING, keep it
  if (item.status === QueueItemStatus.PROCESSING) {
    return QueueItemStatus.PROCESSING;
  }

  // If all services are completed, mark as completed
  if (item.directus?.status === ServiceStatus.COMPLETED && 
      item.eas?.status === ServiceStatus.COMPLETED &&
      item.linking?.status === ServiceStatus.COMPLETED) {
    return QueueItemStatus.COMPLETED;
  }

  // If any service is processing, mark as processing
  // if (item.directus?.status === ServiceStatus.PROCESSING || 
  //     item.eas?.status === ServiceStatus.PROCESSING ||
  //     item.linking?.status === ServiceStatus.PROCESSING) {
  //   return QueueItemStatus.PROCESSING;
  // }

  // If any service is incomplete, mark as pending
  if (item.directus?.status === ServiceStatus.INCOMPLETE || 
      item.eas?.status === ServiceStatus.INCOMPLETE ||
      item.linking?.status === ServiceStatus.INCOMPLETE) {
    return QueueItemStatus.PENDING;
  }

  // Default to pending
  return QueueItemStatus.PENDING;
}

export const isPendingItem = (item: QueueItem): boolean =>
  item.status === QueueItemStatus.PENDING ||
  (item.status === QueueItemStatus.FAILED && item.totalRetryCount < MAX_RETRIES);

export function shouldProcessItem(item: QueueItem): boolean {
  // Don't process if already completed or deleted
  if (item.status === QueueItemStatus.COMPLETED || 
    item.status === QueueItemStatus.FAILED || item.deleted) {
    return false;
  }

  // Don't process if max retries reached
  if (item.totalRetryCount >= MAX_RETRIES) {
    return false;
  }

  // Process if item is pending or failed
  return item.status === QueueItemStatus.PENDING;
}

export function determineItemStatus(item: QueueItem): QueueItemStatus {
  // If max retries reached, mark as failed
  if (item.totalRetryCount >= MAX_RETRIES) {
    return QueueItemStatus.FAILED;
  }

  // If all services completed, mark as completed
  if (item.directus?.status === ServiceStatus.COMPLETED && 
      item.eas?.status === ServiceStatus.COMPLETED &&
      item.linking?.status === ServiceStatus.COMPLETED) {
    return QueueItemStatus.COMPLETED;
  }

  // Default to pending
  return QueueItemStatus.PENDING;
}

export function shouldProcessService(service?: ServiceState): boolean {
  // Process if service is undefined or explicitly INCOMPLETE
  return !service || service.status === ServiceStatus.INCOMPLETE;
}
