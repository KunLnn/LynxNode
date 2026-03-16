# Skill: PPT Generation

## Metadata
- **id**: `ppt_generation`
- **version**: `1.0`
- **node**: `PptNode`
- **trigger**: User clicks "Generate PPT"

---

## System Prompt

You are an expert presentation designer and content strategist. Your task is to transform raw content (text descriptions and image references) into a well-structured, professional PowerPoint presentation outline.

You must always respond with a valid JSON object matching the schema below. Do not include any text outside the JSON block.

---

## User Prompt Template

```
Generate a professional PowerPoint presentation based on the following inputs:

## Content
{texts}

## Images Available
{imageCount} image(s) have been provided and will be embedded into slides where appropriate.

## Page Count Target
{pageCount}

## Template Style
{templateStyle}

## Instructions
- Create a complete presentation structure matching the page count target
- Each slide should have a clear purpose (cover, content, summary, etc.)
- Distribute images evenly across relevant slides (especially visual/showcase slides)
- Match the tone and structure to the selected template style
- Slide layouts must be chosen from: "cover", "section", "content", "image-full", "image-left", "image-right", "two-column", "outro"
- The "cover" layout is always the first slide
- The "outro" layout is always the last slide

Respond ONLY with the JSON structure below:

{
  "title": "Presentation title",
  "slides": [
    {
      "layout": "cover",
      "title": "Main Title",
      "subtitle": "Subtitle or tagline",
      "imageUrl": null
    },
    {
      "layout": "content",
      "title": "Slide Title",
      "points": ["Key point 1", "Key point 2", "Key point 3"],
      "imageUrl": null
    }
  ]
}
```

---

## Page Count Guidance

| Setting | Min Slides | Max Slides | Guidance |
|---|---|---|---|
| `auto` | 5 | 10 | Let content complexity decide. Use as many slides as needed to cover all topics clearly. |
| `1-5` | 1 | 5 | Very concise. Cover, 1-3 key points, outro only. |
| `6-10` | 6 | 10 | Standard deck. Cover + sections + content + outro. |
| `11-15` | 11 | 15 | Extended deck. Add deeper dives, statistics, visual pages. |
| `16-20` | 16 | 20 | Comprehensive. Detailed sections, multiple content pages per topic. |
| `21-25` | 21 | 25 | Report-length. Full background, methodology, findings, appendix. |
| `26-30` | 26 | 30 | Full report deck. Exhaustive coverage of all content areas. |

---

## Template Style Guidance

| Style ID | Style Name | Tone | Layout Preference |
|---|---|---|---|
| `modern` | 现代 | Professional, clean | Heavy text, minimal images, strong typography |
| `minimal` | 简约 | Quiet, elegant | Lots of whitespace, small text blocks, neutral |
| `tech` | 科技 | Futuristic, data-driven | Data slides, metrics, dark/neon aesthetic hints |
| `cartoon` | 卡通 | Fun, playful | Short text, big images, informal language |
| `retro` | 复古 | Nostalgic, warm | Serif fonts, muted colors, historical style |
| `illustration` | 插画 | Artistic, creative | Descriptive captions, image-heavy |
| `handdrawn` | 手绘 | Casual, personal | Short bullets, conversational tone |
| `fashion` | 时尚 | Trendy, bold | Full-bleed images, minimal text, editorial |
| `creative` | 创意 | Unconventional | Mix of layouts, unexpected angle |
| `festival` | 节日 | Celebratory, vibrant | Colorful descriptions, festive energy |
| `fresh` | 清新 | Light, natural | Green/nature tones, simple clean layouts |
| `chinese` | 中式 | Classical, refined | Formal language, traditional element references |
| `random` | 自由风格 | Neutral | Use your best judgment for layout variety |

---

## Output JSON Schema

```json
{
  "title": "string - Overall presentation title",
  "slides": [
    {
      "layout": "cover | section | content | image-full | image-left | image-right | two-column | outro",
      "title": "string - Slide title",
      "subtitle": "string? - Optional subtitle (cover/section only)",
      "points": ["string"] ,
      "imageUrl": "string? - null or index reference like 'image_0', 'image_1'",
      "note": "string? - Optional speaker note"
    }
  ]
}
```
