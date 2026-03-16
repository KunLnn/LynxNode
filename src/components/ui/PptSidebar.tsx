import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import useStore from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { X, Type, Trash2, Download, FileText, FileImage, Presentation, GripVertical, RefreshCw } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { PptLayoutType } from '@/store/useStore';
import { SlidePreview } from '@/components/ui/SlidePreview';

export default function PptSidebar() {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);


  const isPptSidebarOpen = useStore((s) => s.isPptSidebarOpen);
  const activePptNodeId = useStore((s) => s.activePptNodeId);
  const closePptSidebar = useStore((s) => s.closePptSidebar);
  const setPptCover = useStore((s) => s.setPptCover);
  const deletePptSlide = useStore((s) => s.deletePptSlide);
  const extractTextToNewNode = useStore((s) => s.extractTextToNewNode);
  const reorderPptSlides = useStore((s) => s.reorderPptSlides);
  const regeneratePptSlide = useStore((s) => s.regeneratePptSlide);

  // Subscribe ONLY to the active node's slides array, not the `nodes` array
  // This prevents PptSidebar from re-rendering during every node drag
  const slides = useStore(
    useShallow((state) => {
      if (!activePptNodeId) return [];
      const activeNode = state.nodes.find((n) => n.id === activePptNodeId);
      return activeNode?.data?.slides || [];
    })
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !activePptNodeId) return;
    reorderPptSlides(activePptNodeId, result.source.index, result.destination.index);
  };

  // ================= EXPORT LOGIC =================

  // 1. Export as PPTX
  const exportAsPptx = async () => {
    if (slides.length === 0) return;
    setIsExporting(true);
    try {
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';

      slides.forEach((slide) => {
        const slidePres = pres.addSlide();
        const layout = slide.layout || 'cover';
        
        if (layout === 'cover') {
          if (slide.imageUrl) {
            slidePres.addImage({ path: slide.imageUrl, x: 0, y: 0, w: '100%', h: '100%' });
          }
          if (slide.text) {
            slidePres.addShape(pres.ShapeType.rect, { 
              x: '5%', y: '5%', w: '90%', h: '90%', fill: { color: '000000', transparency: 50 } 
            });
            slidePres.addText(slide.text, { 
              x: '5%', y: '5%', w: '90%', h: '90%', color: 'FFFFFF', fontSize: 32, align: 'center', valign: 'middle', margin: 20
            });
          }
        } else if (layout === 'image-left') {
          if (slide.imageUrl) {
            slidePres.addImage({ path: slide.imageUrl, x: 0, y: 0, w: '50%', h: '100%' });
          }
          if (slide.text) {
            slidePres.addText(slide.text, { 
              x: '55%', y: '10%', w: '40%', h: '80%', color: '000000', fontSize: 24, align: 'left', valign: 'middle'
            });
          }
        } else if (layout === 'image-right') {
          if (slide.imageUrl) {
            slidePres.addImage({ path: slide.imageUrl, x: '50%', y: 0, w: '50%', h: '100%' });
          }
          if (slide.text) {
            slidePres.addText(slide.text, { 
              x: '5%', y: '10%', w: '40%', h: '80%', color: '000000', fontSize: 24, align: 'left', valign: 'middle'
            });
          }
        } else if (layout === 'text-only') {
           if (slide.text) {
            slidePres.addText(slide.text, { 
              x: '10%', y: '10%', w: '80%', h: '80%', color: '000000', fontSize: 28, align: 'center', valign: 'middle'
            });
          }         
        }
      });

      await pres.writeFile({ fileName: `InfiType-Presentation-${Date.now()}.pptx` });
    } catch (e) {
      console.error(e);
      alert('导出 PPTX 失败。');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Helper to capture all slide DOM nodes as images
  const captureSlides = async () => {
    const images: string[] = [];
    for (const slide of slides) {
      const node = document.getElementById(`slide-capture-${slide.id}`);
      if (node) {
        // html-to-image capturing
        const dataUrl = await toPng(node, { quality: 0.95, pixelRatio: 2 });
        images.push(dataUrl);
      }
    }
    return images;
  };

  // 2. Export as PDF
  const exportAsPdf = async () => {
    if (slides.length === 0) return;
    setIsExporting(true);
    try {
      const images = await captureSlides();
      if (images.length === 0) throw new Error('No images captured');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080], // Standard 16:9 1080p
      });

      images.forEach((img, idx) => {
        if (idx !== 0) pdf.addPage();
        pdf.addImage(img, 'PNG', 0, 0, 1920, 1080);
      });

      pdf.save(`InfiType-Presentation-${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
      alert('导出 PDF 失败。');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // 3. Export as ZIP of Images
  const exportAsImages = async () => {
    if (slides.length === 0) return;
    setIsExporting(true);
    try {
      const images = await captureSlides();
      if (images.length === 0) throw new Error('No images captured');

      const zip = new JSZip();
      
      images.forEach((img, idx) => {
        // Remove "data:image/png;base64," prefix for jszip
        const base64Data = img.split(',')[1];
        zip.file(`slide-${idx + 1}.png`, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `InfiType-Presentation-${Date.now()}.zip`);
    } catch (e) {
      console.error(e);
      alert('导出单页图片包压缩失败。');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // 4. Export as Vertically Stitched Long Image
  const exportAsLongImage = async () => {
    if (slides.length === 0) return;
    setIsExporting(true);
    try {
      const images = await captureSlides();
      if (images.length === 0) throw new Error('No images captured');

      const width = 1920;
      const height = 1080;
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height * images.length;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas context');

      for (let i = 0; i < images.length; i++) {
        const img = new Image();
        // Load image and wait
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = images[i];
        });
        ctx.drawImage(img, 0, i * height, width, height);
      }

      const mergedDataUrl = canvas.toDataURL('image/png');
      saveAs(mergedDataUrl, `InfiType-Presentation-Long-${Date.now()}.png`);
    } catch (e) {
      console.error(e);
      alert('长图合成并导出失败。');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // ================================================

  return (
    <AnimatePresence>
      {isPptSidebarOpen && (
        <motion.div 
          className="fixed inset-y-0 right-0 z-50 w-80 md:w-96 border-l border-neutral-200 bg-white/80 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-900/80 overflow-hidden flex flex-col"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-neutral-900/50 sticky top-0 z-10">
            <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Slides Overview
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isExporting}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isExporting 
                      ? 'bg-neutral-100 text-neutral-400 cursor-wait dark:bg-neutral-800' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20'
                  }`}
                >
                  <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
                  {isExporting ? '导出中...' : '导出'}
                </button>

                {/* Export Dropdown */}
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-black/5 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-neutral-800"
                    >
                      <button 
                        onClick={exportAsPptx}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5"
                      >
                        <Presentation className="h-3.5 w-3.5 text-orange-500" />
                        导出为 PPTX 
                      </button>
                      <button 
                        onClick={exportAsPdf}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5"
                      >
                        <FileText className="h-3.5 w-3.5 text-red-500" />
                        导出为 PDF
                      </button>
                      <button 
                        onClick={exportAsImages}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5"
                      >
                        <FileImage className="h-3.5 w-3.5 text-green-500" />
                        单页图片包 (ZIP)
                      </button>
                      <button 
                        onClick={exportAsLongImage}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/5"
                      >
                        <FileImage className="h-3.5 w-3.5 text-indigo-500" />
                        竖向拼接长图 (PNG)
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />

              <button 
                onClick={closePptSidebar}
                className="p-1.5 rounded-md text-neutral-500 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Slides List & Capture Region */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* HIDDEN CAPTURE TARGETS FOR EXPORT */}
            <div className="absolute opacity-0 pointer-events-none -left-[9999px]">
              {slides.map((slide) => (
                <SlidePreview key={`capture-${slide.id}`} slide={slide} isCapture={true} />
              ))}
            </div>

            {/* VISIBLE LIST UI */}
            {slides.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400 dark:text-neutral-500 gap-3">
                <Presentation className="w-8 h-8 opacity-50" />
                <p className="text-sm">暂无页面数据</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="ppt-slides-list">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {slides.map((slide, index) => (
                        <Draggable key={slide.id} draggableId={slide.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`group flex flex-col gap-3 rounded-xl border bg-white p-3 shadow-sm transition-all dark:bg-neutral-800/80 ${
                                snapshot.isDragging 
                                  ? 'border-blue-500 ring-4 ring-blue-500/20 z-50 scale-105' 
                                  : 'border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="flex cursor-grab items-center justify-center text-neutral-400 hover:text-neutral-700 active:cursor-grabbing dark:text-neutral-500 dark:hover:text-neutral-300"
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                  
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                                    {index + 1}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400 border border-black/5 dark:border-white/5 capitalize tracking-wide">
                                      {slide.layout || 'cover'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                  <div className="group/regen relative">
                                    <button
                                      onClick={() => activePptNodeId && regeneratePptSlide(activePptNodeId, index)}
                                      className="rounded p-1.5 text-blue-500 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-neutral-100 hover:bg-neutral-50 hover:border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700 transition-colors"
                                      title="重新生成并更换内容"
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                    </button>
                                    {/* Hover Menu for layouts */}
                                    {/* Adjusted z-index and top position explicitly to avoid header overlap */}
                                    <div className={`absolute right-full mr-2 w-32 bg-white dark:bg-neutral-800 rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] border border-black/10 dark:border-white/10 opacity-0 invisible group-hover/regen:opacity-100 group-hover/regen:visible transition-all z-[999] flex flex-col p-1.5 gap-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-200 ${index === 0 ? "top-0" : "-translate-y-1/2 top-1/2"}`}>
                                      <button onClick={() => activePptNodeId && regeneratePptSlide(activePptNodeId, index, 'cover')} className={`p-1.5 text-left rounded-md flex items-center justify-between transition-colors ${slide.layout==='cover' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>封面图文 {slide.layout==='cover' && '✓'}</button>
                                      <button onClick={() => activePptNodeId && regeneratePptSlide(activePptNodeId, index, 'image-left')} className={`p-1.5 text-left rounded-md flex items-center justify-between transition-colors ${slide.layout==='image-left' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>左图右文 {slide.layout==='image-left' && '✓'}</button>
                                      <button onClick={() => activePptNodeId && regeneratePptSlide(activePptNodeId, index, 'image-right')} className={`p-1.5 text-left rounded-md flex items-center justify-between transition-colors ${slide.layout==='image-right' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>右图左文 {slide.layout==='image-right' && '✓'}</button>
                                      <button onClick={() => activePptNodeId && regeneratePptSlide(activePptNodeId, index, 'text-only')} className={`p-1.5 text-left rounded-md flex items-center justify-between transition-colors ${slide.layout==='text-only' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}>纯文本 {slide.layout==='text-only' && '✓'}</button>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => activePptNodeId && deletePptSlide(activePptNodeId, slide.id)}
                                    className="rounded p-1.5 text-red-500 bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-neutral-100 hover:bg-red-50 hover:border-red-200 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-red-500/10 transition-colors"
                                    title="删除此页"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="w-full rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shadow-sm bg-neutral-50 dark:bg-neutral-900 pointer-events-none">
                                <SlidePreview slide={slide} isCapture={false} />
                              </div>
                              
                              <p className="px-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 line-clamp-2" title={slide.text}>
                                {slide.text ? slide.text : `Slide ${index + 1}`}
                              </p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
