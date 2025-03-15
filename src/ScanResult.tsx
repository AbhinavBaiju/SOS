import { useNavigate } from 'react-router-dom';
import './ScanResult.css';

interface ScanResultProps {
  imageUrl: string;
  sustainabilityData: {
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

export default function ScanResult({ imageUrl, sustainabilityData }: ScanResultProps) {
  const navigate = useNavigate();

  const calculatePercentage = (value: number, maxValue: number): number => {
    return Math.round((value / maxValue) * 100);
  };

  const plantLifePercentage = calculatePercentage(
    sustainabilityData.affect_on.plant_life.value,
    sustainabilityData.affect_on.plant_life.max_value
  );

  const marineLifePercentage = calculatePercentage(
    sustainabilityData.affect_on.marine_life.value,
    sustainabilityData.affect_on.marine_life.max_value
  );

  const landLifePercentage = calculatePercentage(
    sustainabilityData.affect_on.land_life.value,
    sustainabilityData.affect_on.land_life.max_value
  );

  // Calculate overall SOS score (average of all impacts)
  const sosScore = Math.round(
    (plantLifePercentage + marineLifePercentage + landLifePercentage) / 3
  );

  const handleScanAgain = () => {
    navigate('/dashboard');
  };

  return (
    <div className="scan-result">
      <div className="scan-result__content-wrapper">
        <div className="scan-result__header">
          <div className="scan-result__image-container">
            <img src={imageUrl} alt="Scanned item" className="scan-result__image" />
          </div>
        </div>

        <div className="scan-result__content">
          <div className="impact-metrics">
            <div className="impact-metric">
              <img src="/scan/MARINELIFE_ICON.png" alt="Marine life" className="impact-icon" />
              <div className="impact-score-circle">
                <div className="impact-score-value">{marineLifePercentage}%</div>
              </div>
              <div className="impact-label">marinelife</div>
            </div>
            <div className="impact-metric">
              <img src="/scan/PLANTLIFE_ICON.png" alt="Plant life" className="impact-icon" />
              <div className="impact-score-circle">
                <div className="impact-score-value">{plantLifePercentage}%</div>
              </div>
              <div className="impact-label">plantlife</div>
            </div>
            <div className="impact-metric">
              <img src="/scan/LANDLIFE_ICON.png" alt="Land life" className="impact-icon" />
              <div className="impact-score-circle">
                <div className="impact-score-value">{landLifePercentage}%</div>
              </div>
              <div className="impact-label">landlife</div>
            </div>
          </div>
          <div className="information">
            <div className="info-grid">
            <h3 className="info-title">Why Is It Bad?</h3>
              <div className="info-item">{sustainabilityData.bad_effect}</div>
            </div>
          </div>
          <div className="alternative">
            <div className="alternative-image">
              {/* Placeholder image - you may need to add the actual alternative product image */}
              <div style={{ width: '100%', height: '100%', background: '#512B52', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EED1ED' }}>Alt</div>
            </div>
            <div className="alternative-content">
              <h3 className="alternative-title">{sustainabilityData.alternative.product_title}</h3>
              <p className="alternative-description">{sustainabilityData.alternative.reason}</p>
            </div>
          </div>
          <div style={{ height: '120px' }} /> {/* Spacer for floating footer */}
        </div>

        <div className="scan-result__footer">
            <h3 className='final-verdict'>FINAL VIRDICT GOES HERE</h3>
          <button className="sos-again-button" onClick={handleScanAgain}>
            sos again
          </button>
        </div>
      </div>
    </div>
  );
}