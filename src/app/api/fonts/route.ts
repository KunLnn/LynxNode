import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const fontsDir = path.join(process.cwd(), 'public', 'fonts');
    if (!fs.existsSync(fontsDir)) {
      return NextResponse.json({ fonts: [] });
    }

    const files = fs.readdirSync(fontsDir);
    const fonts = files
      .filter(file => file.match(/\.(ttf|otf|woff|woff2)$/i))
      .map(file => ({
        name: file.replace(/\.[^/.]+$/, ""), // e.g., "MyCustomFont.ttf" -> "MyCustomFont"
        url: `/fonts/${file}`,
      }));

    return NextResponse.json({ fonts });
  } catch (error) {
    console.error('Error reading fonts directory:', error);
    return NextResponse.json({ fonts: [] }, { status: 500 });
  }
}
