"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, Pause, RotateCcw, Volume2, Music, Upload, 
  Sparkles, Sliders, Disc, Disc2, Radio, Activity,
  ChevronRight, Scissors, Shuffle, Plus, Star, CircleAlert,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ContactModal } from "./contact-modal";
import SoundBitePro from "./soundbite-pro";

// --- Types ---
interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: number;
  type: "synth" | "user";
  genre: string;
  color: string;
  key?: string; // Camelot key
  file?: File;
}

const PRESET_TRACKS: Track[] = [
  { id: "cosmic-techno", title: "Cosmic Techno", artist: "Synth Engine", bpm: 128, duration: 30, type: "synth", genre: "Acid Techno", color: "from-purple-600 to-indigo-600", key: "8A" },
  { id: "retro-synthwave", title: "Midnight Grid", artist: "Synth Engine", bpm: 110, duration: 30, type: "synth", genre: "Synthwave", color: "from-pink-600 to-rose-600", key: "11B" },
  { id: "chillhop-lofi", title: "Nostalgic Rain", artist: "Synth Engine", bpm: 85, duration: 30, type: "synth", genre: "Lofi Hip Hop", color: "from-amber-500 to-orange-600", key: "2A" },
  { id: "acid-house", title: "Squelch Wave", artist: "Synth Engine", bpm: 124, duration: 30, type: "synth", genre: "House / Acid", color: "from-emerald-500 to-teal-600", key: "5B" }
];

// Simple synthesizer pattern generator for Web Audio API
class AudioLoopSynth {
  private ctx: AudioContext;
  private bpm: number;
  private trackId: string;
  private outputNode: AudioNode;
  private isRunning: boolean = false;
  private nextNoteTime: number = 0.0;
  private current16thNote: number = 0;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // sec
  private timerId: any = null;

  constructor(ctx: AudioContext, trackId: string, bpm: number, outputNode: AudioNode) {
    this.ctx = ctx;
    this.trackId = trackId;
    this.bpm = bpm;
    this.outputNode = outputNode;
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.nextNoteTime = this.ctx.currentTime;
    this.current16thNote = 0;
    this.scheduler();
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduler() {
    if (!this.isRunning) return;
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.next16thNote();
    }
    this.timerId = setTimeout(() => this.scheduler(), this.lookahead);
  }

  private next16thNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.current16thNote = (this.current16thNote + 1) % 16;
  }

  private scheduleNote(step: number, time: number) {
    if (this.trackId === "cosmic-techno") {
      this.playTechnoStep(step, time);
    } else if (this.trackId === "retro-synthwave") {
      this.playSynthwaveStep(step, time);
    } else if (this.trackId === "chillhop-lofi") {
      this.playLofiStep(step, time);
    } else if (this.trackId === "acid-house") {
      this.playAcidHouseStep(step, time);
    }
  }

  // --- Synth Drum Utilities ---
  private triggerKick(time: number, freqStart = 150, freqEnd = 40, duration = 0.15) {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(this.outputNode);

    osc.frequency.setValueAtTime(freqStart, time);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, time + duration);

    gainNode.gain.setValueAtTime(0.8, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration);
  }

  private triggerNoiseHat(time: number, duration = 0.05, highPassCutoff = 8000) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(highPassCutoff, time);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.outputNode);

    noiseNode.start(time);
  }

  private triggerBass(time: number, freq: number, duration = 0.2, filterSweep = true) {
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    
    if (filterSweep) {
      filter.frequency.setValueAtTime(800, time);
      filter.frequency.exponentialRampToValueAtTime(100, time + duration);
      filter.Q.setValueAtTime(8, time);
    } else {
      filter.frequency.setValueAtTime(250, time);
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.4, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.outputNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  private triggerChord(time: number, freqs: number[], duration = 0.8) {
    const oscs = freqs.map(freq => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      return osc;
    });

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, time);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.2 / freqs.length, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

    oscs.forEach(osc => {
      osc.connect(filter);
    });
    filter.connect(gainNode);
    gainNode.connect(this.outputNode);

    oscs.forEach(osc => osc.start(time));
    oscs.forEach(osc => osc.stop(time + duration));
  }

  // --- Track Step Patterns ---
  private playTechnoStep(step: number, time: number) {
    // 4-on-the-floor heavy kick
    if (step % 4 === 0) {
      this.triggerKick(time, 160, 42, 0.2);
    }

    // Dynamic off-beat hats
    if (step % 4 === 2) {
      this.triggerNoiseHat(time, 0.08, 9000);
    } else if (step % 2 === 1 && Math.random() > 0.4) {
      this.triggerNoiseHat(time, 0.04, 10000);
    }

    // Acid bassline sequence
    // Bass frequencies: C2 (65.4Hz), Eb2 (77.8Hz), F2 (87.3Hz), Bb1 (58.3Hz)
    const notes = [65.4, 65.4, 77.8, 65.4, 87.3, 87.3, 58.3, 77.8, 65.4, 77.8, 87.3, 58.3, 65.4, 65.4, 77.8, 87.3];
    const bassTrigger = [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1];
    
    if (bassTrigger[step] === 1) {
      this.triggerBass(time, notes[step], 0.15, true);
    }
  }

  private playSynthwaveStep(step: number, time: number) {
    // Vintage kick on 1, 3
    if (step === 0 || step === 8) {
      this.triggerKick(time, 130, 50, 0.18);
    }

    // Snare (synthetic noise clap) on 4, 12
    if (step === 4 || step === 12) {
      const snareGain = this.ctx.createGain();
      snareGain.gain.setValueAtTime(0.5, time);
      snareGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, time);

      osc.connect(snareGain);
      snareGain.connect(this.outputNode);

      osc.start(time);
      osc.stop(time + 0.2);

      this.triggerNoiseHat(time, 0.15, 3000); // snare noise
    }

    // Sizzling 16th hats
    if (step % 2 === 1) {
      this.triggerNoiseHat(time, 0.04, 7000);
    }

    // Driving 8th-note bassline (C2 -> G1 -> Ab1 -> Bb1)
    const baseFreqs = [65.4, 49.0, 51.9, 58.3];
    const phrase = Math.floor(step / 4);
    const activeBass = baseFreqs[phrase];
    if (step % 2 === 0) {
      this.triggerBass(time, activeBass, 0.22, false);
    }
  }

  private playLofiStep(step: number, time: number) {
    // Soft organic kick
    if (step === 0 || step === 6 || step === 10) {
      this.triggerKick(time, 90, 48, 0.25);
    }

    // Soft lazy rim-snare on 4, 12
    if (step === 4 || step === 12) {
      const snareGain = this.ctx.createGain();
      snareGain.gain.setValueAtTime(0.3, time);
      snareGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, time);

      osc.connect(snareGain);
      snareGain.connect(this.outputNode);

      osc.start(time);
      osc.stop(time + 0.15);
    }

    // Shuffle lofi hat
    if (step % 4 === 1 || step % 4 === 3) {
      this.triggerNoiseHat(time, 0.03, 9500);
    }

    // Warm rhodes jazz chords
    // Cmaj7 (261.6, 329.6, 392.0, 493.9), Am7 (220.0, 261.6, 329.6, 392.0)
    if (step === 0) {
      this.triggerChord(time, [130.8, 164.8, 196.0, 246.9], 1.5);
    } else if (step === 8) {
      this.triggerChord(time, [110.0, 130.8, 164.8, 196.0], 1.5);
    }
  }

  private playAcidHouseStep(step: number, time: number) {
    // Classic 909 kick
    if (step % 4 === 0) {
      this.triggerKick(time, 140, 45, 0.22);
    }

    // Open high hat
    if (step % 4 === 2) {
      this.triggerNoiseHat(time, 0.15, 8000);
    } else if (step % 4 === 0 && Math.random() > 0.5) {
      this.triggerNoiseHat(time, 0.04, 9000);
    }

    // Resonant acid bass notes
    const notes = [130.8, 130.8, 146.8, 164.8, 116.5, 116.5, 130.8, 146.8, 196.0, 196.0, 174.6, 164.8, 146.8, 130.8, 110.0, 116.5];
    const trigger = [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1];
    
    if (trigger[step] === 1) {
      this.triggerBass(time, notes[step] / 2, 0.18, true);
    }
  }
}

