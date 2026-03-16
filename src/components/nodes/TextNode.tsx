import React, { memo, useEffect, useRef, useState } from 'react';
import { Handle, NodeProps, NodeResizer, Position } from 'reactflow';
import useStore, { NodeData } from '@/store/useStore';
import {
  ArrowUpToLine,
  Bold,
  Bot,
  ChevronDown,
  Eye,
  EyeOff,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Send,
  Trash2,
  Type,
} from 'lucide-react';

type TextNodeProps = NodeProps<NodeData>;

type FontAsset = { name: string; url: string };

const PLACEHOLDER_TEXT = '输入文字...';
const FONT_FAMILIES = ['Georgia', 'Arial', 'Times New Roman', 'Courier New', 'Verdana'];
const FONT_SIZES = [16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96];
const ZERO_WIDTH_SPACE = '\u200b';

let cachedFonts: FontAsset[] | null = null;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plainTextToHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

function stripHtml(value: string) {
  if (typeof window === 'undefined') return value.replace(/<[^>]+>/g, ' ').trim();
  const div = document.createElement('div');
  div.innerHTML = value;
  return div.textContent?.replace(/\u200b/g, '').trim() || '';
}

function normalizeHtml(value: string) {
  return value.replace(/\u200b/g, '').trim() || `<p>${PLACEHOLDER_TEXT}</p>`;
}

