
import { WorkflowModel, OrgLevel } from './types';

export const ORG_LEVELS: OrgLevel[] = [
  { id: 'strategic', label: 'Strategic', color: 'border-red-200', bgColor: 'bg-red-50/50' },
  { id: 'portfolio', label: 'Portfolio', color: 'border-purple-200', bgColor: 'bg-purple-50/50' },
  { id: 'team', label: 'Team', color: 'border-blue-200', bgColor: 'bg-blue-50/50' },
];

export const INITIAL_MODEL: WorkflowModel = {
  levels: ORG_LEVELS,
  teams: [
    { id: 't1', name: 'Executive Team', members: ['CEO', 'CPO', 'CTO'], level: 'strategic' },
    { id: 't2', name: 'Product Ops', members: ['Operations Lead', 'Agile Coach'], level: 'portfolio' },
    { id: 't_intake', name: 'Intake Team', members: ['Intake Manager', 'Solution Architect'], level: 'portfolio' },
    { id: 't3', name: 'Core Platform Squad', members: ['Eng Manager', 'Lead Dev', 'Dev A', 'Dev B'], level: 'team' },
  ],
  workItems: [
    // Strategic
    { id: 'w1', title: 'EU AI Act Compliance', type: 'input', level: 'strategic' },
    { id: 'w2', title: 'Scale Infrastructure 2025', type: 'initiative', level: 'strategic', owningTeamId: 't1' },
    
    // Portfolio
    { id: 'w_port_in1', title: 'Corporate Budget Roadmap', type: 'input', level: 'portfolio' },
    { id: 'w3', title: 'Unified Data API', type: 'epic', level: 'portfolio', owningTeamId: 't2' },
    
    // Team
    { id: 'w_team_intake_input', title: 'Portfolio Intake Stream', type: 'input', level: 'team' },
    { id: 'w_team_in1', title: 'User Feedback: Mobile Latency', type: 'input', level: 'team' },
    { id: 'w4', title: 'Service Auth Migration', type: 'epic', level: 'team', owningTeamId: 't3' },
  ],
  rituals: [
    { 
      id: 'r_strat_1', 
      title: 'Monthly Strategy Review', 
      level: 'strategic', 
      participants: ['CEO', 'VPs', 'Board Members'],
      agendaItems: ['Review market signals', 'Approve capital expenditure', 'Pivot roadmap'],
      ritualFrequency: 'Monthly',
      owningTeamId: 't1'
    },
    { 
      id: 'r1', 
      title: 'Portfolio Review', 
      level: 'portfolio', 
      participants: ['VPs', 'Directors', 'Lab Leads', 'Scrum Masters'],
      agendaItems: ['Review releases', 'Review portfolio impacts', 'Review risks', 'Review intakes'],
      ritualFrequency: 'Weekly',
      owningTeamId: 't2'
    },
    { 
      id: 'r_intake_review', 
      title: 'Intake Review', 
      level: 'portfolio', 
      participants: ['Intake Manager', 'Product Owners', 'Architects'],
      agendaItems: ['Screen new requests', 'Assign priority', 'Validate requirements'],
      ritualFrequency: 'Weekly',
      owningTeamId: 't_intake'
    },
    { 
      id: 'r_port_lead', 
      title: 'Leadership Review', 
      level: 'portfolio', 
      participants: ['Directors', 'Lab Leads', 'Department Heads'],
      agendaItems: ['Review management updates', 'Analyze cross-department metrics'],
      ritualFrequency: 'Weekly',
      owningTeamId: 't2'
    },
    { 
      id: 'r2', 
      title: 'Daily Standup', 
      level: 'team', 
      participants: ['Team', 'Scrum Master'],
      agendaItems: ['Review blockers', 'Ask for help', 'Share updates'],
      ritualFrequency: 'Mon/Wed/Fri',
      owningTeamId: 't3'
    },
    { 
      id: 'r_team_backlog', 
      title: 'Backlog Cleanup', 
      level: 'team', 
      participants: ['Product Owner', 'Team Members'],
      agendaItems: ['Groom team backlog items', 'Clarify requirements', 'Estimate complexity'],
      ritualFrequency: 'Bi-weekly',
      owningTeamId: 't3'
    },
    { 
      id: 'r_team_demo', 
      title: 'Sprint Demo', 
      level: 'team', 
      participants: ['Team', 'Stakeholders', 'Product Owner'],
      agendaItems: ['Get feedback on completed work', 'Showcase new functionality'],
      ritualFrequency: 'Fortnightly',
      owningTeamId: 't3'
    }
  ],
  connections: [
    { id: 'c1', from: 'w1', to: 'w2', label: 'Mandates', style: 'solid' }, 
    { id: 'c2', from: 'w2', to: 'w3', label: 'Flow Down', style: 'solid' }, 
    { id: 'c3', from: 'w3', to: 'w4', label: 'Implementation', style: 'solid' }, 
    { id: 'c4', from: 'r_team_demo', to: 'r_port_lead', label: 'Insights Up', style: 'dashed' }, 
    { id: 'c5', from: 'r1', to: 'r_strat_1', label: 'Status Up', style: 'dashed' },
    { id: 'c_intake_to_team', from: 'r_intake_review', to: 'w_team_intake_input', label: 'Handover', style: 'solid' },
  ]
};
