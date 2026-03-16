'use client';

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import Canvas from '@/components/canvas/Canvas';
import CanvasDock from '@/components/ui/CanvasDock';
import ClientOnly from '@/components/canvas/ClientOnly';
import StorePersistence from '@/components/canvas/StorePersistence';
import SelectionMenu from '@/components/ui/SelectionMenu';
import ImageViewer from '@/components/ui/ImageViewer';
import EdgeToolbar from '@/components/ui/EdgeToolbar';
import { TemplateWindow } from '@/components/ui/TemplateWindow';
import { TemplatePreviewModal } from '@/components/ui/TemplatePreviewModal';
import RenderGuard from '@/components/ui/RenderGuard';

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <ClientOnly>
        <ReactFlowProvider>
          <StorePersistence />
          <RenderGuard name="Canvas">
            <Canvas />
          </RenderGuard>
          <RenderGuard name="CanvasDock">
            <CanvasDock />
          </RenderGuard>
          <RenderGuard name="SelectionMenu">
            <SelectionMenu />
          </RenderGuard>
          <RenderGuard name="EdgeToolbar">
            <EdgeToolbar />
          </RenderGuard>
          <RenderGuard name="ImageViewer">
            <ImageViewer />
          </RenderGuard>
          <RenderGuard name="TemplateWindow">
            <TemplateWindow />
          </RenderGuard>
          <RenderGuard name="TemplatePreviewModal">
            <TemplatePreviewModal />
          </RenderGuard>
        </ReactFlowProvider>
      </ClientOnly>
    </main>
  );
}
