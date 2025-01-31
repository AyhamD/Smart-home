// // src/components/GroupsGrid/GroupsGrid.tsx
// import { LightGroup, Light } from '../../types';
// import GroupCard from '../GroupCard/GroupCard';

// type GroupsGridProps = {
//   groups: LightGroup[];
//   lights: Light[];
//   onToggleGroup: (group: LightGroup) => void;
// };

// export const GroupsGrid = ({ groups, lights, onToggleGroup }: GroupsGridProps) => (
//   <div className="groups-grid">
//     {groups.map(group => (
//       <GroupCard
//         key={group.id}
//         group={group}
//         lights={lights}
//         onToggleGroup={onToggleGroup}
//       />
//     ))}
//   </div>
// );