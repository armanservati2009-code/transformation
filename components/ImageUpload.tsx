import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, Camera, X, Circle, CheckCircle2 } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (base64: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onImageSelected(base64String);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelected]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        stopCamera();
        onImageSelected(base64);
      }
    }
  };

  // Effect to attach stream to video element when camera opens
  useEffect(() => {
    if (isCameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 p-6">
      
      {/* Main Interaction Area */}
      <div className="relative w-full h-96 rounded-2xl overflow-hidden bg-slate-800/50 border-2 border-dashed border-slate-600 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
        
        {isCameraOpen ? (
          /* Camera View */
          <div className="absolute inset-0 z-20 bg-black flex flex-col">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Camera Overlay Controls */}
            <div className="absolute top-4 right-4 z-30">
               <button 
                onClick={stopCamera}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-30">
              <button 
                onClick={capturePhoto}
                className="group relative flex items-center justify-center p-1 rounded-full border-4 border-white/30 transition-all active:scale-95"
              >
                <div className="w-14 h-14 bg-white rounded-full group-hover:bg-blue-500 transition-colors shadow-lg" />
              </button>
            </div>
          </div>
        ) : (
          /* File Upload View */
          <div className="relative w-full h-full group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="p-4 bg-slate-700/50 rounded-full mb-6 group-hover:scale-110 group-hover:bg-slate-700 transition-all duration-300 shadow-xl">
                <Upload className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-200 mb-2">Upload a photo</h3>
              <p className="text-slate-400 mb-8 max-w-xs">
                Drag and drop or click to select a file.<br/>
                Supports JPG, PNG, WEBP.
              </p>
              
              <div className="relative z-20 flex items-center gap-4 w-full max-w-md px-8">
                <div className="h-px bg-slate-700 flex-1"></div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Or</span>
                <div className="h-px bg-slate-700 flex-1"></div>
              </div>

              {/* Camera Button (Needs higher z-index/positioning to be clickable over file input if placed inside, 
                  but we put it inside a z-20 container to sit 'above' the file input layer for this specific button area) */}
              <div className="mt-8 relative z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering file upload
                    startCamera();
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-blue-500/20 border border-slate-600 hover:border-slate-500"
                >
                  <Camera className="w-5 h-5" />
                  Take a Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-center rounded-lg">
          {cameraError}
        </div>
      )}

      {/* Feature Grid */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-200">High Quality</p>
            <p className="text-slate-500">HD Processing</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-200">Creative Styles</p>
            <p className="text-slate-500">AI Powered</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Upload className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-200">Easy Export</p>
            <p className="text-slate-500">Download Result</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;