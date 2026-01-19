
export type LevelId = 'strategic' | 'portfolio' | 'team';

export interface OrgLevel {
  id: LevelId;
  label: string;
  color: string;
  bgColor: string;
}

export type WorkItemType = 'initiative' | 'epic' | 'story' | 'input';

export interface Team {
  id: string;
  name: string;
  members: string[];
  level: LevelId;
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
}

export interface Connection {
  id: string;
  from: string; // ID of WorkItem or Ritual
  to: string;   // ID of WorkItem or Ritual
  label?: string;
  style: 'solid' | 'dashed';
}

export interface WorkflowModel {
  levels: OrgLevel[];
  teams: Team[];
  workItems: WorkItem[];
  rituals: Ritual[];
  connections: Connection[];
}
