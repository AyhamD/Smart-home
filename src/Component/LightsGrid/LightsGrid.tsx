// // src/components/LightsGrid/LightsGrid.tsx
// import { Light, LightState } from '../../types';
// import { LightCard } from '../LightCard/LightCard';

// type LightsGridProps = {
//   lights: Light[];
//   onToggle: (lightId: string, currentState: LightState) => void;
// };

// export const LightsGrid = ({ lights, onToggle }: LightsGridProps) => (
//   <div className="lights-grid">
//     {lights.map(light => (
//       <LightCard key={light.id} light={light} onToggle={onToggle} />
//     ))}
//   </div>
// );