import React from 'react';
import { X, Download, Calendar, Maximize, HardDrive } from 'lucide-react';
import useStore from '@/store/useStore';

const ImageViewer = () => {
  const fullscreenImage = useStore((state) => state.fullscreenImage);
  const closeFullscreen = useStore((state) => state.closeFullscreen);

  if (!fullscreenImage) return null;

  const { src, meta } = fullscreenImage;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-row bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeFullscreen}
    >
      {/* Close Button */}
      <button
        onClick={closeFullscreen}
        className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Left: Image Canvas */}
      <div className="relative flex flex-1 items-center justify-center p-8">
        <img
          src={src}
          alt={meta.fileName}
          className="max-h-full max-w-full rounded-sm object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Right: Sidebar */}
      <div
        className="flex w-80 flex-col border-l border-white/10 bg-[#111] text-neutral-300 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <h2 className="truncate text-lg font-semibold text-white" title={meta.fileName}>
            {meta.fileName}
          </h2>
          <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">Asset Details</p>
        </div>

        {/* Metadata Grid */}
        <div className="flex-1 space-y-6 p-6">
          {/* Resolution */}
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-white/5 p-2">
              <Maximize className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Resolution</p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {meta.width} x {meta.height}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-white/5 p-2">
              <Calendar className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Created At</p>
              <p className="mt-0.5 text-xs text-neutral-400">{meta.createdAt}</p>
            </div>
          </div>

          {/* Size */}
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-white/5 p-2">
              <HardDrive className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">File Size</p>
              <p className="mt-0.5 text-xs text-neutral-400">{meta.fileSize}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto border-t border-white/10 bg-black/20 p-6">
          <a
            href={src}
            download={meta.fileName}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-white py-2.5 font-medium text-black transition-colors hover:bg-neutral-200"
          >
            <Download className="h-4 w-4" />
            Download Asset
          </a>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
