import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Play, Pause, Activity } from 'lucide-react';

/**
 * Ambient Hero Background Layer
 * Universally renders the 3D vault video loop (MP4 / WebM / WebP)
 * in the ambient background with high visibility and subtle contrast gradient.
 */
export const HeroBackground: React.FC<{
  opacity?: number;
  showOverlay?: boolean;
  className?: string;
}> = ({
  opacity = 0.85,
  showOverlay = true,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays smoothly across all mobile and browser policies
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted without user interaction in some contexts; muted bypasses this
      });
    }
  }, []);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* Universal HTML5 Video with WebP fallback */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover object-center scale-105"
        style={{ opacity }}
      >
        <source src="/media/legacy-vault-hero.mp4" type="video/mp4" />
        <source src="/media/legacy-vault-hero.webm" type="video/webm" />
        {/* Animated WebP Fallback image */}
        <img
          src="/media/legacy-vault-hero.webp"
          alt="Legacy Vault Animated Background"
          className="w-full h-full object-cover object-center"
        />
      </video>

      {/* Subtle modern cinematic vignette so text remains crisp and legible */}
      {showOverlay && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14]/75 via-[#0B0F14]/40 to-[#0B0F14]/85" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(11,15,20,0.7)_100%)]" />
        </>
      )}
    </div>
  );
};

/**
 * Featured Hero Video Showcase Card
 * Prominently displays the 3D animated vault engine with interactive controls.
 */
export const HeroVideoShowcase: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
      className="relative mx-auto mt-10 w-full max-w-4xl px-2 sm:px-0"
    >
      {/* Outer neon glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#AAFF00]/25 via-emerald-500/15 to-[#AAFF00]/25 blur-xl opacity-75" />

      {/* Main Video Container */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#AAFF00]/40 bg-[#0E1217] shadow-2xl shadow-[#AAFF00]/15 ring-1 ring-white/10">
        <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
          {/* Universal Video player */}
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className={`h-full w-full object-cover object-center transition-all duration-300 ${
              isPlaying ? 'opacity-100' : 'opacity-40 grayscale contrast-125'
            }`}
          >
            <source src="/media/legacy-vault-hero.mp4" type="video/mp4" />
            <source src="/media/legacy-vault-hero.webm" type="video/webm" />
            <img
              src="/media/legacy-vault-hero.webp"
              alt="Legacy Vault 3D Engine Autonomous Animation"
              className="h-full w-full object-cover object-center"
            />
          </video>

          {/* Vignette Shadow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1217]/80 via-transparent to-black/30 pointer-events-none" />

          {/* Top Floating Badges */}
          <div className="absolute top-3 left-3 sm:top-5 sm:left-5 flex flex-wrap items-center gap-2 z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/80 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-mono font-semibold text-white shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#AAFF00] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#AAFF00]" />
              </span>
              <span className="text-[#AAFF00] font-bold">AUTONOMOUS</span> VAULT ENGINE
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[11px] font-mono text-zinc-300">
              <Activity className="h-3 w-3 text-primary" />
              Starknet L2 Live
            </span>
          </div>

          {/* Top Right Pause/Play Toggle */}
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10">
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/80 hover:bg-black backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-mono text-white/90 transition-colors cursor-pointer shadow-md"
              title={isPlaying ? 'Pause visual preview' : 'Resume visual preview'}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3 text-[#AAFF00]" />
                  <span className="text-[11px] hidden sm:inline">Looping</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 text-zinc-300" />
                  <span className="text-[11px] hidden sm:inline">Paused</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom Information Bar */}
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-5 sm:right-5 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2 text-xs text-white/90">
              <span className="font-mono text-[11px] text-zinc-300 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#AAFF00]" />
                Self-Custodial Smart Contract Inheritance
              </span>
            </div>

            <span className="font-mono text-[10px] text-[#AAFF00] bg-[#AAFF00]/15 border border-[#AAFF00]/30 px-2.5 py-1 rounded-md backdrop-blur-md font-semibold tracking-wider uppercase">
              HD 60FPS
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
