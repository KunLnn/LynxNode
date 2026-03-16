import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

// ─────────────────────────────────────────────────
// IndexedDB Storage Adapter for zustand/persist
// Avoids the ~5MB localStorage quota (images are large base64 strings)
// ─────────────────────────────────────────────────
const DB_NAME = 'infitype-db';
const STORE_NAME = 'keyval';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const idbStorageAdapter = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (typeof indexedDB === 'undefined') return null;
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const val: string | undefined = await new Promise((res, rej) => {
        const r = tx.objectStore(STORE_NAME).get(name);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      return val ?? null;
    } catch { return null; }
  },
  // Debounced setItem: coalesces rapid writes (e.g. during node drag at 60fps)
  // into a single IDB write every 500ms — eliminates drag lag
  setItem: (() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pendingName = '';
    let pendingValue = '';
    return async (name: string, value: string): Promise<void> => {
      pendingName = name;
      pendingValue = value;
      if (timer) return; // already scheduled
      timer = setTimeout(async () => {
        timer = null;
        try {
          if (typeof indexedDB === 'undefined') return;
          const db = await openDB();
          const tx = db.transaction(STORE_NAME, 'readwrite');
          await new Promise<void>((res, rej) => {
            const r = tx.objectStore(STORE_NAME).put(pendingValue, pendingName);
            r.onsuccess = () => res();
            r.onerror = () => rej(r.error);
          });
        } catch (e) { console.error('IDB setItem failed', e); }
      }, 500);
    };
  })(),
  removeItem: async (name: string): Promise<void> => {
    try {
      if (typeof indexedDB === 'undefined') return;
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await new Promise<void>((res) => {
        const r = tx.objectStore(STORE_NAME).delete(name);
        r.onsuccess = () => res();
      });
    } catch { /* ignore */ }
  },
};

// Sort nodes so parent group nodes always come before their children
// (React Flow requirement)
const sortGroupNodesFirst = (nodes: AppNode[]): AppNode[] => {
  const parents: AppNode[] = [];
  const rest: AppNode[] = [];
  for (const n of nodes) {
    if (n.type === 'groupNode') parents.push(n);
    else rest.push(n);
  }
  return [...parents, ...rest];
};

export type PptLayoutType = 'cover' | 'image-left' | 'image-right' | 'text-only';

export type PptSlide = {
  id: string;
  imageUrl: string;
  text?: string;
  layout?: PptLayoutType;
};

export type PptTemplate = string; // e.g., '/ppt-templates/modern/template_01.pptx'
export type PptPageCount = 'auto' | '1-5' | '6-10' | '11-15' | '16-20' | '21-25' | '26-30';

export type NodeData = {
  text?: string;
  richTextHtml?: string;
  imageUrl?: string;
  label?: string;
  slides?: PptSlide[];
  coverUrl?: string;
  isPptGenerated?: boolean;
  pptTemplate?: PptTemplate;
  pptPageCount?: PptPageCount;
  bgTransparent?: boolean;
  onChange?: (id: string, text: string) => void;
};

export type AppNode = Node<NodeData>;

export type CanvasMode = 'PAN' | 'SELECT';

export type AISettings = {
  llmProvider: 'openai' | 'gemini' | 'custom';
  llmApiKey: string;
  llmBaseUrl?: string;
  llmModel?: string;
  imageApiKey: string;    // Replicate (for upscale)
  removeBgApiKey: string; // PhotoRoom (for remove bg)
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  llmProvider: 'openai',
  llmApiKey: '',
  llmBaseUrl: '',
  llmModel: '',
  imageApiKey: '',
  removeBgApiKey: '',
};

export type GlobalEdgeStyle = {
  type: 'default' | 'straight' | 'smoothstep' | 'step';
  dashed: boolean;
  animated: boolean;
  edgesVisible: boolean;
};

export const DEFAULT_GLOBAL_EDGE_STYLE: GlobalEdgeStyle = {
  type: 'smoothstep',
  dashed: false,
  animated: false,
  edgesVisible: true,
};

