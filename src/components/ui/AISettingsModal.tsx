import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Image as ImageIcon, Key, Link as LinkIcon, ChevronDown, Sparkles, Scissors, Info } from 'lucide-react';
import useStore from '@/store/useStore';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LLM_PROVIDERS = [
  { id: 'openai', label: 'OpenAI', placeholder: 'gpt-4o-mini', urlPlaceholder: 'https://api.openai.com/v1' },
  { id: 'gemini', label: 'Google Gemini', placeholder: 'gemini-1.5-flash', urlPlaceholder: '(Managed by Google)' },
  { id: 'custom', label: '自定义 / Custom', placeholder: 'your-model-name', urlPlaceholder: 'https://your-api.com/v1' },
] as const;

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
      <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{title}</h3>
    </div>
    <div className="space-y-3 pl-1">
      {children}
    </div>
  </div>
);

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5">
      {label}
      {hint && (
        <span className="text-neutral-400 dark:text-neutral-500 font-normal normal-case group relative cursor-help">
          <Info className="w-3 h-3" />
          <span className="absolute bottom-full left-0 mb-1.5 w-52 bg-neutral-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none normal-case shadow-lg z-50">
            {hint}
          </span>
        </span>
      )}
    </label>
    {children}
  </div>
);

const inputClass = "w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-sm outline-none transition-colors focus:border-neutral-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800/50 dark:focus:border-neutral-500 dark:focus:bg-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400";

const AISettingsModal = ({ isOpen, onClose }: AISettingsModalProps) => {
  const aiSettings = useStore((state) => state.aiSettings);
  const updateAISettings = useStore((state) => state.updateAISettings);

  const currentProvider = LLM_PROVIDERS.find(p => p.id === aiSettings.llmProvider) || LLM_PROVIDERS[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10 flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-white leading-tight">AI Engine Settings</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">配置大模型与图像 API</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-6 space-y-7 overflow-y-auto flex-1 custom-scrollbar">

              {/* LLM Section */}
              <Section icon={Bot} title="语言模型 (LLM)">
                <Field label="服务商 Provider">
                  <div className="relative">
                    <select
                      value={aiSettings.llmProvider}
                      onChange={(e) => updateAISettings({ llmProvider: e.target.value as any })}
                      className={`${inputClass} appearance-none pr-9 cursor-pointer`}
                    >
                      {LLM_PROVIDERS.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  </div>
                </Field>

                <Field label="API Key" hint="Your key is stored locally in your browser and never sent to our servers.">
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      placeholder="sk-... or AIza..."
                      value={aiSettings.llmApiKey}
                      onChange={(e) => updateAISettings({ llmApiKey: e.target.value })}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>

                {aiSettings.llmProvider !== 'gemini' && (
                  <Field label="Base URL" hint="Leave empty to use the default endpoint for this provider.">
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        placeholder={currentProvider.urlPlaceholder}
                        value={aiSettings.llmBaseUrl || ''}
                        onChange={(e) => updateAISettings({ llmBaseUrl: e.target.value })}
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </Field>
                )}

                <Field label="模型名称 Model" hint="Specific model to use, e.g. gpt-4o-mini or gemini-1.5-flash.">
                  <input
                    type="text"
                    placeholder={currentProvider.placeholder}
                    value={aiSettings.llmModel || ''}
                    onChange={(e) => updateAISettings({ llmModel: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </Section>

              {/* Image Processing Section */}
              <Section icon={ImageIcon} title="图像处理 Image APIs">
                <Field
                  label="超分辨率 Upscale API Key (Replicate)"
                  hint="Used for the Upscale button on Image nodes. Get your key at replicate.com"
                >
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      placeholder="r8_..."
                      value={aiSettings.imageApiKey}
                      onChange={(e) => updateAISettings({ imageApiKey: e.target.value })}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>

                <Field
                  label="去背景 Remove BG API Key (PhotoRoom)"
                  hint="Used for the Remove BG button on Image nodes. Get your key at photoroom.com"
                >
                  <div className="relative">
                    <Scissors className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      placeholder="Your PhotoRoom API key"
                      value={aiSettings.removeBgApiKey}
                      onChange={(e) => updateAISettings({ removeBgApiKey: e.target.value })}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </Field>
              </Section>

              {/* Info note */}
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3.5 flex gap-3 text-blue-700 dark:text-blue-400">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  所有 API Key 安全地存储在你浏览器的本地存储中，不会上传至任何服务器。
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-950/50 shrink-0">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-neutral-900 py-2.5 text-sm font-medium text-white transition-all hover:bg-black hover:shadow-lg dark:bg-white dark:text-black dark:hover:bg-neutral-200 active:scale-[0.98]"
              >
                保存 Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AISettingsModal;
