import React from 'react';
import { Sparkles, Eraser, Maximize2 } from 'lucide-react';

interface FloatingToolbarProps {
  onUpscale?: () => void;
  onRemoveBg?: () => void;
  onFullscreen?: () => void;
}

const FloatingToolbar = ({ onUpscale, onRemoveBg, onFullscreen }: FloatingToolbarProps) => {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/80 p-1 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-neutral-800/80">
      <button
        type="button"
        className="flex h-8 items-center rounded-full px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-white hover:text-black dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
        onClick={onUpscale}
      >
        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-blue-500" />
        Upscale
      </button>
      <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
      <button
        type="button"
        className="flex h-8 items-center rounded-full px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-white hover:text-black dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
        onClick={onRemoveBg}
      >
        <Eraser className="mr-1.5 h-3.5 w-3.5 text-pink-500" />
        Remove BG
      </button>
      
      {onFullscreen && (
        <>
          <div className="mx-1 h-4 w-px bg-neutral-200 dark:bg-neutral-700" />
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-white hover:text-black dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
            onClick={onFullscreen}
            title="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
};

export default FloatingToolbar;