function rgbToHex(value: string) {
  if (!value) return '#000000';
  if (value.startsWith('#')) return value;
  const match = value.match(/\d+/g);
  if (!match || match.length < 3) return '#000000';
  return `#${match.slice(0, 3).map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
}

function normalizeFontFamily(value: string) {
  return value.split(',')[0]?.replace(/['"]/g, '').trim() || 'Georgia';
}

function getExplicitTextColor(target: HTMLElement, boundary: HTMLElement | null) {
  let current: HTMLElement | null = target;
  while (current && current !== boundary) {
    if (current instanceof HTMLFontElement && current.color) {
      return rgbToHex(current.color);
    }
    if (current.style.color) {
      return rgbToHex(current.style.color);
    }
    current = current.parentElement;
  }
  return '#000000';
}

function placeCaretAtEnd(element: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);

  const selection = window.getSelection();
  if (!selection) return;
  selection.removeAllRanges();
  selection.addRange(range);
}

function findStyledTextElement(container: HTMLElement) {
  const textWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let textNode = textWalker.nextNode() as Text | null;

  while (textNode) {
    if (textNode.textContent?.replace(/\u200b/g, '').trim()) {
      return textNode.parentElement || container;
    }
    textNode = textWalker.nextNode() as Text | null;
  }

  const elementWalker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  let current = elementWalker.nextNode() as HTMLElement | null;

  while (current) {
    if (current.tagName !== 'BR' && current !== container) {
      return current;
    }
    current = elementWalker.nextNode() as HTMLElement | null;
  }

  return container;
}

export default memo(function TextNode({ id, data, selected }: TextNodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const suppressSelectionSyncRef = useRef(false);
  const waitingForFreshSelectionRef = useRef(false);
  const hasExplicitSelectionRef = useRef(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState('#000000');
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isOrderedListActive, setIsOrderedListActive] = useState(false);
  const [isUnorderedListActive, setIsUnorderedListActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFontSizeDropdownOpen, setIsFontSizeDropdownOpen] = useState(false);
  const [isFontFamilyDropdownOpen, setIsFontFamilyDropdownOpen] = useState(false);
  const [customFonts, setCustomFonts] = useState<FontAsset[]>(cachedFonts || []);

  useEffect(() => {
    if (cachedFonts) return;
    fetch('/api/fonts')
      .then((res) => res.json())
      .then((payload) => {
        const fonts = payload.fonts || [];
        cachedFonts = fonts;
        setCustomFonts(fonts);
      })
      .catch(console.error);
  }, []);

  const updateNodeData = useStore((state) => state.updateNodeData);
  const updateNodeSize = useStore((state) => state.updateNodeSize);
  const deleteSelectedNodes = useStore((state) => state.deleteSelectedNodes);
  const bringToFront = useStore((state) => (state as any).bringToFront);
  const aiSettings = useStore((state) => state.aiSettings);
  const selectedNodeCount = useStore((state) => {
    let count = 0;
    for (const node of state.nodes) {
      if (node.selected) count += 1;
      if (count > 1) return count;
    }
    return count;
  });

  const initialHtml = data.richTextHtml || (data.text ? plainTextToHtml(data.text) : `<p>${PLACEHOLDER_TEXT}</p>`);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement === editor) return;
    if (editor.innerHTML !== initialHtml) {
      editor.innerHTML = initialHtml;
    }
  }, [initialHtml]);

  const persistEditorContent = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = normalizeHtml(editor.innerHTML);
    const text = stripHtml(html);
    updateNodeData(id, {
      richTextHtml: html,
      text: text || PLACEHOLDER_TEXT,
    });
  };

  const getEditorSelection = () => {
    const editor = editorRef.current;
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return null;

    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return null;
    return { sel, range };
  };

  const getSelectedRange = () => {
    const selection = getEditorSelection();
    if (!selection) return null;
    if (selection.range.collapsed) return null;
    if (!selection.range.toString().trim()) return null;
    return selection.range;
  };

  const syncSavedSelection = () => {
    const range = getSelectedRange();
    if (range) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const hideVisibleSelection = () => {
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  };

  const getSelectionTargetElement = () => {
    const selection = getEditorSelection();
    if (!selection) return null;
    const { range } = selection;
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      return range.startContainer.parentElement;
    }
    return range.startContainer as HTMLElement | null;
  };

  const syncToolbarStateFromElement = (target: HTMLElement, hasTextSelection: boolean) => {
    const editor = editorRef.current;
    const styles = window.getComputedStyle(target);
    setFontFamily(normalizeFontFamily(styles.fontFamily));
    setFontSize(Math.round(parseFloat(styles.fontSize || '24')));
    setFontColor(hasTextSelection ? getExplicitTextColor(target, editor) : '#000000');
    setIsBoldActive(hasTextSelection ? document.queryCommandState('bold') : false);
    setIsItalicActive(hasTextSelection ? document.queryCommandState('italic') : false);
    setIsOrderedListActive(hasTextSelection ? document.queryCommandState('insertOrderedList') : false);
    setIsUnorderedListActive(hasTextSelection ? document.queryCommandState('insertUnorderedList') : false);
  };

  const setToolbarDefaults = () => {
    setFontFamily('Georgia');
    setFontSize(24);
    setFontColor('#000000');
    setIsBoldActive(false);
    setIsItalicActive(false);
    setIsOrderedListActive(false);
    setIsUnorderedListActive(false);
  };

  const syncToolbarStateFromSelection = () => {
    const selectedRange = getSelectedRange();
    if (!selectedRange) return;

    const target = getSelectionTargetElement();
    if (!target) return;

    syncToolbarStateFromElement(target, true);
  };

  const syncListItemStyles = (listRootsOverride?: HTMLElement[]) => {
    const editor = editorRef.current;
    if (!editor) return;

    const listRoots =
      listRootsOverride && listRootsOverride.length > 0
        ? listRootsOverride
        : Array.from(editor.querySelectorAll('ol, ul')) as HTMLElement[];

    const listItems = listRoots.flatMap(
      (listRoot) => Array.from(listRoot.querySelectorAll(':scope > li')) as HTMLElement[]
    );

    for (const li of listItems) {
      const sampleTarget = findStyledTextElement(li);
      const styles = window.getComputedStyle(sampleTarget);
      li.style.fontFamily = styles.fontFamily;
      li.style.fontSize = styles.fontSize;
      li.style.fontWeight = styles.fontWeight;
      li.style.fontStyle = styles.fontStyle;
      li.style.color = styles.color;
      li.style.setProperty('--marker-font-family', styles.fontFamily);
      li.style.setProperty('--marker-font-size', styles.fontSize);
      li.style.setProperty('--marker-font-weight', styles.fontWeight);
      li.style.setProperty('--marker-font-style', styles.fontStyle);
      li.style.setProperty('--marker-color', styles.color);
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = getEditorSelection();
      if (!selection) return;
      savedRangeRef.current = selection.range.cloneRange();
      if (suppressSelectionSyncRef.current) return;
      if (waitingForFreshSelectionRef.current) return;
      if (selection.range.collapsed || !selection.range.toString().trim()) {
        return;
      }
      markExplicitSelection();
      syncToolbarStateFromSelection();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor || !savedRangeRef.current) return;
    editor.focus();
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
  };

  const saveSelection = () => {
    const selection = getEditorSelection();
    if (selection) {
      savedRangeRef.current = selection.range.cloneRange();
    }
  };

  const getCaretSelection = () => {
    const selection = getEditorSelection();
    if (!selection) return null;
    return selection;
  };

  const markExplicitSelection = () => {
    waitingForFreshSelectionRef.current = false;
    hasExplicitSelectionRef.current = true;
  };

  const resetSelectionTracking = () => {
    waitingForFreshSelectionRef.current = false;
    hasExplicitSelectionRef.current = false;
  };

  const enterEditingMode = () => {
    suppressSelectionSyncRef.current = true;
    waitingForFreshSelectionRef.current = true;
    hasExplicitSelectionRef.current = false;
    setIsEditing(true);
    savedRangeRef.current = null;
    setToolbarDefaults();

    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      window.getSelection()?.removeAllRanges();
      placeCaretAtEnd(editor);
      savedRangeRef.current = window.getSelection()?.rangeCount ? window.getSelection()!.getRangeAt(0).cloneRange() : null;
      setToolbarDefaults();
      setTimeout(() => {
        suppressSelectionSyncRef.current = false;
      }, 0);
    });
  };

  const handleEditorPointerDown = () => {
    if (!isEditing) return;
    if (waitingForFreshSelectionRef.current) {
      waitingForFreshSelectionRef.current = false;
    }
  };

  const focusEditorCaret = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
  };

  const runAfterListMutation = () => {
    const editor = editorRef.current;
    const listRoots = editor ? (Array.from(editor.querySelectorAll('ol, ul')) as HTMLElement[]) : [];

    requestAnimationFrame(() => {
      syncListItemStyles(listRoots);
      requestAnimationFrame(() => {
        syncListItemStyles(listRoots);
        persistEditorContent();
        if (getSelectedRange()) {
          syncToolbarStateFromSelection();
          hideVisibleSelection();
          return;
        }
        setIsOrderedListActive(document.queryCommandState('insertOrderedList'));
        setIsUnorderedListActive(document.queryCommandState('insertUnorderedList'));
        focusEditorCaret();
      });
    });
  };

  const createStyledTypingSpan = (styleUpdater: (element: HTMLSpanElement) => void) => {
    restoreSelection();
    const selection = getCaretSelection();
    if (!selection) return false;

    const { range, sel } = selection;
    if (!range.collapsed) return false;

    const span = document.createElement('span');
    styleUpdater(span);
    span.appendChild(document.createTextNode(ZERO_WIDTH_SPACE));
    range.insertNode(span);

    const nextRange = document.createRange();
    nextRange.setStart(span.firstChild as Text, 1);
    nextRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(nextRange);
    savedRangeRef.current = nextRange.cloneRange();
    focusEditorCaret();
    return true;
  };

  const toggleList = (type: 'ordered' | 'unordered') => {
    const command = type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList';
    restoreSelection();
    const hasRangeSelection = !!getSelectedRange();

    if (!hasRangeSelection) {
      return;
    }

    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, undefined);
    runAfterListMutation();
  };

  const applySelectionCommand = (command: string, value?: string) => {
    restoreSelection();
    const selection = getCaretSelection();
    if (!selection) return;
    const hasRangeSelection = !!getSelectedRange();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    saveSelection();
    if (hasRangeSelection) {
      syncToolbarStateFromSelection();
      hideVisibleSelection();
    } else {
      if (command === 'foreColor' && value) setFontColor(value);
      if (command === 'bold') setIsBoldActive(document.queryCommandState('bold'));
      if (command === 'italic') setIsItalicActive(document.queryCommandState('italic'));
      if (command === 'insertOrderedList') setIsOrderedListActive(document.queryCommandState('insertOrderedList'));
      if (command === 'insertUnorderedList') setIsUnorderedListActive(document.queryCommandState('insertUnorderedList'));
      focusEditorCaret();
    }
  };

  const applyFontFamily = (family: string) => {
    restoreSelection();
    if (!getSelectedRange()) {
      const created = createStyledTypingSpan((span) => {
        span.style.fontFamily = family;
      });
      if (created) {
        setFontFamily(family);
      }
      return;
    }
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('fontName', false, family);
    syncSavedSelection();
    syncListItemStyles();
    persistEditorContent();
    syncToolbarStateFromSelection();
    hideVisibleSelection();
  };

  const applyFontSize = (size: number) => {
    const editor = editorRef.current;
    if (!editor) return;

    restoreSelection();
    const selection = getEditorSelection();
    if (!selection) return;
    if (!getSelectedRange()) {
      const created = createStyledTypingSpan((span) => {
        span.style.fontSize = `${size}px`;
      });
      if (created) {
        setFontSize(size);
      }
      return;
    }

    const span = document.createElement('span');
    span.style.fontSize = `${size}px`;

    try {
      selection.range.surroundContents(span);
    } catch {
      span.appendChild(selection.range.extractContents());
      selection.range.insertNode(span);
    }

    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.sel.removeAllRanges();
    selection.sel.addRange(newRange);
    savedRangeRef.current = newRange.cloneRange();
    syncListItemStyles();
    persistEditorContent();
    syncToolbarStateFromSelection();
    hideVisibleSelection();
  };

  const insertDefaultParagraph = () => {
    const editor = editorRef.current;
    const selection = getEditorSelection();
    if (!editor || !selection) return;

    const paragraph = document.createElement('p');
    paragraph.style.marginBottom = '0.75rem';

    const span = document.createElement('span');
    span.style.fontFamily = 'Georgia';
    span.style.fontSize = '24px';
    span.style.color = '#000000';
    span.style.fontWeight = '400';
    span.style.fontStyle = 'normal';
    span.appendChild(document.createTextNode(ZERO_WIDTH_SPACE));
    paragraph.appendChild(span);

    selection.range.deleteContents();
    selection.range.insertNode(paragraph);

    const nextRange = document.createRange();
    nextRange.setStart(span.firstChild as Text, 1);
    nextRange.collapse(true);
    selection.sel.removeAllRanges();
    selection.sel.addRange(nextRange);
    savedRangeRef.current = nextRange.cloneRange();
    setToolbarDefaults();
    focusEditorCaret();
  };

  const insertHr = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    const selection = getEditorSelection();
    if (selection) {
      selection.range.collapse(false);
      const hr = document.createElement('hr');
      selection.range.insertNode(hr);
      const p = document.createElement('p');
      p.appendChild(document.createElement('br'));
      hr.after(p);
      const newRange = document.createRange();
      newRange.setStart(p, 0);
      newRange.collapse(true);
      selection.sel.removeAllRanges();
      selection.sel.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();
    } else {
      document.execCommand('insertHorizontalRule', false, undefined);
    }

    persistEditorContent();
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const nextFocus = e.relatedTarget as HTMLElement | null;
    if (containerRef.current?.contains(nextFocus)) return;
    persistEditorContent();
    resetSelectionTracking();
    setIsEditing(false);
  };

  const handleAskAi = async () => {
    if (!prompt.trim()) return;
    if (!aiSettings.llmApiKey) {
      setError('请先在 AI Engine Settings 中配置 API Key');
      return;
    }

    setIsGenerating(true);
    setError('');
    try {
      const { callLLMText } = await import('@/lib/llm');
      const result = await callLLMText(
        'You are a writing assistant. Reply with polished user-facing content in Chinese. Return plain text only.',
        prompt,
        aiSettings
      );

      const nextText = result.trim();
      const nextHtml = plainTextToHtml(nextText);
      if (editorRef.current) {
        editorRef.current.innerHTML = nextHtml;
      }
      updateNodeData(id, { text: nextText, richTextHtml: nextHtml });
      setToolbarDefaults();
      setPrompt('');
      setIsChatOpen(false);
    } catch (err: any) {
      setError(err.message || 'AI 对话失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const toolbarVisible = selected && selectedNodeCount === 1;
  const currentModel = aiSettings.llmModel || (aiSettings.llmProvider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini');
  const isTransparent = (data as any).bgTransparent;

  return (
    <>
      {customFonts.length > 0 ? (
        <style>
          {customFonts
            .map(
              (font) => `
            @font-face {
              font-family: '${font.name}';
              src: url('${font.url}');
            }
          `
            )
            .join('\n')}
        </style>
      ) : null}

      <NodeResizer
        color="#6366f1"
        isVisible={selected}
        minWidth={120}
        minHeight={80}
        handleStyle={{ width: 10, height: 10, borderRadius: 5 }}
        onResize={(_, params) => {
          if (containerRef.current) {
            containerRef.current.style.width = `${params.width}px`;
            containerRef.current.style.height = `${params.height}px`;
          }
        }}
        onResizeEnd={(_, params) => updateNodeSize(id, params.width, params.height)}
      />

      <div
        ref={containerRef}
        onDoubleClick={(e) => {
          e.stopPropagation();
          enterEditingMode();
        }}
        className={`group relative h-full w-full min-w-[120px] rounded-2xl p-1 text-neutral-800 transition-[box-shadow,background-color,border-color,ring-color] duration-100 will-change-transform dark:text-neutral-100 ${
          isTransparent
            ? `border border-dashed bg-transparent ${selected ? 'border-indigo-400/50 bg-white/5 dark:bg-neutral-900/50' : 'border-transparent hover:border-black/5 dark:hover:border-white/10'}`
            : `border border-transparent bg-white shadow-sm ${selected ? 'border-indigo-400 shadow-lg ring-2 ring-indigo-500/20' : 'hover:shadow-md hover:border-indigo-400/60 ring-1 ring-black/5 dark:ring-white/10'} dark:bg-neutral-900`
        }`}
      >
        {toolbarVisible ? (
          <div
            onMouseDown={saveSelection}
            className="nodrag nopan absolute bottom-[calc(100%+16px)] left-1/2 z-[50] flex w-max -translate-x-1/2 items-center gap-1.5 rounded-xl border border-black/10 bg-white/95 px-1.5 py-1 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-800/95"
          >
            <button
              type="button"
              onClick={() => setIsChatOpen((value) => !value)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isChatOpen ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-neutral-600 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              AI Chat
            </button>

            <div className="mx-0.5 h-5 w-px bg-black/10 dark:bg-white/10" />

            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onClick={() => setIsFontFamilyDropdownOpen((value) => !value)}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10"
              >
                <span className="max-w-[80px] truncate">{fontFamily}</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-neutral-400" />
              </button>
              {isFontFamilyDropdownOpen ? (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute bottom-full left-0 z-50 mb-1 max-h-48 w-36 overflow-y-auto rounded-lg border border-black/10 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#161616]"
                >
                  {[...FONT_FAMILIES, ...customFonts.map((font) => font.name)].map((family) => (
                    <button
                      key={family}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFontFamily(family);
                        applyFontFamily(family);
                        setIsFontFamilyDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10 ${
                        family === fontFamily ? 'font-medium text-indigo-600 dark:text-indigo-400' : 'text-black dark:text-white'
                      }`}
                      style={{ fontFamily: family }}
                    >
                      {family}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative flex items-center">
              <input
                type="number"
                value={fontSize}
                onMouseDown={saveSelection}
                onChange={(e) => {
                  const size = Number(e.target.value);
                  setFontSize(size);
                  if (size > 0) applyFontSize(size);
                }}
                className="w-14 appearance-none rounded-lg bg-transparent px-2 py-1.5 text-center text-xs text-neutral-600 outline-none hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsFontSizeDropdownOpen((value) => !value)}
                className="flex h-5 w-4 items-center justify-center rounded text-neutral-400 hover:bg-black/5 hover:text-neutral-600 dark:hover:bg-white/10 dark:hover:text-neutral-300"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
              {isFontSizeDropdownOpen ? (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute bottom-full left-0 z-50 mb-1 max-h-48 w-16 overflow-y-auto rounded-lg border border-black/10 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#161616]"
                >
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFontSize(size);
                        applyFontSize(size);
                        setIsFontSizeDropdownOpen(false);
                      }}
                      className="w-full px-2 py-1.5 text-center text-xs text-black hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <label
              className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
              onMouseDown={saveSelection}
            >
              <div className="pointer-events-none h-4 w-4 rounded-full border border-black/20 shadow-sm dark:border-white/20" style={{ backgroundColor: fontColor }} />
              <input
                type="color"
                value={fontColor}
                onChange={(e) => {
                  setFontColor(e.target.value);
                  applySelectionCommand('foreColor', e.target.value);
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>

            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applySelectionCommand('bold')} className={`rounded-lg p-1.5 transition-colors ${isBoldActive ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-neutral-600 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white'}`}>
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applySelectionCommand('italic')} className={`rounded-lg p-1.5 transition-colors ${isItalicActive ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-neutral-600 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white'}`}>
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertHr} className="rounded-lg p-1.5 text-neutral-600 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white">
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => toggleList('ordered')} className={`rounded-lg p-1.5 transition-colors ${isOrderedListActive ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-neutral-600 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white'}`}>
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => toggleList('unordered')} className={`rounded-lg p-1.5 transition-colors ${isUnorderedListActive ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-neutral-600 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white'}`}>
              <List className="h-3.5 w-3.5" />
            </button>

            <div className="mx-0.5 h-5 w-px bg-black/10 dark:bg-white/10" />

            <button type="button" onClick={() => bringToFront?.(id)} className="rounded-lg p-1.5 text-neutral-500 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white">
              <ArrowUpToLine className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => updateNodeData(id, { bgTransparent: !isTransparent } as any)}
              className={`rounded-lg p-1.5 transition-colors ${
                isTransparent ? 'bg-black/5 text-black dark:bg-white/10 dark:text-white' : 'text-neutral-500 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {isTransparent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button type="button" onClick={deleteSelectedNodes} className="rounded-lg p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-red-950/30 dark:hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {toolbarVisible && isChatOpen ? (
          <div className="nodrag nopan absolute top-[calc(100%+16px)] left-1/2 z-[50] w-[min(480px,80vw)] -translate-x-1/2 cursor-default rounded-2xl border border-black/10 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-neutral-800/95">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-neutral-700 dark:text-neutral-200">
                <Bot className="h-4 w-4 text-indigo-500" />
                AI Chat
              </div>
              <div className="rounded-md border border-black/10 bg-black/5 px-2 py-0.5 text-[10px] text-neutral-500 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
                {currentModel}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述任何你想要生成的内容"
                className="min-h-[100px] w-full resize-none bg-transparent px-3 py-3 text-[13px] text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
              />
              <div className="flex items-center justify-between border-t border-black/10 bg-black/5 px-3 py-2 dark:border-white/10 dark:bg-black/20">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <Bot className="h-3.5 w-3.5" />
                  <span>智能续写与重构</span>
                </div>
                <button
                  type="button"
                  onClick={handleAskAi}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {error ? <div className="mt-3 text-xs text-red-500">{error}</div> : null}
          </div>
        ) : null}

        <Handle type="target" position={Position.Left} className={`!h-3 !w-3 !bg-gray-200 !border-2 !border-white transition-opacity group-hover:transition-colors group-hover:!bg-indigo-500 dark:!border-neutral-900 ${isTransparent && !selected ? 'opacity-0' : ''}`} />

        {!isTransparent ? (
          <div className="mb-2 flex items-center gap-1.5 px-3 pt-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <Type className="h-3.5 w-3.5" />
            <span>Text Node</span>
          </div>
        ) : null}

        <div
          ref={editorRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={handleBlur}
          onMouseDown={handleEditorPointerDown}
          className={`text-node-editor h-full w-full overflow-auto bg-transparent px-3 pb-3 text-[24px] font-medium leading-tight outline-none [&_hr]:my-3 [&_hr]:border-black/10 dark:[&_hr]:border-white/10 [&_li]:ml-5 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-4 ${
            isTransparent ? 'pt-3' : 'h-[calc(100%-2.25rem)] pt-0'
          } ${isEditing ? 'nodrag cursor-text' : 'cursor-pointer'}`}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              editorRef.current?.blur();
              return;
            }

            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              insertDefaultParagraph();
            }
          }}
          onMouseUp={() => {
            if (suppressSelectionSyncRef.current) return;
            const selectedRange = getSelectedRange();
            if (selectedRange) {
              markExplicitSelection();
              syncToolbarStateFromSelection();
              return;
            }
            if (!hasExplicitSelectionRef.current) {
              setToolbarDefaults();
            }
          }}
          onKeyUp={() => {
            if (suppressSelectionSyncRef.current) return;
            if (getSelectedRange()) {
              markExplicitSelection();
              syncToolbarStateFromSelection();
              return;
            }
            if (!hasExplicitSelectionRef.current) {
              setToolbarDefaults();
            }
          }}
        />

        <Handle type="source" position={Position.Right} className={`!h-3 !w-3 !bg-gray-200 !border-2 !border-white transition-opacity group-hover:transition-colors group-hover:!bg-indigo-500 dark:!border-neutral-900 ${isTransparent && !selected ? 'opacity-0' : ''}`} />
      </div>
    </>
  );
});