// --- Component ---
export default function DJConsole() {
  // --- Audio Context & Graph References ---
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Audio Nodes refs for Deck A
  const deckAAnaRef = useRef<AnalyserNode | null>(null);
  const deckAEqHighRef = useRef<BiquadFilterNode | null>(null);
  const deckAEqMidRef = useRef<BiquadFilterNode | null>(null);
  const deckAEqLowRef = useRef<BiquadFilterNode | null>(null);
  const deckAFxFilterRef = useRef<BiquadFilterNode | null>(null);
  const deckAFxDelayRef = useRef<DelayNode | null>(null);
  const deckAFxDelayFeedbackRef = useRef<GainNode | null>(null);
  const deckAFxDelayWetRef = useRef<GainNode | null>(null);
  const deckAVolRef = useRef<GainNode | null>(null);
  const deckASourceRef = useRef<AudioBufferSourceNode | null>(null);
  const deckASynthRef = useRef<AudioLoopSynth | null>(null);

  // Audio Nodes refs for Deck B
  const deckBAnaRef = useRef<AnalyserNode | null>(null);
  const deckBEqHighRef = useRef<BiquadFilterNode | null>(null);
  const deckBEqMidRef = useRef<BiquadFilterNode | null>(null);
  const deckBEqLowRef = useRef<BiquadFilterNode | null>(null);
  const deckBFxFilterRef = useRef<BiquadFilterNode | null>(null);
  const deckBFxDelayRef = useRef<DelayNode | null>(null);
  const deckBFxDelayFeedbackRef = useRef<GainNode | null>(null);
  const deckBFxDelayWetRef = useRef<GainNode | null>(null);
  const deckBVolRef = useRef<GainNode | null>(null);
  const deckBSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const deckBSynthRef = useRef<AudioLoopSynth | null>(null);

  // Central Mixing Nodes
  const crossfaderNodeRef = useRef<GainNode | null>(null);
  const deckACrossGainRef = useRef<GainNode | null>(null);
  const deckBCrossGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Canvas Refs
  const canvasRefA = useRef<HTMLCanvasElement | null>(null);
  const canvasRefB = useRef<HTMLCanvasElement | null>(null);

  // State Management
  const [audioStarted, setAudioStarted] = useState(false);
  const [tracks, setTracks] = useState<Track[]>(PRESET_TRACKS);
  const [isDragging, setIsDragging] = useState(false);

  // Deck A UI State
  const [deckA, setDeckA] = useState({
    track: PRESET_TRACKS[0],
    isPlaying: false,
    pitch: 0, // slider +/- 16%
    volume: 0.8,
    eqHigh: 0, // slider +/- 12 dB
    eqMid: 0,
    eqLow: 0,
    fxFilter: 10000, // cutoff
    fxDelay: 0, // feedback 0-1
    rotation: 0,
    currentTime: 0,
    totalDuration: 30,
    hotCues: [null, null, null] as (number | null)[]
  });

  // Deck B UI State
  const [deckB, setDeckB] = useState({
    track: PRESET_TRACKS[1],
    isPlaying: false,
    pitch: 0,
    volume: 0.8,
    eqHigh: 0,
    eqMid: 0,
    eqLow: 0,
    fxFilter: 10000,
    fxDelay: 0,
    rotation: 0,
    currentTime: 0,
    totalDuration: 30,
    hotCues: [null, null, null] as (number | null)[]
  });

  // Central Mixer Controls
  const [crossfader, setCrossfader] = useState(0.5); // 0 (Left/A) -> 1 (Right/B)
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"console" | "soundbite">("console");
  const decodedBuffersRef = useRef<Record<string, AudioBuffer>>({});

  // MIDI Support
  const [midiDevices, setMidiDevices] = useState<string[]>([]);
  const [midiLearnMode, setMidiLearnMode] = useState<string | null>(null);
  const [midiMap, setMidiMap] = useState<Record<string, string | number>>({});
  const midiMapRef = useRef<Record<string, string | number>>({}); // for fast access in handlers
  const midiControlTypesRef = useRef<Record<string, 'absolute' | 'relative'>>({});
  const midiRelativeCountRef = useRef<Record<string, number>>({});

  // Initializing Web Audio graph
  const initAudio = () => {
    if (audioStarted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Build Graph for A
      const anaA = ctx.createAnalyser();
      anaA.fftSize = 256;
      const eqHA = ctx.createBiquadFilter(); eqHA.type = "highshelf"; eqHA.frequency.value = 8000;
      const eqMA = ctx.createBiquadFilter(); eqMA.type = "peaking"; eqMA.frequency.value = 1000; eqMA.Q.value = 1.0;
      const eqLA = ctx.createBiquadFilter(); eqLA.type = "lowshelf"; eqLA.frequency.value = 200;
      const fFilterA = ctx.createBiquadFilter(); fFilterA.type = "lowpass"; fFilterA.frequency.value = 10000;
      const fDelayA = ctx.createDelay(); fDelayA.delayTime.value = 0.3;
      const fDelayFbA = ctx.createGain(); fDelayFbA.gain.value = 0.0;
      const fDelayWetA = ctx.createGain(); fDelayWetA.gain.value = 0.0;
      const volA = ctx.createGain(); volA.gain.value = 0.8;
      const crossA = ctx.createGain(); crossA.gain.value = 0.5;

      // Connection graph for Deck A
      // Input source (BufferSource/Synth) -> EQ High -> EQ Mid -> EQ Low -> FX Filter -> Delay Path -> Vol Gain -> Cross Gain -> Master Gain
      eqHA.connect(eqMA);
      eqMA.connect(eqLA);
      eqLA.connect(fFilterA);
      
      // Delay loop connection
      fFilterA.connect(fDelayA);
      fDelayA.connect(fDelayFbA);
      fDelayFbA.connect(fDelayA); // feedback loop
      fDelayA.connect(fDelayWetA); // wet out
      
      // Join direct path and delay path to channel gain
      fFilterA.connect(volA);
      fDelayWetA.connect(volA);
      
      volA.connect(anaA);
      anaA.connect(crossA);

      // Save references
      deckAAnaRef.current = anaA;
      deckAEqHighRef.current = eqHA;
      deckAEqMidRef.current = eqMA;
      deckAEqLowRef.current = eqLA;
      deckAFxFilterRef.current = fFilterA;
      deckAFxDelayRef.current = fDelayA;
      deckAFxDelayFeedbackRef.current = fDelayFbA;
      deckAFxDelayWetRef.current = fDelayWetA;
      deckAVolRef.current = volA;
      deckACrossGainRef.current = crossA;


      // Build Graph for B
      const anaB = ctx.createAnalyser();
      anaB.fftSize = 256;
      const eqHB = ctx.createBiquadFilter(); eqHB.type = "highshelf"; eqHB.frequency.value = 8000;
      const eqMB = ctx.createBiquadFilter(); eqMB.type = "peaking"; eqMB.frequency.value = 1000; eqMB.Q.value = 1.0;
      const eqLB = ctx.createBiquadFilter(); eqLB.type = "lowshelf"; eqLB.frequency.value = 200;
      const fFilterB = ctx.createBiquadFilter(); fFilterB.type = "lowpass"; fFilterB.frequency.value = 10000;
      const fDelayB = ctx.createDelay(); fDelayB.delayTime.value = 0.3;
      const fDelayFbB = ctx.createGain(); fDelayFbB.gain.value = 0.0;
      const fDelayWetB = ctx.createGain(); fDelayWetB.gain.value = 0.0;
      const volB = ctx.createGain(); volB.gain.value = 0.8;
      const crossB = ctx.createGain(); crossB.gain.value = 0.5;

      eqHB.connect(eqMB);
      eqMB.connect(eqLB);
      eqLB.connect(fFilterB);
      
      fFilterB.connect(fDelayB);
      fDelayB.connect(fDelayFbB);
      fDelayFbB.connect(fDelayB);
      fDelayB.connect(fDelayWetB);
      
      fFilterB.connect(volB);
      fDelayWetB.connect(volB);
      
      volB.connect(anaB);
      anaB.connect(crossB);

      // Save references
      deckBAnaRef.current = anaB;
      deckBEqHighRef.current = eqHB;
      deckBEqMidRef.current = eqMB;
      deckBEqLowRef.current = eqLB;
      deckBFxFilterRef.current = fFilterB;
      deckBFxDelayRef.current = fDelayB;
      deckBFxDelayFeedbackRef.current = fDelayFbB;
      deckBFxDelayWetRef.current = fDelayWetB;
      deckBVolRef.current = volB;
      deckBCrossGainRef.current = crossB;


      // Master Stage
      const mGain = ctx.createGain();
      mGain.gain.value = 0.8;
      
      crossA.connect(mGain);
      crossB.connect(mGain);
      
      mGain.connect(ctx.destination);
      masterGainRef.current = mGain;

      // Instantiate Synthesizers for local loops
      deckASynthRef.current = new AudioLoopSynth(ctx, deckA.track.id, deckA.track.bpm, eqHA);
      deckBSynthRef.current = new AudioLoopSynth(ctx, deckB.track.id, deckB.track.bpm, eqHB);

      setAudioStarted(true);

      // Trigger standard visualizer frame render loops
      requestAnimationFrame(() => renderVisualizer("A"));
      requestAnimationFrame(() => renderVisualizer("B"));
    } catch (err) {
      console.error("Failed to initialize AudioContext", err);
    }
  };

  // --- Real-time Visualizer Renderer ---
  const renderVisualizer = (deck: "A" | "B") => {
    const canvas = deck === "A" ? canvasRefA.current : canvasRefB.current;
    const analyser = deck === "A" ? deckAAnaRef.current : deckBAnaRef.current;
    
    if (!canvas || !analyser) {
      requestAnimationFrame(() => renderVisualizer(deck));
      return;
    }

    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!canvas || !analyser) return;
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = "rgba(4, 4, 4, 0.25)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const barHeight = (value / 255) * canvas.height;

        // Custom glow gradient
        const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        if (deck === "A") {
          gradient.addColorStop(0, "rgba(124, 58, 237, 0.1)");
          gradient.addColorStop(1, "rgba(236, 72, 153, 0.85)");
        } else {
          gradient.addColorStop(0, "rgba(16, 185, 129, 0.1)");
          gradient.addColorStop(1, "rgba(6, 182, 212, 0.85)");
        }

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth - 1.5, barHeight);

        x += barWidth;
      }
    };
    draw();
  };

  // --- Crossfader Math ---
  // Constant-power crossfading ensures smooth mixing with no mid-point volume drop
  useEffect(() => {
    if (!audioStarted) return;
    const gainA = Math.cos(crossfader * Math.PI * 0.5);
    const gainB = Math.sin(crossfader * Math.PI * 0.5);
    if (deckACrossGainRef.current) deckACrossGainRef.current.gain.setValueAtTime(gainA, audioContextRef.current!.currentTime);
    if (deckBCrossGainRef.current) deckBCrossGainRef.current.gain.setValueAtTime(gainB, audioContextRef.current!.currentTime);
  }, [crossfader, audioStarted]);

  // --- Master Volume Adjust ---
  useEffect(() => {
    if (!audioStarted || !masterGainRef.current) return;
    masterGainRef.current.gain.setValueAtTime(masterVolume, audioContextRef.current!.currentTime);
  }, [masterVolume, audioStarted]);

  // --- MIDI Controller Support ---
  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;

    let midiAccess: any = null;

    const onMIDIMessage = (message: any) => {
      const [status, data1, data2] = message.data;
      
      let midiKey = "";
      let normalizedValue = 0;
      let rawValue = data1; // for fallback simple keys
      
      // Control Change (176 to 191)
      if (status >= 176 && status <= 191) {
        const ccNum = data1;
        const val = data2;
        midiKey = `cc_${ccNum}`;
        normalizedValue = val / 127;
        rawValue = ccNum;
      }
      // Pitch Bend (224 to 239)
      else if (status >= 224 && status <= 239) {
        const pbValue = (data2 << 7) | data1;
        midiKey = `pb_${status}`;
        normalizedValue = pbValue / 16383;
        rawValue = status;
      }
      // Note On / Note Off (144-159 or 128-143)
      else if ((status >= 144 && status <= 159) || (status >= 128 && status <= 143)) {
        const noteNum = data1;
        const velocity = data2;
        midiKey = `note_${noteNum}`;
        normalizedValue = (status >= 128 && status <= 143) ? 0 : velocity / 127;
        rawValue = noteNum;
      }
      
      if (!midiKey) return;

      // Learn mode
      setMidiLearnMode(currentMode => {
        if (currentMode) {
          setMidiMap(prev => {
            const newMap = { ...prev, [currentMode]: midiKey };
            midiMapRef.current = newMap;
            return newMap;
          });
          return null; // exit learn mode after mapped
        }
        return currentMode; // unchanged
      });

      const currentMap = midiMapRef.current;
      
      // Find which control is mapped to this midiKey or the raw numeric value (for backwards compatibility)
      let mappedControl: string | null = null;
      for (const [controlName, mappedKey] of Object.entries(currentMap)) {
        if (String(mappedKey) === midiKey || String(mappedKey) === String(rawValue)) {
          mappedControl = controlName;
          break;
        }
      }

      if (mappedControl) {
        // Automatically detect relative vs absolute CC messages
        let isRelativeCC = false;
        let delta = 0;
        
        if (status >= 176 && status <= 191) {
          const val = data2;
          const controlType = midiControlTypesRef.current[midiKey] || 'absolute';
          
          if (controlType === 'absolute') {
            if (val >= 10 && val <= 118) {
              midiControlTypesRef.current[midiKey] = 'absolute';
              midiRelativeCountRef.current[midiKey] = 0;
            } else if (val === 1 || val === 2 || val === 3 || val === 127 || val === 126 || val === 125 || val === 63 || val === 65) {
              if (!midiRelativeCountRef.current[midiKey]) midiRelativeCountRef.current[midiKey] = 0;
              midiRelativeCountRef.current[midiKey]++;
              if (midiRelativeCountRef.current[midiKey] >= 3) {
                midiControlTypesRef.current[midiKey] = 'relative';
              }
            }
          } else {
            if (val >= 10 && val <= 118) {
              midiControlTypesRef.current[midiKey] = 'absolute';
              midiRelativeCountRef.current[midiKey] = 0;
            } else {
              isRelativeCC = true;
            }
          }
          
          if (isRelativeCC) {
            if (val === 1 || val === 2 || val === 3) {
              delta = val;
            } else if (val === 127 || val === 126 || val === 125) {
              delta = -(128 - val);
            } else if (val === 65 || val === 66) {
              delta = val - 64;
            } else if (val === 63 || val === 62) {
              delta = -(64 - val);
            }
          }
        }

        // Apply change to the control
        switch (mappedControl) {
          case 'crossfader':
            if (isRelativeCC) {
              setCrossfader(p => Math.max(0, Math.min(1, p + delta * 0.015)));
            } else {
              setCrossfader(normalizedValue);
            }
            break;
          case 'masterVolume':
            if (isRelativeCC) {
              setMasterVolume(p => Math.max(0, Math.min(1.2, p + delta * 0.015)));
            } else {
              setMasterVolume(normalizedValue * 1.2);
            }
            break;
          case 'deckAVolume':
            if (isRelativeCC) {
              setDeckA(p => ({ ...p, volume: Math.max(0, Math.min(1, p.volume + delta * 0.015)) }));
            } else {
              setDeckA(p => ({ ...p, volume: normalizedValue }));
            }
            break;
          case 'deckBVolume':
            if (isRelativeCC) {
              setDeckB(p => ({ ...p, volume: Math.max(0, Math.min(1, p.volume + delta * 0.015)) }));
            } else {
              setDeckB(p => ({ ...p, volume: normalizedValue }));
            }
            break;
          case 'deckAEqHigh':
            if (isRelativeCC) {
              setDeckA(p => ({ ...p, eqHigh: Math.max(-12, Math.min(12, p.eqHigh + delta)) }));
            } else {
              setDeckA(p => ({ ...p, eqHigh: Math.round((normalizedValue * 24) - 12) }));
            }
            break;
          case 'deckAEqMid':
            if (isRelativeCC) {
              setDeckA(p => ({ ...p, eqMid: Math.max(-12, Math.min(12, p.eqMid + delta)) }));
            } else {
              setDeckA(p => ({ ...p, eqMid: Math.round((normalizedValue * 24) - 12) }));
            }
            break;
          case 'deckAEqLow':
            if (isRelativeCC) {
              setDeckA(p => ({ ...p, eqLow: Math.max(-12, Math.min(12, p.eqLow + delta)) }));
            } else {
              setDeckA(p => ({ ...p, eqLow: Math.round((normalizedValue * 24) - 12) }));
            }
            break;
          case 'deckBEqHigh':
            if (isRelativeCC) {
              setDeckB(p => ({ ...p, eqHigh: Math.max(-12, Math.min(12, p.eqHigh + delta)) }));
            } else {
              setDeckB(p => ({ ...p, eqHigh: Math.round((normalizedValue * 24) - 12) }));
            }
            break;
          case 'deckBEqMid':
            if (isRelativeCC) {
              setDeckB(p => ({ ...p, eqMid: Math.max(-12, Math.min(12, p.eqMid + delta)) }));
            } else {
              setDeckB(p => ({ ...p, eqMid: Math.round((normalizedValue * 24) - 12) }));
            }
            break;
          case 'deckBEqLow':
            if (isRelativeCC) {
              setDeckB(p => ({ ...p, eqLow: Math.max(-12, Math.min(12, p.eqLow + delta)) }));
            } else {
              setDeckB(p => ({ ...p, eqLow: Math.round((normalizedValue * 24) - 12) }));
            }
            break;
          case 'deckAPitch':
            if (isRelativeCC) {
              setDeckA(p => ({ ...p, pitch: Math.max(-16, Math.min(16, p.pitch + delta * 0.2)) }));
            } else {
              setDeckA(p => ({ ...p, pitch: (normalizedValue * 32) - 16 }));
            }
            break;
          case 'deckBPitch':
            if (isRelativeCC) {
              setDeckB(p => ({ ...p, pitch: Math.max(-16, Math.min(16, p.pitch + delta * 0.2)) }));
            } else {
              setDeckB(p => ({ ...p, pitch: (normalizedValue * 32) - 16 }));
            }
            break;
          case 'deckAFxFilter':
            if (isRelativeCC) {
              setDeckA(p => ({ ...p, fxFilter: Math.max(200, Math.min(18000, p.fxFilter + delta * 150)) }));
            } else {
              setDeckA(p => ({ ...p, fxFilter: Math.round(200 + normalizedValue * 17800) }));
            }
            break;
          case 'deckBFxFilter':
            if (isRelativeCC) {
              setDeckB(p => ({ ...p, fxFilter: Math.max(200, Math.min(18000, p.fxFilter + delta * 150)) }));
            } else {
              setDeckB(p => ({ ...p, fxFilter: Math.round(200 + normalizedValue * 17800) }));
            }
            break;
          default:
            break;
        }
      }
    };

    const updateDevices = (access: any) => {
      const devices: string[] = [];
      access.inputs.forEach((input: any) => {
        devices.push(input.name || 'Unknown MIDI Device');
        input.onmidimessage = onMIDIMessage;
      });
      setMidiDevices(devices);
    };

    navigator.requestMIDIAccess().then(access => {
      midiAccess = access;
      updateDevices(access);
      access.onstatechange = () => updateDevices(access);
    }).catch(err => {
      console.warn("MIDI access failed", err);
    });

    return () => {
      if (midiAccess) {
        midiAccess.inputs.forEach((input: any) => {
          input.onmidimessage = null;
        });
        midiAccess.onstatechange = null;
      }
    };
  }, []);

  // --- Protect from Accidental Refresh ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // --- Web Audio Unmount Cleanup ---
  useEffect(() => {
    return () => {
      try {
        deckASynthRef.current?.stop();
        deckBSynthRef.current?.stop();
        deckASourceRef.current?.stop();
        deckBSourceRef.current?.stop();
      } catch (e) {
        // Ignore stopped node errors
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error("Error closing AudioContext on unmount:", err));
      }
    };
  }, []);

  // --- Deck A Parameter Effects ---
  useEffect(() => {
    if (!audioStarted) return;
    // Volume Gain
    if (deckAVolRef.current) {
      deckAVolRef.current.gain.setValueAtTime(deckA.volume, audioContextRef.current!.currentTime);
    }
    // EQ High
    if (deckAEqHighRef.current) {
      deckAEqHighRef.current.gain.setValueAtTime(deckA.eqHigh, audioContextRef.current!.currentTime);
    }
    // EQ Mid
    if (deckAEqMidRef.current) {
      deckAEqMidRef.current.gain.setValueAtTime(deckA.eqMid, audioContextRef.current!.currentTime);
    }
    // EQ Low
    if (deckAEqLowRef.current) {
      deckAEqLowRef.current.gain.setValueAtTime(deckA.eqLow, audioContextRef.current!.currentTime);
    }
    // FX Filter cutoff
    if (deckAFxFilterRef.current) {
      deckAFxFilterRef.current.frequency.setValueAtTime(deckA.fxFilter, audioContextRef.current!.currentTime);
    }
    // FX Delay feedback & wet
    if (deckAFxDelayFeedbackRef.current) {
      deckAFxDelayFeedbackRef.current.gain.setValueAtTime(deckA.fxDelay * 0.7, audioContextRef.current!.currentTime);
    }
    if (deckAFxDelayWetRef.current) {
      deckAFxDelayWetRef.current.gain.setValueAtTime(deckA.fxDelay, audioContextRef.current!.currentTime);
    }
  }, [deckA.volume, deckA.eqHigh, deckA.eqMid, deckA.eqLow, deckA.fxFilter, deckA.fxDelay, audioStarted]);

  // --- Deck B Parameter Effects ---
  useEffect(() => {
    if (!audioStarted) return;
    // Volume Gain
    if (deckBVolRef.current) {
      deckBVolRef.current.gain.setValueAtTime(deckB.volume, audioContextRef.current!.currentTime);
    }
    // EQ High
    if (deckBEqHighRef.current) {
      deckBEqHighRef.current.gain.setValueAtTime(deckB.eqHigh, audioContextRef.current!.currentTime);
    }
    // EQ Mid
    if (deckBEqMidRef.current) {
      deckBEqMidRef.current.gain.setValueAtTime(deckB.eqMid, audioContextRef.current!.currentTime);
    }
    // EQ Low
    if (deckBEqLowRef.current) {
      deckBEqLowRef.current.gain.setValueAtTime(deckB.eqLow, audioContextRef.current!.currentTime);
    }
    // FX Filter cutoff
    if (deckBFxFilterRef.current) {
      deckBFxFilterRef.current.frequency.setValueAtTime(deckB.fxFilter, audioContextRef.current!.currentTime);
    }
    // FX Delay feedback & wet
    if (deckBFxDelayFeedbackRef.current) {
      deckBFxDelayFeedbackRef.current.gain.setValueAtTime(deckB.fxDelay * 0.7, audioContextRef.current!.currentTime);
    }
    if (deckBFxDelayWetRef.current) {
      deckBFxDelayWetRef.current.gain.setValueAtTime(deckB.fxDelay, audioContextRef.current!.currentTime);
    }
  }, [deckB.volume, deckB.eqHigh, deckB.eqMid, deckB.eqLow, deckB.fxFilter, deckB.fxDelay, audioStarted]);

  // --- Update Pitch/BPM Live ---
  useEffect(() => {
    if (!audioStarted) return;
    // Deck A
    const realBpmA = deckA.track.bpm * (1 + deckA.pitch / 100);
    if (deckASynthRef.current) {
      deckASynthRef.current.setBpm(realBpmA);
    }
    if (deckASourceRef.current) {
      deckASourceRef.current.playbackRate.setValueAtTime(1 + deckA.pitch / 100, audioContextRef.current!.currentTime);
    }
  }, [deckA.pitch, deckA.track, audioStarted]);

  useEffect(() => {
    if (!audioStarted) return;
    // Deck B
    const realBpmB = deckB.track.bpm * (1 + deckB.pitch / 100);
    if (deckBSynthRef.current) {
      deckBSynthRef.current.setBpm(realBpmB);
    }
    if (deckBSourceRef.current) {
      deckBSourceRef.current.playbackRate.setValueAtTime(1 + deckB.pitch / 100, audioContextRef.current!.currentTime);
    }
  }, [deckB.pitch, deckB.track, audioStarted]);

  // --- Rotational animation logic ---
  useEffect(() => {
    let frameId: any;
    const tick = () => {
      // Rotation speed based on pitch and play state
      if (deckA.isPlaying) {
        setDeckA(prev => ({
          ...prev,
          rotation: (prev.rotation + 2.5 * (1 + prev.pitch / 100)) % 360,
          currentTime: prev.currentTime + 0.1 > prev.totalDuration ? 0 : prev.currentTime + 0.1
        }));
      }
      if (deckB.isPlaying) {
        setDeckB(prev => ({
          ...prev,
          rotation: (prev.rotation + 2.5 * (1 + prev.pitch / 100)) % 360,
          currentTime: prev.currentTime + 0.1 > prev.totalDuration ? 0 : prev.currentTime + 0.1
        }));
      }
      frameId = setTimeout(tick, 100);
    };
    tick();
    return () => clearTimeout(frameId);
  }, [deckA.isPlaying, deckB.isPlaying]);

  // --- Load Track Utility ---
  const loadTrack = (deck: "A" | "B", track: Track) => {
    initAudio();
    if (deck === "A") {
      // Stop old
      if (deckA.isPlaying) {
        if (deckA.track.type === "synth") {
          deckASynthRef.current?.stop();
        } else {
          deckASourceRef.current?.stop();
        }
      }

      // Recreate synth or source
      setTimeout(() => {
        if (track.type === "synth" && audioContextRef.current && deckAEqHighRef.current) {
          deckASynthRef.current = new AudioLoopSynth(
            audioContextRef.current,
            track.id,
            track.bpm,
            deckAEqHighRef.current
          );
        }
        setDeckA(prev => ({
          ...prev,
          track,
          isPlaying: false,
          currentTime: 0,
          totalDuration: track.duration,
          hotCues: [null, null, null]
        }));
      }, 50);

    } else {
      // Stop old
      if (deckB.isPlaying) {
        if (deckB.track.type === "synth") {
          deckBSynthRef.current?.stop();
        } else {
          deckBSourceRef.current?.stop();
        }
      }

      setTimeout(() => {
        if (track.type === "synth" && audioContextRef.current && deckBEqHighRef.current) {
          deckBSynthRef.current = new AudioLoopSynth(
            audioContextRef.current,
            track.id,
            track.bpm,
            deckBEqHighRef.current
          );
        }
        setDeckB(prev => ({
          ...prev,
          track,
          isPlaying: false,
          currentTime: 0,
          totalDuration: track.duration,
          hotCues: [null, null, null]
        }));
      }, 50);
    }
  };

  // --- Custom File Decoding/Playback ---
  const handleUserFileUpload = async (file: File) => {
    initAudio();
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    const newTrack: Track = {
      id: `user-${Date.now()}`,
      title: cleanName.substring(0, 18) || "Uploaded Track",
      artist: "Local File",
      bpm: 120, // default bpm estimate
      duration: 30, // temporary, will read actual duration
      type: "user",
      genre: "Custom Audio",
      color: "from-blue-600 to-indigo-600",
      file: file
    };

    setTracks(prev => [newTrack, ...prev]);
  };

  // Custom audio file player with offset support and buffer caching
  const playUserTrack = async (deck: "A" | "B", track: Track, offset: number = 0) => {
    if (!track.file || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    try {
      let decodedBuffer = decodedBuffersRef.current[track.id];
      if (!decodedBuffer) {
        const arrayBuffer = await track.file.arrayBuffer();
        decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        decodedBuffersRef.current[track.id] = decodedBuffer;
      }

      // Save buffer duration
      if (deck === "A") {
        setDeckA(prev => ({ ...prev, totalDuration: decodedBuffer.duration }));
        
        // Stop current source if playing
        try {
          deckASourceRef.current?.stop();
        } catch (e) {
          // ignore
        }
        
        const source = ctx.createBufferSource();
        source.buffer = decodedBuffer;
        source.loop = true;
        source.playbackRate.value = 1 + deckA.pitch / 100;

        // Connect to start of processing chain
        if (deckAEqHighRef.current) {
          source.connect(deckAEqHighRef.current);
        }
        deckASourceRef.current = source;
        source.start(0, offset % decodedBuffer.duration);
      } else {
        setDeckB(prev => ({ ...prev, totalDuration: decodedBuffer.duration }));
        
        try {
          deckBSourceRef.current?.stop();
        } catch (e) {
          // ignore
        }
        
        const source = ctx.createBufferSource();
        source.buffer = decodedBuffer;
        source.loop = true;
        source.playbackRate.value = 1 + deckB.pitch / 100;

        if (deckBEqHighRef.current) {
          source.connect(deckBEqHighRef.current);
        }
        deckBSourceRef.current = source;
        source.start(0, offset % decodedBuffer.duration);
      }
    } catch (err) {
      console.error("Failed to play user custom track:", err);
    }
  };

  // Seek track navigation
  const seekTrack = (deck: "A" | "B", seekTime: number) => {
    if (deck === "A") {
      setDeckA(prev => ({ ...prev, currentTime: seekTime }));
      if (deckA.track.type === "user" && deckA.isPlaying && deckASourceRef.current) {
        playUserTrack("A", deckA.track, seekTime);
      }
    } else {
      setDeckB(prev => ({ ...prev, currentTime: seekTime }));
      if (deckB.track.type === "user" && deckB.isPlaying && deckBSourceRef.current) {
        playUserTrack("B", deckB.track, seekTime);
      }
    }
  };

  // --- Deck Action Triggers ---
  const togglePlay = (deck: "A" | "B") => {
    initAudio();
    if (deck === "A") {
      if (deckA.isPlaying) {
        if (deckA.track.type === "synth") {
          deckASynthRef.current?.stop();
        } else {
          deckASourceRef.current?.stop();
        }
        setDeckA(prev => ({ ...prev, isPlaying: false }));
      } else {
        if (deckA.track.type === "synth") {
          deckASynthRef.current?.start();
        } else {
          playUserTrack("A", deckA.track, deckA.currentTime);
        }
        setDeckA(prev => ({ ...prev, isPlaying: true }));
      }
    } else {
      if (deckB.isPlaying) {
        if (deckB.track.type === "synth") {
          deckBSynthRef.current?.stop();
        } else {
          deckBSourceRef.current?.stop();
        }
        setDeckB(prev => ({ ...prev, isPlaying: false }));
      } else {
        if (deckB.track.type === "synth") {
          deckBSynthRef.current?.start();
        } else {
          playUserTrack("B", deckB.track, deckB.currentTime);
        }
        setDeckB(prev => ({ ...prev, isPlaying: true }));
      }
    }
  };

  // --- Hot Cues triggers ---
  const triggerHotCue = (deck: "A" | "B", index: number) => {
    initAudio();
    const activeDeck = deck === "A" ? deckA : deckB;
    const timeVal = activeDeck.hotCues[index];

    if (timeVal === null) {
      // Record Hot Cue
      if (deck === "A") {
        setDeckA(prev => {
          const cues = [...prev.hotCues];
          cues[index] = prev.currentTime;
          return { ...prev, hotCues: cues };
        });
      } else {
        setDeckB(prev => {
          const cues = [...prev.hotCues];
          cues[index] = prev.currentTime;
          return { ...prev, hotCues: cues };
        });
      }
    } else {
      // Jump to Hot Cue
      if (deck === "A") {
        setDeckA(prev => ({ ...prev, currentTime: timeVal }));
        if (deckA.track.type === "user" && deckASourceRef.current) {
          // Restart audio buffer at specified offset
          playUserTrack("A", deckA.track, timeVal);
        }
      } else {
        setDeckB(prev => ({ ...prev, currentTime: timeVal }));
        if (deckB.track.type === "user" && deckBSourceRef.current) {
          playUserTrack("B", deckB.track, timeVal);
        }
      }
    }
  };

  // --- Reset cues ---
  const clearHotCues = (deck: "A" | "B") => {
    if (deck === "A") {
      setDeckA(prev => ({ ...prev, hotCues: [null, null, null] }));
    } else {
      setDeckB(prev => ({ ...prev, hotCues: [null, null, null] }));
    }
  };

  // --- Sync BPM ---
  const syncBpmToDeck = (targetDeck: "A" | "B") => {
    if (targetDeck === "A") {
      // Sync A to B
      const targetBpm = deckB.track.bpm * (1 + deckB.pitch / 100);
      const newPitch = ((targetBpm / deckA.track.bpm) - 1) * 100;
      setDeckA(prev => ({ ...prev, pitch: newPitch }));
    } else {
      // Sync B to A
      const targetBpm = deckA.track.bpm * (1 + deckA.pitch / 100);
      const newPitch = ((targetBpm / deckB.track.bpm) - 1) * 100;
      setDeckB(prev => ({ ...prev, pitch: newPitch }));
    }
  };

  // --- Drag & Drop Handlers ---
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("audio/")) {
        handleUserFileUpload(file);
      }
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("audio/")) {
        handleUserFileUpload(file);
      }
    }
  };

  if (currentView === "soundbite") {
    return (
      <div id="dj-console-container" className="flex-1 flex flex-col p-3 sm:p-6 max-w-[1400px] w-full mx-auto select-none gap-4 sm:gap-6">
        <div className="max-w-4xl mx-auto w-full">
          <button 
            onClick={() => setCurrentView("console")} 
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-mono cursor-pointer bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800"
          >
            <ArrowLeft className="w-4 h-4" /> BACK TO APEX: DJ Console : Deck-Two
          </button>
        </div>
        <SoundBitePro />
      </div>
    );
  }

  return (
    <div id="dj-console-container" className="flex-1 flex flex-col p-3 sm:p-6 max-w-[1400px] w-full mx-auto select-none gap-4 sm:gap-6">
      
      {/* HEADER SECTION */}
      <header id="console-header" className="flex flex-col md:flex-row justify-between items-center bg-[#0F0F0F] border border-[#1A1A1A] rounded-2xl p-4 sm:p-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-[#FF4B2B] to-[#FF8008] rounded-xl shadow-[0_0_15px_rgba(255,75,43,0.3)]">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-white flex items-center gap-2">
              APEX <span className="text-[#FF4B2B]">DECK-TWO</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-500 font-mono tracking-wider">STUDIO GRADE DUAL MIXER CONSOLE</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
          <button 
            onClick={() => setCurrentView("soundbite")}
            className="px-4 py-2 bg-[#FF4B2B]/10 text-[#FF4B2B] hover:bg-[#FF4B2B]/20 text-[10px] font-mono tracking-widest rounded-lg border border-[#FF4B2B]/30 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            RED SOUND SOUNDBITE
          </button>
          
          <button
            onClick={() => {
              const targets = [
                'crossfader', 'masterVolume',
                'deckAVolume', 'deckAEqHigh', 'deckAEqMid', 'deckAEqLow',
                'deckBVolume', 'deckBEqHigh', 'deckBEqMid', 'deckBEqLow',
                'deckAPitch', 'deckBPitch', 'deckAFxFilter', 'deckBFxFilter'
              ];
              if (!midiLearnMode) setMidiLearnMode(targets[0]);
              else {
                const idx = targets.indexOf(midiLearnMode);
                if (idx < targets.length - 1) setMidiLearnMode(targets[idx + 1]);
                else setMidiLearnMode(null);
              }
            }}
            className={cn(
              "px-3 py-2 text-[10px] font-mono tracking-widest rounded-lg border transition-colors flex items-center gap-2",
              midiDevices.length > 0
                ? midiLearnMode ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : "bg-zinc-800 text-zinc-500 border-zinc-700"
            )}
            title={midiDevices.join(', ')}
          >
            {midiDevices.length > 0 ? (midiLearnMode ? `LEARNING: ${midiLearnMode.toUpperCase()}` : "MIDI: CONNECTED") : "MIDI: DISCONNECTED"}
          </button>

          {!audioStarted ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={initAudio}
            className="px-4 sm:px-6 py-2 bg-gradient-to-r from-[#FF4B2B] to-[#FF8008] text-white font-mono font-medium rounded-xl shadow-[0_0_20px_rgba(255,75,43,0.3)] transition-all flex items-center gap-2 hover:brightness-110 text-xs sm:text-sm"
          >
            <Sparkles className="w-4 h-4" />
            INITIALIZE AUDIO SYSTEM
          </motion.button>
        ) : (
          <div className="flex items-center gap-2 bg-[#141414] px-4 py-2 rounded-xl border border-emerald-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] sm:text-xs text-emerald-400 font-mono">SYSTEM LIVE (WEB AUDIO API)</span>
          </div>
        )}
        </div>
      </header>

      {/* MAIN DECKS WORKSPACE */}
      <div id="main-studio-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        
        {/* --- DECK A (LEFT PANEL) --- */}
        <section id="deck-a-panel" className="lg:col-span-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-4 sm:p-6 flex flex-col justify-between gap-4 sm:gap-6 hover:border-purple-500/20 transition-all shadow-xl relative overflow-hidden">
          {/* Subtle neon gradient glow */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />

          {/* Deck A Header */}
          <div className="flex justify-between items-start z-10 gap-2">
            <div className="min-w-0 flex-1">
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 font-mono text-[10px] uppercase font-bold rounded-md tracking-wider border border-purple-500/20">
                DECK A
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white truncate mt-2 max-w-[130px] min-[380px]:max-w-[180px] sm:max-w-xs">
                {deckA.track.title}
              </h2>
              <p className="text-xs text-zinc-500 truncate">{deckA.track.artist}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-mono text-purple-400 flex items-center gap-2 justify-end">
                {deckA.track.key && <span className="bg-purple-900/40 text-purple-200 px-1.5 py-0.5 rounded text-[9px]">{deckA.track.key}</span>}
                <span>{(deckA.track.bpm * (1 + deckA.pitch / 100)).toFixed(1)} <span className="text-[10px] text-zinc-500">BPM</span></span>
              </p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <button 
                  onClick={() => syncBpmToDeck("A")}
                  className="px-2 py-0.5 bg-zinc-800 text-[9px] font-mono rounded hover:bg-zinc-700 text-purple-300 transition-colors"
                >SYNC</button>
                <p className="text-[10px] font-mono text-zinc-600">
                  ORIG: {deckA.track.bpm} BPM
                </p>
              </div>
            </div>
          </div>

          {/* TURNTABLE SECTION */}
          <div className="flex justify-center my-2 sm:my-4 relative">
            <div 
              id="vinyl-deck-a"
              style={{ transform: `rotate(${deckA.rotation}deg)` }}
              className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-radial from-[#151515] to-[#0D0D0D] border-4 border-[#1C1C1C] flex items-center justify-center cursor-pointer shadow-2xl overflow-hidden transition-transform ease-out"
              onClick={() => togglePlay("A")}
            >
              {/* Grooves */}
              <div className="absolute inset-4 rounded-full border border-zinc-800/20" />
              <div className="absolute inset-8 rounded-full border border-zinc-800/10" />
              <div className="absolute inset-12 rounded-full border border-zinc-800/20" />
              <div className="absolute inset-16 rounded-full border border-zinc-800/10" />
              <div className="absolute inset-20 rounded-full border border-zinc-800/15" />
              <div className="absolute inset-24 rounded-full border border-zinc-800/5" />

              {/* Deck Style Center Label */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg relative">
                <Disc className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin-slow" />
                {/* Center Spindle Hole */}
                <div className="absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#0A0A0A] border border-zinc-800" />
              </div>

              {/* Sound Indicator Accent */}
              <div className="absolute top-2 left-1/2 w-1 h-6 sm:w-1.5 sm:h-10 bg-purple-400/80 rounded-full -translate-x-1/2 shadow-lg" />
            </div>

            {/* Tonearm Needle */}
            <div className="hidden sm:block absolute top-0 right-4 w-12 h-28 pointer-events-none transform origin-top-right rotate-6 transition-transform">
              {/* Metallic arm arm */}
              <div className="absolute right-2 top-0 w-1.5 h-20 bg-zinc-600 rounded-full rotate-6" />
              {/* Needle cart */}
              <div className="absolute right-4 top-20 w-4 h-6 bg-zinc-800 border border-zinc-700 rounded-sm flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* VISUALIZER & TIMING */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono text-zinc-500 px-1">
              <span>{Math.floor(deckA.currentTime / 60)}:{(deckA.currentTime % 60).toFixed(0).padStart(2, "0")}</span>
              <span>{Math.floor(deckA.totalDuration / 60)}:{(deckA.totalDuration % 60).toFixed(0).padStart(2, "0")}</span>
            </div>
            
            {/* Waveform Progress Bar */}
            <input 
              type="range"
              min="0"
              max={deckA.totalDuration || 30}
              step="0.1"
              value={deckA.currentTime}
              onChange={(e) => seekTrack("A", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-purple-500 outline-none"
              style={{
                background: `linear-gradient(to right, #a855f7 0%, #ec4899 ${(deckA.currentTime / (deckA.totalDuration || 30)) * 100}%, #18181b ${(deckA.currentTime / (deckA.totalDuration || 30)) * 100}%, #18181b 100%)`
              }}
            />

            {/* Live Audio Visualizer Canvas */}
            <div className="w-full h-10 bg-[#0E0E0E] rounded-xl border border-zinc-900 overflow-hidden mt-1 relative">
              <canvas ref={canvasRefA} width={280} height={40} className="w-full h-full" />
              {!deckA.isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                  <span className="text-[10px] font-mono text-zinc-600 tracking-wider">WAITING FOR AUDIO PLAY</span>
                </div>
              )}
            </div>
          </div>

          {/* CONTROLS (PLAY/CUE, PITCH SLIDER) */}
          <div className="flex gap-4 items-center mt-2 justify-between">
            {/* Play Button */}
            <button 
              id="play-btn-a"
              onClick={() => togglePlay("A")}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md border",
                deckA.isPlaying 
                  ? "bg-[#FF4B2B] border-[#FF4B2B] text-white shadow-[#FF4B2B]/20" 
                  : "bg-zinc-900 border-zinc-800 text-purple-400 hover:text-white"
              )}
            >
              {deckA.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
            </button>

            {/* Pitch / Tempo slider */}
            <div className="flex-1 flex flex-col gap-1 ml-2">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>PITCH / BPM</span>
                <span className={deckA.pitch === 0 ? "text-zinc-600" : "text-purple-400"}>
                  {deckA.pitch > 0 ? "+" : ""}{deckA.pitch.toFixed(1)}%
                </span>
              </div>
              <input 
                type="range"
                min="-16"
                max="16"
                step="0.1"
                value={deckA.pitch}
                onChange={(e) => setDeckA(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                className="w-full accent-purple-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-zinc-600">
                <span>-16%</span>
                <button onClick={() => setDeckA(prev => ({ ...prev, pitch: 0 }))} className="hover:text-white">RESET</button>
                <span>+16%</span>
              </div>
            </div>
          </div>

          {/* HOT CUES & AUDIO LOOPS */}
          <div className="grid grid-cols-2 gap-4 border-t border-[#151515] pt-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-zinc-500 tracking-wider">HOT CUES (TAP TO SET/JUMP)</span>
              <div className="flex gap-1.5">
                {deckA.hotCues.map((cue, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerHotCue("A", idx)}
                    className={cn(
                      "flex-1 py-1 px-1 rounded text-[10px] font-mono border transition-all text-center",
                      cue !== null 
                        ? "bg-purple-600/20 border-purple-500/40 text-purple-300" 
                        : "bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    {cue !== null ? `C${idx+1}` : `+`}
                  </button>
                ))}
              </div>
              {deckA.hotCues.some(c => c !== null) && (
                <button 
                  onClick={() => clearHotCues("A")}
                  className="text-[8px] font-mono text-zinc-600 hover:text-zinc-400 text-left mt-0.5"
                >
                  CLEAR CUES
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-zinc-500 tracking-wider">FILTER SWEEP (LOW / HIGH)</span>
              <div className="flex items-center gap-2">
                <input 
                  type="range"
                  min="200"
                  max="18000"
                  value={deckA.fxFilter}
                  onChange={(e) => setDeckA(prev => ({ ...prev, fxFilter: parseInt(e.target.value) }))}
                  className="w-full accent-pink-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-zinc-600">
                <span>LOWPASS</span>
                <button onClick={() => setDeckA(prev => ({ ...prev, fxFilter: 10000 }))} className="hover:text-white">BYPASS</button>
                <span>HIGHPASS</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- CENTRAL MIXER (MIDDLE PANEL) --- */}
        <section id="central-mixer-panel" className="lg:col-span-4 bg-[#080808] border border-[#1A1A1A] rounded-3xl p-4 sm:p-6 flex flex-col justify-between gap-4 sm:gap-6 shadow-2xl relative">
          
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <h3 className="text-xs font-mono text-zinc-500 tracking-widest uppercase flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#FF4B2B]" />
              EQ MIXING ENGINE
            </h3>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#FF4B2B]" />
              <span className="text-[9px] font-mono text-zinc-500">VU ANALOG</span>
            </div>
          </div>

          {/* DUAL CHANNEL STRIPS & MASTER VU */}
          <div className="flex justify-between gap-2 flex-1 my-2">
            
            {/* CH A Mixer Strip */}
            <div className="flex-1 min-w-0 flex flex-col items-center gap-4 bg-[#0D0D0D] p-2 sm:p-3 rounded-2xl border border-zinc-900">
              <span className="text-[10px] font-mono text-purple-400 font-bold">CH A</span>
              
              {/* EQ Knobs/Sliders */}
              <div className="flex flex-col gap-3 w-full">
                {/* HIGH */}
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500 px-1">
                    <span>HI</span>
                    <span>{deckA.eqHigh > 0 ? "+" : ""}{deckA.eqHigh}dB</span>
                  </div>
                  <input 
                    type="range" min="-12" max="12" step="1" value={deckA.eqHigh}
                    onChange={(e) => setDeckA(prev => ({ ...prev, eqHigh: parseInt(e.target.value) }))}
                    className="accent-purple-500 h-1 bg-zinc-950 rounded cursor-pointer w-full"
                  />
                </div>

                {/* MID */}
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500 px-1">
                    <span>MID</span>
                    <span>{deckA.eqMid > 0 ? "+" : ""}{deckA.eqMid}dB</span>
                  </div>
                  <input 
                    type="range" min="-12" max="12" step="1" value={deckA.eqMid}
                    onChange={(e) => setDeckA(prev => ({ ...prev, eqMid: parseInt(e.target.value) }))}
                    className="accent-purple-500 h-1 bg-zinc-950 rounded cursor-pointer w-full"
                  />
                </div>

                {/* LOW */}
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500 px-1">
                    <span>LOW</span>
                    <span>{deckA.eqLow > 0 ? "+" : ""}{deckA.eqLow}dB</span>
                  </div>
                  <input 
                    type="range" min="-12" max="12" step="1" value={deckA.eqLow}
                    onChange={(e) => setDeckA(prev => ({ ...prev, eqLow: parseInt(e.target.value) }))}
                    className="accent-purple-500 h-1 bg-zinc-950 rounded cursor-pointer w-full"
                  />
                </div>
              </div>

              {/* Volume Slider A */}
              <div className="flex flex-col items-center gap-1.5 w-full mt-2 border-t border-zinc-900 pt-3">
                <span className="text-[8px] font-mono text-zinc-500">VOLUME</span>
                <input 
                  type="range" min="0" max="1" step="0.05" value={deckA.volume}
                  onChange={(e) => setDeckA(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="accent-purple-500 h-16 cursor-pointer -rotate-180 w-1"
                  style={{ writingMode: "bt-lr", appearance: "slider-vertical" } as any}
                />
              </div>
            </div>

            {/* MASTER VU METER */}
            <div className="w-10 bg-[#0A0A0A] border border-zinc-900 rounded-2xl flex flex-col justify-between items-center py-4 relative">
              <div className="flex flex-col gap-0.5 h-full w-2.5 overflow-hidden justify-end">
                {Array.from({ length: 14 }).map((_, idx) => {
                  const isActive = (1 - (idx / 14)) < (deckA.isPlaying || deckB.isPlaying ? (crossfader > 0.4 && crossfader < 0.6 ? 0.8 : 0.6) : 0.05);
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "w-full h-1 rounded-sm transition-all duration-75",
                        isActive 
                          ? idx < 3 
                            ? "bg-red-500" 
                            : idx < 6 
                              ? "bg-amber-500" 
                              : "bg-emerald-500" 
                          : "bg-zinc-900"
                      )} 
                    />
                  );
                })}
              </div>
              <span className="text-[7px] font-mono text-zinc-600 uppercase mt-2">dB</span>
            </div>

            {/* CH B Mixer Strip */}
            <div className="flex-1 min-w-0 flex flex-col items-center gap-4 bg-[#0D0D0D] p-2 sm:p-3 rounded-2xl border border-zinc-900">
              <span className="text-[10px] font-mono text-emerald-400 font-bold">CH B</span>
              
              {/* EQ Knobs/Sliders */}
              <div className="flex flex-col gap-3 w-full">
                {/* HIGH */}
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500 px-1">
                    <span>HI</span>
                    <span>{deckB.eqHigh > 0 ? "+" : ""}{deckB.eqHigh}dB</span>
                  </div>
                  <input 
                    type="range" min="-12" max="12" step="1" value={deckB.eqHigh}
                    onChange={(e) => setDeckB(prev => ({ ...prev, eqHigh: parseInt(e.target.value) }))}
                    className="accent-emerald-500 h-1 bg-zinc-950 rounded cursor-pointer w-full"
                  />
                </div>

                {/* MID */}
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500 px-1">
                    <span>MID</span>
                    <span>{deckB.eqMid > 0 ? "+" : ""}{deckB.eqMid}dB</span>
                  </div>
                  <input 
                    type="range" min="-12" max="12" step="1" value={deckB.eqMid}
                    onChange={(e) => setDeckB(prev => ({ ...prev, eqMid: parseInt(e.target.value) }))}
                    className="accent-emerald-500 h-1 bg-zinc-950 rounded cursor-pointer w-full"
                  />
                </div>

                {/* LOW */}
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500 px-1">
                    <span>LOW</span>
                    <span>{deckB.eqLow > 0 ? "+" : ""}{deckB.eqLow}dB</span>
                  </div>
                  <input 
                    type="range" min="-12" max="12" step="1" value={deckB.eqLow}
                    onChange={(e) => setDeckB(prev => ({ ...prev, eqLow: parseInt(e.target.value) }))}
                    className="accent-emerald-500 h-1 bg-zinc-950 rounded cursor-pointer w-full"
                  />
                </div>
              </div>

              {/* Volume Slider B */}
              <div className="flex flex-col items-center gap-1.5 w-full mt-2 border-t border-zinc-900 pt-3">
                <span className="text-[8px] font-mono text-zinc-500">VOLUME</span>
                <input 
                  type="range" min="0" max="1" step="0.05" value={deckB.volume}
                  onChange={(e) => setDeckB(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                  className="accent-emerald-500 h-16 cursor-pointer -rotate-180 w-1"
                  style={{ writingMode: "bt-lr", appearance: "slider-vertical" } as any}
                />
              </div>
            </div>

          </div>

          {/* DELAY FEEDBACK SYSTEM */}
          <div className="bg-[#0B0B0B] border border-zinc-900 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-[9px] font-mono text-zinc-400 tracking-wider">ECHO DELAY FX ENGINE</span>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                  <span className="truncate">DECK A FEED</span>
                  <span>{(deckA.fxDelay * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0" max="0.85" step="0.05" value={deckA.fxDelay}
                  onChange={(e) => setDeckA(prev => ({ ...prev, fxDelay: parseFloat(e.target.value) }))}
                  className="accent-purple-500 h-1 bg-zinc-900 rounded-lg cursor-pointer w-full"
                />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                  <span className="truncate">DECK B FEED</span>
                  <span>{(deckB.fxDelay * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0" max="0.85" step="0.05" value={deckB.fxDelay}
                  onChange={(e) => setDeckB(prev => ({ ...prev, fxDelay: parseFloat(e.target.value) }))}
                  className="accent-emerald-500 h-1 bg-zinc-900 rounded-lg cursor-pointer w-full"
                />
              </div>
            </div>
          </div>

          {/* MASTER CROSSFADER & VOLUME */}
          <div className="flex flex-col gap-4 border-t border-zinc-900 pt-4">
            
            {/* Master Volume */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                MASTER OUT
              </span>
              <span className="text-xs font-mono text-[#FF4B2B] font-bold">
                {(masterVolume * 100).toFixed(0)}%
              </span>
            </div>
            <input 
              type="range" min="0" max="1.2" step="0.05" value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="accent-[#FF4B2B] h-1.5 bg-zinc-900 rounded-lg cursor-pointer"
            />

            {/* Crossfader bar */}
            <div className="flex flex-col gap-1.5 bg-[#0C0C0C] p-3 rounded-2xl border border-zinc-900">
              <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                <span className={crossfader < 0.4 ? "text-purple-400 font-bold" : ""}>DECK A</span>
                <span>CROSSFADER</span>
                <span className={crossfader > 0.6 ? "text-emerald-400 font-bold" : ""}>DECK B</span>
              </div>
              
              <input 
                type="range" min="0" max="1" step="0.01" value={crossfader}
                onChange={(e) => setCrossfader(parseFloat(e.target.value))}
                className="w-full accent-[#FF4B2B] h-2 bg-zinc-950 rounded-lg cursor-pointer"
              />
              
              <div className="flex justify-between text-[8px] font-mono text-zinc-600">
                <button onClick={() => setCrossfader(0)} className="hover:text-white">100% A</button>
                <button onClick={() => setCrossfader(0.5)} className="hover:text-white">CENTER</button>
                <button onClick={() => setCrossfader(1)} className="hover:text-white">100% B</button>
              </div>
            </div>

          </div>
        </section>

        {/* --- DECK B (RIGHT PANEL) --- */}
        <section id="deck-b-panel" className="lg:col-span-4 bg-[#0A0A0A] border border-[#1A1A1A] rounded-3xl p-4 sm:p-6 flex flex-col justify-between gap-4 sm:gap-6 hover:border-emerald-500/20 transition-all shadow-xl relative overflow-hidden">
          {/* Subtle neon gradient glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />

          {/* Deck B Header */}
          <div className="flex justify-between items-start z-10 gap-2">
            <div className="min-w-0 flex-1">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase font-bold rounded-md tracking-wider border border-emerald-500/20">
                DECK B
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white truncate mt-2 max-w-[130px] min-[380px]:max-w-[180px] sm:max-w-xs">
                {deckB.track.title}
              </h2>
              <p className="text-xs text-zinc-500 truncate">{deckB.track.artist}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-mono text-emerald-400 flex items-center gap-2 justify-end">
                {deckB.track.key && <span className="bg-emerald-900/40 text-emerald-200 px-1.5 py-0.5 rounded text-[9px]">{deckB.track.key}</span>}
                <span>{(deckB.track.bpm * (1 + deckB.pitch / 100)).toFixed(1)} <span className="text-[10px] text-zinc-500">BPM</span></span>
              </p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <button 
                  onClick={() => syncBpmToDeck("B")}
                  className="px-2 py-0.5 bg-zinc-800 text-[9px] font-mono rounded hover:bg-zinc-700 text-emerald-300 transition-colors"
                >SYNC</button>
                <p className="text-[10px] font-mono text-zinc-600">
                  ORIG: {deckB.track.bpm} BPM
                </p>
              </div>
            </div>
          </div>

          {/* TURNTABLE SECTION */}
          <div className="flex justify-center my-2 sm:my-4 relative">
            <div 
              id="vinyl-deck-b"
              style={{ transform: `rotate(${deckB.rotation}deg)` }}
              className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-radial from-[#151515] to-[#0D0D0D] border-4 border-[#1C1C1C] flex items-center justify-center cursor-pointer shadow-2xl overflow-hidden transition-transform ease-out"
              onClick={() => togglePlay("B")}
            >
              {/* Grooves */}
              <div className="absolute inset-4 rounded-full border border-zinc-800/20" />
              <div className="absolute inset-8 rounded-full border border-zinc-800/10" />
              <div className="absolute inset-12 rounded-full border border-zinc-800/20" />
              <div className="absolute inset-16 rounded-full border border-zinc-800/10" />
              <div className="absolute inset-20 rounded-full border border-zinc-800/15" />
              <div className="absolute inset-24 rounded-full border border-zinc-800/5" />

              {/* Deck Style Center Label */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg relative">
                <Disc2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin-slow" />
                {/* Center Spindle Hole */}
                <div className="absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-[#0A0A0A] border border-zinc-800" />
              </div>

              {/* Sound Indicator Accent */}
              <div className="absolute top-2 left-1/2 w-1 h-6 sm:w-1.5 sm:h-10 bg-emerald-400/80 rounded-full -translate-x-1/2 shadow-lg" />
            </div>

            {/* Tonearm Needle */}
            <div className="hidden sm:block absolute top-0 right-4 w-12 h-28 pointer-events-none transform origin-top-right rotate-6 transition-transform">
              {/* Metallic arm arm */}
              <div className="absolute right-2 top-0 w-1.5 h-20 bg-zinc-600 rounded-full rotate-6" />
              {/* Needle cart */}
              <div className="absolute right-4 top-20 w-4 h-6 bg-zinc-800 border border-zinc-700 rounded-sm flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* VISUALIZER & TIMING */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono text-zinc-500 px-1">
              <span>{Math.floor(deckB.currentTime / 60)}:{(deckB.currentTime % 60).toFixed(0).padStart(2, "0")}</span>
              <span>{Math.floor(deckB.totalDuration / 60)}:{(deckB.totalDuration % 60).toFixed(0).padStart(2, "0")}</span>
            </div>
            
            {/* Waveform Progress Bar */}
            <input 
              type="range"
              min="0"
              max={deckB.totalDuration || 30}
              step="0.1"
              value={deckB.currentTime}
              onChange={(e) => seekTrack("B", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-900 rounded-full appearance-none cursor-pointer accent-emerald-500 outline-none"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #06b6d4 ${(deckB.currentTime / (deckB.totalDuration || 30)) * 100}%, #18181b ${(deckB.currentTime / (deckB.totalDuration || 30)) * 100}%, #18181b 100%)`
              }}
            />

            {/* Live Audio Visualizer Canvas */}
            <div className="w-full h-10 bg-[#0E0E0E] rounded-xl border border-zinc-900 overflow-hidden mt-1 relative">
              <canvas ref={canvasRefB} width={280} height={40} className="w-full h-full" />
              {!deckB.isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                  <span className="text-[10px] font-mono text-zinc-600 tracking-wider">WAITING FOR AUDIO PLAY</span>
                </div>
              )}
            </div>
          </div>

          {/* CONTROLS (PLAY/CUE, PITCH SLIDER) */}
          <div className="flex gap-4 items-center mt-2 justify-between">
            {/* Play Button */}
            <button 
              id="play-btn-b"
              onClick={() => togglePlay("B")}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md border",
                deckB.isPlaying 
                  ? "bg-[#FF4B2B] border-[#FF4B2B] text-white shadow-[#FF4B2B]/20" 
                  : "bg-zinc-900 border-zinc-800 text-emerald-400 hover:text-white"
              )}
            >
              {deckB.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
            </button>

            {/* Pitch / Tempo slider */}
            <div className="flex-1 flex flex-col gap-1 ml-2">
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>PITCH / BPM</span>
                <span className={deckB.pitch === 0 ? "text-zinc-600" : "text-emerald-400"}>
                  {deckB.pitch > 0 ? "+" : ""}{deckB.pitch.toFixed(1)}%
                </span>
              </div>
              <input 
                type="range"
                min="-16"
                max="16"
                step="0.1"
                value={deckB.pitch}
                onChange={(e) => setDeckB(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                className="w-full accent-emerald-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-zinc-600">
                <span>-16%</span>
                <button onClick={() => setDeckB(prev => ({ ...prev, pitch: 0 }))} className="hover:text-white">RESET</button>
                <span>+16%</span>
              </div>
            </div>
          </div>

          {/* HOT CUES & AUDIO LOOPS */}
          <div className="grid grid-cols-2 gap-4 border-t border-[#151515] pt-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-zinc-500 tracking-wider">HOT CUES (TAP TO SET/JUMP)</span>
              <div className="flex gap-1.5">
                {deckB.hotCues.map((cue, idx) => (
                  <button
                    key={idx}
                    onClick={() => triggerHotCue("B", idx)}
                    className={cn(
                      "flex-1 py-1 px-1 rounded text-[10px] font-mono border transition-all text-center",
                      cue !== null 
                        ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300" 
                        : "bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    {cue !== null ? `C${idx+1}` : `+`}
                  </button>
                ))}
              </div>
              {deckB.hotCues.some(c => c !== null) && (
                <button 
                  onClick={() => clearHotCues("B")}
                  className="text-[8px] font-mono text-zinc-600 hover:text-zinc-400 text-left mt-0.5"
                >
                  CLEAR CUES
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-zinc-500 tracking-wider">FILTER SWEEP (LOW / HIGH)</span>
              <div className="flex items-center gap-2">
                <input 
                  type="range"
                  min="200"
                  max="18000"
                  value={deckB.fxFilter}
                  onChange={(e) => setDeckB(prev => ({ ...prev, fxFilter: parseInt(e.target.value) }))}
                  className="w-full accent-cyan-500 h-1 bg-zinc-900 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[8px] font-mono text-zinc-600">
                <span>LOWPASS</span>
                <button onClick={() => setDeckB(prev => ({ ...prev, fxFilter: 10000 }))} className="hover:text-white">BYPASS</button>
                <span>HIGHPASS</span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* TRACK LIBRARY & FILE UPLOADER */}
      <footer id="console-library-footer" className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 bg-[#090909] border border-[#1A1A1A] rounded-3xl p-4 sm:p-6 relative">
        
        {/* DRAG AND DROP FILE UPLOADER */}
        <div 
          id="uploader-container"
          className={cn(
            "md:col-span-4 rounded-2xl border-2 border-dashed p-4 sm:p-6 flex flex-col justify-center items-center text-center cursor-pointer transition-all gap-3 select-none relative",
            isDragging 
              ? "border-[#FF4B2B] bg-[#FF4B2B]/5" 
              : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40"
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => document.getElementById("file-loader-input")?.click()}
        >
          <input 
            type="file" 
            id="file-loader-input" 
            accept="audio/*" 
            className="hidden" 
            onChange={onFileSelect} 
          />
          <div className="p-3 bg-[#111111] rounded-xl border border-zinc-800/80 shadow-md">
            <Upload className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-300 font-mono">DRAG & DROP CUSTOM TRACKS</h4>
            <p className="text-[10px] text-zinc-500 mt-1">Supports MP3, WAV, FLAC, M4A, OGG</p>
          </div>
        </div>

        {/* LIBRARY LIST */}
        <div id="library-list-container" className="md:col-span-8 flex flex-col gap-3 min-w-0">
          <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Music className="w-3.5 h-3.5" />
            CONSOLE AUDIO LIBRARY presets & uploads
          </h3>
          
          <div className="max-h-[280px] sm:max-h-[350px] overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
            {tracks.map((track) => (
              <div 
                key={track.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-all group hover:bg-zinc-950/80 gap-3 sm:gap-4 min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn("w-2 h-8 rounded-full bg-gradient-to-b shadow-sm shrink-0", track.color)} />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-zinc-300 truncate max-w-[160px] min-[400px]:max-w-[220px] sm:max-w-xs md:max-w-md">
                      {track.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 truncate">
                      {track.artist} • <span className="text-zinc-600 font-mono">{track.genre}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-mono text-zinc-400">{track.bpm} BPM</span>
                    <p className="text-[8px] font-mono text-zinc-600">{track.type === "synth" ? "BUILT-IN SYNTH" : "CUSTOM FILE"}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-1.5">
                    <button
                      onClick={() => loadTrack("A", track)}
                      className="px-3 py-1 text-[10px] font-mono rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 cursor-pointer w-16 sm:w-auto text-center font-bold"
                    >
                      LOAD A
                    </button>
                    <button
                      onClick={() => loadTrack("B", track)}
                      className="px-3 py-1 text-[10px] font-mono rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-pointer w-16 sm:w-auto text-center font-bold"
                    >
                      LOAD B
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </footer>
      
      {/* QUICK WARNING NOTICE & AUTHOR INFO */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        <div id="license-notice" className="bg-[#0A0A0A] border border-zinc-900/60 p-3.5 rounded-2xl flex items-center gap-3 flex-1">
          <CircleAlert className="w-5 h-5 text-amber-500/80 shrink-0" />
          <p className="text-[10px] leading-relaxed text-zinc-500 font-sans">
            This APEX: DJ Console : Deck-Two is fully functional on the client side using the HTML5 <strong className="text-zinc-400">Web Audio API</strong>. Built-in loops are procedurally synthesized in real time. For the ultimate custom mix, drag and drop your own audio tracks to control pitch, EQ filtering, and echo delays instantly.
          </p>
        </div>
        
        <div className="bg-[#0A0A0A] border border-zinc-900/60 p-3.5 px-5 rounded-2xl flex flex-col justify-center shrink-0 min-w-[220px]">
          <div className="flex justify-between text-[7px] uppercase tracking-widest text-zinc-500 mb-1.5">
            <span>Product Design Portfolio</span>
            <span>© 2026</span>
          </div>
          <button 
            onClick={() => setIsContactModalOpen(true)}
            className="text-left text-[11px] font-bold uppercase tracking-widest text-[#00F0FF] truncate cursor-pointer hover:text-white transition-colors"
          >
            Stanislav Dovidenko
          </button>
          <div className="h-0.5 bg-zinc-900 rounded-full overflow-hidden mt-2">
            <div className="h-full w-full bg-zinc-700"></div>
          </div>
        </div>

        {/* PRODUCT HUNT BADGE */}
        <div className="shrink-0 flex items-center justify-center">
          <a 
            href="https://www.producthunt.com/products/apex-dj-console?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-apex-dj-console" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block hover:opacity-90 transition-opacity"
          >
            <img 
              alt="APEX: DJ Console - Browser-based DJ deck with live procedural audio synthesis  | Product Hunt" 
              width="250" 
              height="54" 
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1191125&amp;theme=dark&amp;t=1783622466278"
              className="h-[54px] w-[250px] object-contain rounded-xl border border-zinc-900/60"
            />
          </a>
        </div>
      </div>

      {isContactModalOpen && (
        <ContactModal onClose={() => setIsContactModalOpen(false)} />
      )}
    </div>
  );
}
