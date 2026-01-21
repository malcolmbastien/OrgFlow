
import { WorkflowModel, OrgLevel } from './types';

export const ORG_LEVELS: OrgLevel[] = [
  { id: 'strategic', label: 'Strategic', color: 'border-red-200', bgColor: 'bg-red-50/50' },
  { id: 'portfolio', label: 'Portfolio', color: 'border-purple-200', bgColor: 'bg-purple-50/50' },
  { id: 'team', label: 'Team', color: 'border-blue-200', bgColor: 'bg-blue-50/50' },
];

export const INITIAL_MODEL: WorkflowModel = {
  levels: ORG_LEVELS,
  teams: [
    { 
      id: 't1', 
      name: 'Executive Team', 
      members: ['CEO', 'CPO', 'CTO'], 
      level: 'strategic', 
      teamType: 'stream-aligned',
      collaborators: ['Board of Directors', 'External Auditors', 'Legal Counsel']
    },
    { 
      id: 't2', 
      name: 'Product Ops', 
      members: ['Operations Lead', 'Agile Coach'], 
      level: 'portfolio', 
      teamType: 'enabling',
      collaborators: ['HR Business Partners', 'Finance', 'Data Privacy Office']
    },
    { 
      id: 't3', 
      name: 'Platform Squad', 
      members: ['Eng Manager', 'Lead Dev'], 
      level: 'team', 
      teamType: 'platform',
      collaborators: ['Cloud Provider Support', 'Security Team', 'Design Systems Group']
    },
  ],
  workItems: [
    { id: 'w1', title: 'Regulatory Feed (EU)', type: 'input', level: 'strategic' },
    { id: 'w2', title: 'Market Analysis Stream', type: 'input', level: 'strategic' },
    { id: 'w3', title: 'Strategic Mandates', type: 'input', level: 'portfolio', description: 'Mandates filtered down from Strategy' },
    { id: 'w4', title: 'Portfolio Roadmap Feed', type: 'input', level: 'team' },
    { id: 'w5', title: 'Customer Support Signals', type: 'input', level: 'team' },
    { id: 'board_port', title: 'Portfolio Board', type: 'epic', level: 'portfolio', description: 'Central tracker for initiatives', owningTeamId: 't2' },
    { id: 'board_team', title: 'Team Jira Board', type: 'story', level: 'team', description: 'Active development board', owningTeamId: 't3' },
  ],
  rituals: [
    { 
      id: 'r_strat_sync', 
      title: 'Strategic Sync', 
      level: 'strategic', 
      participants: ['CEO', 'Board'],
      agendaItems: ['Market shifts', 'Funding'],
      ritualFrequency: 'Monthly',
      owningTeamId: 't1'
    },
    { 
      id: 'r_port_rev', 
      title: 'Portfolio Review', 
      level: 'portfolio', 
      participants: ['VPs', 'Directors', 'Scrum Masters'],
      agendaItems: ['Review releases', 'Risk assessment'],
      ritualFrequency: 'Bi-Weekly',
      owningTeamId: 't2'
    },
    { 
      id: 'r_standup', 
      title: 'Daily Standup', 
      level: 'team', 
      participants: ['Team Members', 'Scrum Master'],
      agendaItems: ['Review blockers', 'Help needed'],
      ritualFrequency: 'Daily',
      owningTeamId: 't3'
    },
  ],
  connections: [
    { id: 'c1', from: 'w1', to: 'board_port', style: 'solid' }, 
    { id: 'c2', from: 'board_port', to: 'r_port_rev', style: 'solid' }, 
    { id: 'c6', from: 'w3', to: 'board_port', style: 'solid' },
    { id: 'c7', from: 'w4', to: 'board_team', style: 'solid' },
  ]
};
