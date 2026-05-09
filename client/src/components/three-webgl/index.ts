// WebGL/Three.js components — stubs for production build
// The 3D effects are disabled to ensure build stability
export const WebGLScene = () => null;
export const LazyWebGLScene = () => null;
export const WebGLParticles = () => null;
export const PerformanceProvider = ({ children }: { children: React.ReactNode }) => children as any;
export const PerformanceToggle = () => null;
export const usePerformance = () => ({ mode: 'standard', setMode: () => {} });
