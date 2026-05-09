let webglSupported: boolean | null = null;

export function detectWebGL(): boolean {
  if (webglSupported !== null) return webglSupported;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    webglSupported = !!(gl && gl instanceof WebGLRenderingContext);
  } catch (e) {
    webglSupported = false;
  }
  
  return webglSupported;
}

export function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return !!(gl && gl instanceof WebGL2RenderingContext);
  } catch (e) {
    return false;
  }
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return (memory && memory < 4) || (cores && cores < 4);
}
