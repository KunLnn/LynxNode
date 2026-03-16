import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  SelectionMode,
  OnSelectionChangeParams,
  EdgeChange,
} from 'reactflow';
import useStore from '@/store/useStore';
import TextNode from '@/components/nodes/TextNode';
import ImageNode from '@/components/nodes/ImageNode';
import PptNode from '@/components/nodes/PptNode';
import GroupNode from '@/components/nodes/GroupNode';
import AppEdge from '@/components/edges/AppEdge';
import PptSidebar from '@/components/ui/PptSidebar';

export default function Canvas() {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const canvasMode = useStore((state) => state.canvasMode);
  const onNodesChange = useStore((state) => state.onNodesChange);
  const onEdgesChange = useStore((state) => state.onEdgesChange);
  const onConnect = useStore((state) => state.onConnect);

  // ── Ctrl-drag: direction-aware selection box ────────────────────────
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(SelectionMode.Partial);
  const [isInteracting, setIsInteracting] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const selectionModeRef = useRef<SelectionMode>(SelectionMode.Partial);
  const selectionDragEnabled = canvasMode === 'SELECT' || ctrlHeld;

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Control') setCtrlHeld(true); };
    const up   = (e: KeyboardEvent) => { if (e.key === 'Control') setCtrlHeld(false); };
    const blur = () => setCtrlHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectionDragEnabled) {
      dragStartX.current = e.clientX;
      setIsInteracting(true);
    }
  }, [selectionDragEnabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (selectionDragEnabled && dragStartX.current !== null) {
      const nextMode =
        e.clientX > dragStartX.current ? SelectionMode.Full : SelectionMode.Partial;
      if (selectionModeRef.current !== nextMode) {
        selectionModeRef.current = nextMode;
        setSelectionMode(nextMode);
      }
    }
  }, [selectionDragEnabled]);

  const handleMouseUp = useCallback(() => {
    dragStartX.current = null;
    setIsInteracting(false);
    if (selectionModeRef.current !== SelectionMode.Partial) {
      selectionModeRef.current = SelectionMode.Partial;
      setSelectionMode(SelectionMode.Partial);
    }
  }, []);

  const handleNodeDragStart = useCallback(() => {
    setIsInteracting(true);
  }, []);

  const handleNodeDragStop = useCallback(() => {
    setIsInteracting(false);
  }, []);

  // ── Edge click tracking: only allow edge selection via direct click ──
  // Edges must NOT be selectable via box-selection.
  const edgeWasClicked = useRef(false);

  const onEdgeClick = useCallback(() => {
    edgeWasClicked.current = true;
    // Reset after ReactFlow finishes propagating the selection change
    setTimeout(() => { edgeWasClicked.current = false; }, 50);
  }, []);

  // onSelectionChange fires after every selection update.
  // If edges appear in the selection but we didn't just click one, remove them (box-select).
  const onSelectionChange = useCallback(({ edges: selEdges, nodes: selNodes }: OnSelectionChangeParams) => {
    const hasEdges = selEdges.length > 0;
    if (!hasEdges) return;

    // Case 1: edges caught by box-selection (no direct click just happened)
    // Case 2: edges selected alongside nodes — always clear edges
    if (!edgeWasClicked.current || selNodes.length > 0) {
      const deselect: EdgeChange[] = selEdges.map((e) => ({
        id: e.id,
        type: 'select',
        selected: false,
      }));
      onEdgesChange(deselect);
    }
  }, [onEdgesChange]);

  const nodeTypes = useMemo(() => ({
    textNode: TextNode,
    imageNode: ImageNode,
    pptNode: PptNode,
    groupNode: GroupNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    default: AppEdge,
    straight: AppEdge,
    smoothstep: AppEdge,
    step: AppEdge,
  }), []);

  return (
    <div
      className={`h-screen w-screen bg-background ${
        canvasMode === 'SELECT' ? 'canvas-select-mode' : 'canvas-pan-mode'
      } ${
        isInteracting ? 'canvas-interacting' : ''
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <PptSidebar />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={onEdgeClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        panOnScroll
        panOnDrag={!selectionDragEnabled}
        selectionOnDrag={selectionDragEnabled}
        selectionMode={selectionMode}
        multiSelectionKeyCode="Shift"
        selectionKeyCode={null}
        deleteKeyCode={['Backspace', 'Delete']}
        elementsSelectable
        edgesFocusable
        edgesUpdatable={false}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#cccccc', strokeWidth: 1.5 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#aaaaaa" gap={24} size={1} />
        <Controls showInteractive={false} className="border-none shadow-sm shadow-black/5" />
      </ReactFlow>
    </div>
  );
}
