'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Power, Volume2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoopTrack {
  id: number;
  beats: number;
  active: boolean;
  volume: number;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  startTime: number;
  duration: number;
}

export default function SoundBitePro() {
  const [power, setPower] = useState(false);
  const [bpm, setBpm] = useState(128);
  const [trackBuffer, setTrackBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [loops, setLoops] = useState<LoopTrack[]>([
    { id: 1, beats: 1, active: false, volume: 0.8, sourceNode: null, gainNode: null, startTime: 0, duration: 0 },
    { id: 2, beats: 2, active: false, volume: 0.8, sourceNode: null, gainNode: null, startTime: 0, duration: 0 },
    { id: 3, beats: 4, active: false, volume: 0.8, sourceNode: null, gainNode: null, startTime: 0, duration: 0 },
    { id: 4, beats: 8, active: false, volume: 0.8, sourceNode: null, gainNode: null, startTime: 0, duration: 0 },
    { id: 5, beats: 16, active: false, volume: 0.8, sourceNode: null, gainNode: null, startTime: 0, duration: 0 },
    { id: 6, beats: 32, active: false, volume: 0.8, sourceNode: null, gainNode: null, startTime: 0, duration: 0 },
  ]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const trackStartTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new window.AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    initAudio();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await audioCtxRef.current!.decodeAudioData(arrayBuffer);
    setTrackBuffer(buffer);
  };

  const toggleMainPlay = () => {
    if (!audioCtxRef.current || !trackBuffer) return;
    
    if (isPlaying) {
      mainSourceRef.current?.stop();
      mainSourceRef.current?.disconnect();
      mainSourceRef.current = null;
      setIsPlaying(false);
    } else {
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = trackBuffer;
      
      const gain = audioCtxRef.current.createGain();
      gain.gain.value = 0.5;
      
      source.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      
      source.start();
      mainSourceRef.current = source;
      mainGainRef.current = gain;
      trackStartTimeRef.current = audioCtxRef.current.currentTime;
      setIsPlaying(true);
      
      source.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const triggerLoop = (loopIndex: number, beats: number) => {
    if (!audioCtxRef.current || !trackBuffer || !isPlaying) return;

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const trackElapsed = now - trackStartTimeRef.current;
    
    // Calculate perfect loop points based on BPM
    const beatDuration = 60 / bpm;
    const currentBeat = Math.floor(trackElapsed / beatDuration);
    
    // Quantize to the exact start of the current beat
    const loopStartTimeInTrack = currentBeat * beatDuration;
    const loopDuration = beats * beatDuration;
    
    const newLoops = [...loops];
    const loop = newLoops[loopIndex];

    if (loop.active) {
      // Stop loop
      loop.sourceNode?.stop();
      loop.sourceNode?.disconnect();
      loop.gainNode?.disconnect();
      loop.active = false;
      loop.sourceNode = null;
      loop.gainNode = null;
    } else {
      // Start loop
      const source = ctx.createBufferSource();
      source.buffer = trackBuffer;
      source.loop = true;
      source.loopStart = loopStartTimeInTrack;
      source.loopEnd = loopStartTimeInTrack + loopDuration;
      
      const gain = ctx.createGain();
      gain.gain.value = loop.volume;
      
      source.connect(gain);
      gain.connect(ctx.destination);
      
      // Calculate when the next exact loop boundary occurs so it plays perfectly in sync
      const timeUntilNextBeat = (loopStartTimeInTrack + beatDuration) - trackElapsed;
      const startTime = now; // + timeUntilNextBeat; // starting immediately but offset in the buffer
      
      source.start(startTime, loopStartTimeInTrack + (trackElapsed - loopStartTimeInTrack));
      
      loop.sourceNode = source;
      loop.gainNode = gain;
      loop.active = true;
      loop.startTime = loopStartTimeInTrack;
      loop.duration = loopDuration;
    }
    
    setLoops(newLoops);
  };

  const handleVolumeChange = (index: number, val: number) => {
    const newLoops = [...loops];
    newLoops[index].volume = val;
    if (newLoops[index].gainNode && audioCtxRef.current) {
      newLoops[index].gainNode!.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
    setLoops(newLoops);
  };

  return (
    <div className="bg-[#1a1a1a] p-4 sm:p-8 rounded-xl border-4 border-[#0a0a0a] shadow-2xl max-w-4xl mx-auto font-sans select-none" style={{ backgroundImage: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)' }}>
      
      {/* Header / Brand */}
      <div className="flex justify-between items-center mb-6 sm:b-8 border-b-2 border-[#0a0a0a] pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-red-600 tracking-tighter italic">RED SOUND</h2>
          <h3 className="text-lg sm:text-xl font-bold text-zinc-400 tracking-wider">SOUNDBITE PRO</h3>
        </div>
        <button 
          onClick={() => setPower(!power)}
          className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]", power ? "border-red-500 text-red-500 bg-red-950" : "border-zinc-700 text-zinc-700 bg-zinc-900")}
        >
          <Power className="w-5 h-5" />
        </button>
      </div>

      {!power ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-zinc-700 font-bold tracking-widest text-lg sm:text-xl">POWER OFF</p>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          
          {/* Main Controls & Screen */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-start w-full min-w-0">
            
            <div className="bg-black p-4 rounded-lg border-2 border-zinc-800 flex-1 min-w-0 relative shadow-inner">
              <div className="absolute top-2 left-2 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[10px] font-bold text-red-600 tracking-widest">AUTO-BPM</span>
              </div>
              <div className="text-center mt-4">
                <p className="text-4xl sm:text-5xl font-mono text-red-500 font-bold" style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}>
                  {bpm.toFixed(1)}
                </p>
                <p className="text-xs text-red-900 font-bold tracking-widest mt-1">BEATS PER MINUTE</p>
              </div>
            </div>

            <div className="flex-1 min-w-0 bg-[#222] p-4 rounded-lg border-2 border-[#111] shadow-inner space-y-4">
              <div className="flex gap-2 items-center min-w-0">
                <label className="text-xs font-bold text-zinc-400 w-16 shrink-0">BPM SET</label>
                <input 
                  type="number" 
                  value={bpm} 
                  onChange={e => setBpm(Number(e.target.value))}
                  className="bg-black border border-zinc-700 text-red-500 font-mono px-2 py-1 rounded w-20 text-center"
                />
              </div>
              <div className="flex gap-2 items-center min-w-0">
                <label className="text-xs font-bold text-zinc-400 w-16 shrink-0">AUDIO IN</label>
                <label className="bg-zinc-800 hover:bg-zinc-700 text-xs font-bold px-3 py-2 rounded cursor-pointer border border-zinc-600 transition-colors flex-1 text-center truncate text-zinc-300 block min-w-0 max-w-full">
                  {fileName || "UPLOAD TRACK"}
                  <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              <button 
                onClick={toggleMainPlay}
                disabled={!trackBuffer}
                className={cn("w-full py-2 rounded text-xs font-bold tracking-widest transition-colors border", 
                  !trackBuffer ? "bg-zinc-900 border-zinc-800 text-zinc-700" : 
                  isPlaying ? "bg-emerald-900 border-emerald-500 text-emerald-400" : "bg-zinc-800 border-zinc-600 text-zinc-300 hover:bg-zinc-700")}
              >
                {isPlaying ? "STOP INPUT" : "PLAY INPUT"}
              </button>
            </div>
          </div>

          {/* Loop Pads */}
          <div className="bg-[#111] p-4 sm:p-6 rounded-xl border border-black shadow-inner">
            <h4 className="text-zinc-500 font-bold text-xs tracking-widest mb-4">SEAMLESS LOOP CHANNELS</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {loops.map((loop, i) => (
                <div key={loop.id} className="bg-[#222] p-4 rounded-lg border border-[#333] flex flex-col items-center gap-4 relative">
                  <div className="absolute top-2 right-2">
                    <div className={cn("w-2 h-2 rounded-full", loop.active ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-zinc-800")} />
                  </div>
                  
                  <div className="text-center">
                    <span className="text-zinc-600 font-bold text-[10px]">BEATS</span>
                    <p className="text-xl font-black text-zinc-300">{loop.beats}</p>
                  </div>
                  
                  <button
                    onClick={() => triggerLoop(i, loop.beats)}
                    className={cn(
                      "w-20 h-20 rounded-md border-b-4 border-r-4 transition-all active:translate-y-1 active:border-b-0 active:border-r-0 flex items-center justify-center shadow-lg",
                      loop.active 
                        ? "bg-green-600 border-green-800 text-white" 
                        : "bg-zinc-700 border-zinc-900 text-zinc-400 hover:bg-zinc-600"
                    )}
                  >
                    <span className="font-bold tracking-wider">{loop.active ? "STOP" : "LOOP"}</span>
                  </button>

                  <div className="w-full mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <Volume2 className="w-3 h-3 text-zinc-500" />
                      <span className="text-[9px] font-bold text-zinc-500">MIX</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={loop.volume}
                      onChange={(e) => handleVolumeChange(i, parseFloat(e.target.value))}
                      className="w-full h-2 bg-black rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-zinc-300 [&::-webkit-slider-thumb]:rounded-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