export type FullscreenImageData = {
  src: string;
  meta: {
    fileName: string;
    width: number;
    height: number;
    createdAt: string;
    fileSize: string;
  };
} | null;

export type AppState = {
  nodes: AppNode[];
  edges: Edge[];
  canvasMode: CanvasMode;
  fullscreenImage: FullscreenImageData;
  aiSettings: AISettings;
  globalEdgeStyle: GlobalEdgeStyle;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: AppNode) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  updateNodeSize: (id: string, width: number, height: number) => void;
  setCanvasMode: (mode: CanvasMode) => void;
  setFullscreenImage: (data: FullscreenImageData) => void;
  closeFullscreen: () => void;
  updateAISettings: (settings: Partial<AISettings>) => void;
  updateGlobalEdgeStyle: (style: Partial<GlobalEdgeStyle>) => void;
  updateSelectedEdgesStyle: (style: Partial<GlobalEdgeStyle>) => void;
  toggleEdgesVisible: () => void;
  deleteSelectedEdges: () => void;
  alignNodes: (type: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'middle') => void;
  distributeNodes: (type: 'horizontal' | 'vertical') => void;
  groupNodes: () => void;
  autoGridNodes: () => void;
  deleteSelectedNodes: () => void;
  clearAll: () => void;
  bringToFront: (id: string) => void;
  isPptSidebarOpen: boolean;
  activePptNodeId: string | null;
  openPptSidebar: (nodeId: string) => void;
  closePptSidebar: () => void;
  isTemplateWindowOpen: boolean;
  activeTemplateNodeId: string | null;
  openTemplateWindow: (nodeId: string) => void;
  closeTemplateWindow: () => void;
  previewingTemplate: { id: string; name: string; pptxUrl: string; previewUrls: string[] } | null;
  openTemplatePreview: (templateData: { id: string; name: string; pptxUrl: string; previewUrls: string[] }) => void;
  closeTemplatePreview: () => void;
  setPptCover: (nodeId: string, coverUrl: string) => void;
  deletePptSlide: (nodeId: string, slideId: string) => void;
  extractTextToNewNode: (sourcePptNodeId: string, slideText: string) => void;
  generatePptSlides: (nodeId: string, texts: string[], images: string[], template?: PptTemplate, pageCount?: PptPageCount) => void;
  reorderPptSlides: (nodeId: string, sourceIndex: number, destIndex: number) => void;
  regeneratePptSlide: (nodeId: string, slideIndex: number, layout?: PptLayoutType) => void;
};

export type PersistedAppState = Pick<AppState, 'nodes' | 'edges' | 'aiSettings' | 'globalEdgeStyle'>;

export const PERSISTENCE_KEY = 'infitype-storage';

export async function loadPersistedAppState(): Promise<PersistedAppState | null> {
  const raw = await idbStorageAdapter.getItem(PERSISTENCE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PersistedAppState;
    return {
      nodes: Array.isArray(parsed.nodes) ? sortGroupNodesFirst(parsed.nodes as AppNode[]) : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      aiSettings: { ...DEFAULT_AI_SETTINGS, ...(parsed.aiSettings || {}) },
      globalEdgeStyle: { ...DEFAULT_GLOBAL_EDGE_STYLE, ...(parsed.globalEdgeStyle || {}) },
    };
  } catch {
    await idbStorageAdapter.removeItem(PERSISTENCE_KEY);
    return null;
  }
}

export async function savePersistedAppState(state: PersistedAppState): Promise<void> {
  await idbStorageAdapter.setItem(PERSISTENCE_KEY, JSON.stringify(state));
}

