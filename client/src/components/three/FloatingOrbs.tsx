import { useEffect, useRef } from "react";

interface OrbProps {
  className?: string;
  color: string;
  size: string;
  delay?: number;
  duration?: number;
  left?: string;
  top?: string;
  right?: string;
  bottom?: string;
}

function Orb({ className = "", color, size, delay = 0, duration = 6, left, top, right, bottom }: OrbProps) {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orbRef.current) return;
  }, [delay, duration]);

  return (
    <div
      ref={orbRef}
      className={`absolute rounded-full blur-3xl ${className}`}
      style={{
        background: color,
        width: size,
        height: size,
        left,
        top,
        right,
        bottom,
      }}
    />
  );
}

function ParticleField() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const particles = containerRef.current.querySelectorAll(".particle");
    particles.forEach((particle, i) => {
    });
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="particle absolute h-1 w-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: ["#a78bfa", "#ec4899", "#fb923c", "#22d3ee"][i % 4],
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}

function GlowRings() {
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ring1Ref.current) {
    }
    if (ring2Ref.current) {
    }
  }, []);

  return (
    <>
      <div
        ref={ring1Ref}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-purple-500/10"
        style={{ transformOrigin: "center center" }}
      />
      <div
        ref={ring2Ref}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-pink-500/10"
        style={{ transformOrigin: "center center" }}
      />
    </>
  );
}

export function FloatingOrbs({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <Orb
        color="radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%)"
        size="350px"
        left="-100px"
        top="10%"
        delay={0}
        duration={7}
      />
      <Orb
        color="radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, rgba(236, 72, 153, 0) 70%)"
        size="280px"
        right="-80px"
        bottom="20%"
        delay={1}
        duration={8}
      />
      <Orb
        color="radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, rgba(34, 211, 238, 0) 70%)"
        size="200px"
        left="30%"
        top="5%"
        delay={2}
        duration={6}
      />
      <Orb
        color="radial-gradient(circle, rgba(251, 146, 60, 0.25) 0%, rgba(251, 146, 60, 0) 70%)"
        size="150px"
        right="25%"
        top="40%"
        delay={0.5}
        duration={9}
      />
      
      <GlowRings />
      <ParticleField />
    </div>
  );
}

export function FloatingOrbsFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl animate-pulse-glow" />
      <div className="absolute -right-20 bottom-20 h-48 w-48 rounded-full bg-pink-500/20 blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      <div className="absolute left-1/3 top-1/4 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
      <div className="absolute right-1/4 top-1/2 h-24 w-24 rounded-full bg-orange-500/20 blur-3xl animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
    </div>
  );
}
