"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlignLeft, AlignCenter, AlignRight,
  ArrowUpToLine, AlignVerticalJustifyCenter, ArrowDownToLine,
  ArrowLeftRight, ArrowUpDown,
  Grid2X2, Group,
  Trash2, Eraser, Maximize2, ImageIcon,
  ChevronDown,
} from 'lucide-react';
import useStore from '@/store/useStore';

export default function SelectionMenu() {
  const alignNodes = useStore((state) => state.alignNodes);
  const distributeNodes = useStore((state) => state.distributeNodes);
  const groupNodes = useStore((state) => state.groupNodes);
  const autoGridNodes = useStore((state) => state.autoGridNodes);
  const deleteSelectedNodes = useStore((state) => state.deleteSelectedNodes);
  const aiSettings = useStore((state) => state.aiSettings);
  const updateNodeData = useStore((state) => state.updateNodeData);

  const [alignOpen, setAlignOpen] = useState(false);
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const selectedHash = useStore(
    React.useCallback((state: any) => {
      let c = 0;
      const ids: string[] = [];
      for (const n of state.nodes) {
        if (n.selected) {
          c++;
          if (n.type === 'imageNode' && n.data?.imageUrl) {
            ids.push(n.id);
          }
        }
      }
      return `${c}|${ids.join(',')}`;
    }, [])
  );

  const { count, imageNodeIds } = React.useMemo(() => {
    const parts = selectedHash.split('|');
    const c = parseInt(parts[0], 10);
    const ids = parts[1] ? parts[1].split(',') : [];
    return { count: c, imageNodeIds: ids };
  }, [selectedHash]);

  // Reset all dropdowns to closed whenever the selection changes
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (prevCountRef.current === 0 && count > 0) {
      // Just appeared — ensure all collapsed
      setAlignOpen(false);
      setDistributeOpen(false);
      setImageOpen(false);
    }
    prevCountRef.current = count;
  }, [count]);

  const closeAll = () => {
    setAlignOpen(false);
    setDistributeOpen(false);
    setImageOpen(false);
  };

  const handleBatchAi = async (action: 'upscale' | 'removebg') => {
    if (imageNodeIds.length === 0) return;
    setIsBatchProcessing(true);
    setImageOpen(false);
    
    // Fetch fresh nodes right when needed
    const currentStateNodes = useStore.getState().nodes;
    const targets = currentStateNodes.filter(n => imageNodeIds.includes(n.id));

    try {
      await Promise.all(
        targets.map(async (node) => {
          if (!node.data.imageUrl) return;
          const { upscaleImage, removeBg } = await import('@/lib/imageProcessing');
          let result: string;
          if (action === 'upscale') {
            if (!aiSettings.imageApiKey) throw new Error('No Replicate API Key configured');
            result = await upscaleImage(node.data.imageUrl, aiSettings.imageApiKey);
          } else {
            if (!aiSettings.removeBgApiKey) throw new Error('No Remove BG API Key configured');
            result = await removeBg(node.data.imageUrl, aiSettings.removeBgApiKey);
          }
          updateNodeData(node.id, { imageUrl: result });
        })
      );
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const btnBase = "flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors whitespace-nowrap";
  const iconBtn = "flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors";
  const popoverBase = "absolute top-full mt-2 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-2xl ring-1 ring-black/5 dark:border-neutral-800 dark:bg-neutral-900 dark:ring-white/10 z-[9999]";
  const menuItem = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors";
  const separator = "mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700 shrink-0";

  if (count < 2) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -20, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed top-8 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-xl bg-white/95 dark:bg-[#1a1a1a]/95 px-2 py-1.5 shadow-xl backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 z-[200] overflow-visible"
      >
        {/* Count Badge */}
        <div className="flex items-center gap-1.5 pl-1 pr-3 border-r border-neutral-200 dark:border-neutral-800 mr-1">
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded bg-black text-white px-1.5 text-[10px] font-bold dark:bg-white dark:text-black">
            {count}
          </span>
          <span className="text-xs font-medium text-neutral-400">Selected</span>
        </div>

        {/* Align dropdown */}
        {count >= 2 && (
          <div className="relative overflow-visible">
            <button
              className={`${btnBase} ${alignOpen ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' : ''}`}
              onClick={() => { closeAll(); setAlignOpen(!alignOpen); }}
              title="Align"
            >
              <AlignLeft className="h-3.5 w-3.5" />
              Align
              <ChevronDown className={`h-3 w-3 transition-transform ${alignOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {alignOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className={`${popoverBase} left-0 w-36`}
                >
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Horizontal</div>
                  <div className="flex gap-0.5 px-1 pb-1">
                    {[
                      { icon: AlignLeft, label: 'Left', type: 'left' as const },
                      { icon: AlignCenter, label: 'Center', type: 'center' as const },
                      { icon: AlignRight, label: 'Right', type: 'right' as const },
                    ].map(({ icon: Icon, label, type }) => (
                      <button key={type} className={iconBtn} onClick={() => { alignNodes(type); setAlignOpen(false); }} title={label}>
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                  <div className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Vertical</div>
                  <div className="flex gap-0.5 px-1 pb-1">
                    {[
                      { icon: ArrowUpToLine, label: 'Top', type: 'top' as const },
                      { icon: AlignVerticalJustifyCenter, label: 'Middle', type: 'middle' as const },
                      { icon: ArrowDownToLine, label: 'Bottom', type: 'bottom' as const },
                    ].map(({ icon: Icon, label, type }) => (
                      <button key={type} className={iconBtn} onClick={() => { alignNodes(type); setAlignOpen(false); }} title={label}>
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Distribute dropdown — always shown when ≥3 nodes selected */}
        {count >= 2 && (
          <div className="relative overflow-visible">
            <button
              className={`${btnBase} ${distributeOpen ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' : ''}`}
              onClick={() => { closeAll(); setDistributeOpen(!distributeOpen); }}
              title="Distribute"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Distribute
              <ChevronDown className={`h-3 w-3 transition-transform ${distributeOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {distributeOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className={`${popoverBase} left-0 w-40`}
                >
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Spacing</div>
                  <button className={menuItem} onClick={() => { distributeNodes('horizontal'); setDistributeOpen(false); }}>
                    <ArrowLeftRight className="h-3.5 w-3.5 text-neutral-400" /> Horizontal
                  </button>
                  <button className={menuItem} onClick={() => { distributeNodes('vertical'); setDistributeOpen(false); }}>
                    <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" /> Vertical
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {count >= 2 && (
          <>
            <div className={separator} />
            <button className={iconBtn} onClick={groupNodes} title="Group">
              <Group className="h-3.5 w-3.5" />
            </button>
            <button className={iconBtn} onClick={autoGridNodes} title="Auto Grid">
              <Grid2X2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {/* Image Tools — only when image nodes selected */}
        {imageNodeIds.length > 0 && (
          <>
            <div className={separator} />
            <div className="relative overflow-visible">
              <button
                className={`${btnBase} ${isBatchProcessing ? 'animate-pulse' : ''} ${imageOpen ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' : ''}`}
                onClick={() => { closeAll(); setImageOpen(!imageOpen); }}
                title="Image Tools"
                disabled={isBatchProcessing}
              >
                <ImageIcon className="h-3.5 w-3.5 text-indigo-500" />
                Image
                <span className="flex h-4 items-center justify-center rounded bg-indigo-100 px-1 text-[9px] font-semibold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                  {imageNodeIds.length}
                </span>
                <ChevronDown className={`h-3 w-3 transition-transform ${imageOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {imageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className={`${popoverBase} right-0 w-40`}
                  >
                    <button className={menuItem}           onClick={() => handleBatchAi('removebg')}
          disabled={isBatchProcessing || imageNodeIds.length === 0}>
                      <Eraser className="h-3.5 w-3.5 text-pink-500" /> Remove BG
                    </button>
                    <button className={menuItem}           onClick={() => handleBatchAi('upscale')}
          disabled={isBatchProcessing || imageNodeIds.length === 0}>
                      <Maximize2 className="h-3.5 w-3.5 text-indigo-500" /> Upscale
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        <div className={separator} />

        {/* Delete */}
        <button
          onClick={deleteSelectedNodes}
          className={`${iconBtn} hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/30 dark:hover:!text-red-500`}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