const useStore = create<AppState>()(
    (set, get) => ({
      nodes: [],
      edges: [],
      canvasMode: 'PAN',
      fullscreenImage: null,
      isPptSidebarOpen: false,
      activePptNodeId: null,

      aiSettings: DEFAULT_AI_SETTINGS,
      globalEdgeStyle: DEFAULT_GLOBAL_EDGE_STYLE,
      onNodesChange: (changes: NodeChange[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },
      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },
      onConnect: (connection: Connection) => {
        const { type, dashed, animated } = get().globalEdgeStyle;
        set({
          edges: addEdge({
            ...connection,
            type,
            animated,
            data: { edgeType: type },
            style: dashed ? { strokeDasharray: '6 3' } : {},
          }, get().edges),
        });
      },
      addNode: (node: AppNode) => {
        set({
          nodes: sortGroupNodesFirst([...get().nodes, node]),
        });
      },
      updateNodeData: (id: string, data: Partial<NodeData>) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === id ? { ...node, data: { ...node.data, ...data } } : node
          ),
        });
      },
      updateNodeSize: (id: string, width: number, height: number) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === id ? { ...node, style: { ...node.style, width, height } } : node
          ),
        });
      },
      setCanvasMode: (mode: CanvasMode) => {
        set({ canvasMode: mode });
      },
      setFullscreenImage: (data: FullscreenImageData) => {
        set({ fullscreenImage: data });
      },
      closeFullscreen: () => {
        set({ fullscreenImage: null });
      },
      updateAISettings: (settings) => {
        set({ aiSettings: { ...get().aiSettings, ...settings } });
      },
      updateGlobalEdgeStyle: (style) => {
        const newStyle = { ...get().globalEdgeStyle, ...style };
        set({
          globalEdgeStyle: newStyle,
          edges: get().edges.map((e) => ({
            ...e,
            ...(style.type !== undefined ? { type: newStyle.type, data: { ...e.data, edgeType: newStyle.type } } : {}),
            ...(style.animated !== undefined ? { animated: newStyle.animated } : {}),
          })),
        });
      },
      toggleEdgesVisible: () => {
        const next = !get().globalEdgeStyle.edgesVisible;
        set({
          globalEdgeStyle: { ...get().globalEdgeStyle, edgesVisible: next },
          // Stamp visibility into each edge's data so AppEdge reads it from props (no store subscription)
          edges: get().edges.map((e) => ({
            ...e,
            data: { ...e.data, edgesVisible: next },
          })),
        });
      },
      updateSelectedEdgesStyle: (style) => {
        // Dashed-only toggle — only changes selected edges' stroke style
        set({
          edges: get().edges.map((e) => {
            if (!e.selected) return e;
            const dashed = style.dashed ?? !!(e.style?.strokeDasharray);
            return {
              ...e,
              ...(style.type !== undefined ? { type: style.type } : {}),
              style: { ...e.style, strokeDasharray: dashed ? '6 3' : undefined },
            };
          }),
        });
      },
      deleteSelectedEdges: () => {
        set({ edges: get().edges.filter((e) => !e.selected) });
      },
      alignNodes: (type) => {
        const nodes = get().nodes;
        const selectedNodes = nodes.filter((n) => n.selected);
        if (selectedNodes.length < 2) return;

        let targetVal = 0;
        if (type === 'left') {
          targetVal = Math.min(...selectedNodes.map((n) => n.position.x));
        } else if (type === 'right') {
          targetVal = Math.max(...selectedNodes.map((n) => n.position.x + (n.style?.width ? Number(n.style.width) : 0)));
        } else if (type === 'top') {
          targetVal = Math.min(...selectedNodes.map((n) => n.position.y));
        } else if (type === 'bottom') {
          targetVal = Math.max(...selectedNodes.map((n) => n.position.y + (n.style?.height ? Number(n.style.height) : 0)));
        } else if (type === 'center') {
          // Average X
          targetVal = selectedNodes.reduce((acc, n) => acc + n.position.x, 0) / selectedNodes.length;
        } else if (type === 'middle') {
          // Average Y
          targetVal = selectedNodes.reduce((acc, n) => acc + n.position.y, 0) / selectedNodes.length;
        }

        set({
          nodes: nodes.map((node) => {
            if (!node.selected) return node;

            let newX = node.position.x;
            let newY = node.position.y;

            if (type === 'left' || type === 'center') newX = targetVal;
            if (type === 'right') newX = targetVal - (node.style?.width ? Number(node.style.width) : 0);
            
            if (type === 'top' || type === 'middle') newY = targetVal;
            if (type === 'bottom') newY = targetVal - (node.style?.height ? Number(node.style.height) : 0);

            return {
              ...node,
              position: { x: newX, y: newY },
            };
          }),
        });
      },
      distributeNodes: (type) => {
        const nodes = get().nodes;
        const selected = [...nodes.filter((n) => n.selected)];
        if (selected.length < 2) return;

        if (type === 'horizontal') {
          selected.sort((a, b) => a.position.x - b.position.x);
          // Space evenly with a 16px gap between each node
          const gap = 16;
          let cursor = selected[0].position.x;
          const positions: Record<string, number> = {};
          for (const n of selected) {
            positions[n.id] = cursor;
            cursor += (n.style?.width ? Number(n.style.width) : 200) + gap;
          }
          set({
            nodes: nodes.map((node) => {
              if (!node.selected) return node;
              return { ...node, position: { ...node.position, x: positions[node.id] } };
            }),
          });
        } else {
          selected.sort((a, b) => a.position.y - b.position.y);
          const gap = 16;
          let cursor = selected[0].position.y;
          const positions: Record<string, number> = {};
          for (const n of selected) {
            positions[n.id] = cursor;
            cursor += (n.style?.height ? Number(n.style.height) : 200) + gap;
          }
          set({
            nodes: nodes.map((node) => {
              if (!node.selected) return node;
              return { ...node, position: { ...node.position, y: positions[node.id] } };
            }),
          });
        }
      },
      groupNodes: () => {
        const nodes = get().nodes;
        const selected = nodes.filter((n) => n.selected && !n.parentNode);
        if (selected.length < 2) return;

        const PADDING = 24;
        const minX = Math.min(...selected.map((n) => n.position.x)) - PADDING;
        const minY = Math.min(...selected.map((n) => n.position.y)) - PADDING;
        const maxX = Math.max(...selected.map((n) => n.position.x + (n.style?.width ? Number(n.style.width) : 200)));
        const maxY = Math.max(...selected.map((n) => n.position.y + (n.style?.height ? Number(n.style.height) : 200)));

        const groupId = `group-${Date.now()}`;
        const groupNode: AppNode = {
          id: groupId,
          type: 'groupNode',
          position: { x: minX, y: minY },
          style: { width: maxX - minX + PADDING, height: maxY - minY + PADDING, zIndex: -1 },
          data: { label: 'Group' },
          selected: false,
        };

        const updatedChildren = selected.map((n) => ({
          ...n,
          parentNode: groupId,
          extent: 'parent' as const,
          position: { x: n.position.x - minX, y: n.position.y - minY },
          selected: false,
        }));

        const otherNodes = nodes.filter((n) => !n.selected || n.parentNode);
        set({ nodes: [groupNode, ...otherNodes, ...updatedChildren] });
      },
      autoGridNodes: () => {
        const nodes = get().nodes;
        const selected = nodes.filter((n) => n.selected);
        if (selected.length < 2) return;

        const count = selected.length;
        const cols = Math.ceil(Math.sqrt(count));
        const gap = 20;
        const itemW = 240;
        const itemH = 200;

        // Start from the top-left of the first selected node
        const startX = Math.min(...selected.map((n) => n.position.x));
        const startY = Math.min(...selected.map((n) => n.position.y));

        set({
          nodes: nodes.map((node) => {
            if (!node.selected) return node;
            const idx = selected.findIndex((n) => n.id === node.id);
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            return {
              ...node,
              position: { x: startX + col * (itemW + gap), y: startY + row * (itemH + gap) },
            };
          }),
        });
      },
      deleteSelectedNodes: () => {
        set({
          nodes: get().nodes.filter((node) => !node.selected),
          edges: get().edges.filter((edge) => {
             const nodes = get().nodes;
             const isSourceSelected = nodes.find(n => n.id === edge.source)?.selected;
             const isTargetSelected = nodes.find(n => n.id === edge.target)?.selected;
             return !isSourceSelected && !isTargetSelected;
          }),
        });
      },
      clearAll: () => {
        set({ nodes: [], edges: [] });
      },
      openPptSidebar: (nodeId: string) => set({ isPptSidebarOpen: true, activePptNodeId: nodeId }),
      closePptSidebar: () => set({ isPptSidebarOpen: false, activePptNodeId: null }),
      isTemplateWindowOpen: false,
      activeTemplateNodeId: null,
      openTemplateWindow: (nodeId: string) => set({ isTemplateWindowOpen: true, activeTemplateNodeId: nodeId }),
      closeTemplateWindow: () => set({ isTemplateWindowOpen: false, activeTemplateNodeId: null }),
      previewingTemplate: null,
      openTemplatePreview: (templateData) => set({ previewingTemplate: templateData }),
      closeTemplatePreview: () => set({ previewingTemplate: null }),
      setPptCover: (nodeId, coverUrl) => {
        set({
          nodes: get().nodes.map(node => 
            node.id === nodeId 
              ? { ...node, data: { ...node.data, coverUrl } }
              : node
          )
        });
      },
      deletePptSlide: (nodeId, slideId) => {
        set({
           nodes: get().nodes.map(node => {
             if (node.id === nodeId && node.data.slides) {
               return {
                 ...node,
                 data: {
                   ...node.data,
                   slides: node.data.slides.filter(slide => slide.id !== slideId)
                 }
               };
             }
             return node;
           })
        });
      },
      extractTextToNewNode: (sourceNodeId, slideText) => {
        const nodes = get().nodes;
        const sourceNode = nodes.find(n => n.id === sourceNodeId);
        if (!sourceNode) return;

        const newNodeId = `text-extracted-${Date.now()}`;
        const newX = sourceNode.position.x + (Number(sourceNode.style?.width) || 480) + 120;
        const newY = sourceNode.position.y;

        const newTextNode: AppNode = {
          id: newNodeId,
          type: 'textNode',
          position: { x: newX, y: newY },
          data: { text: slideText },
          selected: false,
        };

        const newEdge: Edge = {
          id: `edge-${sourceNode.id}-${newNodeId}`,
          source: sourceNode.id,
          target: newNodeId,
          type: get().globalEdgeStyle.type,
          animated: get().globalEdgeStyle.animated,
          style: get().globalEdgeStyle.dashed ? { strokeDasharray: '6 3' } : {}
        };

        set({
          nodes: [...nodes, newTextNode],
          edges: [...get().edges, newEdge]
        });
      },
      generatePptSlides: async (nodeId, texts, images, template = 'random', pageCount = 'auto') => {
        const { aiSettings } = get();

        // Mark node as generating
        set({
          nodes: get().nodes.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, isPptGenerating: true } } : n
          ),
        });

        try {
          // 1. Fetch the PPT skill file
          let skillContent = '';
          try {
            const res = await fetch('/skills/ppt_generation.md');
            if (res.ok) skillContent = await res.text();
          } catch (_) { /* skill file not found, use fallback */ }

          // 2. Resolve page count guidance
          const pageCountGuidance: Record<string, string> = {
            'auto': 'Determine the ideal number of slides (5-10) based on content complexity.',
            '1-5': 'Create a very concise deck with 1-5 slides maximum.',
            '6-10': 'Create a standard deck with 6-10 slides.',
            '11-15': 'Create an extended deck with 11-15 slides.',
            '16-20': 'Create a comprehensive deck with 16-20 slides.',
            '21-25': 'Create a detailed report with 21-25 slides.',
            '26-30': 'Create a full exhaustive report with 26-30 slides.',
          };
          const pageCountHint = pageCountGuidance[pageCount] || pageCountGuidance['auto'];

          // 3. Resolve template style name
          const styleMap: Record<string, string> = {
            '/ppt-templates/modern/': '现代 (modern) - professional & clean',
            '/ppt-templates/minimal/': '简约 (minimal) - elegant & sparse',
            '/ppt-templates/tech/': '科技 (tech) - data-driven & futuristic',
            '/ppt-templates/cartoon/': '卡通 (cartoon) - playful & casual',
            '/ppt-templates/retro/': '复古 (retro) - nostalgic & warm',
            '/ppt-templates/illustration/': '插画 (illustration) - artistic & creative',
            '/ppt-templates/handdrawn/': '手绘 (handdrawn) - personal & casual',
            '/ppt-templates/fashion/': '时尚 (fashion) - bold & editorial',
            '/ppt-templates/creative/': '创意 (creative) - unconventional & expressive',
            '/ppt-templates/festival/': '节日 (festival) - vibrant & celebratory',
            '/ppt-templates/fresh/': '清新 (fresh) - light & natural',
            '/ppt-templates/chinese/': '中式 (chinese) - classical & refined',
          };
          const templateKey = Object.keys(styleMap).find(k => template.includes(k));
          const templateStyle = templateKey ? styleMap[templateKey] : '自由风格 (random) - use your best judgment';

          // 4. Build user prompt
          const textContent = texts.length > 0
            ? texts.join('\n\n---\n\n')
            : '(No text content provided. Create a generic professional presentation.)';

          const userPrompt = `
Generate a professional PowerPoint presentation based on the following:

## Content
${textContent}

## Images Available
${images.length} image(s) will be embedded in relevant slides.

## Page Count
${pageCountHint}

## Template Style
${templateStyle}

## Rules
- Output ONLY valid JSON, no markdown fences
- First slide layout must be "cover"
- Last slide layout must be "outro"
- imageUrl field: use null or "image_0", "image_1", etc. to reference available images
- Layouts: cover, section, content, image-full, image-left, image-right, two-column, outro
- response format: {"title": "...", "slides": [{"layout": "cover", "title": "...", "subtitle": "...", "points": [], "imageUrl": null}]}
`;

          // 5. If LLM key is configured, call the API
          if (aiSettings.llmApiKey) {
            const { callLLM } = await import('@/lib/llm');
            const systemPrompt = skillContent
              ? skillContent.split('## System Prompt')[1]?.split('---')[0]?.trim() || 'You are an expert presentation designer. Always respond with valid JSON only.'
              : 'You are an expert presentation designer. Always respond with valid JSON only.';

            const responseText = await callLLM(
              [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
              aiSettings
            );

            // Parse JSON response
            let parsed: any;
            try {
              // Strip any markdown fences if LLM added them
              const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
              parsed = JSON.parse(cleaned);
            } catch {
              throw new Error('LLM returned invalid JSON. Please try again.');
            }

            const newSlides: PptSlide[] = (parsed.slides || []).map((s: any, i: number) => ({
              id: `slide-${Date.now()}-${i}`,
              text: [s.title, s.subtitle, ...(s.points || [])].filter(Boolean).join('\n'),
              imageUrl: s.imageUrl
                ? images[parseInt(s.imageUrl.replace('image_', ''), 10)] || ''
                : '',
              layout: (s.layout || 'content') as PptLayoutType,
            }));

            set({
              nodes: get().nodes.map(node =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, slides: newSlides, coverUrl: newSlides[0]?.imageUrl, isPptGenerated: true, isPptGenerating: false, pptTemplate: template, pptPageCount: pageCount } }
                  : node
              )
            });
            return;
          }

          // 6. Fallback (no LLM key): basic slide generation using existing logic
          const newSlides: PptSlide[] = [];
          let targetCount = Math.max(texts.length, images.length, 3);
          if (pageCount !== 'auto') {
            const [minStr, maxStr] = pageCount.split('-');
            targetCount = Math.floor(Math.random() * (parseInt(maxStr) - parseInt(minStr) + 1)) + parseInt(minStr);
          }
          const layouts: PptLayoutType[] = ['image-left', 'image-right', 'text-only', 'cover'];
          for (let i = 0; i < targetCount; i++) {
            newSlides.push({
              id: `slide-${Date.now()}-${i}`,
              text: texts.length > 0 ? texts[i % texts.length] : '',
              imageUrl: images.length > 0 ? images[i % images.length] : '',
              layout: i === 0 ? 'cover' : layouts[Math.floor(Math.random() * layouts.length)],
            });
          }

          set({
            nodes: get().nodes.map(node =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, slides: newSlides, coverUrl: newSlides[0]?.imageUrl, isPptGenerated: true, isPptGenerating: false, pptTemplate: template, pptPageCount: pageCount } }
                : node
            )
          });
        } catch (err: any) {
          // Clear generating state on error and surface it
          set({
            nodes: get().nodes.map(n =>
              n.id === nodeId ? { ...n, data: { ...n.data, isPptGenerating: false, pptError: err.message } } : n
            ),
          });
        }
      },
      reorderPptSlides: (nodeId, sourceIndex, destIndex) => {
        set({
          nodes: get().nodes.map(node => {
            if (node.id === nodeId && node.data.slides) {
              const newSlides = [...node.data.slides];
              const [movedSlide] = newSlides.splice(sourceIndex, 1);
              newSlides.splice(destIndex, 0, movedSlide);
              
              return {
                ...node,
                data: {
                  ...node.data,
                  slides: newSlides,
                  coverUrl: newSlides[0]?.imageUrl
                }
              };
            }
            return node;
          })
        });
      },
      regeneratePptSlide: (nodeId, slideIndex, layout) => {
        const nodes = get().nodes;
        const edges = get().edges;
        const node = nodes.find(n => n.id === nodeId);
        if (!node || !node.data.slides || slideIndex < 0 || slideIndex >= node.data.slides.length) return;

        const currentSlide = node.data.slides[slideIndex];

        // Try to fetch new content from current connections just for variation
        const incomingEdges = edges.filter((edge) => edge.target === nodeId);
        const sourceNodeIds = incomingEdges.map((edge) => edge.source);
        const sourceNodes = nodes.filter((n) => sourceNodeIds.includes(n.id));
        
        const texts = sourceNodes.filter(n => n.type === 'textNode').map(n => n.data.text).filter((t): t is string => Boolean(t));
        const images = sourceNodes.filter(n => n.type === 'imageNode').map(n => n.data.imageUrl).filter((i): i is string => Boolean(i));

        // Use a random content piece or fallback to existing
        const newText = texts.length > 0 ? texts[Math.floor(Math.random() * texts.length)] : currentSlide.text;
        const newImage = images.length > 0 ? images[Math.floor(Math.random() * images.length)] : currentSlide.imageUrl;

        set({
          nodes: nodes.map(n => {
            if (n.id === nodeId && n.data.slides) {
              const newSlides = [...n.data.slides];
              newSlides[slideIndex] = {
                ...newSlides[slideIndex],
                text: newText,
                imageUrl: newImage,
                layout: layout || currentSlide.layout || 'cover',
                // generate a new id to force UI re-render on image if needed
                id: `slide-${Date.now()}-${slideIndex}`
              };

              return {
                ...n,
                data: {
                  ...n.data,
                  slides: newSlides,
                  coverUrl: newSlides[0]?.imageUrl
                }
              };
            }
            return n;
          })
        });
      },
      bringToFront: (id) => {
        const nodes = get().nodes;
        let maxZ = 0;
        for (const n of nodes) {
          const z = n.style?.zIndex || 0;
          if (typeof z === 'number' && z > maxZ) {
            maxZ = z;
          }
        }
        set({
          nodes: nodes.map(n => {
            if (n.id === id) {
              return {
                ...n,
                style: {
                  ...n.style,
                  zIndex: maxZ + 1
                }
              };
            }
            return n;
          })
        });
      },
    })
);

export default useStore;
