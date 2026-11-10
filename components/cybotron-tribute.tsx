"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Disc3, Sliders } from "lucide-react";

interface DiscographyEntry {
  id: string;
  year: string;
  title: string;
  alias: string;
  label: string;
  catalog: string;
  bpm: number;
  hardware: string;
  visualMode: 0 | 1 | 2 | 3;
  visualName: string;
  accent: string;
  notes: string;
}

const DISCOGRAPHY: DiscographyEntry[] = [
  {
    id: "alleys",
    year: "1981",
    title: "Alleys of Your Mind",
    alias: "Cybotron",
    label: "Deep Space Records",
    catalog: "DS-001",
    bpm: 118,
    hardware: "Roland TR-808, Korg MS-10, ARP Odyssey",
    visualMode: 0,
    visualName: "Oscilloscope Horizon",
    accent: "#FF4B2B",
    notes:
      "Recorded in Detroit with Richard Davis, this debut single fused Kraftwerk's rhythmic precision with electro-funk basslines, laying the blueprint for Detroit techno.",
  },
  {
    id: "cosmic-cars",
    year: "1982",
    title: "Cosmic Cars",
    alias: "Cybotron",
    label: "Deep Space / Fantasy",
    catalog: "F-925",
    bpm: 124,
    hardware: "Roland Jupiter-8, TR-808, Sequential Prophet-5",
    visualMode: 2,
    visualName: "Vector Velocity Field",
    accent: "#00E5FF",
    notes:
      "An ode to automotive futurism and Motor City highways, pairing driving analog arpeggios with vocoded vocal hooks and relentless 808 cowbell syncopation.",
  },
  {
    id: "clear",
    year: "1983",
    title: "Clear",
    alias: "Cybotron",
    label: "Fantasy Records",
    catalog: "F-937",
    bpm: 126,
    hardware: "Roland TR-808, Juno-60, Roland Vocoder Plus",
    visualMode: 1,
    visualName: "Phase-Modulated Grid",
    accent: "#FF4B2B",
    notes:
      "One of the most sampled electro tracks in history. Its stripped-back, surgical drum programming and stark synth stabs defined the transition from electro to techno.",
  },
  {
    id: "techno-city",
    year: "1984",
    title: "Techno City",
    alias: "Cybotron",
    label: "Fantasy Records",
    catalog: "F-949",
    bpm: 128,
    hardware: "Roland TR-909, LinnDrum, Yamaha DX7",
    visualMode: 3,
    visualName: "Harmonic Spectrum Matrix",
    accent: "#F59E0B",
    notes:
      "Coined the term 'Techno' in its title, envisioning a post-industrial metropolis powered by machine rhythm and metallic FM synthesis.",
  },
  {
    id: "no-ufos",
    year: "1985",
    title: "No UFO's",
    alias: "Model 500",
    label: "Metroplex",
    catalog: "M-001",
    bpm: 125,
    hardware: "Roland TR-909, Roland SH-101, Oberheim DMX",
    visualMode: 1,
    visualName: "Phase-Modulated Grid",
    accent: "#00E5FF",
    notes:
      "The inaugural release on Atkins' own Metroplex imprint. Widely recognized as the first pure Detroit techno record, built on hypnotic 909 hi-hats and deep sub-bass.",
  },
  {
    id: "the-chase",
    year: "1989",
    title: "The Chase",
    alias: "Model 500",
    label: "Metroplex / Transmat",
    catalog: "M-014",
    bpm: 130,
    hardware: "Roland TR-909, Akai S950, Korg M1",
    visualMode: 2,
    visualName: "Vector Velocity Field",
    accent: "#FF4B2B",
    notes:
      "A high-velocity club anthem that bridged Detroit's underground warehouse scene with the emerging European rave movement.",
  },
];

