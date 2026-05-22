import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-hot-toast';

const QrScannerModal = ({ onClose, onScanSuccess }) => {
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const scannerRef = useRef(null);
  const audioCtxRef = useRef(null);

  // Sound generator (Web Audio API synthesis for absolute zero-asset reliability)
  const playSuccessBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;
      
      // Ensure context is running (required due to browser autoplay security rules)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(950, audioCtx.currentTime); // 950Hz beep (clean retro-logistique tone)
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // 8% volume (comfortable and professional)
      
      // Quick exponential ramp down
      gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.07);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.07); // 70ms beep duration
    } catch (e) {
      console.warn('Audio feedback synthesis blocked or failed', e);
    }
  };

  // Dynamic extract ID from QR decoded payload
  const extractIdFromQrCode = (text) => {
    if (!text) return null;
    const trimmed = text.trim();

    // 1. System URL Match (e.g. /qr-transit/2 or /inventory/2)
    if (trimmed.includes('/qr-transit/')) {
      const parts = trimmed.split('/qr-transit/');
      if (parts.length > 1) {
        const parsed = parseInt(parts[1], 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
    if (trimmed.includes('/inventory/')) {
      const parts = trimmed.split('/inventory/');
      if (parts.length > 1) {
        const parsed = parseInt(parts[1], 10);
        if (!isNaN(parsed)) return parsed;
      }
    }

    // 2. Technical Code Match (e.g. EQ-2 or EQ-0002)
    const eqMatch = trimmed.match(/EQ-(\d+)/i);
    if (eqMatch) {
      const parsed = parseInt(eqMatch[1], 10);
      if (!isNaN(parsed)) return parsed;
    }

    // 3. Raw Database Integer Key Match
    const rawId = parseInt(trimmed, 10);
    if (!isNaN(rawId) && /^\d+$/.test(trimmed)) {
      return rawId;
    }

    return null;
  };

  // Get cameras list on mounting
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        setIsInitializing(false);
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Auto-select rear/back camera if available, fallback to first camera
          const backCamera = devices.find(
            (device) =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('arrière') ||
              device.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
        } else {
          setCameraError("Aucun capteur vidéo n'a été détecté sur cet appareil.");
        }
      })
      .catch((err) => {
        setIsInitializing(false);
        console.error('Camera enumeration error:', err);
        setCameraError("Accès caméra refusé ou périphérique verrouillé.");
      });

    return () => {
      // Cleanup Web Audio context
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Initialize and run the scanner when the selected camera changes
  useEffect(() => {
    if (!selectedCameraId) return;

    // Create the instance
    const html5Qrcode = new Html5Qrcode('qr-reader');
    scannerRef.current = html5Qrcode;
    setIsScanning(true);

    const onScanSuccessCallback = (decodedText) => {
      // Play a short synth validation beep
      playSuccessBeep();
      
      const parsedId = extractIdFromQrCode(decodedText);
      if (parsedId !== null) {
        onScanSuccess(parsedId);
      } else {
        toast.error(`QR Code invalide ou non reconnu : "${decodedText.substring(0, 20)}..."`);
      }
    };

    const onScanFailureCallback = () => {
      // Quietly ignore frame capture failures to avoid flooding log console
    };

    html5Qrcode
      .start(
        selectedCameraId,
        {
          fps: 15, // Higher scanning frequency for rapid reactions
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.65;
            return { width: size, height: size };
          },
        },
        onScanSuccessCallback,
        onScanFailureCallback
      )
      .catch((err) => {
        console.error('Html5Qrcode boot error:', err);
        toast.error("Erreur d'initialisation de la caméra.");
        setIsScanning(false);
      });

    // Cleanup active scanner stream on cameras swap or modal close
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Scanner stream halt error:", err));
      }
    };
  }, [selectedCameraId, onScanSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 no-print">
      <style>{`
        @keyframes laserSweep {
          0% { top: 12%; opacity: 0.2; }
          50% { top: 88%; opacity: 1; }
          100% { top: 12%; opacity: 0.2; }
        }
      `}</style>
      
      <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-md p-6 relative flex flex-col rounded-none shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-white">Scanner Logistique QR</h3>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">Capteur Photo Actif</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-white cursor-pointer active:scale-90 transition-transform flex items-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Diagnostic camera box */}
        <div className="relative w-full aspect-square border border-slate-800 bg-slate-950 overflow-hidden mb-5 flex items-center justify-center">
          
          {/* Target Element for camera stream */}
          <div id="qr-reader" className="w-full h-full object-cover"></div>

          {/* Fallbacks */}
          {isInitializing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 font-mono text-[10px] text-slate-400 gap-3">
              <div className="size-5 animate-spin border-2 border-slate-400 border-t-transparent rounded-full"></div>
              <span className="uppercase tracking-widest font-black">Chargement Capteurs...</span>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/95 font-mono text-[10px] text-center p-6 gap-3">
              <span className="material-symbols-outlined text-red-500 text-2xl animate-pulse">videocam_off</span>
              <span className="text-red-500 uppercase tracking-widest font-black">Accès Bloqué</span>
              <p className="text-slate-500 leading-normal max-w-[260px] text-[9px] mt-1">{cameraError}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1.5 border border-slate-800 hover:border-slate-500 font-bold uppercase text-[8px] tracking-wider transition-colors rounded-none"
              >
                Rafraîchir
              </button>
            </div>
          )}

          {/* HUD Overlay HUD Corners (Visée Laser) */}
          {!cameraError && !isInitializing && isScanning && (
            <>
              {/* Laser Beam Animation */}
              <div 
                className="absolute left-6 right-6 h-[1px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] pointer-events-none z-10"
                style={{ animation: 'laserSweep 3s ease-in-out infinite' }}
              ></div>

              {/* HUD Collimateurs bounds */}
              <div className="absolute inset-10 pointer-events-none border border-slate-800/40">
                {/* Top Left */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-white"></div>
                {/* Top Right */}
                <div className="absolute top-0 right-0 w-5 h-5 border-t border-r border-white"></div>
                {/* Bottom Left */}
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l border-white"></div>
                {/* Bottom Right */}
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-white"></div>
              </div>

              {/* HUD Text Diagnostic Overlay */}
              <div className="absolute top-3 left-3 pointer-events-none font-mono text-[7px] text-slate-500 uppercase tracking-widest flex flex-col gap-0.5">
                <span>FPS: 15 / CH-1</span>
                <span>STATUS: STREAMING</span>
              </div>
              <div className="absolute bottom-3 right-3 pointer-events-none font-mono text-[7px] text-slate-500 uppercase tracking-widest">
                SYS: ACTIVE
              </div>
            </>
          )}
        </div>

        {/* Camera device selection dropdown (For multi-lens smartphones support) */}
        {!cameraError && cameras.length > 1 && (
          <div className="flex flex-col gap-1.5 font-mono text-[9px] mb-2">
            <label className="text-slate-500 font-bold uppercase tracking-widest">Commuter d'objectif</label>
            <div className="relative">
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="w-full h-10 border border-slate-800 bg-slate-950 focus:border-slate-600 focus:ring-0 focus:ring-transparent outline-none focus:outline-none text-[10px] px-3 font-mono text-slate-300 appearance-none rounded-none cursor-pointer"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900">
                    {c.label || `Caméra ${c.id.substring(0, 8)}...`}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-slate-500 pointer-events-none text-base">expand_more</span>
            </div>
          </div>
        )}

        {/* Action controls footer */}
        <div className="grid grid-cols-1 mt-4">
          <button
            onClick={onClose}
            className="h-12 bg-red-600 hover:bg-red-700 text-white font-mono font-bold uppercase tracking-widest text-[9px] rounded-none active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-black">close</span>
            Fermer le Scanner
          </button>
        </div>

      </div>
    </div>
  );
};

export default QrScannerModal;
