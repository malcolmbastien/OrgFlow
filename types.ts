
export type LevelId = 'strategic' | 'portfolio' | 'team';

export interface OrgLevel {
  id: LevelId;
  label: string;
  color: string;
  bgColor: string;
}

export type WorkItemType = 'initiative' | 'epic' | 'story' | 'input';

// Team Topologies Types
export type TeamType = 'stream-aligned' | 'enabling' | 'complicated-subsystem' | 'platform';
export type InteractionMode = 'collaboration' | 'x-as-a-service' | 'facilitating';

export interface Team {
  id: string;
  name: string;
  members: string[];
  level: LevelId;
  teamType?: TeamType;
  collaborators?: string[]; // Supporting functions, external consultants, etc.
}

export interface Ritual {
  id: string;
  title: string;
  level: LevelId;
  description?: string;
  participants: string[]; // Roles/Participants (e.g. "Director", "VP")
  agendaItems: string[]; // Focus areas for rituals
  ritualFrequency: string; 
  owningTeamId?: string;
}

export interface WorkItem {
  id: string;
  title: string;
  type: WorkItemType;
  level: LevelId;
  description?: string;
  owningTeamId?: string; 
  status?: 'backlog' | 'in-progress' | 'done';
  source?: string; // Origin of the input (e.g., "Market Trends", "Strategic Tier", "Customer Support")
}

export interface Connection {
  id: string;
  from: string; // ID of WorkItem, Ritual, or Team
  to: string;   // ID of WorkItem, Ritual, or Team
  label?: string;
  style: 'solid' | 'dashed';
  interactionMode?: InteractionMode; // For team-to-team connections
}

export interface WorkflowModel {
  levels: OrgLevel[];
  teams: Team[];
  workItems: WorkItem[];
  rituals: Ritual[];
  connections: Connection[];
}
