// // src/components/LightCard/LightCard.tsx
// import { Light } from '../../types';

// type LightCardProps = {
//   light: Light;
//   onToggle: (lightId: string, currentState: LightState) => void;
// };

// export const LightCard = ({ light, onToggle }: LightCardProps) => (
//   <div className="light-card">
//     <h2>{light.name}</h2>
//     <p>Status: {light.state.on ? 'ON' : 'OFF'}</p>
//     <button
//       onClick={() => onToggle(light.id, light.state)}
//       className={light.state.on ? 'on' : 'off'}
//     >
//       {light.state.on ? 'Turn Off' : 'Turn On'}
//     </button>
//   </div>
// );