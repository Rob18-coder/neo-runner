import React, { useEffect, useRef, useState } from 'react';
import { GameControlAction, TeachableMachineConfig } from '../types';
import { Camera, RefreshCw, Layers, CheckCircle2, AlertTriangle, Play, Pause, Hand, Keyboard, HelpCircle } from 'lucide-react';

interface TeachableMachineControllerProps {
  onActionTriggered: (action: GameControlAction) => void;
  onModelLoadedStateChange: (loaded: boolean) => void;
}

// Global window declarations to bypass ts check for dynamically loaded scripts
declare global {
  interface Window {
    tf: any;
    tmImage: any;
  }
}

export const TeachableMachineController: React.FC<TeachableMachineControllerProps> = ({
  onActionTriggered,
  onModelLoadedStateChange,
}) => {
  // Config state
  const [modelUrl, setModelUrl] = useState<string>('https://teachablemachine.withgoogle.com/models/vO_c3-NfD/'); // Placeholder / default or empty
  const [modelClasses, setModelClasses] = useState<string[]>([]);
  const [classMappings, setClassMappings] = useState<Record<string, GameControlAction>>({});
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Predictions state
  const [predictions, setPredictions] = useState<Array<{ className: string; probability: number }>>([]);
  const [activeAction, setActiveAction] = useState<GameControlAction>('NONE');

  // Webcam & loop targets
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(true); // Defaults to Simulation so they can test instantly!
  const [simulatedClass, setSimulatedClass] = useState<string>('Idle / Neutral');

  const webcamContainerRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<any>(null);
  const webcamRef = useRef<any>(null);
  const loopRef = useRef<number | null>(null);

  // Dynamic SDK injector
  const loadTMResources = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.tf && window.tmImage) {
        resolve(true);
        return;
      }

      // 1. Inject Tensorflow
      const tfScript = document.createElement('script');
      tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js';
      tfScript.async = true;
      tfScript.onload = () => {
        // 2. Inject Teachable Machine Image library
        const tmScript = document.createElement('script');
        tmScript.src = 'https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js';
        tmScript.async = true;
        tmScript.onload = () => {
          resolve(true);
        };
        tmScript.onerror = () => resolve(false);
        document.body.appendChild(tmScript);
      };
      tfScript.onerror = () => resolve(false);
      document.body.appendChild(tfScript);
    });
  };

  // Safe fetch function to ensure trailing slash handles correctly
  const sanitizeModelUrl = (url: string): string => {
    let clean = url.trim();
    if (!clean) return '';
    if (!clean.endsWith('/')) {
      clean += '/';
    }
    return clean;
  };

  // Load model from custom URL
  const loadTeachableMachineModel = async () => {
    if (!modelUrl) {
      setErrorMessage('Please type or paste a Teachable Machine model URL first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const ok = await loadTMResources();
      if (!ok) {
        throw new Error('Failed to load TensorFlow or Teachable Machine CDN SDKs.');
      }

      const cleanUrl = sanitizeModelUrl(modelUrl);
      const modelJson = cleanUrl + 'model.json';
      const metadataJson = cleanUrl + 'metadata.json';

      // Load model using TM SDK
      const model = await window.tmImage.load(modelJson, metadataJson);
      modelRef.current = model;

      // Read classes
      const labels = model.getClassLabels();
      setModelClasses(labels);

      // Setup initial default logical mappings based on naming search
      const initialMappings: Record<string, GameControlAction> = {};
      labels.forEach((label: string) => {
        const lower = label.toLowerCase();
        if (lower.includes('jump') || lower.includes('up') || lower.includes('fly')) {
          initialMappings[label] = 'JUMP';
        } else if (lower.includes('duck') || lower.includes('down') || lower.includes('slide')) {
          initialMappings[label] = 'DUCK';
        } else if (lower.includes('left')) {
          initialMappings[label] = 'LEFT';
        } else if (lower.includes('right')) {
          initialMappings[label] = 'RIGHT';
        } else {
          initialMappings[label] = 'NONE';
        }
      });

      setClassMappings(initialMappings);
      setIsLoaded(true);
      onModelLoadedStateChange(true);

      // Disable simulation mode now that real model is loaded
      setIsSimulationMode(false);
    } catch (err: any) {
      console.error('Error loading TM model', err);
      setErrorMessage(
        err?.message || 'Error fetching model. Please check your URL and ensure CORS allows reading.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Start real webcam preview and prediction loops
  const startWebcam = async () => {
    if (!isLoaded || !modelRef.current) {
      setErrorMessage('Load a Teachable Machine model before launching the Camera.');
      return;
    }

    try {
      setErrorMessage(null);
      // Create new Teachable Machine Webcam object
      const size = 180;
      const flip = true;
      const webcam = new window.tmImage.Webcam(size, size, flip);
      await webcam.setup(); // Triggers browser camera prompt
      await webcam.play();
      webcamRef.current = webcam;

      // Mount inside Ref
      if (webcamContainerRef.current) {
        webcamContainerRef.current.innerHTML = '';
        webcamContainerRef.current.appendChild(webcam.webcam);
        // Style the canvas internally to make it 100% responsive
        const childCanvas = webcamContainerRef.current.querySelector('canvas');
        if (childCanvas) {
          childCanvas.style.width = '100%';
          childCanvas.style.height = '100%';
          childCanvas.style.objectFit = 'cover';
          childCanvas.style.borderRadius = '8px';
          childCanvas.style.transform = 'scaleX(-1)'; // correct flip display
        }
      }

      setIsWebcamActive(true);
    } catch (err: any) {
      console.error('Error starting webcam', err);
      setErrorMessage('Could not initiate webcam. Check browser permissions.');
    }
  };

  // Stop Webcam helper
  const stopWebcam = () => {
    if (webcamRef.current) {
      webcamRef.current.stop();
      webcamRef.current = null;
    }
    if (webcamContainerRef.current) {
      webcamContainerRef.current.innerHTML = '';
    }
    setIsWebcamActive(false);
    setPredictions([]);
    onActionTriggered('NONE');
    setActiveAction('NONE');
  };

  // Real-time classification loop
  useEffect(() => {
    const predictLoop = async () => {
      if (!isWebcamActive || !modelRef.current || !webcamRef.current) return;

      try {
        const webcam = webcamRef.current;
        webcam.update(); // Update webcam frame

        const predictionList = await modelRef.current.predict(webcam.canvas);
        setPredictions(predictionList);

        // Find highest confidence prediction
        let bestPred = { className: '', probability: 0 };
        predictionList.forEach((pred: { className: string; probability: number }) => {
          if (pred.probability > bestPred.probability) {
            bestPred = pred;
          }
        });

        // Trigger action based on mapping with threshold (e.g. > 75% confidence)
        if (bestPred.probability > 0.75) {
          const mappedAction = classMappings[bestPred.className] || 'NONE';
          if (mappedAction !== activeAction) {
            onActionTriggered(mappedAction);
            setActiveAction(mappedAction);
          }
        } else {
          if (activeAction !== 'NONE') {
            onActionTriggered('NONE');
            setActiveAction('NONE');
          }
        }
      } catch (e) {
        console.error('Prediction loop error', e);
      }

      loopRef.current = requestAnimationFrame(predictLoop);
    };

    if (isWebcamActive) {
      loopRef.current = requestAnimationFrame(predictLoop);
    }

    return () => {
      if (loopRef.current) {
        cancelAnimationFrame(loopRef.current);
      }
    };
  }, [isWebcamActive, classMappings, activeAction]);

  // Handle virtual simulated gestures trigger
  const handleSimulatedGesture = (action: GameControlAction, labelName: string) => {
    if (!isSimulationMode) return;
    setSimulatedClass(labelName);
    onActionTriggered(action);
    setActiveAction(action);

    // Auto clear jump action after brief period to replicate quick jump event
    if (action === 'JUMP') {
      setTimeout(() => {
        onActionTriggered('NONE');
        setActiveAction('NONE');
        setSimulatedClass('Idle / Neutral');
      }, 350);
    }
  };

  // Map configuration update helper
  const updateMapping = (className: string, action: GameControlAction) => {
    setClassMappings(prev => ({
      ...prev,
      [className]: action
    }));
  };

  return (
    <div className="w-full bg-[#1e1b4b] border-4 border-black/30 rounded-xl p-4 md:p-5 shadow-2xl font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Camera className="text-yellow-400 w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white">🤖 Gesture Model Controller</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsSimulationMode(!isSimulationMode)}
            className={`px-3 py-1 rounded-md font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer flex items-center gap-1.5 border-2 ${
              isSimulationMode
                ? 'bg-yellow-400 text-black border-black/30'
                : 'bg-black/40 text-indigo-300 border-white/10'
            }`}
          >
            {isSimulationMode ? <Keyboard className="w-3 h-3" /> : <Hand className="w-3 h-3" />}
            {isSimulationMode ? 'Simulated Gesture: ON' : 'Use Camera Model'}
          </button>
        </div>
      </div>

      {/* Mode selectors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* URL loading and mappings column */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div>
            <label className="block text-indigo-200 text-xs font-bold mb-2 uppercase text-left">
              1. TEACHABLE MACHINE EMBED URL
            </label>
            <div className="flex gap-2">
              <input
                id="inp-tm-url"
                type="text"
                placeholder="https://teachablemachine.withgoogle.com/models/vO_c3xxxx/"
                value={modelUrl}
                onChange={(e) => setModelUrl(e.target.value)}
                className="flex-1 bg-black/40 text-yellow-400 text-xs border-2 border-white/10 rounded px-3 py-2 font-mono outline-none focus:border-yellow-400 transition-all placeholder:text-indigo-900/60"
              />
              <button
                id="btn-load-model"
                onClick={loadTeachableMachineModel}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:bg-slate-800 disabled:text-slate-600 text-black font-black rounded text-xs transition-all uppercase cursor-pointer flex items-center gap-1 border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1"
              >
                {isLoading ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Layers className="w-3.5 h-3.5" />
                )}
                {isLoading ? 'LOADING...' : 'LOAD MODEL'}
              </button>
            </div>
            <p className="text-[10px] text-indigo-300 mt-1.5 leading-relaxed text-left">
              💡 Generate an <strong className="text-white">Image Classification Model</strong> inside Google Teachable Machine, copy your exported cloud link, paste it, and lock it in.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950 bg-opacity-80 border-2 border-rose-850 rounded flex gap-2 text-rose-300 text-xs text-left">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Model Class Mapping lis          {isLoaded && modelClasses.length > 0 && (
            <div className="p-3 bg-black/40 rounded-lg border-2 border-white/10 transition-all text-left">
              <div className="flex justify-between items-center mb-2.5">
                <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="text-yellow-400 w-4 h-4" />
                  2. MAP MODEL CLASSES TO GAME ACTIONS
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[180px] overflow-y-auto">
                {modelClasses.map((label) => (
                  <div key={label} className="p-2 border border-white/5 bg-black/20 rounded flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-indigo-200 truncate">{label}</span>
                    <select
                      id={`map-${label}`}
                      value={classMappings[label] || 'NONE'}
                      onChange={(e) => updateMapping(label, e.target.value as GameControlAction)}
                      className="bg-black/50 text-yellow-400 text-[10px] py-1 px-1.5 border border-white/10 rounded cursor-pointer font-bold outline-none font-mono"
                    >
                      <option value="NONE">❌ NO ACTION</option>
                      <option value="JUMP">🚀 TRIGGER JUMP</option>
                      <option value="DUCK">🦆 TRIGGER DUCK</option>
                      <option value="LEFT">⬅️ MOVE LEFT</option>
                      <option value="RIGHT">➡️ MOVE RIGHT</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIMULATION CONTROLLERS (ALWAYS VISIBLE OR ACTIVE UNDER SIMULATION STATE) */}
          {isSimulationMode && (
            <div className="p-3.5 bg-yellow-400/5 border-2 border-yellow-400/20 rounded-lg text-left">
              <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Hand className="w-4 h-4 text-yellow-500" />
                🎰 VIRTUAL GESTURE SIMULATOR
              </h3>
              <p className="text-[10px] text-indigo-200 mb-3 leading-relaxed">
                No webcam/model? Click these buttons to mock Teachable Machine outputs. Try clicking <strong className="text-yellow-400">JUMP</strong> when an obstacle approaches!
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  id="btn-sim-jump"
                  onClick={() => handleSimulatedGesture('JUMP', 'Simulated Jump 🤸')}
                  className="px-3 py-2 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-black font-black text-xs uppercase cursor-pointer rounded border-b-4 border-yellow-700 active:border-b-0"
                >
                  🤸 TRIGGER JUMP
                </button>
                <button
                  id="btn-sim-duck"
                  onMouseDown={() => handleSimulatedGesture('DUCK', 'Simulated Duck 🧘')}
                  onMouseUp={() => handleSimulatedGesture('NONE', 'Idle / Neutral')}
                  onTouchStart={() => handleSimulatedGesture('DUCK', 'Simulated Duck 🧘')}
                  onTouchEnd={() => handleSimulatedGesture('NONE', 'Idle / Neutral')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase cursor-pointer rounded border-b-4 border-indigo-900 active:border-b-0 active:translate-y-0.5"
                >
                  🧘 HOLD DUCK
                </button>
                <div className="flex gap-1.5">
                  <button
                    id="btn-sim-left"
                    onMouseDown={() => handleSimulatedGesture('LEFT', 'Simulated Left ⬅️')}
                    onMouseUp={() => handleSimulatedGesture('NONE', 'Idle / Neutral')}
                    className="px-3 py-2 bg-black/40 hover:bg-black/60 border border-white/10 rounded text-indigo-200 font-bold text-xs cursor-pointer"
                  >
                    ⬅️
                  </button>
                  <button
                    id="btn-sim-right"
                    onMouseDown={() => handleSimulatedGesture('RIGHT', 'Simulated Right ➡️')}
                    onMouseUp={() => handleSimulatedGesture('NONE', 'Idle / Neutral')}
                    className="px-3 py-2 bg-black/40 hover:bg-black/60 border border-white/10 rounded text-indigo-200 font-bold text-xs cursor-pointer"
                  >
                    ➡️
                  </button>
                </div>
                <button
                  id="btn-sim-idle"
                  onClick={() => handleSimulatedGesture('NONE', 'Idle / Neutral')}
                  className="px-3 py-2 bg-black/60 hover:bg-black border border-white/5 rounded text-indigo-300 font-bold text-xs cursor-pointer"
                >
                  IDLE
                </button>
              </div>

              <div className="mt-3 py-1.5 px-2.5 bg-black/40 border border-white/15 rounded flex justify-between items-center">
                <span className="text-[10px] text-indigo-300 font-mono">SIMULATION STATE:</span>
                <span className="text-[11px] font-bold text-yellow-400 animate-pulse uppercase tracking-wider">{simulatedClass}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live camera container and predictions graphs */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="bg-black/30 border-2 border-white/10 rounded-lg p-3 flex flex-col items-center">
            <span className="text-[11px] font-bold text-indigo-200 mb-2 uppercase self-start">
              ⚡ LIVE MODEL FEED
            </span>

            {/* Webcam video placeholder */}
            <div
              id="webcam-camera-container"
              ref={webcamContainerRef}
              className="w-44 h-44 border-4 border-black/50 rounded-lg flex flex-col items-center justify-center bg-black/40 relative overflow-hidden mb-3"
            >
              {!isWebcamActive ? (
                <>
                  <Camera className="w-8 h-8 text-indigo-400/40 mb-1" />
                  <span className="text-[10px] text-indigo-200/50 font-bold uppercase tracking-wider">WEBCAM OFF</span>
                </>
              ) : null}
            </div>

            {/* Webcam startup button */}
            {isLoaded ? (
              <button
                id="btn-webcam"
                onClick={isWebcamActive ? stopWebcam : startWebcam}
                className={`w-full py-2 font-black text-xs rounded transition-all uppercase cursor-pointer flex items-center justify-center gap-1.5 border-b-4 ${
                  isWebcamActive
                    ? 'bg-rose-950 text-rose-400 border-rose-800 hover:bg-rose-900'
                    : 'bg-yellow-400 hover:bg-yellow-300 text-black border-yellow-700 active:border-b-0 active:translate-y-0.5'
                }`}
              >
                {isWebcamActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isWebcamActive ? 'STOP PREVIEWS' : 'ACTIVATE CAMERA'}
              </button>
            ) : (
              <div className="w-full text-center py-2 border border-slate-900 rounded bg-slate-900 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                🔒 CAMERA BLOCKED UNTIL MODEL LOADED
              </div>
            )}
          </div>

          {/* Predictions Bar charts */}
          {isWebcamActive && predictions.length > 0 && (
            <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-left">
              <span className="text-[10px] font-bold text-indigo-200 block mb-2 uppercase tracking-wide">
                📊 LIVE CLASSIFICATION CONFIDENCE
              </span>
              <div className="flex flex-col gap-2">
                {predictions.map((pred) => {
                  const percent = Math.round(pred.probability * 100);
                  const isWinner = pred.probability > 0.75;
                  const mappedAction = classMappings[pred.className] || 'NONE';

                  return (
                    <div key={pred.className} className="text-[10px] font-mono">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`font-bold truncate max-w-[120px] ${isWinner ? 'text-yellow-400' : 'text-slate-400'}`}>
                          {pred.className}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-bold bg-slate-900 border border-slate-850 px-1 rounded text-[9px] uppercase">
                            {mappedAction === 'NONE' ? 'NO-OP' : mappedAction}
                          </span>
                          <span className={`font-bold ${isWinner ? 'text-yellow-400' : 'text-slate-500'}`}>
                            {percent}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded transition-all duration-75 ${
                            isWinner ? 'bg-yellow-400' : 'bg-slate-700'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
