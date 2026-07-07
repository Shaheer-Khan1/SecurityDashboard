export const BRAND = {
  name: "Digifort",
  tagline: "Security & Surveillance Platform",
  primaryHex: "A6262C",
  primaryDarkHex: "7A1B20",
  inkHex: "1F2937",
  mutedHex: "6B7280",
  lightFillHex: "F3F4F6",
  logoPath: "/Digifort.png",
};

let cachedLogoDataUrl: string | null = null;
let cachedLogoArrayBuffer: ArrayBuffer | null = null;
let cachedLogoDims: { width: number; height: number } | null = null;

async function loadLogoBuffer(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(BRAND.logoPath);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

function arrayBufferToDataUrl(buffer: ArrayBuffer, mime = "image/png"): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:${mime};base64,${btoa(binary)}`;
}

function measureImage(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = dataUrl;
  });
}

/** Fetches and caches the Digifort logo as a data URL (for PDF/canvas use). */
export async function getLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  const buffer = await loadLogoBuffer();
  if (!buffer) return null;
  cachedLogoArrayBuffer = buffer;
  cachedLogoDataUrl = arrayBufferToDataUrl(buffer);
  return cachedLogoDataUrl;
}

/** Fetches and caches the Digifort logo as a raw ArrayBuffer + natural dimensions (for docx). */
export async function getLogoBufferAndDims(): Promise<
  { buffer: ArrayBuffer; width: number; height: number } | null
> {
  const dataUrl = await getLogoDataUrl();
  if (!dataUrl || !cachedLogoArrayBuffer) return null;
  if (!cachedLogoDims) {
    cachedLogoDims = await measureImage(dataUrl);
  }
  return { buffer: cachedLogoArrayBuffer, ...cachedLogoDims };
}

export function timestampStamp(): string {
  return new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
