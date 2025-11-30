
import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CameraViewProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel }) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const startCamera = async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video metadata to load to prevent early capture issues
        videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play().catch(e => console.error("Play error:", e));
        };
        setHasPermission(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Strict safety checks before attempting to draw
    if (!video || !canvas) {
        console.error("Capture failed: Video or Canvas element missing.");
        return;
    }

    if (video.readyState < 2) { // HAVE_CURRENT_DATA
        console.warn("Capture failed: Video stream not ready.");
        return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Capture failed: Video dimensions are zero.");
        return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      try {
        // Mirror the image if user facing
        if (facingMode === 'user') {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        
        // Wrap drawImage in try-catch to prevent app crash
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageSrc);
      } catch (err) {
        console.error("Failed to execute drawImage:", err);
        alert(t('error_generic')); // Fallback feedback
      }
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (hasPermission === false) {
    return (
      <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <Camera size={48} className="text-red-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">{t('error_camera')}</h3>
        <p className="text-slate-500 mb-6">{t('error_camera_desc')}</p>
        <button onClick={onCancel} className="text-sun-600 font-bold underline">{t('btn_back_home')}</button>
      </div>
    );
  }

  return (
    // Fixed inset-0 ensures it covers the full viewport.
    <div className="absolute inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlays */}
        <button 
          onClick={onCancel}
          className="absolute top-4 left-4 p-2 bg-black/40 text-white rounded-full backdrop-blur-sm safe-top"
        >
          <X size={24} />
        </button>

        <button 
          onClick={switchCamera}
          className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full backdrop-blur-sm safe-top"
        >
          <RefreshCw size={24} />
        </button>
      </div>

      {/* Increased bottom padding (pb-24) to lift the button up from the bottom edge */}
      <div className="bg-black/80 p-6 flex items-center justify-center pb-24 safe-bottom">
        <button 
          onClick={capture}
          className="w-20 h-20 bg-white rounded-full border-4 border-sun-400 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label="Take Photo"
        >
          <div className="w-16 h-16 bg-sun-50 rounded-full"></div>
        </button>
      </div>
    </div>
  );
};
