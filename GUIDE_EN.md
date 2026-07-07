# APEX: DJ Console : Deck-Two User Guide

Welcome to the **APEX: DJ Console : Deck-Two** web interface! This is a full-fledged musical instrument running directly in your browser, powered by the Web Audio API. Below are the core principles for operating the console.

## 1. Basic Deck Usage (Deck A / Deck B)

The console consists of two independent decks. Each acts as a standalone audio generator (synthesizer) or as a player for your uploaded tracks.

*   **Selecting a Preset (Genre):** In the center of the interface (above the mixer), you will find buttons to switch between genre presets (e.g., Cosmic Techno, Lofi Hip Hop, etc.). Selecting a preset alters the characteristics of the synthesized audio.
*   **Play and Pause:** Press the Play button (►) on Deck A or B to start procedural sound generation (or to play a loaded audio file).
*   **Mixing (Crossfader):** Between the two decks lies the crossfader slider. Move it to the left (towards A) to hear only Deck A. Move it to the right (towards B) to hear only Deck B. The center position mixes both signals equally.
*   **Equalizer (EQ) and Volume:** Each deck features a 3-band equalizer (Low, Mid, High) for frequency adjustment and an individual Gain (volume) slider.
*   **Effects:** You can apply Delay and Reverb by tweaking Time/Feedback and Mix/Decay parameters, respectively. You can also utilize filters (LPF/HPF).
*   **Loading Custom Tracks:** At the bottom of the screen is an audio library with a Drag & Drop area. You can drop your audio files (MP3, WAV, etc.) here and click "LOAD A" or "LOAD B" to assign the track to a specific deck. The loaded track will replace the built-in synthesizer.

## 2. RED SOUND SOUNDBITE PRO Sampler Module

The Soundbite Pro module (located at the top/side of the console) is designed for capturing and looping audio on the fly, allowing for seamless live loops and real-time beatmatching.

*   **Purpose:** This module allows you to capture an audio segment (sample) and play it in a continuous loop. This is exceptionally useful when transitioning between tracks or adding extra rhythmic layers.
*   **Loop Control:** The panel features loop duration buttons (e.g., 1, 2, 4, 8, 16, 32 beats). Click a desired interval to instantly "catch" a loop of the current audio and start playing it repeatedly.
*   **BPM Synchronization:** The module attempts to automatically detect the tempo (BPM) and adjust the sample length so it stays perfectly on beat with the current mix.

## 3. Connecting a MIDI Controller

For the ultimate experience, you can connect any physical MIDI controller supported by your browser via the Web MIDI API.

1.  **Connection:** Connect your MIDI device (e.g., a DJ controller, synthesizer, or MIDI keyboard) via USB to your computer *before* launching or refreshing the page. The browser may ask for permission to use MIDI devices.
2.  **MIDI Learn Mode:** Look for the **"MIDI Learn"** toggle (or button) in the interface. Click it to enter mapping mode.
3.  **Mapping Controls:**
    *   Click on a UI element on the screen that you wish to control (for example, the crossfader, Deck A volume slider, or EQ Bass knob).
    *   Once the virtual element is selected, turn the knob or move the fader on your physical MIDI controller.
    *   The UI element will flash or change color, confirming a successful mapping binding.
4.  **Exit Mode:** Toggle off "MIDI Learn". Your physical hardware knobs and sliders will now control the assigned virtual counterparts in real time.

Enjoy mixing and creating with APEX: DJ Console : Deck-Two!
