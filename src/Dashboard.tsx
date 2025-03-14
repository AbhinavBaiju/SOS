import { useState, useRef, useEffect } from 'react';
import './Dashboard.css';

interface DashboardProps {
  userName?: string;
}

function Dashboard({ userName = 'User' }: DashboardProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && stream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setImagePreview(imageData);
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="dashboard">
      <div className="greeting-container">
        <h1 className="greeting">{getGreeting()}, {userName}</h1>
      </div>
      <div className="camera-section">
        <div className="camera-container">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="preview-image" />
          ) : stream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="preview-image"
                style={{ transform: 'scaleX(-1)' }}
                onClick={handleCapture}
              />

            </>
          ) : (
            <div className="camera-placeholder">
            </div>
          )}
        </div>
      </div>

      <div className="bottom-area">
        <p className="info-text">
          SIMPLY SCAN ANY PRODUCT, AND LET SOS MAGNIFY THE DETAILS
        </p>
        <button className="scan-button" disabled={!imagePreview}>
            Scan Product
        </button>
      </div>
    </div>
  );
}

export default Dashboard;