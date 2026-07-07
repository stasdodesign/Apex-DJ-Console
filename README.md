# Remix: DJ Console

[![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Interactive-FF4B2B?style=for-the-badge&logo=soundcharts)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

---

## 🇷🇺 Русская версия

### Описание проекта
**Remix: DJ Console** — это интерактивная веб-джей-система с живым процедурным аудиосинтезом, работающая прямо в вашем браузере. Это полноценный браузерный аудио-инструмент и эксперимент на стыке веб-технологий, аудиоинженерии и интерактивного UI. 

Вся обработка звука происходит на стороне клиента с помощью низкоуровневого **Web Audio API** — без использования внешних аудиофайлов, плагинов, сторонних плееров или DAW. Звук рождается в реальном времени посредством математического синтеза волн.

### Что внутри (Ключевые возможности)
*   **Две независимые деки (Deck A / Deck B):** Полноценные генераторы звука с возможностью независимого управления.
*   **Процедурный синтез:** Использование осцилляторов (синусоидальные, пилообразные, квадратные волны), генераторов шума и динамических фильтров для моделирования инструментов.
*   **Поддержка MIDI-контроллеров:** Подключайте внешние физические MIDI-устройства с помощью встроенной функции MIDI Learn для управления кроссфейдером, громкостью дек и эквалайзером.
*   **Сэмплер RED SOUND SOUNDBITE PRO:** Отдельный модуль для идеального лупинга и сэмплирования внешних аудиотреков с автоматической синхронизацией по BPM.
*   **Встроенные жанровые пресеты:**
    *   🌌 *Cosmic Techno* — плотный синтезированный бас, аналоговый лид и гипнотический ритм.
    *   🌆 *Synthwave* — теплые ретро-аккорды, яркие арпеджио и ностальгическая атмосфера 80-х.
    *   ☕ *Lofi Hip Hop* — виниловый шум, мягкие клавишные текстуры и расслабляющий ритм.
    *   🧪 *Acid House* — резонирующий, пульсирующий бас на базе классического фильтра 303.
*   **Панель микширования и эффектов:**
    *   **3-полосный эквалайзер:** Раздельная регулировка низких (Bass), средних (Mid) и высоких (Treble) частот для каждой деки.
    *   **Кроссфейдер (Crossfader):** Плавное и точное сведение аудиопотоков между деками в реальном времени.
    *   **Эффекты:** Дилей (Delay), реверберация (Reverb) и фильтры среза (LPF / HPF).
*   **Интерактивный 3D-стилизованный UI:** Анимированные виниловые пластинки, отзывчивые фейдеры и регуляторы с физикой взаимодействия.
*   **Аудио-визуализация в реальном времени:** Отрисовка частотного спектра и волновой формы на HTML5 Canvas с высокой частотой кадров.
*   **Firebase Integration:** Облачное сохранение пользовательских миксов, настроек и сессий в Firestore, а также админ-панель для управления медиа-исследованиями.

---

## 🇬🇧 English version

### Project Overview
**Remix: DJ Console** is an interactive, browser-based DJ system powered by live procedural audio synthesis. Built at the intersection of frontend engineering, audio synthesis, and interactive design, it turns your browser into a living musical instrument.

Every sound you hear is generated on the fly using the client-side **Web Audio API**. There are no static audio tracks, external streams, or bulky plugins — the entire soundscape is synthesized procedurally through mathematical oscillators and noise generators in real time.

### Features
*   **Two Independent Decks (Deck A / Deck B):** Separate audio engines with dedicated playback, controls, and sound design layers.
*   **Procedural Audio Synthesis:** Real-time waveform generation (Sine, Sawtooth, Square), frequency modulation, custom audio nodes, and noise injection.
*   **Hardware MIDI Controller Support:** Connect and map your physical MIDI controllers instantly using the built-in MIDI Learn mode for crossfader, volumes, and EQ control.
*   **RED SOUND SOUNDBITE PRO Sampler:** A dedicated looping module for perfect beat-matched loops and sampling of external audio tracks with auto-BPM synchronization.
*   **Genre-Specific Presets:**
    *   🌌 *Cosmic Techno* — Deep sub-bass lines, raw analog leads, and hypnotic industrial patterns.
    *   🌆 *Synthwave* — Nostalgic retro-pads, bright arpeggiated synths, and classic 80s warmth.
    *   ☕ *Lofi Hip Hop* — Warm vinyl crackle, cozy electric piano chords, and dusty drum patterns.
    *   🧪 *Acid House* — Resonant, squelchy basslines modeled after legendary vintage synthesizers.
*   **Pro DJ Mixing Controls:**
    *   **3-Band Equalizer:** Independent controls for Low, Mid, and High frequencies on each deck.
    *   **Master Crossfader:** Smooth, latency-free audio blending across both virtual channels.
    *   **FX Rack:** Integrated Delay, Reverb space modeling, and Low-Pass/High-Pass filtering.
*   **Rich Cinematic User Interface:** High-fidelity animations powered by `motion/react`, spinning virtual vinyl records, and active level indicators.
*   **Live Audio Visualization:** Real-time, low-latency audio spectrum and waveform rendered via HTML5 Canvas.
*   **Firebase Integration:** Secure storage of custom DJ sets, recorded performances, and custom presets in Cloud Firestore with a robust administrator panel.

---

## 🚀 Стек технологий / Tech Stack

*   **Framework:** Next.js 15+ (App Router, React 19)
*   **Language:** TypeScript
*   **Audio Core:** Web Audio API (Oscillators, BiquadFilterNodes, DelayNodes, GainNodes, AnalyserNodes)
*   **Hardware Integration:** Web MIDI API
*   **Styling:** Tailwind CSS v4
*   **Animations:** `motion/react`
*   **Database & Auth:** Firebase SDK (Firestore, Authentication, Admin SDK)
*   **Visuals:** HTML5 Canvas API

---

## 🛠️ Локальный запуск / Local Setup

### Требования / Prerequisites
*   Node.js 18.x или выше / Node.js 18.x or higher
*   npm или yarn

### Установка (RU)

1.  Клонируйте репозиторий:
    ```bash
    git clone https://github.com/your-username/remix-dj-console.git
    cd remix-dj-console
    ```

2.  Установите зависимости:
    ```bash
    npm install
    ```

3.  Настройте переменные окружения:
    Создайте файл `.env.local` на основе `.env.example` и добавьте ваши ключи:
    ```bash
    cp .env.example .env.local
    ```
    Заполните `GEMINI_API_KEY` и данные Firebase-конфигурации.

4.  Запустите сервер разработки:
    ```bash
    npm run dev
    ```

5.  Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Installation (EN)

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/remix-dj-console.git
    cd remix-dj-console
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables:
    Create a `.env.local` file based on `.env.example` and add your keys:
    ```bash
    cp .env.example .env.local
    ```
    Fill in `GEMINI_API_KEY` and Firebase configuration details.

4.  Run the development server:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 Как это устроено / How it Works (Audio Routing)

```
[ Synth Engine (Oscillators / Noise) ]
                 │
                 ▼
     [ BiquadFilterNode (LPF/HPF) ]
                 │
                 ▼
     [ 3-Band EQ (Low / Mid / High) ]
                 │
                 ▼
       [ FX Rack (Delay / Reverb) ]
                 │
                 ▼
        [ Deck Gain Node ]
                 │
                 ▼
          [ Crossfader ]
                 │
        ┌────────┴────────┐
        ▼                 ▼
[ Master Gain ]    [ AnalyserNode ]
        │                 │
        ▼                 ▼
 [ Destination ]   [ Canvas Visualizer ]
```

### Архитектура звука (RU)
1.  **Генерация:** Осцилляторы непрерывно синтезируют базовые волны заданной частоты в зависимости от пресета.
2.  **Фильтрация:** Сигнал пропускается через динамически управляемые фильтры (`BiquadFilterNode`) для изменения тембра.
3.  **Микширование:** Эквалайзеры изменяют баланс частот, а кроссфейдер перераспределяет уровни громкости дек по кривой постоянной мощности.
4.  **Анализ:** Модуль `AnalyserNode` извлекает данные о частотах и волновой форме (FFT), передавая их для визуализации на Canvas с частотой обновления экрана (через `requestAnimationFrame`).

### Audio Architecture (EN)
1.  **Generation:** Oscillators continuously synthesize base waves of a given frequency depending on the preset.
2.  **Filtering:** The signal passes through dynamically controlled filters (`BiquadFilterNode`) to alter the timbre.
3.  **Mixing:** Equalizers adjust the frequency balance, and the crossfader redistributes the volume levels of the decks using a constant-power curve.
4.  **Analysis:** The `AnalyserNode` module extracts frequency and waveform (FFT) data, passing it to the Canvas for visualization synced to the screen refresh rate (via `requestAnimationFrame`).

---

## 🛡️ Лицензия / License
Distributed under the MIT License. See `LICENSE` for more information.
