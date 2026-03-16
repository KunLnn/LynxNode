import React, { memo, useState, useMemo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeToolbar } from '@reactflow/node-toolbar';
import useStore, { NodeData, PptPageCount } from '@/store/useStore';
import { Maximize2, Wand2, Trash2, PresentationIcon, Presentation, Settings2, Check, LayoutTemplate } from 'lucide-react';
import { SlidePreview } from '@/components/ui/SlidePreview';

export default memo(function PptNode({ id, selected, data }: NodeProps<NodeData>) {
  const [showSettings, setShowSettings] = useState(false);
  const [pageCount, setPageCount] = useState<PptPageCount>(data.pptPageCount || 'auto');

  const openPptSidebar = useStore((state) => state.openPptSidebar);
  const openTemplateWindow = useStore((state) => state.openTemplateWindow);
  const deleteSelectedNodes = useStore((state) => state.deleteSelectedNodes);
  const generatePptSlides = useStore((state) => state.generatePptSlides);
  const selectedNodeCount = useStore((state) => {
    let count = 0;
    for (const node of state.nodes) {
      if (node.selected) count += 1;
      if (count > 1) return count;
    }
    return count;
  });

  // ─── PERF: subscribe to a primitive string that encodes connected content.
  // Strings are compared by value so Zustand never sees a reference change
  // on position-only updates, preventing re-renders during node dragging.
  const getConnectedNodesData = useCallback(() => {
    const state = useStore.getState();
    const incomingEdges = state.edges.filter((edge) => edge.target === id);
    const sourceIds = new Set(incomingEdges.map((edge) => edge.source));
    return state.nodes
      .filter((node) => sourceIds.has(node.id))
      .map((node) => ({ id: node.id, type: node.type as string, text: node.data.text, imageUrl: node.data.imageUrl }));
  }, [id]);

  const connectedNodesData = useMemo(() => getConnectedNodesData(), [getConnectedNodesData, data, selected]);

  // Extract texts and images from the flat connector objects
  const previewTexts = connectedNodesData.filter(n => n.type === 'textNode').map(n => n.text).filter((t): t is string => Boolean(t));
  const previewImages = connectedNodesData.filter(n => n.type === 'imageNode').map(n => n.imageUrl).filter((u): u is string => Boolean(u));


  const isGenerated = data.isPptGenerated;
  
  // If generated, we lock the view to what's in `data.slides`, ignoring current connections
  // However, unlike before we don't manually map these - we just use the first slide in data.slides 
  // via SlidePreview.
  
  // For the ungenerated preview, we can fake a Slide item to feed into SlidePreview
  const previewSlide = {
    id: `preview-${id}`,
    text: '在此处连入文本或图片以生成幻灯片',
    imageUrl: '',
    layout: 'cover' as const
  };

  const coverUrl = data.coverUrl || (data.slides && data.slides[0]?.imageUrl);

  const displaySlide = (isGenerated && data.slides && data.slides.length > 0) ? data.slides[0] : previewSlide;

  return (
    <>
      <NodeToolbar
        isVisible={selected && selectedNodeCount === 1}
        position={Position.Top}
        offset={20}
        className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/95 px-2 py-1.5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-800/95"
      >
        <button
          onClick={() => openPptSidebar(id)}
          className="group flex flex-row items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-neutral-600 transition-colors hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
          title="展开所有页面 (Expand All)"
        >
          <Maximize2 className="h-4 w-4" />
          <span className="text-[12px] font-medium tracking-wide">展开页面</span>
        </button>
        
        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" />
        
        <div className="relative flex items-center">
          <button
            onClick={() => openTemplateWindow(id)}
            className="group flex flex-row items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-neutral-600 transition-colors hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
            title="浏览模板库"
          >
            <LayoutTemplate className="h-4 w-4" />
            <span className="text-[12px] font-medium tracking-wide hidden sm:inline-block">模板</span>
          </button>
          
          <div className="mx-1 h-5 w-px bg-black/10 dark:bg-white/10" />

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`group/btn flex flex-row items-center justify-center p-1.5 rounded-md transition-colors ${showSettings ? 'bg-black/5 text-black dark:bg-white/10 dark:text-white' : 'text-neutral-500 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white'}`}
            title="生成设置"
          >
            <Settings2 className="h-4 w-4" />
          </button>

          {showSettings && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-black/10 dark:border-white/10 p-3 z-[9999] flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider pl-1">目标页数</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['auto', '1-5', '6-10', '11-15', '16-20', '21-25'] as PptPageCount[]).map(p => (
                    <button 
                      key={p}
                      onClick={() => setPageCount(p)}
                      className={`text-xs p-1.5 rounded text-left flex justify-between items-center transition-colors ${pageCount === p ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 font-medium' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'}`}
                    >
                       {p === 'auto' ? '自动 (按内容)' : p + ' 页'}
                       {pageCount === p && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" />

          <button
            onClick={() => {
              setShowSettings(false);
              if (previewTexts.length === 0 && previewImages.length === 0) return;
              generatePptSlides(id, previewTexts, previewImages, data.pptTemplate, pageCount);
              openPptSidebar(id);
            }}
            className={`group/btn flex flex-row items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
              previewTexts.length > 0 || previewImages.length > 0 
                ? 'text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-500/10' 
                : 'text-neutral-400 cursor-not-allowed opacity-50'
            }`}
            disabled={previewTexts.length === 0 && previewImages.length === 0}
          >
            <Wand2 className="h-4 w-4" />
            <span className="text-[12px] font-medium tracking-wide hidden sm:inline-block">
              {isGenerated ? '重新生成' : '生成 PPT'}
            </span>
          </button>
        </div>

        <button
          onClick={deleteSelectedNodes}
          className="flex flex-row items-center gap-1.5 rounded-lg px-3 py-1.5 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-500/10 dark:hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-[12px] font-medium tracking-wide hidden sm:inline-block">删除</span>
        </button>
      </NodeToolbar>

      <div
        className={`group relative flex h-[270px] w-[480px] flex-col overflow-hidden rounded-xl bg-white dark:bg-[#151515] transition-[box-shadow,ring-color,border-color] duration-100 will-change-transform ${
          selected 
            ? 'ring-2 ring-blue-500/60' 
            : 'ring-1 ring-black/10 dark:ring-white/10 shadow-md'
        }`}
      >
        <Handle type="target" position={Position.Left} className="h-3 w-3 border-2 border-white bg-blue-500 opacity-50 transition-opacity group-hover:opacity-100 dark:border-neutral-800" />
        
        {/* Top Title Bar */}
        <div className="flex h-8 w-full shrink-0 items-center justify-between border-b border-black/5 dark:border-white/5 bg-neutral-50 px-3 dark:bg-neutral-800/30">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <Presentation className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{data.label || 'PPT Slide'}</span>
          </div>
          <div className="text-[10px] text-neutral-400">{connectedNodesData.length} Elements Linked</div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          {(displaySlide.text === '' && displaySlide.imageUrl === '') ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-neutral-300 dark:text-neutral-600 bg-white dark:bg-neutral-900 border-t border-black/5 dark:border-white/5">
              <PresentationIcon className="h-10 w-10 opacity-50" />
              <span className="text-sm font-medium">连线文本或图片生成排版</span>
            </div>
          ) : (
            // User explicitly set a cover or uploaded slides, prioritize this as cover
            <div className="w-full h-full relative border-t border-black/5 dark:border-white/5">
              <SlidePreview slide={displaySlide} isCapture={false} isNodeCover={true} />
            </div>
          )}
        </div>

        <Handle type="source" position={Position.Right} className="h-3 w-3 border-2 border-white bg-blue-500 opacity-50 transition-opacity group-hover:opacity-100 dark:border-neutral-800" />
      </div>
    </>
  );
});
