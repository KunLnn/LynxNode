"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Image as ImageIcon, Sparkles, Type, Hand, MousePointer2, Presentation, Trash2, Maximize2, Eraser, Wand2, Settings, Eye, EyeOff } from 'lucide-react';
import { useReactFlow } from 'reactflow';
import useStore from '@/store/useStore';
import AISettingsModal from '@/components/ui/AISettingsModal';

const CanvasDock = React.memo(() => {
    const { screenToFlowPosition } = useReactFlow();
    const addNode = useStore((s) => s.addNode);
    const canvasMode = useStore((s) => s.canvasMode);
    const setCanvasMode = useStore((s) => s.setCanvasMode);
    const clearAll = useStore((s) => s.clearAll);
    const globalEdgeStyle = useStore((s) => s.globalEdgeStyle);
    const toggleEdgesVisible = useStore((s) => s.toggleEdgesVisible);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const aiMenuRef = useRef<HTMLDivElement>(null);
    const settingsMenuRef = useRef<HTMLDivElement>(null);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsAddMenuOpen(false);
            }
            if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
                setIsAiMenuOpen(false);
            }
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setIsSettingsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Always place the new node at the exact center of the current viewport
    const getSmartPosition = (width: number, height: number) => {
        const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        return { x: center.x - width / 2, y: center.y - height / 2 };
    };

    const handleAddNode = (type: string, data: Record<string, unknown> = {}) => {
        const width = type === 'textNode' ? 280 : type === 'pptNode' ? 480 : 320;
        const height = type === 'textNode' ? 180 : type === 'pptNode' ? 270 : 240;

        const position = getSmartPosition(width, height);

        const newNode = {
            id: `node-${Date.now()}`,
            type,
            position,
            data: { ...data },
            style: { width, height },
            selected: false,
        };

        addNode(newNode);
        setIsAddMenuOpen(false);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const naturalWidth = img.naturalWidth;
                    const naturalHeight = img.naturalHeight;
                    const width = 320;
                    const height = (width / naturalWidth) * naturalHeight;
                    const position = getSmartPosition(width, height);

                    addNode({
                        id: `node-${Date.now()}`,
                        type: 'imageNode',
                        position,
                        data: { label: file.name, imageUrl: reader.result as string },
                        style: { width, height },
                        selected: false,
                    });
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
        setIsAddMenuOpen(false);
        if (event.target) event.target.value = '';
    };

    return (
        <>
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 pointer-events-auto"
        >
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1.5 shadow-2xl transition-all hover:scale-[1.02] dark:border-neutral-800 dark:bg-neutral-900">
                
                {/* 1. INTERACTION MODES */}
                <div className="flex items-center rounded-full border border-neutral-200 bg-neutral-100 p-1 dark:border-neutral-800 dark:bg-neutral-800">
                    <button
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${canvasMode === 'PAN' ? 'bg-black text-white shadow-sm dark:bg-white dark:text-black' : 'text-neutral-400 hover:bg-neutral-200 hover:text-black dark:hover:bg-neutral-700 dark:hover:text-white'}`}
                        onClick={() => setCanvasMode('PAN')}
                        title="Pan (Hand)"
                    >
                        <Hand className="h-4 w-4" />
                    </button>
                    <button
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${canvasMode === 'SELECT' ? 'bg-black text-white shadow-sm dark:bg-white dark:text-black' : 'text-neutral-400 hover:bg-neutral-200 hover:text-black dark:hover:bg-neutral-700 dark:hover:text-white'}`}
                        onClick={() => setCanvasMode('SELECT')}
                        title="Select (Box)"
                    >
                        <MousePointer2 className="h-4 w-4" />
                    </button>
                </div>

                <div className="mx-1 h-8 w-px bg-neutral-200 dark:bg-neutral-800" />

                {/* 2. ADD MENU */}
                <div className="relative" ref={menuRef}>
                    <button
                        className="flex h-10 items-center justify-center gap-2 rounded-full bg-black px-4 font-medium text-white shadow-lg shadow-black/20 transition-all hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                    >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm">Add Node</span>
                    </button>

                    <AnimatePresence>
                        {isAddMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-full left-1/2 mb-4 w-60 -translate-x-1/2 rounded-xl border border-neutral-200 bg-white p-1.5 object-bottom shadow-2xl ring-1 ring-black/5 dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                <div className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Creation</div>
                                
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                        <ImageIcon className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-black dark:text-white">Image Node</span>
                                        <span className="text-[10px] text-neutral-500">Upload a local image</span>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => handleAddNode('textNode', { text: 'New Text Block' })}
                                    className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                        <Type className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-black dark:text-white">Text Block</span>
                                        <span className="text-[10px] text-neutral-500">Add text or prompt</span>
                                    </div>
                                </div>

                                <div className="my-1 h-px w-full bg-neutral-100 dark:bg-neutral-800" />
                                <div className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-neutral-500">Presentation</div>

                                <div 
                                    onClick={() => handleAddNode('pptNode')}
                                    className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
                                        <Presentation className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-black dark:text-white">PPT View</span>
                                        <span className="text-[10px] text-neutral-500">16:9 presentation board</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 3. AI TOOLS (Visual Parity) */}
                <div className="relative" ref={aiMenuRef}>
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-all hover:bg-neutral-100 hover:text-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white"
                        title="AI Tools"
                        onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                    >
                        <Sparkles className="h-5 w-5" />
                    </button>
                    
                    <AnimatePresence>
                        {isAiMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-full left-1/2 mb-4 w-52 -translate-x-1/2 rounded-xl border border-neutral-200 bg-white p-1 object-bottom shadow-2xl ring-1 ring-black/5 dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                <div className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    <Eraser className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                                    <span className="text-sm font-medium text-black dark:text-white">Remove Background</span>
                                </div>
                                <div className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    <Maximize2 className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                                    <span className="text-sm font-medium text-black dark:text-white">Upscale Image</span>
                                </div>
                                <div className="my-1 h-px w-full bg-neutral-100 dark:bg-neutral-800" />
                                <div className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    <Wand2 className="h-4 w-4 text-neutral-900 dark:text-neutral-300" />
                                    <span className="text-sm font-medium text-black dark:text-white">Generative Fill</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mx-1 h-8 w-px bg-neutral-200 dark:bg-neutral-800" />

                {/* 4. CLEAR SYSTEM & SETTINGS */}
                <div className="flex items-center gap-1">
                    {/* Show/Hide all edges — always accessible */}
                    <button
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent transition-all ${
                            globalEdgeStyle.edgesVisible
                              ? 'text-neutral-400 hover:bg-neutral-100 hover:text-black dark:hover:bg-neutral-800 dark:hover:text-white'
                              : 'text-amber-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30'
                        }`}
                        title={globalEdgeStyle.edgesVisible ? 'Hide connections' : 'Show connections'}
                        onClick={toggleEdgesVisible}
                    >
                        {globalEdgeStyle.edgesVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                    {/* Settings dropdown */}
                    <div className="relative" ref={settingsMenuRef}>
                        <button
                            className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-neutral-400 transition-all hover:bg-neutral-100 hover:text-black dark:hover:bg-neutral-800 dark:hover:text-white"
                            title="Settings"
                            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                        <AnimatePresence>
                            {isSettingsMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full right-0 mb-4 w-52 rounded-xl border border-neutral-200 bg-white p-1 shadow-2xl ring-1 ring-black/5 dark:border-neutral-800 dark:bg-neutral-900"
                                >
                                    <div
                                        className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                        onClick={() => {
                                            setIsSettingsMenuOpen(false);
                                            setIsSettingsOpen(true);
                                        }}
                                    >
                                        <Settings className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                                        <span className="text-sm font-medium text-black dark:text-white">AI Engine Settings</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-red-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-500"
                        title="Clear All Canvas"
                        onClick={() => {
                            if (confirm('Are you sure you want to delete all nodes?')) {
                                clearAll();
                            }
                        }}
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>

            </div>

            {/* Hidden Input for Images */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*"
            />
        </motion.div>

        <AISettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </>
    );
});

export default CanvasDock;
