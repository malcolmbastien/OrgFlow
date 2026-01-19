# OrgFlow Modeler - Product Requirements Document

## Vision
To create a structural modeling tool for organizational design. The focus is on defining the entities that make up an organization (Teams, Rituals, Work Items) and how they interact, before committing to a specific visual representation.

## Core Concepts
1. **Flight Levels**: 
   - **Strategic**: Direction and market signals.
   - **Portfolio**: Coordination and capacity.
   - **Team**: Tactical execution.
2. **The 4-Pillar Model (Input to Output)**:
   - **Inputs**: The 'Why/Where from'. Incoming signals like feedback, regulatory mandates, or corporate strategy.
   - **Teams**: The 'Who'. Groups of people with a primary focus level.
   - **Rituals**: The 'How/When'. Recurring meetings with agendas and cross-level participants that process Inputs.
   - **Work Items**: The 'What'. Initiatives, epics, and stories resulting from Rituals.
3. **Connective Tissue**:
   - Rituals and Work Items are connected across levels to form a flow.
   - **Flow Down**: High-level initiatives decompose into epics/stories.
   - **Roll Up**: Team-level signals and completion status inform portfolio and strategy.

## Target Features
- [x] Tri-entity data model (Teams, Rituals, Work Items).
- [x] High-fidelity Ritual modeling (Agenda vs Participants view).
- [x] Pillar-based structural layout (Inputs, Who, How, What).
- [x] Team-based ownership of rituals and work.
- [x] Cross-level dependency linking (Flow down/Roll up).
- [ ] Visual canvas-style dependency graphing (Lines).
- [ ] Capacity and WIP visualization.

## Success Metrics
- Ability to model complete meeting cadences (Agile/SAFe) within minutes.
- Clear structural distinction between human groups (Teams), process (Rituals), and output (Work).
