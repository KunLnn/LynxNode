const fs = require('fs');
const path = require('path');

const categories = [
  { id: '00_featured', name: '精选', color: '#6366f1' },
  { id: 'modern', name: '现代', color: '#3b82f6' },
  { id: 'minimal', name: '简约', color: '#f3f4f6' },
  { id: 'tech', name: '科技', color: '#06b6d4' },
  { id: 'cartoon', name: '卡通', color: '#f59e0b' },
  { id: 'retro', name: '复古', color: '#d97706' },
  { id: 'illustration', name: '插画', color: '#ec4899' },
  { id: 'handdrawn', name: '手绘', color: '#8b5cf6' },
  { id: 'fashion', name: '时尚', color: '#ef4444' },
  { id: 'creative', name: '创意', color: '#10b981' },
  { id: 'festival', name: '节日', color: '#f43f5e' },
  { id: 'fresh', name: '清新', color: '#84cc16' },
  { id: 'chinese', name: '中式', color: '#b91c1c' },
];

const publicDir = path.join(__dirname, 'public', 'ppt-templates');

// Generate placeholders
categories.forEach(cat => {
  const catPath = path.join(publicDir, cat.id);
  if (!fs.existsSync(catPath)) {
    fs.mkdirSync(catPath, { recursive: true });
  }

  for (let i = 1; i <= 24; i++) { // Generate 24 placeholders per category to test pagination strongly
    const num = i.toString().padStart(2, '0');
    
    // Create an empty .pptx file
    fs.writeFileSync(path.join(catPath, `template_${num}.pptx`), 'DUMMY PPTX CONTENT');
    
    // Create a dummy image (we'll just use a tiny 1x1 base64 GIF or simple text if we used canvas, but let's just create an empty file with SVG extension for ease of browser rendering, or a generic data URI wrapper)
    // Actually, writing an SVG file is perfect for placeholders!
    const svgContent = `
      <svg width="400" height="225" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${cat.color}" opacity="0.1" />
        <rect width="100%" height="100%" fill="none" stroke="${cat.color}" stroke-width="4" />
        <text x="50%" y="45%" font-family="sans-serif" font-size="24" fill="${cat.color}" text-anchor="middle" dominant-baseline="middle">
          ${cat.name} 模板 ${num}
        </text>
        <text x="50%" y="65%" font-family="sans-serif" font-size="14" fill="#666" text-anchor="middle" dominant-baseline="middle">
          1920x1080
        </text>
      </svg>
    `;
    fs.writeFileSync(path.join(catPath, `template_${num}.svg`), svgContent.trim());
  }
});

console.log('Successfully generated SVGs and dummy PPTX files.');
