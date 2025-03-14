import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Dashboard.css';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

interface SustainabilityData {
  sustainability_data: {
    affect_on: {
      plant_life: { value: number; max_value: number };
      marine_life: { value: number; max_value: number };
      land_life: { value: number; max_value: number };
    };
    bad_effect: string;
    alternative: {
      product_title: string;
      reason: string;
    };
  };
}

interface DashboardProps {
  userName?: string;
}

function Dashboard({ userName = 'User' }: DashboardProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const streamRef = { current: null as MediaStream | null };
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        streamRef.current = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setError('Failed to access camera. Please ensure camera permissions are granted.');
      }
    };

    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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

  const navigate = useNavigate();

  const handleScan = async () => {
    if (!imagePreview) {
      setError('Please capture an image first');
      return;
    }
    if (!API_KEY) {
      setError('API key is not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      
      // Convert base64 to blob
      const response = await fetch(imagePreview);
      const blob = await response.blob();
      
      const xmlPrompt = `
<SYSTEM_PROMPT>
You are an environmental analysis AI that generates structured sustainability assessments.
Always return valid JSON using the exact template provided. Analyze both images and text inputs.
</SYSTEM_PROMPT>

<USER_PROMPT>
<ProductAnalysisRequest>
<ImageAnalysis>
[Uploaded product image]
</ImageAnalysis>

<TextAnalysis>
  <ProductCategory>Clothing</ProductCategory>
  <MaterialsDetected>Polyester, Plastic packaging</MaterialsDetected>
</TextAnalysis>
</ProductAnalysisRequest>
`;

      const imageBytes = await blob.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(imageBytes)));
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      };

      const result = await model.generateContent([xmlPrompt, imagePart]);
      const response_text = await result.response.text();
      const sustainabilityData = JSON.parse(response_text) as SustainabilityData;

      navigate('/scan', { 
        state: { 
          imageData: imagePreview,
          sustainabilityData: sustainabilityData
        } 
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      const errorMessage = 'Failed to analyze image. Please try again.';
      setError(errorMessage);
      navigate('/scan', { 
        state: { 
          imageData: imagePreview,
          error: errorMessage
        } 
      });
    } finally {
      setIsLoading(false);
    }
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
        {error && <p className="error-message">{error}</p>}
        <button 
          className="scan-button" 
          onClick={handleScan} 
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Scan Product'}
        </button>
      </div>
    </div>
  );
}

export default Dashboard;