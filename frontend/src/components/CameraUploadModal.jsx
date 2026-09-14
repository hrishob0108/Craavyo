import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CameraUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [step, setStep] = useState('IDLE'); // IDLE, PREVIEW, UPLOADING, SUCCESS
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  
  // reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep('IDLE');
      setSelectedFile(null);
      setPreviewUrl('');
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen && step === 'IDLE') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, step]);

  const handleCaptureClick = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          setStep('PREVIEW');
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const uploadToCloudinary = async () => {
    if (!selectedFile) return;
    setStep('UPLOADING');
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', 'qbvu3y5j');
      
      const res = await fetch('https://api.cloudinary.com/v1_1/dfseckyjx/image/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.secure_url) {
        // Wait a little extra just to show the beautiful chef animation
        setTimeout(() => {
          setPreviewUrl(data.secure_url);
          setStep('SUCCESS');
        }, 1500);
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo');
      setStep('PREVIEW'); // Go back so they can try again
    }
  };

  const handleDone = () => {
    onUploadComplete(previewUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-[500px] h-[350px] bg-[#fbdfe2] rounded-[24px] overflow-hidden shadow-2xl flex items-center justify-center p-4">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-2 left-2 text-[20px] opacity-70">🌿</div>
        <div className="absolute top-6 left-12 text-[24px] opacity-70">🌸</div>
        <div className="absolute bottom-4 left-6 text-[18px] opacity-70">🌸</div>
        <div className="absolute top-4 right-8 text-[22px] opacity-70">🌸</div>
        <div className="absolute bottom-8 right-10 text-[26px] opacity-70">🌿</div>
        <div className="absolute bottom-2 right-2 text-[20px] opacity-70">🌸</div>
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-3 right-3 text-[#8a424b] hover:bg-white/30 p-1.5 rounded-full transition-colors z-10">
          <FiX className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Inner White Box */}
        <div className="relative w-full h-full bg-[#f8f5f5] rounded-[16px] shadow-inner flex flex-col overflow-hidden">
          
          <canvas ref={canvasRef} className="hidden" />

          <AnimatePresence mode="wait">
            {step === 'IDLE' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-center relative bg-black"
              >
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay UI */}
                <div className="absolute inset-0 border-[8px] border-black/20 pointer-events-none"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-[1.5px] border-white/60 rounded-[14px] pointer-events-none flex items-center justify-center">
                  <FiCamera className="w-6 h-6 text-white/50" />
                </div>

                <div className="absolute bottom-4 right-4 z-10">
                  <button 
                    onClick={handleCaptureClick}
                    className="bg-white border-[1.5px] border-[#a5d299] text-[#78a56b] font-bold px-6 py-1.5 rounded-full text-[13px] hover:bg-gray-50 transition-colors shadow-lg"
                  >
                    Capture
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'PREVIEW' && (
              <motion.div 
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col relative"
              >
                <div className="flex-1 w-full h-full p-1.5 pb-0">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-[14px]" />
                </div>
                <div className="absolute bottom-4 right-4 flex gap-3 z-10 bg-white/60 backdrop-blur-md p-2 rounded-full border border-white">
                  <button onClick={() => setStep('IDLE')} className="text-[#e29352] font-bold text-[13px] hover:underline px-2">
                    Retake
                  </button>
                  <button 
                    onClick={uploadToCloudinary}
                    className="bg-white border-[1.5px] border-[#e39ba4] text-[#d88c96] font-bold px-5 py-1.5 rounded-full text-[13px] shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    Upload
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'UPLOADING' && (
              <motion.div 
                key="uploading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col items-center justify-center bg-[#fdfafb]"
              >
                <img src="/chef.png" alt="Uploading..." className="w-[140px] h-[140px] object-contain mb-8 animate-[pulse_2s_ease-in-out_infinite]" onError={(e) => { e.target.onerror = null; e.target.src = "https://cdn-icons-png.flaticon.com/512/3565/3565411.png"; }} />
                
                <div className="w-[60%] h-1 bg-[#f3dadd] rounded-full overflow-hidden relative shadow-inner">
                  <motion.div 
                    initial={{ left: '-100%' }}
                    animate={{ left: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-[100%] h-full bg-[#bd3241] absolute top-0 rounded-full"
                  />
                </div>
              </motion.div>
            )}

            {step === 'SUCCESS' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col relative"
              >
                <div className="flex-1 w-full h-full p-1.5 pb-0">
                  <img src={previewUrl} alt="Uploaded" className="w-full h-full object-cover rounded-[14px]" />
                </div>
                <div className="absolute bottom-4 right-4 flex gap-3 z-10 bg-white/60 backdrop-blur-md p-2 rounded-full border border-white">
                  <button 
                    onClick={() => setStep('IDLE')} 
                    className="bg-transparent border-[1.5px] border-[#e29352] text-[#e29352] font-bold px-4 py-1.5 rounded-full text-[13px] hover:bg-[#e29352]/10 transition-colors"
                  >
                    Upload more
                  </button>
                  <button 
                    onClick={handleDone}
                    className="bg-white border-[1.5px] border-[#e39ba4] text-[#d88c96] font-bold px-6 py-1.5 rounded-full text-[13px] shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};

export default CameraUploadModal;
