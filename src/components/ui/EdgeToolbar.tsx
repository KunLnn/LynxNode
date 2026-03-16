"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus, GitBranch, Waypoints, Workflow,
  StretchHorizontal, Trash2, Eye, EyeOff,
} from 'lucide-react';
import useStore from '@/store/useStore';

type EdgeType = 'default' | 'straight' | 'smoothstep' | 'step';

const EDGE_TYPES: { type: EdgeType; icon: React.ReactNode; label: string }[] = [
  { type: 'smoothstep', icon: <GitBranch className="h-4 w-4" />,  label: 'Smooth Step (global)' },
  { type: 'default',    icon: <Waypoints className="h-4 w-4" />,  label: 'Bezier (global)' },
  { type: 'straight',   icon: <Minus className="h-4 w-4" />,      label: 'Straight (global)' },
  { type: 'step',       icon: <Workflow className="h-4 w-4" />,    label: 'Step (global)' },
];

export default function EdgeToolbar() {
  const globalEdgeStyle = useStore((s) => s.globalEdgeStyle);
  const updateGlobalEdgeStyle = useStore((s) => s.updateGlobalEdgeStyle);
  const updateSelectedEdgesStyle = useStore((s) => s.updateSelectedEdgesStyle);
  const toggleEdgesVisible = useStore((s) => s.toggleEdgesVisible);
  const deleteSelectedEdges = useStore((s) => s.deleteSelectedEdges);
  const selectedNodeCount = useStore(
    React.useCallback((state) => {
      let count = 0;
      for (const node of state.nodes) {
        if (node.selected) count += 1;
      }
      return count;
    }, [])
  );
  const selectedEdgeMeta = useStore(
    React.useCallback((state) => {
      let count = 0;
      let dashed = false;
      for (const edge of state.edges) {
        if (!edge.selected) continue;
        count += 1;
        if (count === 1) dashed = !!edge.style?.strokeDasharray;
      }
      return `${count}|${dashed ? 1 : 0}`;
    }, [])
  );
  const [selectedEdgeCountStr, activeDashedStr] = selectedEdgeMeta.split('|');
  const selectedEdgeCount = Number(selectedEdgeCountStr);

  // Only visible when ONLY edges are selected (no nodes)
  if (selectedEdgeCount === 0 || selectedNodeCount > 0) return null;

  const activeType   = globalEdgeStyle.type;
  const activeDashed = activeDashedStr === '1';
  const isHidden = !globalEdgeStyle.edgesVisible;

  const btnBase   = 'flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors';
  const btnActive = '!bg-neutral-900 !text-white dark:!bg-white dark:!text-black';
  const sep = <div className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700 shrink-0" />;

  return (
    <AnimatePresence>
      <motion.div
        key="edge-toolbar"
        initial={{ y: -20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -20, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-0.5 rounded-xl bg-white/95 dark:bg-[#1a1a1a]/95 px-2 py-1.5 shadow-xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10"
      >
        {/* Count badge + visibility hint */}
        <div className="flex items-center gap-1.5 pl-1 pr-3 border-r border-neutral-200 dark:border-neutral-800 mr-1">
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded bg-black text-white px-1.5 text-[10px] font-bold dark:bg-white dark:text-black">
            {selectedEdgeCount}
          </span>
          <span className="text-xs font-medium text-neutral-400">
            Edge{selectedEdgeCount > 1 ? 's' : ''}
          </span>
          {isHidden && (
            <span className="text-[10px] text-amber-500 font-medium">(hidden)</span>
          )}
        </div>

        {/* Show/Hide ALL edges — first button when hidden for discoverability */}
        <button
          className={`${btnBase} ${isHidden ? '!text-amber-500 hover:!bg-amber-50 dark:hover:!bg-amber-950/30' : ''}`}
          onClick={toggleEdgesVisible}
          title={isHidden ? 'Show all edges' : 'Hide all edges'}
        >
          {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>

        {sep}

        {/* Edge type buttons — GLOBAL */}
        {EDGE_TYPES.map(({ type, icon, label }) => (
          <button
            key={type}
            className={`${btnBase} ${activeType === type ? btnActive : ''}`}
            onClick={() => updateGlobalEdgeStyle({ type })}
            title={label}
          >
            {icon}
          </button>
        ))}

        {sep}

        {/* Dashed toggle — selected edges only */}
        <button
          className={`${btnBase} ${activeDashed ? btnActive : ''}`}
          onClick={() => updateSelectedEdgesStyle({ dashed: !activeDashed })}
          title="Dashed (selected only)"
        >
          <StretchHorizontal className="h-4 w-4" />
        </button>

        {sep}

        {/* Delete */}
        <button
          className={`${btnBase} hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/30 dark:hover:!text-red-500`}
          onClick={deleteSelectedEdges}
          title="Delete selected edge(s)"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
