import React from 'react';
import { motion } from 'framer-motion';
import { Type, Image as ImageIcon, Presentation, Trash2, Hand, MousePointer2 } from 'lucide-react';
import useStore, { AppNode } from '@/store/useStore';

export default function ControlPanel() {
  const addNode = useStore((state) => state.addNode);
  const clearAll = useStore((state) => state.clearAll);
  const canvasMode = useStore((state) => state.canvasMode);
  const setCanvasMode = useStore((state) => state.setCanvasMode);

  const handleAddTextNode = () => {
    const newNode: AppNode = {
      id: crypto.randomUUID(),
      type: 'textNode',
      position: { x: window.innerWidth / 2 - 140, y: window.innerHeight / 2 - 90 },
      data: { text: 'New Text' },
      style: { width: 280, height: 180 },
    };
    addNode(newNode);
  };

  const handleAddImageNode = () => {
    const newNode: AppNode = {
      id: crypto.randomUUID(),
      type: 'imageNode',
      position: { x: window.innerWidth / 2 - 96, y: window.innerHeight / 2 - 64 },
      data: {},
    };
    addNode(newNode);
  };
  
  const handleAddPptNode = () => {
    const newNode: AppNode = {
      id: crypto.randomUUID(),
      type: 'pptNode',
      position: { x: window.innerWidth / 2 + 100, y: window.innerHeight / 2 - 135 },
      data: {},
    };
    addNode(newNode);
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-white/80 dark:bg-[#1a1a1a]/80 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5"
    >
      {/* Mode Toggles */}
      <div className="flex items-center gap-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 mr-2">
        <button
          onClick={() => setCanvasMode('PAN')}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            canvasMode === 'PAN' ? 'bg-white text-black shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
          title="平移模式"
        >
          <Hand className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCanvasMode('SELECT')}
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            canvasMode === 'SELECT' ? 'bg-white text-blue-600 shadow-sm dark:bg-neutral-700 dark:text-blue-400' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
          }`}
          title="选择模式"
        >
          <MousePointer2 className="h-4 w-4" />
        </button>
      </div>

      <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800" />

      <button
        onClick={handleAddTextNode}
        className="group flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <Type className="h-5 w-5 text-neutral-600 transition-colors group-hover:text-black dark:text-neutral-400 dark:group-hover:text-white" />
        <span className="text-[10px] font-medium text-neutral-500">添加文本</span>
      </button>

      <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800" />

      <button
        onClick={handleAddImageNode}
        className="group flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <ImageIcon className="h-5 w-5 text-neutral-600 transition-colors group-hover:text-black dark:text-neutral-400 dark:group-hover:text-white" />
        <span className="text-[10px] font-medium text-neutral-500">添加图片</span>
      </button>

      <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800" />

      <button
        onClick={handleAddPptNode}
        className="group flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        <Presentation className="h-5 w-5 text-blue-500/80 transition-colors group-hover:text-blue-600 dark:text-blue-400/80 dark:group-hover:text-blue-400" />
        <span className="text-[10px] font-medium text-blue-500/80 dark:text-blue-400/80">添加 PPT</span>
      </button>
      
      <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-800 ml-4" />
      
      <button
        onClick={clearAll}
        className="group flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        <Trash2 className="h-5 w-5 text-red-400 transition-colors group-hover:text-red-600 dark:text-red-500 dark:group-hover:text-red-400" />
        <span className="text-[10px] font-medium text-red-500">清空画布</span>
      </button>
    </motion.div>
  );
}
