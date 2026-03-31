// src/features/hue/components/GroupCard/GroupCard.tsx
import { FaLightbulb, FaPowerOff } from 'react-icons/fa';
import { LightGroup } from '../../../../shared/types';

// Room color gradients for Hue app-like appearance
const roomGradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
];

type GroupCardProps = {
  group: LightGroup;
  isActive: boolean;
  onToggle: () => void;
  onClick: () => void;
  type: 'hue' | 'bluetooth';
  colorIndex?: number;
};

const GroupCard = ({ group, isActive, onToggle, onClick, type, colorIndex = 0 }: GroupCardProps) => {
  const lightsCount = group.lights?.length || 0;
  const gradient = roomGradients[colorIndex % roomGradients.length];

  if (type !== 'hue') return null;

  return (
    <div 
      className={`room-card ${isActive ? 'active' : 'inactive'}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        '--room-gradient': gradient,
        '--room-gradient-dim': gradient.replace('100%)', '30%)'),
      } as React.CSSProperties}
    >
      <div className="room-background" />
      
      <div className="room-content">
        <div className="room-icon">
          <FaLightbulb className={`bulb-icon ${isActive ? 'on' : 'off'}`} />
        </div>
        
        <div className="room-info">
          <h3 className="room-name">{group.name}</h3>
          <p className="room-lights">
            {lightsCount} light{lightsCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      <button 
        className={`power-button ${isActive ? 'on' : 'off'}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={isActive ? 'Turn off' : 'Turn on'}
      >
        <FaPowerOff />
      </button>
      
      {isActive && <div className="active-indicator" />}
    </div>
  );
};

export default GroupCard;