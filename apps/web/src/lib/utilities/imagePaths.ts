/**
 * Utility functions for getting organized image paths
 */

export interface ImagePathConfig {
  ageGroup: '11-14' | '15-18';
  levelNumber?: number;
  sessionId?: number | string;
  imageType: 'flashcards' | 'cheat-sheet' | 'backdrop';
}

/**
 * Get the base path for session images
 * @param ageGroup - Age group (11-14 or 15-18)
 * @param levelNumber - Level number (1-4) - optional for backdrop
 * @param sessionId - Session ID (1-10 or 'code_convergence') - optional for backdrop
 * @param imageType - Type of image (flashcards, cheat-sheet, or backdrop)
 * @returns Base path for images
 */
export function getImageBasePath(
  ageGroup: '11-14' | '15-18',
  levelNumber: number | undefined,
  sessionId: number | string | undefined,
  imageType: 'flashcards' | 'cheat-sheet' | 'backdrop'
): string {
  // Handle backdrop images (no level/session-specific folder)
  if (imageType === 'backdrop') {
    return `/images/${ageGroup}/backdrop`;
  }

  // Default to level 1 if not specified
  const level = levelNumber || 1;

  // Handle Code Convergence / Mini Project
  if (sessionId === 'code_convergence' || sessionId === 'mini-project') {
    return `/images/${ageGroup}/level-${level}/mini-project/${imageType}`;
  }

  // Handle regular sessions
  return `/images/${ageGroup}/level-${level}/sessions/session-${sessionId}/${imageType}`;
}

/**
 * Get full image path
 * @param config - Image path configuration
 * @param imageName - Name of the image file
 * @returns Full path to the image
 */
export function getImagePath(
  config: ImagePathConfig,
  imageName: string
): string {
  const basePath = getImageBasePath(
    config.ageGroup,
    config.levelNumber,
    config.sessionId,
    config.imageType
  );
  return `${basePath}/${imageName}`;
}

/**
 * Get all images from a folder (requires API endpoint or static listing)
 * @param config - Image path configuration
 * @returns Array of image paths
 */
export function getImageFolder(config: ImagePathConfig): string {
  return getImageBasePath(
    config.ageGroup,
    config.levelNumber,
    config.sessionId,
    config.imageType
  );
}

/**
 * Helper to get flashcard images for Arena Warm-Up
 */
export function getFlashcardPath(
  ageGroup: '11-14' | '15-18',
  levelNumber: number,
  sessionId: number | string,
  imageName: string
): string {
  return getImagePath({ ageGroup, levelNumber, sessionId, imageType: 'flashcards' }, imageName);
}

/**
 * Helper to get cheat sheet images
 */
export function getCheatSheetPath(
  ageGroup: '11-14' | '15-18',
  levelNumber: number,
  sessionId: number | string,
  imageName: string
): string {
  return getImagePath({ ageGroup, levelNumber, sessionId, imageType: 'cheat-sheet' }, imageName);
}

/**
 * Helper to get backdrop/background images
 */
export function getBackdropPath(
  ageGroup: '11-14' | '15-18',
  imageName: string
): string {
  return getImagePath({ ageGroup, imageType: 'backdrop' }, imageName);
}

/**
 * Parse image name from introduction content format
 * Example: "1. variables.png" returns "variables.png"
 */
export function parseImageName(line: string): string | null {
  const imageMatch = line.match(/^(?:🖼️\s*)?(\d+)\.\s*(.+\.(?:png|jpg|jpeg|gif|webp))/i);
  if (imageMatch) {
    return imageMatch[2].trim();
  }
  return null;
}
