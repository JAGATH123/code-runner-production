import { domToPng } from 'modern-screenshot';

/**
 * Downloads a cheatsheet as PNG using modern-screenshot
 * Client-side rendering ensures 100% exact visual output with zero server load
 */
export async function downloadCheatsheet(sessionId: number): Promise<void> {
  try {
    console.log(`📥 Downloading cheatsheet for session ${sessionId}...`);

    // Get the cheatsheet element
    const element = document.getElementById('cheat-sheet-printable');

    if (!element) {
      throw new Error('Cheatsheet element not found');
    }

    console.log('📸 Capturing screenshot...');

    // Capture the element as PNG with high quality
    const dataUrl = await domToPng(element, {
      quality: 1.0,
      scale: 2, // 2x for high resolution
      backgroundColor: '#000000', // Black background for transparency
    });

    // Convert data URL to blob and download
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cheatsheet-session-${sessionId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ Cheatsheet downloaded successfully');
  } catch (error: any) {
    console.error('❌ Download failed:', error);
    throw error;
  }
}
