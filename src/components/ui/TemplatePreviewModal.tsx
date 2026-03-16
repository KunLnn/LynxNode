import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import useStore from '@/store/useStore';

export function TemplatePreviewModal() {
  const previewingTemplate = useStore(state => state.previewingTemplate);
  const closeTemplatePreview = useStore(state => state.closeTemplatePreview);
  const activeTemplateNodeId = useStore(state => state.activeTemplateNodeId);
  const updateNodeData = useStore(state => state.updateNodeData);
  const closeTemplateWindow = useStore(state => state.closeTemplateWindow);

  const [activePageIndex, setActivePageIndex] = useState(0);

  if (!previewingTemplate) return null;

  const handleUseStyle = () => {
    if (activeTemplateNodeId) {
      updateNodeData(activeTemplateNodeId, { pptTemplate: previewingTemplate.pptxUrl });
      closeTemplatePreview();
      closeTemplateWindow();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 lg:p-12 pointer-events-none">
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeTemplatePreview}
        />

        {/* Modal Window */}
        <motion.div
          className="relative flex flex-col w-full max-w-6xl h-full max-h-[85vh] bg-[#f8f8f8] dark:bg-neutral-900 rounded-[24px] shadow-2xl overflow-hidden pointer-events-auto border border-black/10 dark:border-white/10"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-neutral-900 border-b border-black/5 dark:border-white/5">
            <h2 className="text-xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100">
              效果预览
            </h2>
            <button
              onClick={closeTemplatePreview}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-black/5 dark:hover:text-neutral-200 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#f4f4f5] dark:bg-neutral-950 p-6 lg:p-8 gap-6 overflow-hidden">
            
            {/* Big Active Image Display */}
            <div className="flex-1 min-h-0 flex items-center justify-center bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
              <motion.img
                key={`main-${activePageIndex}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={previewingTemplate.previewUrls[activePageIndex]}
                className="w-full h-full object-contain p-4"
                alt={`${previewingTemplate.name} page ${activePageIndex + 1}`}
              />
            </div>

            {/* Thumbnail Strip */}
            <div className="h-28 shrink-0 w-full overflow-x-auto custom-scrollbar overflow-y-hidden pb-2">
              <div className="flex gap-4 h-full items-center">
                {previewingTemplate.previewUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePageIndex(index)}
                    className={`relative h-24 shrink-0 aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                      activePageIndex === index
                        ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20 scale-105 z-10'
                        : 'border-transparent opacity-60 hover:opacity-100 hover:border-black/10 dark:hover:border-white/10'
                    }`}
                  >
                    <img 
                      src={url} 
                      className="absolute inset-0 w-full h-full object-cover" 
                      alt={`Thumb ${index + 1}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 bg-white dark:bg-neutral-900 border-t border-black/5 dark:border-white/5">
            <button
              onClick={closeTemplatePreview}
              className="px-6 py-2.5 rounded-xl font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              再看看
            </button>
            <button
              onClick={handleUseStyle}
              className="px-8 py-2.5 rounded-xl font-medium text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 hover:bg-black hover:shadow-lg dark:hover:bg-neutral-200 transition-all active:scale-95"
            >
              使用风格
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
