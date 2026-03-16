import React, { memo } from 'react';
import { NodeProps } from 'reactflow';

/**
 * GroupNode — lightweight container for grouped nodes.
 * Has no visible handles, just a styled background frame.
 */
export default memo(function GroupNode({ selected }: NodeProps) {
  return (
    <div
      className={`h-full w-full rounded-2xl transition-[background-color,border-color,ring-color] duration-100 ${
        selected
          ? 'bg-indigo-50/60 border-2 border-indigo-400/60 ring-2 ring-indigo-300/30 dark:bg-indigo-900/20 dark:border-indigo-500/50'
          : 'bg-neutral-50/50 border-2 border-dashed border-neutral-300/70 dark:bg-neutral-800/30 dark:border-neutral-600/50'
      }`}
    />
  );
});
