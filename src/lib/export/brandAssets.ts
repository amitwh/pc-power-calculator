/**
 * Browser-only loaders for the images the PDF report embeds.
 *
 * Everything here touches `fetch`, `FileReader` and the browser QR encoder, so
 * it must never run in the Node test harness or be imported by the document
 * module itself. The print-sized logo is preferred over the 546 KB source so
 * the report stays small.
 */

const LOGO_URLS = ['/brand/logo-report.png', '/brand/logo.png'] as const;
const ICON_URL = '/icons/pwa-192x192.png';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await blobToDataUrl(await response.blob());
  } catch {
    return null;
  }
}

/** The report logo, rendered onto a white plate by the document. */
export async function loadBrandLogo(): Promise<string | null> {
  for (const url of LOGO_URLS) {
    const dataUrl = await fetchAsDataUrl(url);
    if (dataUrl) return dataUrl;
  }
  return null;
}

/** The square app icon shown in the continuation header. */
export async function loadBrandIcon(): Promise<string | null> {
  return fetchAsDataUrl(ICON_URL);
}

/** A 512 px QR encoding the build's share URL, as a PNG data URL. */
export async function makeQrDataUrl(url: string): Promise<string> {
  const { toDataURL } = await import('qrcode');
  return toDataURL(url, { margin: 1, width: 512, errorCorrectionLevel: 'M' });
}
