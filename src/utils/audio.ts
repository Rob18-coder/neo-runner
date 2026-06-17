class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.3; // Default 30% volume

  constructor() {
    // Lazy initialized on first interaction due to browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('retro_game_muted', muted ? 'true' : 'false');
  }

  getMuted(): boolean {
    const saved = localStorage.getItem('retro_game_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
    return this.isMuted;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('retro_game_volume', String(this.volume));
  }

  getVolume(): number {
    const saved = localStorage.getItem('retro_game_volume');
    if (saved !== null) {
      this.volume = parseFloat(saved);
    }
    return this.volume;
  }

  private createGainNode(duration: number): { osc: OscillatorNode; gain: GainNode } | null {
    this.initCtx();
    if (!this.ctx || this.isMuted) return null;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    return { osc, gain };
  }

  playJump() {
    const nodes = this.createGainNode(0.18);
    if (!nodes) return;

    const { osc } = nodes;
    osc.type = 'triangle'; // triangle gives a nice round 8-bit jump
    osc.frequency.setValueAtTime(150, this.ctx!.currentTime);
    // Sweepy jump frequency
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx!.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.18);
  }

  playDuck() {
    const nodes = this.createGainNode(0.12);
    if (!nodes) return;

    const { osc } = nodes;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, this.ctx!.currentTime);
    osc.frequency.linearRampToValueAtTime(70, this.ctx!.currentTime + 0.1);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.12);
  }

  playCoin() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    // Classic coin twin-tone sound (e.g., B5 then E6)
    const playTone = (freq: number, startDelay: number, duration: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.type = 'square'; // square wave is iconic for retro coins
      osc.frequency.setValueAtTime(freq, now + startDelay);

      gain.gain.setValueAtTime(0, now + startDelay);
      gain.gain.linearRampToValueAtTime(this.volume * 0.8, now + startDelay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startDelay + duration);

      osc.start(now + startDelay);
      osc.stop(now + startDelay + duration);
    };

    playTone(987.77, 0, 0.08); // B5
    playTone(1318.51, 0.08, 0.2); // E6
  }

  playHit() {
    const nodes = this.createGainNode(0.25);
    if (!nodes) return;

    const { osc } = nodes;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx!.currentTime + 0.22);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.25);

    // Add noise simulation
    try {
      const bufferSize = this.ctx!.sampleRate * 0.25;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx!.createGain();
      noiseGain.gain.setValueAtTime(this.volume * 0.6, this.ctx!.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.25);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx!.destination);
      noise.start();
    } catch (e) {
      // Ignored if noise buffer constructor is blocked
    }
  }

  playGameOver() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    // Gloomy minor descending notes (C4, Ab3, F3, C3)
    const notes = [261.63, 207.65, 174.61, 130.81]; // C4, Ab3, F3, C3
    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.15);

      gain.gain.setValueAtTime(0, now + index * 0.15);
      gain.gain.linearRampToValueAtTime(this.volume, now + index * 0.15 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.15 + 0.25);

      osc.start(now + index * 0.15);
      osc.stop(now + index * 0.15 + 0.25);
    });
  }

  playLevelUp() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    // Upbeat major arpeggio ascending (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(this.volume * 0.7, now + index * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.18);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.18);
    });
  }
}

export const audio = new RetroAudioEngine();
