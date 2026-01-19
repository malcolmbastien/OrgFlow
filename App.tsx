
import React, { useState, useMemo } from 'react';
import { WorkflowModel, Team, LevelId, Connection, Ritual, WorkItem, TeamType, InteractionMode } from './types';
import { INITIAL_MODEL, ORG_LEVELS } from './constants';

type ViewMode = 'architect' | 'connectivity';
type PillarType = 'input' | 'team' | 'ritual' | 'work';

const TYPE_COLORS: Record<string, { border: string, bg: string, text: string, accent: string }> = {
  'input': { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', accent: 'bg-amber-500' },
  'team': { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700', accent: 'bg-indigo-500' },
  'ritual': { border: 'border-teal-200', bg: 'bg-teal-50', text: 'text-teal-700', accent: 'bg-teal-500' },
  'work': { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', accent: 'bg-blue-600' },
};

const TEAM_TYPE_COLORS: Record<TeamType, { bg: string, text: string, border: string }> = {
  'stream-aligned': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'enabling': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'complicated-subsystem': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'platform': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const INTERACTION_COLORS: Record<InteractionMode, string> = {
  'collaboration': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'x-as-a-service': 'bg-rose-100 text-rose-700 border-rose-200',
  'facilitating': 'bg-amber-100 text-amber-700 border-amber-200',
};

const App: React.FC = () => {
  const [model, setModel] = React.useState<WorkflowModel>(INITIAL_MODEL);
  const [selection, setSelection] = React.useState<{ type: 'team' | 'work' | 'ritual' | 'input', id: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('architect');
  const [activeLinkTab, setActiveLinkTab] = useState<PillarType>('work');

  const selectedItem = useMemo(() => {
    if (!selection) return null;
    if (selection.type === 'team') return model.teams.find(t => t.id === selection.id);
    if (selection.type === 'work' || selection.type === 'input') return model.workItems.find(w => w.id === selection.id);
    if (selection.type === 'ritual') return model.rituals.find(r => r.id === selection.id);
    return null;
  }, [selection, model]);

  const toggleConnection = (fromId: string, toId: string, mode?: InteractionMode) => {
    const existingIndex = model.connections.findIndex(c => 
      (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
    );
    
    if (existingIndex > -1) {
      if (mode && model.connections[existingIndex].interactionMode !== mode) {
        setModel(prev => ({
          ...prev,
          connections: prev.connections.map((c, i) => i === existingIndex ? { ...c, interactionMode: mode } : c)
        }));
      } else {
        setModel(prev => ({ 
          ...prev, 
          connections: prev.connections.filter((_, i) => i !== existingIndex) 
        }));
      }
    } else {
      const isTeamToTeam = model.teams.some(t => t.id === fromId) && model.teams.some(t => t.id === toId);
      const newConn: Connection = { 
        id: `c-${Math.random().toString(36).substr(2, 9)}`, 
        from: fromId, 
        to: toId, 
        style: isTeamToTeam ? 'dashed' : 'solid', 
        label: 'Flow',
        interactionMode: isTeamToTeam ? (mode || 'collaboration') : undefined
      };
      setModel(prev => ({ 
        ...prev, 
        connections: [...prev.connections, newConn] 
      }));
    }
  };

  const addItem = (levelId: LevelId, pillar: PillarType) => {
    const id = `new-${Math.random().toString(36).substr(2, 9)}`;
    if (pillar === 'team') {
      const newTeam: Team = { id, name: 'New Team', members: [], level: levelId, teamType: 'stream-aligned' };
      setModel(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
      setSelection({ type: 'team', id });
    } else if (pillar === 'ritual') {
      const newRitual: Ritual = { id, title: 'New Ritual', level: levelId, participants: [], agendaItems: [], ritualFrequency: 'Weekly' };
      setModel(prev => ({ ...prev, rituals: [...prev.rituals, newRitual] }));
      setSelection({ type: 'ritual', id });
    } else {
      const isInput = pillar === 'input';
      const newItem: WorkItem = { 
        id, 
        title: isInput ? 'New Input Signal' : 'New Initiative', 
        type: isInput ? 'input' : 'initiative', 
        level: levelId, 
        source: isInput ? 'Internal' : undefined 
      };
      setModel(prev => ({ ...prev, workItems: [...prev.workItems, newItem] }));
      setSelection({ type: isInput ? 'input' : 'work', id });
    }
  };

  const updateItem = (id: string, updates: any) => {
    setModel(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.id === id ? { ...t, ...updates } : t),
      workItems: prev.workItems.map(w => w.id === id ? { ...w, ...updates } : w),
      rituals: prev.rituals.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const linkableItems = useMemo(() => {
    const inputs = model.workItems.filter(w => w.type === 'input' && w.id !== selection?.id);
    const teams = model.teams.filter(t => t.id !== selection?.id);
    const rituals = model.rituals.filter(r => r.id !== selection?.id);
    const work = model.workItems.filter(w => w.type !== 'input' && w.id !== selection?.id);
    return { input: inputs, team: teams, ritual: rituals, work: work };
  }, [model, selection]);

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-gray-50 text-slate-900">
      <aside className="w-[380px] h-full border-r bg-white flex flex-col z-50 shadow-sm border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3 bg-gray-50/50">
          <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">O</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">OrgFlow</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {selection && selectedItem ? (
            <div className="space-y-7">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inspector</span>
                <button onClick={() => setSelection(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                   <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Title / Name</label>
                   <input 
                    className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-base font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                    value={(selectedItem as any).name || (selectedItem as any).title || ''} 
                    onChange={(e) => updateItem(selectedItem.id, { [(selectedItem as any).name !== undefined ? 'name' : 'title']: e.target.value })}
                   />
                </div>

                {selection.type === 'team' && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Team Topology</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['stream-aligned', 'enabling', 'complicated-subsystem', 'platform'] as TeamType[]).map(type => (
                        <button
                          key={type}
                          onClick={() => updateItem(selectedItem.id, { teamType: type })}
                          className={`text-[10px] font-bold uppercase py-2 px-1 rounded-md border transition-all text-center leading-tight
                            ${(selectedItem as Team).teamType === type 
                              ? `${TEAM_TYPE_COLORS[type].bg} ${TEAM_TYPE_COLORS[type].text} ${TEAM_TYPE_COLORS[type].border} shadow-sm ring-1 ring-offset-1 ring-blue-500/20` 
                              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-500'}`}
                        >
                          {type.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                   <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Description</label>
                   <textarea 
                    className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm h-24 resize-none"
                    value={(selectedItem as any).description || ''} 
                    onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })}
                    placeholder="Provide context or operational details..."
                   />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Tier / Level</label>
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                    {ORG_LEVELS.map(l => (
                      <button
                        key={l.id}
                        onClick={() => updateItem(selectedItem.id, { level: l.id })}
                        className={`text-[10px] font-bold uppercase py-1.5 rounded-md transition-all ${selectedItem.level === l.id ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                   <div className="flex items-center justify-between mb-3">
                     <label className="text-sm font-semibold text-gray-600">Flow Connections</label>
                   </div>
                   
                   <div className="flex border-b border-gray-200 mb-2">
                     {(['input', 'team', 'ritual', 'work'] as PillarType[]).map(tab => (
                       <button
                        key={tab}
                        onClick={() => setActiveLinkTab(tab)}
                        className={`flex-1 pb-2 text-[10px] font-black uppercase tracking-tighter transition-all border-b-2 ${activeLinkTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400'}`}
                       >
                         {tab === 'input' ? 'Signals' : tab === 'work' ? 'Initiatives' : tab + 's'}
                       </button>
                     ))}
                   </div>

                   <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar bg-gray-50/30 shadow-inner">
                      {linkableItems[activeLinkTab].length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400 italic">No {activeLinkTab}s found</div>
                      ) : (
                        linkableItems[activeLinkTab].map(target => {
                          const connection = model.connections.find(c => (c.fromSelectionId === selection.id && c.to === target.id) || (c.from === selection.id && c.to === target.id) || (c.from === target.id && c.to === selection.id));
                          const isConnected = !!connection;
                          const isTeamTarget = activeLinkTab === 'team';
                          const isTeamSelection = selection.type === 'team';
                          const showInteractionMode = isTeamSelection && isTeamTarget && isConnected;

                          return (
                            <div key={target.id} className={`group transition-all ${isConnected ? 'bg-white shadow-sm ring-1 ring-blue-100' : ''}`}>
                              <button 
                                onClick={() => toggleConnection(selection.id, target.id)}
                                className={`w-full text-left px-4 py-3 text-xs flex items-center justify-between transition-all ${isConnected ? 'text-blue-700 font-bold' : 'text-gray-600 hover:bg-white'}`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ORG_LEVELS.find(l => l.id === target.level)?.color.replace('border-', 'bg-') || 'bg-gray-300'}`} />
                                  <span className="truncate pr-2">{(target as any).title || (target as any).name}</span>
                                </div>
                                {isConnected ? (
                                  <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0">Linked</span>
                                ) : (
                                  <span className="opacity-0 group-hover:opacity-100 text-blue-500 text-[8px] font-black uppercase transition-opacity">Connect</span>
                                )}
                              </button>
                              
                              {showInteractionMode && (
                                <div className="px-4 pb-3 flex flex-wrap gap-1">
                                  {(['collaboration', 'x-as-a-service', 'facilitating'] as InteractionMode[]).map(mode => (
                                    <button
                                      key={mode}
                                      onClick={() => toggleConnection(selection.id, target.id, mode)}
                                      className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border transition-all
                                        ${connection?.interactionMode === mode 
                                          ? 'bg-indigo-600 text-white border-indigo-700' 
                                          : 'bg-white text-gray-400 border-gray-200 hover:text-indigo-500 hover:border-indigo-300'}`}
                                    >
                                      {mode.replace(/-/g, ' ')}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 opacity-50">
               <svg className="w-14 h-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <p className="text-sm text-gray-500 font-medium">Select a node to inspect architecture and flow connections.</p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
        <header className="h-16 bg-white px-8 flex items-center justify-between z-40 border-b border-gray-200 shadow-sm">
           <nav className="flex items-center gap-10">
              <div className="flex gap-2 items-baseline">
                 <span className="text-sm font-bold text-gray-400 uppercase tracking-tighter">Project</span>
                 <span className="text-base font-semibold text-slate-800">Operational Topology</span>
              </div>
              <div className="h-5 w-px bg-gray-200" />
              <div className="flex gap-8">
                 <button onClick={() => setViewMode('architect')} className={`text-sm font-bold pb-5 -mb-5 border-b-2 tracking-tight ${viewMode === 'architect' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Architect</button>
                 <button onClick={() => setViewMode('connectivity')} className={`text-sm font-bold pb-5 -mb-5 border-b-2 tracking-tight ${viewMode === 'connectivity' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Connectivity</button>
              </div>
           </nav>
        </header>

        <main className={`flex-1 overflow-auto p-12 transition-all duration-300 custom-scrollbar ${viewMode === 'connectivity' ? 'canvas-grid' : ''}`}>
          <div className="relative min-w-[1600px] space-y-20">
            {ORG_LEVELS.map(level => (
              <LevelGrid 
                key={level.id} 
                level={level} 
                model={model} 
                selection={selection} 
                setSelection={setSelection} 
                addItem={addItem}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

const LevelGrid: React.FC<any> = ({ level, model, selection, setSelection, addItem }) => {
  const pillars = [
    { label: 'Signals (Why)', type: 'input' as PillarType, items: model.workItems.filter((w: any) => w.level === level.id && w.type === 'input') },
    { label: 'Teams (Who)', type: 'team' as PillarType, items: model.teams.filter((t: any) => t.level === level.id) },
    { label: 'Rituals (How)', type: 'ritual' as PillarType, items: model.rituals.filter((r: any) => r.level === level.id) },
    { label: 'Work (What)', type: 'work' as PillarType, items: model.workItems.filter((w: any) => w.level === level.id && w.type !== 'input') },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5">
         <span className={`w-4 h-4 rounded-full ${level.id === 'strategic' ? 'bg-red-400' : level.id === 'portfolio' ? 'bg-purple-400' : 'bg-blue-400'}`} />
         <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.2em]">{level.label} Tier</h2>
         <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="grid grid-cols-4 gap-8">
        {pillars.map(pillar => (
          <div key={pillar.label} className="bg-gray-200/30 rounded-xl p-6 space-y-5 min-h-[180px] border border-gray-200/50 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{pillar.label}</h3>
              <button 
                onClick={() => addItem(level.id, pillar.type)}
                className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all group"
              >
                <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="space-y-5 flex-1">
              {pillar.items.map((item: any) => (
                <JiraCard 
                  key={item.id} 
                  item={item} 
                  type={pillar.type} 
                  isSelected={selection?.id === item.id}
                  onSelect={() => setSelection({ type: pillar.type as any, id: item.id })}
                  model={model}
                />
              ))}
              {pillar.items.length === 0 && (
                <div className="h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center opacity-40">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">No Items</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const JiraCard: React.FC<any> = ({ item, type, isSelected, onSelect, model }) => {
  const color = TYPE_COLORS[type] || TYPE_COLORS.work;
  const owningTeam = item.owningTeamId ? model.teams.find((t: any) => t.id === item.owningTeamId) : null;

  const linkedItems = useMemo(() => {
    return model.connections
      .filter(c => c.from === item.id || c.to === item.id)
      .map(c => {
        const targetId = c.from === item.id ? c.to : c.from;
        const target = [...model.workItems, ...model.rituals, ...model.teams].find(i => i.id === targetId);
        if (!target) return null;
        let targetType: string = 'work';
        if ('type' in target && target.type === 'input') targetType = 'input';
        else if ('agendaItems' in target) targetType = 'ritual';
        else if ('members' in target) targetType = 'team';
        return { id: targetId, title: (target as any).title || (target as any).name, type: targetType, interactionMode: c.interactionMode };
      })
      .filter(Boolean);
  }, [model, item.id]);

  const teamTypeStyles = item.teamType ? TEAM_TYPE_COLORS[item.teamType as TeamType] : null;
  const isTeam = type === 'team';

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`bg-white border rounded-lg shadow-sm transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-400 z-20 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'} 
        w-full
      `}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${color.accent}`} />
      <div className="p-5 pl-6 space-y-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-base font-semibold text-slate-800 leading-tight truncate">
              {item.name || item.title}
            </span>
            {isTeam && item.teamType && (
               <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border mt-1 w-fit ${teamTypeStyles?.bg} ${teamTypeStyles?.text} ${teamTypeStyles?.border}`}>
                  {item.teamType.replace('-', ' ')}
               </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md whitespace-nowrap ${color.bg} ${color.text}`}>
               {item.type || type}
            </div>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          {type === 'team' ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {(item.members || []).map((m: string) => (
                  <span key={m} className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-[10px] font-medium text-gray-600 shadow-sm">{m}</span>
                ))}
              </div>
            </div>
          ) : type === 'ritual' ? (
            <div className="space-y-1.5">
               {(item.agendaItems || []).slice(0, 2).map((ai: string, idx: number) => (
                 <div key={idx} className="text-xs text-slate-500 pl-2 border-l-2 border-teal-100 leading-tight line-clamp-1">{ai}</div>
               ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 leading-relaxed italic line-clamp-2">
              {item.description || 'No description provided.'}
            </p>
          )}

          {linkedItems.length > 0 && (
            <div className="pt-3 border-t border-gray-100 mt-2 space-y-2">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                {isTeam ? 'Team Interactions' : 'Flow Links'}
              </div>
              <div className="flex flex-wrap gap-1">
                {linkedItems.map((linked: any) => {
                  const linkedColor = TYPE_COLORS[linked.type] || TYPE_COLORS.work;
                  const intStyle = linked.interactionMode ? INTERACTION_COLORS[linked.interactionMode as InteractionMode] : '';
                  return (
                    <div key={linked.id} className={`text-[8px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 shadow-sm max-w-full truncate ${linked.interactionMode ? intStyle : `${linkedColor.bg} ${linkedColor.text} ${linkedColor.border}`}`}>
                      {linked.interactionMode && <span className="w-1 h-1 rounded-full bg-current opacity-60" />}
                      <span className="truncate">{linked.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-gray-100 bg-gray-50/20 -mx-5 -mb-5 p-3 pl-5">
           <div className="flex items-center gap-2 overflow-hidden">
              {item.source && (
                <span className="text-[9px] font-black text-amber-600 uppercase truncate max-w-[80px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                  {item.source}
                </span>
              )}
              {owningTeam && (
                <span className="text-[10px] font-black text-indigo-400 uppercase truncate">
                  {owningTeam.name}
                </span>
              )}
           </div>
           {item.ritualFrequency && (
              <span className="text-[9px] font-black text-teal-600 uppercase bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                {item.ritualFrequency}
              </span>
           )}
        </div>
      </div>
    </div>
  );
};

export default App;
