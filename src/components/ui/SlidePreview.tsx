import React from 'react';
import { PptSlide } from '@/store/useStore';

export const SlidePreview = ({ slide, isCapture = false, isNodeCover = false }: { slide: PptSlide, isCapture?: boolean, isNodeCover?: boolean }) => {
  const layout = slide.layout || 'cover';
  
  // `isNodeCover` uses h-full instead of aspect-video to fill the taller PPT Node container,
  // while `isCapture` is absolute fixed pixel perfect resolution for exporting
  const containerClass = isCapture 
    ? "relative w-[1920px] h-[1080px] bg-white overflow-hidden flex shrink-0" 
    : `relative w-full ${isNodeCover ? 'h-full' : 'aspect-video'} bg-white overflow-hidden flex`;

  if (layout === 'cover') {
     return (
       <div id={isCapture ? `slide-capture-${slide.id}` : undefined} className={containerClass}>
         {slide.imageUrl && <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />}
         {slide.text && (
            <div className={`absolute inset-0 flex items-center justify-center ${isCapture ? 'p-[5%]' : 'p-4'} bg-black/40`}>
              <h2 className={`text-white font-bold text-center text-shadow-md leading-relaxed drop-shadow-xl line-clamp-4 ${isCapture ? 'text-[80px]' : isNodeCover ? 'text-2xl' : 'text-sm sm:text-base'}`}>{slide.text}</h2>
            </div>
         )}
       </div>
     );
  }

  if (layout === 'image-left' || layout === 'image-right') {
     const isLeft = layout === 'image-left';
     return (
       <div id={isCapture ? `slide-capture-${slide.id}` : undefined} className={`${containerClass} ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
         {/* Image Half */}
         <div className="w-1/2 h-full relative bg-neutral-100 dark:bg-neutral-800">
            {slide.imageUrl && <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />}
         </div>
         {/* Text Half */}
         <div className={`w-1/2 h-full flex flex-col items-center justify-center ${isCapture ? 'p-16' : isNodeCover ? 'p-8' : 'p-3'} bg-white dark:bg-neutral-900 border-l border-black/5 dark:border-white/5`}>
            {slide.text && <p className={`text-neutral-800 dark:text-neutral-200 leading-relaxed max-w-full overflow-hidden ${isCapture ? 'text-4xl line-clamp-6' : isNodeCover ? 'text-lg line-clamp-5' : 'text-[10px] leading-tight line-clamp-4'}`}>{slide.text}</p>}
         </div>
       </div>
     );
  }

  if (layout === 'text-only') {
     return (
       <div id={isCapture ? `slide-capture-${slide.id}` : undefined} className={`${containerClass} flex items-center justify-center ${isCapture ? 'p-24' : isNodeCover ? 'p-12' : 'p-6'} bg-white dark:bg-neutral-900`}>
          {slide.text && <p className={`text-neutral-800 dark:text-neutral-200 leading-relaxed text-center ${isCapture ? 'text-5xl font-medium line-clamp-6' : isNodeCover ? 'text-3xl font-semibold line-clamp-5' : 'text-sm font-medium line-clamp-4'}`}>{slide.text}</p>}
       </div>
     );
  }

  return null;
}
