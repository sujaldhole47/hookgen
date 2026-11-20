import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, X, FlipHorizontal, Type, Gauge } from 'lucide-react';

export default function Teleprompter({ title, hook, script, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3); // 1 (slow) to 10 (fast)
  const [fontSize, setFontSize] = useState(44); // px
  const [isMirrored, setIsMirrored] = useState(false);

  const contentRef = useRef(null);
  const offsetRef = useRef(0);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);

  const applyTransform = useCallback(() => {
    if (!contentRef.current) return;
    const mirror = isMirrored ? 'scaleX(-1)' : '';
    contentRef.current.style.transform = `translate3d(0, -${offsetRef.current}px, 0) ${mirror}`;
  }, [isMirrored]);

  // Re-apply transform immediately if user toggles Mirror while paused
  useEffect(() => {
    applyTransform();
  }, [applyTransform]);

  // GPU-accelerated smooth scroll loop
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(animationRef.current);
      lastTimeRef.current = null;
      return;
    }

    const scrollStep = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      // Cap delta at 50ms so switching windows never causes a jump
      const delta = Math.min(timestamp - lastTimeRef.current, 50);
      lastTimeRef.current = timestamp;

      if (contentRef.current) {
        const pixelsToScroll = (speed * 25 * delta) / 1000;
        offsetRef.current += pixelsToScroll;
        applyTransform();

        // Auto-pause once the script finishes scrolling past the eye-line
        if (offsetRef.current >= contentRef.current.scrollHeight) {
          setIsPlaying(false);
          return;
        }
      }

      animationRef.current = requestAnimationFrame(scrollStep);
    };

    animationRef.current = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, speed, applyTransform]);

  // Keyboard shortcuts: Space = Play/Pause, Esc = Close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleReset = () => {
    setIsPlaying(false);
    offsetRef.current = 0;
    applyTransform();
  };

  // Allow manual mouse-wheel scrolling up/down
  const handleWheel = (e) => {
    offsetRef.current = Math.max(0, offsetRef.current + e.deltaY * 0.6);
    applyTransform();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black text-white flex flex-col select-none">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-950/90 border-b border-slate-800 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Start'}
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 cursor-pointer"
            title="Reset to top"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="text-xs text-slate-500 hidden md:inline">
            Space to Play/Pause • Esc to Exit
          </span>
        </div>

        {/* Sliders & Mirror Toggle */}
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <Gauge className="w-4 h-4 text-indigo-400" />
            <span>Speed: {speed}</span>
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-24 accent-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <Type className="w-4 h-4 text-emerald-400" />
            <span>Size: {fontSize}px</span>
            <input
              type="range"
              min="24"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24 accent-emerald-500 cursor-pointer"
            />
          </label>

          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition cursor-pointer ${
              isMirrored
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Mirror text horizontally for teleprompter glass"
          >
            <FlipHorizontal className="w-4 h-4" />
            Mirror
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reading Area */}
      <div
        onWheel={handleWheel}
        className="relative flex-1 overflow-hidden px-6 sm:px-16 md:px-28"
      >
        {/* Eye-Line Reading Guide */}
        <div className="pointer-events-none absolute top-[28%] left-0 right-0 h-20 border-y border-indigo-500/40 bg-indigo-500/5 z-10 flex items-center justify-between px-4">
          <div className="w-3 h-3 rounded-full bg-indigo-500/70" />
          <div className="w-3 h-3 rounded-full bg-indigo-500/70" />
        </div>

        {/* GPU-Animated Script Container */}
        <div
          ref={contentRef}
          className="will-change-transform pt-[30vh] pb-[75vh]"
        >
          <div className="max-w-4xl mx-auto space-y-8">
            <p className="text-sm uppercase tracking-widest text-indigo-400 font-semibold">
              {title}
            </p>

            {hook && (
              <p
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}
                className="font-bold text-amber-300"
              >
                {hook}
              </p>
            )}

            <div
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
              className="font-semibold text-slate-100 whitespace-pre-line"
            >
              {script || 'No script available yet.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}