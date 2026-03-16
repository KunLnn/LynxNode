# LynxNode

LynxNode is a node-based infinite canvas built with Next.js, React Flow, and Zustand. It is designed for visual thinking and presentation building: you can place text blocks, image nodes, and PPT nodes on a freeform canvas, connect them together, and generate slide content from linked materials.

## Features

- Infinite canvas workflow powered by React Flow
- Text nodes with rich-text editing, formatting controls, and AI-assisted writing
- Image nodes with upload, resize, fullscreen preview, upscaling, and background removal
- PPT nodes that collect linked text and images and turn them into presentation slides
- Local persistence through IndexedDB so your canvas state survives refreshes
- Configurable AI providers, including OpenAI-compatible endpoints and Gemini

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- React Flow
- Zustand
- Framer Motion
- PptxGenJS

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### Canvas Nodes

- `Text Node`: write notes, prompts, outlines, and polished content
- `Image Node`: upload local images and apply image-processing actions
- `PPT Node`: combine connected text and image nodes into slide previews and generated presentation content

### AI Settings

The app includes an `AI Engine Settings` panel for configuring:

- LLM provider and model
- OpenAI-compatible base URL
- LLM API key
- Replicate API key for image upscale
- Remove BG API key for background removal

These values are stored locally in the browser through the app state persistence layer.

## Project Structure

```text
src/
  app/                 Next.js app router entry
  components/
    canvas/            Canvas bootstrap and persistence
    nodes/             Text, image, group, and PPT node components
    ui/                Floating controls, viewers, toolbars, and modals
  lib/                 LLM and image-processing helpers
  store/               Global canvas state with Zustand
public/
  ppt-templates/       Template category folders
  fonts/               Optional local font assets
```

## Notes

- `public/ppt-templates` and `public/fonts` currently keep directory structure only. Add your own assets there if your workflow depends on local templates or custom fonts.
- Some AI-powered actions require third-party API keys before they can run successfully.
- Canvas data is persisted locally, not in a backend database.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
