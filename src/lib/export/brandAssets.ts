/**
 * Browser-only loaders for the images the PDF report embeds.
 *
 * Everything here touches `fetch`, `FileReader` and the browser QR encoder, so
 * it must never run in the Node test harness or be imported by the document
 * module itself. The print-sized logo is preferred over the 546 KB source so
 * the report stays small.
 */

const LOGO_URLS = ['/brand/logo-report.png', '/brand/logo.png'] as const;

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

/** The report logo, printed at the top of every page. */
export async function loadBrandLogo(): Promise<string | null> {
  for (const url of LOGO_URLS) {
    const dataUrl = await fetchAsDataUrl(url);
    if (dataUrl) return dataUrl;
  }
  return null;
}

/** A 512 px QR encoding the build's share URL, as a PNG data URL. */
export async function makeQrDataUrl(url: string): Promise<string> {
  const { toDataURL } = await import('qrcode');
  return toDataURL(url, { margin: 1, width: 512, errorCorrectionLevel: 'M' });
}
