export interface ShowroomConfig {
  initialRoom: string;
  initialFloor: number;
  initialFace: number;
  initialTimeOfDay: 'day' | 'night';
  idleTimeBeforeHint: number;
  structureImage: string;
}

export const showroomConfig: ShowroomConfig = {
  initialRoom: 'Lobby',
  initialFloor: 1,
  initialFace: 0,
  initialTimeOfDay: 'day',
  idleTimeBeforeHint: 10000,
  structureImage: "/building/structure.png"
};
