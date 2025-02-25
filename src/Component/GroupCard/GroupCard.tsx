// src/components/GroupCard/GroupCard.tsx
import { FaLightbulb } from 'react-icons/fa';
import { LightGroup } from '../../types';

type GroupCardProps = {
  group: LightGroup;
  isActive: boolean;
  onToggle: () => void;
  onClick: () => void;
  type: 'hue' | 'bluetooth';
};

const GroupCard = ({ group, isActive, onToggle, onClick, type }: GroupCardProps) => {
  // Add safe access for lights array
  const lightsCount = group.lights?.length || 0;
  const groupType = group.type || 'Unknown';

  return (
    <div>
      {type === 'hue' ? (
        <div 
        className={`group-card ${isActive ? 'active' : ''}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
      >
        <div className="card-interactions">
          <FaLightbulb
            className={`lamp-icon ${isActive ? 'on' : 'off'}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          />
        </div>
        <div className="card-content">
          <h3 className="group-name">{group.name}</h3>
          <p className="group-meta">
            <span className="group-type">{groupType}</span>
            <span className="group-lights-count">
              {lightsCount} light{lightsCount !== 1 ? 's' : ''}
            </span>
          </p>
        </div>
      </div>
      ): <></>}
    </div>
  );
};

export default GroupCard;