import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

function Dashboard({ userName = localStorage.getItem('userName') || 'User' }: DashboardProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, []);

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
        console.debug('Camera initialized successfully', {
          videoTracks: mediaStream.getVideoTracks().map(t => ({id: t.id, kind: t.kind})),
          resolution: videoRef.current ? 
            `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}` : 'unknown'
        });
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
    if (!videoRef.current || !stream) {
      console.error('Camera capture failed:', {
        videoRef: videoRef.current ? 'exists' : 'missing',
        stream: stream ? 'active' : 'inactive'
      });
      setError('Camera not ready. Please try again.');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      context.drawImage(videoRef.current, 0, 0);
      
      // Convert canvas to blob and create a session-cached URL
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a blob URL that persists for the browser session
          const blobUrl = URL.createObjectURL(blob);
          setImagePreview(blobUrl);
          setError(null);
          console.debug('Image captured and cached successfully', {
            dimensions: `${canvas.width}x${canvas.height}`,
            blobSize: blob.size,
            blobUrl: blobUrl,
            timestamp: new Date().toISOString()
          });
        } else {
          throw new Error('Failed to create image blob');
        }
      }, 'image/jpeg', 0.95);
      
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    } catch (error) {
      console.error('Image capture error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        videoWidth: videoRef.current?.videoWidth,
        videoHeight: videoRef.current?.videoHeight
      });
      setError('Failed to capture image. Please try again.');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.error) {
      navigate('.', { state: null, replace: true });
      setError(null);
    }
  }, [location]);

  const handleScan = async () => {
    console.debug('Scan initiated', {
      hasImagePreview: !!imagePreview,
      hasApiKey: !!API_KEY,
      timestamp: new Date().toISOString()
    });

    if (!imagePreview) {
      console.warn('Scan attempted without image');
      setError('Please capture an image first');
      return;
    }
    if (!API_KEY) {
      console.error('API key missing');
      setError('API key is not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.debug('Initializing Gemini model');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      console.debug('Fetching image blob from preview');
      const response = await fetch(imagePreview);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      console.debug('Image blob fetched successfully', {
        size: blob.size,
        type: blob.type,
        timestamp: new Date().toISOString()
      });
      
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
<OutputTemplate>
{
  "sustainability_data": {
    "affect_on": {
      "plant_life": {"value": 0,"max_value": 100},
      "marine_life": {"value": 0,"max_value": 100},
      "land_life": {"value": 0,"max_value": 100}
    },
    "bad_effect": "[VISUAL-BASED ANALYSIS]...",
    "alternative": {
      "product_title": "...",
      "reason": "..."
    }
  }
}
</OutputTemplate>
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

      console.debug('Initiating Gemini API request with payload:', {
        model: 'gemini-pro-vision',
        prompt: xmlPrompt.replace(/\s+/g, ' ').substring(0, 200) + '...',
        imageMetadata: {
          mimeType: 'image/jpeg',
          dataLength: base64Data.length
        }
      });

      const startTime = Date.now();
      const result = await model.generateContent([xmlPrompt, imagePart]);
      const duration = Date.now() - startTime;

      const response_text = await result.response.text();
      console.log('Complete Raw Gemini API Response:', {
        fullResponse: response_text,
        responseLength: response_text.length,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      // Clean the response text by removing markdown code block syntax if present
      const cleanedResponse = response_text
        .replace(/^```(?:json)?\n|```$/gm, '') // Remove markdown code blocks with or without language specifier
        .trim()
        .replace(/\\n/g, '\n') // Handle escaped newlines
        .replace(/\\([^\\])/g, '$1'); // Remove unnecessary escaping
      
      try {
        const sustainabilityData = JSON.parse(cleanedResponse) as SustainabilityData;
        console.debug('Parsed sustainability data:', {
          plantLifeImpact: sustainabilityData.sustainability_data.affect_on.plant_life,
          marineLifeImpact: sustainabilityData.sustainability_data.affect_on.marine_life,
          alternativeProduct: sustainabilityData.sustainability_data.alternative.product_title
        });
      
        navigate('/scan', { 
          state: { 
            imageData: imagePreview,
            sustainabilityData: sustainabilityData,
            error: null
          } 
        });
      } catch (parseError) {
        console.error('JSON parsing error:', {
          error: parseError instanceof Error ? parseError.message : 'Unknown error',
          rawResponse: response_text.substring(0, 200),
          cleanedResponse: cleanedResponse.substring(0, 200)
        });
        throw new Error(`Failed to parse API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error analyzing image:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        imagePreview: imagePreview ? imagePreview.substring(0, 50) + '...' : null
      });
      let errorMessage = 'Failed to analyze image. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'Network error: Please check your internet connection.';
        } else if (error.message.includes('invalid JSON')) {
          errorMessage = 'Invalid API response format. Please try again.';
        } else if (error.message.includes('API key')) {
          errorMessage = 'Invalid API configuration. Please check credentials.';
        } else if (error.message.includes('deprecated')) {
          errorMessage = 'API version error: The model version is not supported.';
        }
      }
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
              />
              <button 
                className="capture-button"
                onClick={handleCapture}
                disabled={!stream}
              >
                Capture Image
              </button>
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