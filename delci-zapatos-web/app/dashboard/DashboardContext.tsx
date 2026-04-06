'use client'

import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'

export type DashboardView =
  | { key: 'home' }
  | { key: 'accounts_new' }
  | { key: 'accounts_detail'; accountId?: string }


interface DashboardContextValue {
  view: DashboardView
  setView: (view: DashboardView) => void
  goBack: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null);
const storage_view = 'delci_dashboard_view'

function getStoredView(): DashboardView | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = localStorage.getItem(storage_view);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as { key?: unknown; accountId?: unknown };

    if (parsed?.key === 'home') {
      return { key: 'home' };
    }

    if (parsed?.key === 'accounts_new') {
      return { key: 'accounts_new' };
    }

    if (parsed?.key === 'accounts_detail') {
      if (typeof parsed.accountId === 'string' && parsed.accountId.trim().length > 0) {
        return { key: 'accounts_detail', accountId: parsed.accountId };
      }

      return { key: 'accounts_detail' };
    }
  } catch {}

  return null;
}

function saveView(view: DashboardView) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storage_view, JSON.stringify(view))
  } catch {}
}

export function DashboardProvider({
  children,
  initialView = { key: 'home' },
}: {
  children: React.ReactNode;
  initialView?: DashboardView;
}) {
  const [view, setViewState] = useState<DashboardView>(initialView);
  const previousViewRef = useRef<DashboardView | null>(null);

  useEffect(() => {
    const storedView = getStoredView();
    if (storedView) {
      queueMicrotask(() => {
        setViewState(storedView);
      });
      return;
    }

    saveView(initialView);
  }, [initialView]);

  const setView = useCallback((next: DashboardView) => {
    setViewState((current) => {
      previousViewRef.current = current;
      saveView(next);
      return next;
    });
  }, []);

  const goBack = useCallback(() => {
    if (previousViewRef.current) {
      const prevView = previousViewRef.current;
      setViewState(prevView);
      saveView(prevView);
      previousViewRef.current = null;
    } else {
      const home_view = { key: 'home' } as DashboardView;
      setViewState(home_view);
      saveView(home_view);
    }
  }, []);

  const value = useMemo(
    () => ({
      view,
      setView,
      goBack,
    }),
    [
      view,
      setView,
      goBack,
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

export function useDashboardOptional() {
  return useContext(DashboardContext);
}