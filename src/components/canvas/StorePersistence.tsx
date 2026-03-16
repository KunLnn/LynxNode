"use client";

import { useEffect } from 'react';
import useStore, {
  DEFAULT_AI_SETTINGS,
  DEFAULT_GLOBAL_EDGE_STYLE,
  loadPersistedAppState,
  savePersistedAppState,
} from '@/store/useStore';

export default function StorePersistence() {
  useEffect(() => {
    let disposed = false;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;

    const hydrate = async () => {
      const persisted = await loadPersistedAppState();
      if (disposed) return;

      if (persisted) {
        useStore.setState({
          nodes: persisted.nodes,
          edges: persisted.edges,
          aiSettings: { ...DEFAULT_AI_SETTINGS, ...persisted.aiSettings },
          globalEdgeStyle: { ...DEFAULT_GLOBAL_EDGE_STYLE, ...persisted.globalEdgeStyle },
        });
      }

      const unsubscribe = useStore.subscribe((state) => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          savePersistedAppState({
            nodes: state.nodes,
            edges: state.edges,
            aiSettings: state.aiSettings,
            globalEdgeStyle: state.globalEdgeStyle,
          });
        }, 500);
      });

      if (disposed) {
        unsubscribe();
      }

      return unsubscribe;
    };

    let unsubscribe: (() => void) | void;
    hydrate().then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => {
      disposed = true;
      if (saveTimer) clearTimeout(saveTimer);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return null;
}
