import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Scan.css';
import ScanResult from './ScanResult';

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

  useEffect(() => {
    return () => {
      if (state?.error) {
        state.error = undefined;
      }
    };
  }, [state]);

  useEffect(() => {
    if (state?.sustainabilityData) {
      console.debug('Received sustainability data:', {
        plantLifeImpact: state.sustainabilityData.sustainability_data.affect_on.plant_life,
        marineLifeImpact: state.sustainabilityData.sustainability_data.affect_on.marine_life,
        landLifeImpact: state.sustainabilityData.sustainability_data.affect_on.land_life,
        alternativeProduct: state.sustainabilityData.sustainability_data.alternative.product_title,
        dataStructure: JSON.stringify(state.sustainabilityData, null, 2)
      });
    }
  }, [state?.sustainabilityData]);

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
      {sustainabilityData ? (
        <ScanResult 
          imageUrl={state.imageData} 
          sustainabilityData={sustainabilityData} 
        />
      ) : (
        <>
          <h1 className="scan-title">SCAN ANALYSIS</h1>
          <img src={state.imageData} alt="Scanned product" className="scan-image" />
          <p className="scan-message">Processing your product scan...</p>
        </>
      )}
    </div>
  );
}