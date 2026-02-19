import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, X, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const CameraPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      setCameraActive(true);
      // Wait for next render so the video element is mounted
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      });
    } catch (err) {
      console.error("Camera error:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraActive(false);
  }, [stream]);

  const snapPhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCaptured(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCaptured(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const proceed = () => {
    if (captured) {
      navigate("/result", { state: { image: captured } });
    }
  };

  const retake = () => {
    setCaptured(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={() => { stopCamera(); navigate("/"); }}>
          <X className="h-6 w-6" />
        </Button>
        <span className="font-display text-sm font-semibold text-foreground">
          Snap<span className="text-primary">'n</span>Buy
        </span>
        <div className="w-10" />
      </div>

      {/* Camera / Preview area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {captured ? (
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={captured}
            alt="Captured"
            className="h-full w-full object-cover"
          />
        ) : cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-6 px-8 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary">
              <Camera className="h-10 w-10 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground">
              Point at any product
            </p>
            <p className="text-sm text-muted-foreground">
              Take a photo or upload from your gallery
            </p>
            <div className="flex gap-3">
              <Button onClick={startCamera} className="gap-2 rounded-xl">
                <Camera className="h-4 w-4" />
                Start Camera
              </Button>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 rounded-xl"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
        )}

        {/* Scan overlay */}
        {cameraActive && !captured && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-64 w-64 rounded-3xl border-2 border-primary/40" />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="safe-area-bottom flex items-center justify-center gap-6 bg-card/80 px-6 py-6 backdrop-blur-xl">
        {captured ? (
          <>
            <Button variant="secondary" onClick={retake} className="gap-2 rounded-xl">
              <RotateCcw className="h-4 w-4" />
              Retake
            </Button>
            <Button onClick={proceed} className="gap-2 rounded-xl px-8">
              Identify Brand
            </Button>
          </>
        ) : cameraActive ? (
          <button
            onClick={snapPhoto}
            className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-primary bg-primary/20 transition-transform active:scale-90"
            style={{ width: 72, height: 72 }}
          >
            <div className="h-14 w-14 rounded-full bg-primary" style={{ width: 56, height: 56 }} />
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">Start the camera or upload a photo</p>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
};

export default CameraPage;
