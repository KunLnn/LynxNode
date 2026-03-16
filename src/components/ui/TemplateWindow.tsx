import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutTemplate, ChevronLeft, ChevronRight, Eye, Sparkles } from 'lucide-react';
import useStore from '@/store/useStore';

const CATEGORIES = [
  { id: '00_featured', name: '✨ 精选' },
  { id: 'modern', name: '现代' },
  { id: 'minimal', name: '简约' },
  { id: 'tech', name: '科技' },
  { id: 'cartoon', name: '卡通' },
  { id: 'retro', name: '复古' },
  { id: 'illustration', name: '插画' },
  { id: 'handdrawn', name: '手绘' },
  { id: 'fashion', name: '时尚' },
  { id: 'creative', name: '创意' },
  { id: 'festival', name: '节日' },
  { id: 'fresh', name: '清新' },
  { id: 'chinese', name: '中式' },
];

const ITEMS_PER_CATEGORY = 24;
const ITEMS_PER_PAGE = 12;

export function TemplateWindow() {
  const isTemplateWindowOpen = useStore(state => state.isTemplateWindowOpen);
  const closeTemplateWindow = useStore(state => state.closeTemplateWindow);
  const openTemplatePreview = useStore(state => state.openTemplatePreview);
  const activeTemplateNodeId = useStore(state => state.activeTemplateNodeId);
  const nodes = useStore(state => state.nodes);

  const activeNode = nodes.find(n => n.id === activeTemplateNodeId);
  const currentSelectedTemplate = activeNode?.data?.pptTemplate || '';

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [currentPage, setCurrentPage] = useState(1);

  if (!isTemplateWindowOpen) return null;

  const isFeatured = activeCategory === '00_featured';
  const totalItems = ITEMS_PER_CATEGORY + (isFeatured ? 1 : 0); // Add 1 for the special 'random' item
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  
  const pageItems = Array.from({ length: ITEMS_PER_PAGE }, (_, i) => {
    const itemIndex = startIndex + i;
    
    // Inject the special 'random' item at the very beginning of the 'featured' category
    if (isFeatured && itemIndex === 0) {
      return {
        id: 'template_random',
        previewUrl: '',
        pptxUrl: 'random',
        name: '自由风格模板',
        isSpecial: true
      };
    }

    // Offset the file index if we are in 'featured' to account for the special item
    const fileIndex = isFeatured ? itemIndex : itemIndex + 1;
    if (fileIndex > ITEMS_PER_CATEGORY) return null;

    const numStr = fileIndex.toString().padStart(2, '0');
    return {
      id: `template_${numStr}`,
      previewUrl: `/ppt-templates/${activeCategory}/template_${numStr}.svg`,
      pptxUrl: `/ppt-templates/${activeCategory}/template_${numStr}.pptx`,
      name: `模板 ${numStr}`,
      isSpecial: false
    };
  }).filter(Boolean);

  const handleSelect = (item: any) => {
    if (activeTemplateNodeId) {
      useStore.getState().updateNodeData(activeTemplateNodeId, { pptTemplate: item.pptxUrl });
    }
  };

  const handlePreview = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (activeTemplateNodeId) {
      if (item.id === 'template_random') return;

      const simulatedPreviewUrls = [
        item.previewUrl,
        item.previewUrl,
        item.previewUrl,
        item.previewUrl
      ];

      openTemplatePreview({
        id: item.id,
        name: item.name,
        pptxUrl: item.pptxUrl,
        previewUrls: simulatedPreviewUrls
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 sm:p-6 md:p-10 pointer-events-none">
        {/* Removed the blurred backdrop so it floats cleanly over the canvas */}

        {/* Modal Window */}
        <motion.div
          drag
          dragMomentum={false}
          className="relative flex flex-col w-full max-w-5xl h-[650px] max-h-full bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden pointer-events-auto border border-black/10 dark:border-white/10 ring-1 ring-black/5"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header (Drag Handle) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5 cursor-grab active:cursor-grabbing bg-neutral-50/50 dark:bg-neutral-800/50">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
              <LayoutTemplate className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-sm">选择 PPT 模板</span>
            </div>
            <button
              onClick={closeTemplateWindow}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-black/5 dark:hover:text-neutral-200 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Categories */}
            <div className="w-48 shrink-0 overflow-y-auto border-r border-black/5 dark:border-white/5 p-3 flex flex-col gap-1 bg-neutral-50/30 dark:bg-neutral-900/30 custom-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setCurrentPage(1); // Reset pagination on category change
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                    activeCategory === cat.id
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  {cat.name}
                  {activeCategory === cat.id && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900 pt-4 px-6 pb-4">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                  {CATEGORIES.find(c => c.id === activeCategory)?.name}
                  <span className="text-sm font-normal text-neutral-400">({totalItems} 款)</span>
                </h2>
              </div>

              {/* Grid of Templates */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar pb-2 pr-2">
                {pageItems.map((item) => {
                  if (!item) return null;
                  const isSelected = currentSelectedTemplate === item.pptxUrl;

                  return (
                    <div 
                      key={item.id} 
                      className="group relative flex flex-col gap-2 rounded-xl p-2 cursor-pointer transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      onClick={() => handleSelect(item)}
                    >
                      <div className={`relative aspect-video w-full rounded-lg overflow-hidden border shadow-sm bg-white dark:bg-neutral-950 transition-colors ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-black/10 dark:border-white/10'}`}>
                        {item.isSpecial ? (
                           <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center text-white transition-transform duration-500 group-hover:scale-105">
                             <Sparkles className="w-8 h-8 mb-2 opacity-80" />
                             <span className="font-bold tracking-wide text-sm opacity-90 drop-shadow-md">自由组合</span>
                           </div>
                        ) : (
                          <img 
                            src={item.previewUrl} 
                            alt={item.name} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        )}
                        
                        {!item.isSpecial && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={(e) => handlePreview(e, item)}
                              className="px-3 py-1.5 bg-white/95 text-neutral-900 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="text-xs font-semibold">预览</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="px-1 flex items-center justify-between">
                        <span className={`text-xs font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                          {item.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-500/20 px-1.5 py-0.5 rounded">
                            已套用
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Footer */}
              <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <div className="text-xs text-neutral-500">
                  显示第 {startIndex + (totalItems > 0 ? 1 : 0)} 到 {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} 项，共 {totalItems} 项
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-md text-xs font-medium flex items-center justify-center transition-colors ${
                        currentPage === page
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md border border-black/10 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
