/**
 * Custom hooks for data fetching and state management
 */

import { useState, useEffect, useCallback } from 'react';
import { mesApi } from '../services/mesApi';
import type { SimpleBarrel, CreateBarrelInput } from '../types/barrel';
import type { SimpleStation } from '../types/station';
import type { DashboardMetrics, BarrelProcessInfo, SystemAnalytics } from '../types/metrics';
import { POLLING_INTERVALS } from '../lib/constants';

/**
 * Hook for fetching and managing barrels data
 */
export function useBarrels(pollingInterval = POLLING_INTERVALS.DASHBOARD) {
  const [barrels, setBarrels] = useState<SimpleBarrel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBarrels = useCallback(async () => {
    try {
      const data = await mesApi.getBarrels();
      setBarrels(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch barrels'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBarrel = useCallback(async (data: CreateBarrelInput) => {
    const newBarrel = await mesApi.createBarrel(data);
    await fetchBarrels();
    return newBarrel;
  }, [fetchBarrels]);

  const startOperation = useCallback(async (barrelId: string, stationName: string) => {
    const barrel = await mesApi.startOperation(barrelId, stationName);
    await fetchBarrels();
    return barrel;
  }, [fetchBarrels]);

  const completeOperation = useCallback(async (barrelId: string, notes?: string) => {
    const barrel = await mesApi.completeOperation(barrelId, notes);
    await fetchBarrels();
    return barrel;
  }, [fetchBarrels]);

  useEffect(() => {
    fetchBarrels();
  }, [fetchBarrels]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = mesApi.onDataChange(fetchBarrels);
    return unsubscribe;
  }, [fetchBarrels]);

  // Polling for updates
  useEffect(() => {
    const interval = setInterval(fetchBarrels, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchBarrels, pollingInterval]);

  return {
    barrels,
    isLoading,
    error,
    refresh: fetchBarrels,
    createBarrel,
    startOperation,
    completeOperation,
  };
}

/**
 * Hook for fetching metrics
 */
export function useMetrics(pollingInterval = POLLING_INTERVALS.DASHBOARD) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await mesApi.getMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    const unsubscribe = mesApi.onDataChange(fetchMetrics);
    return unsubscribe;
  }, [fetchMetrics]);

  useEffect(() => {
    const interval = setInterval(fetchMetrics, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, pollingInterval]);

  return { metrics, isLoading, error, refresh: fetchMetrics };
}

/**
 * Hook for barrel process tracking info
 */
export function useBarrelTracking(pollingInterval = POLLING_INTERVALS.DASHBOARD) {
  const [trackingData, setTrackingData] = useState<BarrelProcessInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrackingData = useCallback(async () => {
    try {
      const data = await mesApi.getBarrelProcessInfo();
      setTrackingData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tracking data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  useEffect(() => {
    const unsubscribe = mesApi.onDataChange(fetchTrackingData);
    return unsubscribe;
  }, [fetchTrackingData]);

  useEffect(() => {
    const interval = setInterval(fetchTrackingData, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchTrackingData, pollingInterval]);

  return { trackingData, isLoading, error, refresh: fetchTrackingData };
}

/**
 * Hook for stations data
 */
export function useStations() {
  const [stations] = useState<SimpleStation[]>(() => mesApi.getStations());
  return { stations };
}

/**
 * Hook for operation timer
 */
export function useOperationTimer(isActive: boolean) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const reset = useCallback(() => {
    setElapsedTime(0);
  }, []);

  return { elapsedTime, reset };
}

/**
 * Hook for system analytics (admin)
 */
export function useSystemAnalytics(pollingInterval = POLLING_INTERVALS.ADMIN_PANEL) {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await mesApi.getSystemAnalytics();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    const unsubscribe = mesApi.onDataChange(fetchAnalytics);
    return unsubscribe;
  }, [fetchAnalytics]);

  useEffect(() => {
    const interval = setInterval(fetchAnalytics, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchAnalytics, pollingInterval]);

  return { analytics, isLoading, error, refresh: fetchAnalytics };
}
