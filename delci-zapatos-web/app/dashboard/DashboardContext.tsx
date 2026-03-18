'use client'

import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'

export type DashboardView =
  | { key: 'home' }
  | { key: 'products_list' }
  | { key: 'products_new' }
  | { key: 'accounts' }
  | { key: 'accounts_new' }
  | { key: 'accounts_detail'; accountId?: string }
  | { key: 'clients' }


interface DashboardContextValue {
  view: DashboardView
  setView: (view: DashboardView) => void
  goBack: () => void
  canGoBack: boolean
  isClientCreateModalOpen: boolean
  openClientCreateModal: () => void
  closeClientCreateModal: () => void
  isClienteDetailModalOpen: boolean
  openClienteDetailModalOpen: () => void
  closeClienteDetailModalOpen: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null);
const storage_view = 'delci_dashboard_view'

function saveView(view: DashboardView) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storage_view, JSON.stringify(view))
  } catch(error) {}
}

export function DashboardProvider({
  children,
  initialView = { key: 'home' },
}: {
  children: React.ReactNode;
  initialView?: DashboardView;
}) {
  const [view, setViewState] = useState<DashboardView>(initialView);
  const [isClientCreateModalOpen, setClientCreateModalOpen] = useState(false);
  const [isClienteDetailModalOpen, setClienteDetailModalOpen] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const previousViewRef = useRef<DashboardView | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storage_view);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && 'key' in parsed) {
          setViewState(parsed as DashboardView);
        }
      }
    } catch (error) {}
    setIsHydrating(false);
  }, []);

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
      const homeView = { key: 'home' } as DashboardView;
      setViewState(homeView);
      saveView(homeView);
    }
  }, []);

  const openClientCreateModal = useCallback(() => setClientCreateModalOpen(true), []);
  const closeClientCreateModal = useCallback(() => setClientCreateModalOpen(false), []);

  const openClienteDetailModalOpen = useCallback(() => setClienteDetailModalOpen(true), []);
  const closeClienteDetailModalOpen = useCallback(() => setClienteDetailModalOpen(false), []);

  const value = useMemo(
    () => ({
      view,
      setView,
      goBack,
      canGoBack: previousViewRef.current !== null,
      isClientCreateModalOpen,
      openClientCreateModal,
      closeClientCreateModal,
      isClienteDetailModalOpen,
      openClienteDetailModalOpen,
      closeClienteDetailModalOpen,
    }),
    [
      view,
      setView,
      goBack,
      isClientCreateModalOpen,
      openClientCreateModal,
      closeClientCreateModal,
      isClienteDetailModalOpen,
      openClienteDetailModalOpen,
      closeClienteDetailModalOpen,
    ]
  );

  if (isHydrating) return null;

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