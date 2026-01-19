
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
    { id: 'w1', title: 'EU AI Act Compliance', type: 'input', level: 'strategic', source: 'Regulation (External)' },
    { id: 'w2', title: 'Competitor X Series C', type: 'input', level: 'strategic', source: 'Market Trends' },
    { id: 'w3', title: 'Carbon Neutrality 2026', type: 'input', level: 'portfolio', source: 'Strategic Directive', description: 'Mandate filtered down from ESG Strategy' },
    { id: 'w4', title: 'Scale to 1M Users', type: 'input', level: 'team', source: 'Portfolio Roadmap' },
    { id: 'w5', title: 'Latency Complaints', type: 'input', level: 'team', source: 'Customer Support' },
    { id: 'board_port', title: 'Portfolio Board', type: 'epic', level: 'portfolio', description: 'Central tracker for all cross-team initiatives', owningTeamId: 't2' },
    { id: 'board_team', title: 'Team Jira Board', type: 'story', level: 'team', description: 'Active development sprint board', owningTeamId: 't3' },
  ],
  rituals: [
    { 
      id: 'r_port_rev', 
      title: 'Portfolio Review', 
      level: 'portfolio', 
      participants: ['VPs', 'Directors', 'Scrum Masters'],
      agendaItems: ['Review releases', 'Review portfolio impacts', 'Risk assessment'],
      ritualFrequency: 'Weekly',
      owningTeamId: 't2'
    },
    { 
      id: 'r_standup', 
      title: 'Daily Standup', 
      level: 'team', 
      participants: ['Team', 'Scrum Master'],
      agendaItems: ['Review blockers', 'Yesterday/Today', 'Help needed'],
      ritualFrequency: 'Daily',
      owningTeamId: 't3'
    },
    { 
      id: 'r_demo', 
      title: 'Sprint Demo', 
      level: 'team', 
      participants: ['Team', 'Stakeholders'],
      agendaItems: ['Showcase work', 'Gather feedback'],
      ritualFrequency: 'Bi-weekly',
      owningTeamId: 't3'
    }
  ],
  connections: [
    { id: 'c1', from: 'w1', to: 'board_port', label: 'Flows to', style: 'solid' }, 
    { id: 'c2', from: 'board_port', to: 'r_port_rev', label: 'Governed by', style: 'solid' }, 
    { id: 'c3', from: 'r_port_rev', to: 'board_team', label: 'Decomposes to', style: 'solid' },
    { id: 'c4', from: 'board_team', to: 'r_standup', label: 'Processes', style: 'solid' },
    { id: 'c5', from: 'r_standup', to: 'r_demo', label: 'Progresses to', style: 'dashed' },
    { id: 'c6', from: 'w3', to: 'board_port', style: 'solid' },
    { id: 'c7', from: 'w4', to: 'board_team', style: 'solid' },
  ]
};
