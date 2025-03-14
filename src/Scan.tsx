import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Scan.css';

interface ScanState {
  imageData: string;
  sustainabilityData?: {
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
  };
  error?: string;
}

export default function Scan() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ScanState;

  if (!state?.imageData) {
    return (
      <div className="scan-container">
        <h1 className="scan-title">SCAN ANALYSIS</h1>
        <p className="scan-message error">No product scan data available</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="scan-container">
        <h1 className="scan-title">SCAN ANALYSIS</h1>
        <p className="scan-message error">{state.error}</p>
        <img src={state.imageData} alt="Scanned product" className="scan-image" />
      </div>
    );
  }

  const sustainabilityData = state.sustainabilityData?.sustainability_data;

  return (
    <div className="scan-container">
      <h1 className="scan-title">SCAN ANALYSIS</h1>
      <img src={state.imageData} alt="Scanned product" className="scan-image" />
      
      {sustainabilityData ? (
        <div className="analysis-results">
          <h2>Environmental Impact</h2>
          <div className="impact-metrics">
            <div className="metric">
              <h3>Plant Life Impact</h3>
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{
                    width: `${(sustainabilityData.affect_on.plant_life.value / sustainabilityData.affect_on.plant_life.max_value) * 100}%`
                  }}
                />
              </div>
            </div>
            <div className="metric">
              <h3>Marine Life Impact</h3>
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{
                    width: `${(sustainabilityData.affect_on.marine_life.value / sustainabilityData.affect_on.marine_life.max_value) * 100}%`
                  }}
                />
              </div>
            </div>
            <div className="metric">
              <h3>Land Life Impact</h3>
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{
                    width: `${(sustainabilityData.affect_on.land_life.value / sustainabilityData.affect_on.land_life.max_value) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="impact-details">
            <h3>Environmental Effects</h3>
            <p>{sustainabilityData.bad_effect}</p>
            
            <h3>Sustainable Alternative</h3>
            <div className="alternative">
              <h4>{sustainabilityData.alternative.product_title}</h4>
              <p>{sustainabilityData.alternative.reason}</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="scan-message">Processing your product scan...</p>
      )}
    </div>
  );
}