export default function CybotronTribute() {
  const [selectedIndex, setSelectedIndex] = useState<number>(2); // Default to "Clear" (1983)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [bpmOverride, setBpmOverride] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeEntry = DISCOGRAPHY[selectedIndex];
  const effectiveBpm = bpmOverride ?? activeEntry.bpm;

  const handleSelectEntry = (index: number) => {
    setSelectedIndex(index);
    setBpmOverride(null);
  };

  const handlePrev = () => {
    const nextIdx = (selectedIndex - 1 + DISCOGRAPHY.length) % DISCOGRAPHY.length;
    handleSelectEntry(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = (selectedIndex + 1) % DISCOGRAPHY.length;
    handleSelectEntry(nextIdx);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId: number;
    let phase = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear with deep obsidian
      ctx.fillStyle = "#060608";
      ctx.fillRect(0, 0, width, height);

      // Subtle CRT scanline texture
      ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      const mode = activeEntry.visualMode;
      const accent = activeEntry.accent;
      const speed = (effectiveBpm / 120) * 0.032;

      if (isPlaying && !prefersReducedMotion) {
        phase += speed;
      }

      if (mode === 0) {
        // 0: Oscilloscope Horizon (Alleys of Your Mind)
        const horizonY = height * 0.52;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(width, horizonY);
        ctx.stroke();

        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath();
          ctx.strokeStyle = layer === 0 ? accent : "rgba(224, 224, 224, 0.28)";
          ctx.lineWidth = layer === 0 ? 2 : 1;
          for (let x = 0; x <= width; x += 4) {
            const normX = x / width;
            const env = Math.sin(normX * Math.PI);
            const y =
              horizonY +
              Math.sin(x * 0.02 + phase * (1 + layer * 0.4) + layer) *
                (44 - layer * 10) *
                env +
              Math.cos(x * 0.05 - phase * 1.5) * 12 * env;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (mode === 1) {
        // 1: Phase-Modulated Grid (Clear / No UFO's)
        const horizonY = height * 0.42;
        const centerX = width * 0.5;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
        ctx.lineWidth = 1;

        // Perspective radial lines
        for (let i = -10; i <= 10; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX + i * 22, horizonY);
          ctx.lineTo(centerX + i * 110, height);
          ctx.stroke();
        }

        // Moving horizontal grid lines
        const offset = (phase * 40) % 40;
        for (let y = horizonY; y < height; y += 22) {
          const prog = (y - horizonY) / (height - horizonY);
          const shiftedY = y + offset * prog * 0.5;
          if (shiftedY < height) {
            ctx.beginPath();
            ctx.strokeStyle =
              prog > 0.7 ? accent : `rgba(224, 224, 224, ${0.06 + prog * 0.18})`;
            ctx.moveTo(0, shiftedY);
            ctx.lineTo(width, shiftedY);
            ctx.stroke();
          }
        }

        // Top synth sun/oscillator disc
        ctx.beginPath();
        ctx.arc(centerX, horizonY - 38, 34, 0, Math.PI * 2);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (mode === 2) {
        // 2: Vector Velocity Field (Cosmic Cars / The Chase)
        const centerY = height * 0.5;
        const count = 24;
        for (let i = 0; i < count; i++) {
          const t = ((i / count) + phase * 0.15) % 1;
          const x = t * width;
          const barH = 14 + Math.sin(t * Math.PI * 4 + phase * 2) * 38;
          ctx.strokeStyle = i % 4 === 0 ? accent : "rgba(224, 224, 224, 0.25)";
          ctx.lineWidth = i % 4 === 0 ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(x, centerY - barH);
          ctx.lineTo(x, centerY + barH);
          ctx.stroke();
        }
      } else {
        // 3: Harmonic Spectrum Matrix (Techno City)
        const cols = 32;
        const colW = width / cols;
        for (let i = 0; i < cols; i++) {
          const amp =
            0.25 +
            0.55 *
              Math.abs(
                Math.sin(i * 0.35 + phase * 1.4) * Math.cos(i * 0.18 - phase)
              );
          const barHeight = amp * (height * 0.72);
          const x = i * colW + 4;
          const y = height - barHeight - 20;

          ctx.fillStyle = i % 5 === 0 ? accent : "rgba(224, 224, 224, 0.22)";
          ctx.fillRect(x, y, Math.max(colW - 8, 2), barHeight);
        }
      }

      if (isPlaying && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [activeEntry, isPlaying, effectiveBpm]);

  return (
    <section
      aria-label="Juan Atkins and Cybotron Tribute"
      className="w-full border-t border-white/10 bg-[#050507] text-[#E0E0E0] px-6 py-14 md:px-10"
    >
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Editorial Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-white/10 pb-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-mono tracking-widest text-[#FF4B2B] uppercase">
              Detroit Proto-Techno Archive · 1981–1989
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-white text-balance">
              Juan Atkins &amp; Cybotron: The Architecture of Machine Soul
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 tabular-nums">
            <span>{activeEntry.alias}</span>
            <span aria-hidden="true">·</span>
            <span>{activeEntry.label}</span>
            <span aria-hidden="true">·</span>
            <span>{activeEntry.catalog}</span>
          </div>
        </div>

        {/* Main 2-Column Interactive Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Evolving Synth-Wave Visualizer */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-lg border border-white/10 bg-[#08080B] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5 text-xs font-mono text-neutral-300">
                <Disc3 className="w-4 h-4 text-[#FF4B2B]" aria-hidden="true" />
                <span>Sequence 0{activeEntry.visualMode + 1}: {activeEntry.visualName}</span>
              </div>
              <div className="text-xs font-mono text-neutral-400 tabular-nums">
                {effectiveBpm} BPM
              </div>
            </div>

            <div className="relative h-64 md:h-80 w-full bg-[#060608]">
              <canvas
                ref={canvasRef}
                className="w-full h-full block"
                aria-label={`Synth-wave visual sequence for ${activeEntry.title}`}
              />
            </div>

            {/* Transport & Tempo Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-t border-white/10 bg-[#0A0A0E]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous release"
                  className="p-2 rounded border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4B2B]"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#FF4B2B] text-white text-xs font-medium hover:bg-[#e03e20] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Visual</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Play Visual</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next release"
                  className="p-2 rounded border border-white/10 text-neutral-300 hover:text-white hover:border-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4B2B]"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Sliders className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                <label htmlFor="cybotron-bpm" className="text-xs font-mono text-neutral-400">
                  Tempo
                </label>
                <input
                  id="cybotron-bpm"
                  type="range"
                  min={90}
                  max={150}
                  value={effectiveBpm}
                  onChange={(e) => setBpmOverride(Number(e.target.value))}
                  className="w-28 accent-[#FF4B2B] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right: Active Release Dossier */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-lg border border-white/10 bg-[#08080B] p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-xs font-mono text-neutral-400 tabular-nums">
                  {activeEntry.year} · {activeEntry.alias}
                </span>
                <span className="text-xs font-mono text-neutral-400 tabular-nums">
                  {activeEntry.catalog}
                </span>
              </div>

              <h3 className="font-display text-2xl font-semibold text-white">
                {activeEntry.title}
              </h3>

              <p className="text-sm leading-relaxed text-neutral-300">
                {activeEntry.notes}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="text-xs font-mono text-neutral-400">
                Studio Hardware
              </div>
              <div className="text-sm font-mono text-neutral-200">
                {activeEntry.hardware}
              </div>
            </div>
          </div>
        </div>

        {/* Selectable Discography Timeline */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-neutral-400">
            Select a landmark release to morph the synth-wave sequence
          </div>
          <div
            role="tablist"
            aria-label="Juan Atkins Discography Timeline"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
          >
            {DISCOGRAPHY.map((entry, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={entry.id}
                  role="tab"
                  aria-selected={isSelected}
                  type="button"
                  onClick={() => handleSelectEntry(idx)}
                  className={`text-left p-3.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4B2B] ${
                    isSelected
                      ? "bg-[#121218] border-[#FF4B2B] text-white"
                      : "bg-[#08080B] border-white/10 text-neutral-400 hover:border-white/25 hover:text-neutral-200"
                  }`}
                >
                  <div className="text-xs font-mono tabular-nums text-neutral-400">
                    {entry.year}
                  </div>
                  <div className="mt-1 text-sm font-medium truncate text-inherit">
                    {entry.title}
                  </div>
                  <div className="mt-0.5 text-xs font-mono truncate text-neutral-500">
                    {entry.alias}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
