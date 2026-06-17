import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TeachableMachineController } from './components/TeachableMachineController';
import { GameControlAction } from './types';
import { audio } from './utils/audio';
import { 
  Volume2, 
  VolumeX, 
  Gamepad2, 
  Cpu, 
  Award, 
  HelpCircle, 
  Info, 
  ChevronRight, 
  Zap, 
  Sliders,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [teachableAction, setTeachableAction] = useState<GameControlAction>('NONE');
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [gameSpeedMultiplier, setGameSpeedMultiplier] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(() => audio.getMuted());
  const [volume, setVolume] = useState<number>(() => audio.getVolume());
  const [activeTab, setActiveTab] = useState<'play' | 'wizard'>('play');

  // UI state mirroring from canvas
  const [gameStats, setGameStats] = useState({
    score: 0,
    coins: 0,
    lives: 3,
    gameOver: false,
  });

  // Handle muted change
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audio.setMute(nextMuted);
    // Play quick beep test
    if (!nextMuted) {
      audio.playCoin();
    }
  };

  // Handle volume change
  const handleVolumeChange = (v: number) => {
    setVolume(v);
    audio.setVolume(v);
  };

  // Sync state on load
  useEffect(() => {
    // Initial audio setup triggers
    const triggerAudioActivation = () => {
      // Warm up Web Audio context on first click
      audio.setMute(isMuted);
      audio.setVolume(volume);
      window.removeEventListener('click', triggerAudioActivation);
    };
    window.addEventListener('click', triggerAudioActivation);
    return () => window.removeEventListener('click', triggerAudioActivation);
  }, [isMuted, volume]);

  return (
    <div className="min-h-screen bg-[#312e81] text-white flex flex-col justify-between font-mono select-none">
      {/* Top Retro Vibrant Header */}
      <header className="h-auto sm:h-24 px-4 sm:px-10 flex flex-col sm:flex-row justify-between items-center bg-black/30 border-b-4 border-white/10 relative z-30">
        <div className="flex flex-col text-left py-3 sm:py-0">
          <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-yellow-400 pixel-text-shadow">
            PIXEL-SENSE PLATFORMER
          </h1>
          <div className="flex gap-2 items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-200 font-bold">
              {isModelLoaded ? "TM-Model: V3.4_ACTIVE" : "TM-Model: V3.4_DEMO"}
            </span>
          </div>
        </div>

        {/* Audio and Controls in header */}
        <div className="flex flex-wrap items-center gap-4 py-2 sm:py-0">
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded border border-white/10 text-xs">
            <button
              id="btn-toggle-mute"
              onClick={toggleMute}
              className="text-slate-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-green-400" />
              )}
            </button>
            <input
              id="inp-volume"
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-12 sm:w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              title="Volume slider"
            />
            <select
              id="select-speed"
              value={gameSpeedMultiplier}
              onChange={(e) => setGameSpeedMultiplier(parseFloat(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-amber-400 rounded px-1 ml-2 text-[10px] cursor-pointer outline-none font-bold"
            >
              <option value="0.7">0.7x</option>
              <option value="1.0">1.0x</option>
              <option value="1.3">1.3x</option>
              <option value="1.6">1.6x</option>
            </select>
          </div>

          {/* DYNAMIC SCORING DISPLAY ACCORDING TO VIBRANT THEME */}
          <div className="flex gap-4 sm:gap-8 items-center text-xs">
            <div className="text-right">
              <div className="text-[9px] text-indigo-300 uppercase tracking-widest font-bold">Top Score</div>
              <div className="text-xl sm:text-2xl font-bold tabular-nums text-white">
                {Math.max(gameStats.score, Number(localStorage.getItem('retro_high_score') || '0')).toString().padStart(6, '0')}
              </div>
            </div>
            <div className="text-right bg-black/40 px-4 sm:px-6 py-1 sm:py-2 rounded-sm border-2 border-white/20">
              <div className="text-[9px] text-yellow-500 uppercase tracking-widest font-bold">Current Run</div>
              <div className="text-2xl sm:text-3xl font-black tabular-nums text-yellow-400 retro-glow-amber">
                {gameStats.score.toString().padStart(6, '0')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 flex flex-col gap-6">
        {/* Intro Alert with matching vibrant colors */}
        <div className="bg-[#1e1b4b]/80 border-2 border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-left">
          <div className="flex gap-3 items-start md:items-center">
            <span className="bg-yellow-400 text-black px-2.5 py-1.5 rounded-lg border-2 border-black font-black text-lg shrink-0">
              🕹️
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-yellow-400 uppercase font-press-start tracking-tight">
                Play using Camera gestures or Keyboard!
              </h2>
              <p className="text-xs text-indigo-200 mt-1 font-mono">
                Launch the cabinet below, play right away using <strong className="text-white">Space/Arrows</strong>, choose our built-in <strong className="text-yellow-400">Virtual Simulator</strong>, or link your webcam model instantly.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab(activeTab === 'play' ? 'wizard' : 'play')}
            className="text-xs font-bold text-yellow-400 hover:text-yellow-300 shrink-0 uppercase border-2 border-yellow-400/50 bg-black/40 hover:bg-black px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {activeTab === 'play' ? 'Open Training Guide' : 'Back to Cabinet'}
          </button>
        </div>

        {/* Dual panel Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel - Game Stage Block */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <GameCanvas
              teachableAction={teachableAction}
              gameSpeedMultiplier={gameSpeedMultiplier}
              onStatsChange={(score, coins, lives, gameOver) => {
                setGameStats({ score, coins, lives, gameOver });
              }}
            />

            {/* Sub gameplay info banners */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-black/30 border-2 border-white/10 rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg">⌨️</span>
                <div className="text-left">
                  <h4 className="text-[10px] font-bold text-indigo-300 uppercase">Space / Up Arrow</h4>
                  <p className="text-xs text-white">Jump over spike cacti</p>
                </div>
              </div>
              <div className="bg-black/30 border-2 border-white/10 rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg">⬇️</span>
                <div className="text-left">
                  <h4 className="text-[10px] font-bold text-indigo-300 uppercase">Down Arrow</h4>
                  <p className="text-xs text-white">Duck under bird hazard</p>
                </div>
              </div>
              <div className="bg-black/30 border-2 border-white/10 rounded-xl p-3 flex items-center gap-3">
                <span className="text-lg">✨</span>
                <div className="text-left">
                  <h4 className="text-[10px] font-bold text-yellow-400 uppercase">Collect Coins</h4>
                  <p className="text-xs text-yellow-300">Golden points & extra lives</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel - Teachable Machine Hub */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <TeachableMachineController
              onActionTriggered={(action) => {
                setTeachableAction(action);
              }}
              onModelLoadedStateChange={(loaded) => {
                setIsModelLoaded(loaded);
              }}
            />

            {/* Quick status card with matching style */}
            <div className="bg-[#1e1b4b] border-4 border-black/30 rounded-xl p-4 text-left">
              <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                CONSOLE METRICS
              </h3>
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                <span className="text-indigo-200">Model Link:</span>
                <span className={isModelLoaded ? "text-emerald-400 font-bold" : "text-yellow-400 font-bold"}>
                  {isModelLoaded ? "✅ CONNECTED" : "⚠️ VIRTUAL SIMULATOR/DEMO"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5 text-xs">
                <span className="text-indigo-200">Active Action:</span>
                <span className="text-yellow-400 font-black animate-pulse px-2 py-0.5 bg-black/40 rounded border border-white/10 block text-[10px] tracking-widest">
                  {teachableAction === 'NONE' ? 'NEUTRAL / IDLE' : teachableAction}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 text-xs">
                <span className="text-indigo-200">Confidence Mode:</span>
                <span className="text-white font-bold">Image Classify v3.4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab view for Detailed Training Guide & Step-by-Step wizard */}
        <section id="training-guide-wizard" className="bg-[#1e1b4b] border-4 border-black/30 rounded-xl p-5 md:p-6 text-left shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
            <Sparkles className="text-yellow-400 w-5 h-5 shrink-0" />
            <h3 className="text-sm font-bold font-press-start tracking-tight text-white uppercase">
              🎓 Train & link your own gesture model
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-indigo-100">
            <div className="p-4 bg-black/20 rounded-lg border-2 border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 bg-yellow-400 text-black rounded font-black text-[10px]">STEP 1</span>
                <span className="text-lg">🤖</span>
              </div>
              <h4 className="font-bold text-yellow-400 uppercase text-[11px] tracking-wider">Train the model</h4>
              <p className="text-[11px] leading-relaxed text-indigo-200">
                Go to <a href="https://teachablemachine.withgoogle.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-400 underline font-bold hover:text-yellow-300">Teachable Machine</a>, click <strong className="text-white">Image Project</strong>. Record gestures like <strong className="text-white">"Jump"</strong>, <strong className="text-white">"Duck"</strong>, and <strong className="text-white">"Neutral"</strong>. Let TensorFlow.js train it.
              </p>
            </div>

            <div className="p-4 bg-black/20 rounded-lg border-2 border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 bg-yellow-400 text-black rounded font-black text-[10px]">STEP 2</span>
                <span className="text-lg">📤</span>
              </div>
              <h4 className="font-bold text-yellow-400 uppercase text-[11px] tracking-wider">Export & Upload</h4>
              <p className="text-[11px] leading-relaxed text-indigo-200">
                Click <strong className="text-white">"Export Model"</strong>. Select the "TensorFlow.js" tab, then click <strong className="text-yellow-400">"Upload my model"</strong>. Teachable Machine will generate your unique share link.
              </p>
            </div>

            <div className="p-4 bg-black/20 rounded-lg border-2 border-white/5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 bg-yellow-400 text-black rounded font-black text-[10px]">STEP 3</span>
                <span className="text-lg">⚡</span>
              </div>
              <h4 className="font-bold text-yellow-400 uppercase text-[11px] tracking-wider">Paste & Control</h4>
              <p className="text-[11px] leading-relaxed text-indigo-200">
                Paste your dynamic model URL (e.g., <code className="text-yellow-400 bg-black/30 px-1 border border-white/10 text-[10px]">https://teachablemachine...</code>) into the input field above, select your mappings and click <strong className="text-yellow-300">Load Model</strong>!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer copyright */}
      <footer className="border-t-4 border-black bg-[#1e1b4b] py-4 px-4 text-xs font-mono text-indigo-300/60 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>🎮 PIXEL-SENSE PLATFORMER | Inspired by Google Offline Run | Built with TensorFlow.js Integrations</span>
          <span className="font-bold uppercase tracking-wider text-yellow-400/80">© Retro Cabinets V3.4</span>
        </div>
      </footer>
    </div>
  );
}
