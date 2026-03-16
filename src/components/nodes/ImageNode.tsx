import React, { memo, useState, useRef, useCallback } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { NodeToolbar } from '@reactflow/node-toolbar';
import useStore, { NodeData } from '@/store/useStore';
import { Upload, Image as ImageIcon, RefreshCcw, Maximize2, Sparkles, Scissors, Loader2, Trash2 } from 'lucide-react';

type ImageNodeProps = NodeProps<NodeData> & {
  width?: number;
  height?: number;
};

export default memo(function ImageNode({ id, data, selected, width, height }: ImageNodeProps) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const updateNodeSize = useStore((state) => state.updateNodeSize);
  const deleteSelectedNodes = useStore((state) => state.deleteSelectedNodes);
  const aiSettings = useStore((state) => state.aiSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedNodeCount = useStore((state) => {
    let count = 0;
    for (const node of state.nodes) {
      if (node.selected) count += 1;
      if (count > 1) return count;
    }
    return count;
  });

  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [imageError, setImageError] = useState('');

  const styleWidth = width;
  const styleHeight = height;

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const newWidth = Number(styleWidth) || 320;
          const newHeight = (newWidth / img.naturalWidth) * img.naturalHeight;
          updateNodeData(id, { imageUrl: reader.result as string, label: file.name });
          updateNodeSize(id, newWidth, newHeight);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = '';
  }, [id, styleWidth, updateNodeData, updateNodeSize]);

  const triggerUpload = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const handleViewFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.imageUrl) return;
    const container = (e.currentTarget as HTMLElement).closest('[data-node-id]') as HTMLElement;
    const imgEl = container?.querySelector('img');
    const naturalWidth = imgEl?.naturalWidth || Number(styleWidth) || 1024;
    const naturalHeight = imgEl?.naturalHeight || Number(styleHeight) || 1024;
    useStore.getState().setFullscreenImage({
      src: data.imageUrl,
      meta: {
        fileName: data.label || 'image.png',
        width: naturalWidth,
        height: naturalHeight,
        fileSize: 'Unknown',
        createdAt: new Date().toLocaleDateString(),
      },
    });
  }, [data.imageUrl, data.label, styleWidth, styleHeight]);

  const showError = (msg: string) => {
    setImageError(msg);
    setTimeout(() => setImageError(''), 3500);
  };

  const handleUpscale = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.imageUrl) return;
    if (!aiSettings.imageApiKey) { showError('请先配置 Replicate API Key'); return; }
    setIsUpscaling(true);
    setImageError('');
    try {
      const { upscaleImage } = await import('@/lib/imageProcessing');
      updateNodeData(id, { imageUrl: await upscaleImage(data.imageUrl, aiSettings.imageApiKey) });
    } catch (err: any) { showError(err.message || '超分失败'); }
    finally { setIsUpscaling(false); }
  }, [data.imageUrl, aiSettings.imageApiKey, id, updateNodeData]);

  const handleRemoveBg = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.imageUrl) return;
    if (!aiSettings.removeBgApiKey) { showError('请先配置 Remove BG API Key'); return; }
    setIsRemovingBg(true);
    setImageError('');
    try {
      const { removeBg } = await import('@/lib/imageProcessing');
      updateNodeData(id, { imageUrl: await removeBg(data.imageUrl, aiSettings.removeBgApiKey) });
    } catch (err: any) { showError(err.message || '去背景失败'); }
    finally { setIsRemovingBg(false); }
  }, [data.imageUrl, aiSettings.removeBgApiKey, id, updateNodeData]);

  const hasImage = !!data.imageUrl;

  const toolbarClass = "flex items-center gap-1 rounded-xl border border-black/10 bg-white/95 px-1.5 py-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-800/95";
  const toolBtn = "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white";
  const sep = "mx-0.5 h-5 w-px bg-black/10 dark:bg-white/10";

  return (
    <>
      <NodeResizer
        color="#6366f1"
        isVisible={selected && selectedNodeCount === 1}
        minWidth={120}
        minHeight={100}
        keepAspectRatio={hasImage}
        handleStyle={{ width: 10, height: 10, borderRadius: 5 }}
      />

      {/* Floating Toolbar */}
      <NodeToolbar isVisible={selected && selectedNodeCount === 1} position={Position.Top} offset={12} className={toolbarClass}>
        <div className="flex items-center gap-1.5 px-2 border-r border-black/10 dark:border-white/10 mr-0.5">
          <ImageIcon className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-[11px] font-semibold text-neutral-400">图像</span>
        </div>

        <button onClick={(e) => triggerUpload(e)} className={toolBtn} title="替换图片">
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>替换</span>
        </button>

        {hasImage && (
          <>
            <div className={sep} />
            <button onClick={handleUpscale} disabled={isUpscaling || isRemovingBg} className={`${toolBtn} disabled:opacity-50`} title="超分辨率放大">
              {isUpscaling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
              <span>超分</span>
            </button>
            <button onClick={handleRemoveBg} disabled={isUpscaling || isRemovingBg} className={`${toolBtn} disabled:opacity-50`} title="去除背景">
              {isRemovingBg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5 text-pink-500" />}
              <span>去背景</span>
            </button>
            <div className={sep} />
            <button onClick={handleViewFullscreen} className={toolBtn} title="全屏查看">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        <div className={sep} />
        <button onClick={() => deleteSelectedNodes()} className={`${toolBtn} hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/30 dark:hover:!text-red-500`} title="删除">
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {imageError && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-[11px] whitespace-nowrap shadow-lg z-50">
            {imageError}
          </div>
        )}
      </NodeToolbar>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

      {hasImage && (
        <>
          <div className="absolute -top-8 left-0 flex items-center gap-2 text-neutral-500 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1 text-xs font-medium backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:bg-neutral-800/60 dark:text-neutral-300 dark:ring-white/10">
              <ImageIcon className="h-3.5 w-3.5" />
              <span className="max-w-[100px] truncate">{data.label || 'Image'}</span>
            </div>
          </div>
          <div className="absolute -top-8 right-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
            <div className="rounded-md bg-white/60 px-2 py-1 text-[10px] font-medium text-neutral-500 backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:bg-neutral-800/60 dark:text-neutral-400 dark:ring-white/10">
              {styleWidth && styleHeight ? `${Math.round(Number(styleWidth))} × ${Math.round(Number(styleHeight))}` : 'Auto'}
            </div>
          </div>
        </>
      )}

      <div
        data-node-id={id}
        className={`group relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl transition-[box-shadow,border-color,ring-color,background-color,opacity] duration-100 will-change-transform ${
          hasImage
            ? `bg-white border border-transparent shadow-sm ${selected ? 'shadow-lg ring-2 ring-indigo-500/20' : 'hover:shadow-md'}`
            : `bg-gray-50 border-2 border-dashed cursor-pointer ${selected ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-gray-200 hover:border-indigo-400/60 hover:bg-indigo-50/30'}`
        }`}
        onClick={!hasImage ? () => triggerUpload() : undefined}
      >
        <Handle type="target" position={Position.Left} className={`!h-3 !w-3 !bg-gray-200 !border-2 !border-white transition-colors group-hover:!bg-indigo-500 ${!hasImage ? 'opacity-0' : ''}`} />

        <div className="relative h-full w-full">
          {hasImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={data.imageUrl} alt="Node content" className="h-full w-full object-cover pointer-events-none" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full text-center p-4">
              <div className="mb-3 rounded-full bg-gray-100 p-4 ring-1 ring-gray-200 group-hover:scale-105 transition-transform">
                <Upload className="h-6 w-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <p className="text-sm font-medium text-gray-500 group-hover:text-indigo-500 transition-colors">点击上传图片</p>
              <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP</p>
            </div>
          )}
        </div>

        <Handle type="source" position={Position.Right} className="!h-3 !w-3 !bg-gray-200 !border-2 !border-white transition-colors group-hover:!bg-indigo-500" />
      </div>
    </>
  );
});
