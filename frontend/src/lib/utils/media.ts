/**
 * Utilities for media handling and proxying.
 */

/**
 * Converts a Google Drive File ID to a public proxy URL.
 * Falls back to the original URL if it's already a full URL or not a Drive ID.
 */
export const getProxyUrl = (fileIdOrUrl: string | null | undefined): string => {
  if (!fileIdOrUrl) return '';

  // If it's already a full URL (http/https) or a base64 data URI, return it
  if (fileIdOrUrl.startsWith('http') || fileIdOrUrl.startsWith('data:')) {
    return fileIdOrUrl;
  }

  // If it's a Drive ID (not a URL), use our proxy endpoint
  // The endpoint is /api/vaults/media/proxy/:fileId
  return `/api/vaults/media/proxy/${fileIdOrUrl}`;
};
