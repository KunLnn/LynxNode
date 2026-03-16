import React, { memo } from 'react';
import {
  EdgeProps,
  getStraightPath,
  getSmoothStepPath,
  getBezierPath,
  BaseEdge,
} from 'reactflow';

type AppEdgeData = {
  edgeType?: 'default' | 'straight' | 'smoothstep' | 'step';
  edgesVisible?: boolean;
  [key: string]: unknown;
};

/**
 * AppEdge — custom edge renderer.
 *
 * Design decisions:
 * - Reads edgeType from data.edgeType (ReactFlow v11 does NOT pass `type` to custom components)
 * - Reads edgesVisible from data.edgesVisible (NOT useStore — avoids re-render on every node drag)
 * - Keeps a 12px transparent hit-path even when hidden so edges remain selectable
 */
function AppEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
  markerEnd,
}: EdgeProps<AppEdgeData>) {
  const edgeType    = data?.edgeType     ?? 'smoothstep';
  // Default to visible; only false when explicitly stamped by toggleEdgesVisible
  const edgesVisible = data?.edgesVisible !== false;

  let edgePath = '';
  if (edgeType === 'straight') {
    [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  } else if (edgeType === 'smoothstep' || edgeType === 'step') {
    [edgePath] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: edgeType === 'step' ? 0 : 8,
    });
  } else {
    [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  }

  const isHidden = !edgesVisible;

  const baseStyle: React.CSSProperties = {
    stroke: isHidden
      ? (selected ? 'rgba(99,102,241,0.45)' : 'transparent')
      : (selected ? '#6366f1' : '#aaaaaa'),
    strokeWidth: selected ? 2.5 : 1.5,
    filter: (!isHidden && selected) ? 'drop-shadow(0 0 4px rgba(99,102,241,0.6))' : 'none',
    strokeDasharray: isHidden && selected ? '4 4' : ((!isHidden && style.strokeDasharray) ? style.strokeDasharray : undefined),
    ...(!isHidden ? { strokeWidth: selected ? 2.5 : 1.5 } : {}),
  };

  return (
    <>
      {/* Wide transparent hit-target — always present so hidden edges stay clickable */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
      />
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={baseStyle} />
    </>
  );
}

export default memo(AppEdge);
