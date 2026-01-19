
import React from 'react';
import { WorkflowModel, WorkItem, Ritual, Team, LevelId, WorkItemType, Connection } from './types';
import { INITIAL_MODEL, ORG_LEVELS } from './constants';

const App: React.FC = () => {
  const [model, setModel] = React.useState<WorkflowModel>(INITIAL_MODEL);
  const [selection, setSelection] = React.useState<{ type: 'team' | 'work' | 'ritual', id: string } | null>(null);

  const selectedTeam = selection?.type === 'team' ? model.teams.find(t => t.id === selection.id) : null;
  const selectedWork = selection?.type === 'work' ? model.workItems.find(w => w.id === selection.id) : null;
  const selectedRitual = selection?.type === 'ritual' ? model.rituals.find(r => r.id === selection.id) : null;

  const updateTeam = (id: string, updates: Partial<Team>) => {
    setModel(prev => ({ ...prev, teams: prev.teams.map(t => t.id === id ? { ...t, ...updates } : t) }));
  };
  const updateWork = (id: string, updates: Partial<WorkItem>) => {
    setModel(prev => ({ ...prev, workItems: prev.workItems.map(w => w.id === id ? { ...w, ...updates } : w) }));
  };
  const updateRitual = (id: string, updates: Partial<Ritual>) => {
    setModel(prev => ({ ...prev, rituals: prev.rituals.map(r => r.id === id ? { ...r, ...updates } : r) }));
  };

  const deleteItem = () => {
    if (!selection) return;
    const { type, id } = selection;
    setModel(prev => ({
      ...prev,
      teams: type === 'team' ? prev.teams.filter(t => t.id !== id) : prev.teams,
      workItems: type === 'work' ? prev.workItems.filter(w => w.id !== id) : prev.workItems,
      rituals: type === 'ritual' ? prev.rituals.filter(r => r.id !== id) : prev.rituals,
      connections: prev.connections.filter(c => c.from !== id && c.to !== id)
    }));
    setSelection(null);
  };

  const toggleConnection = (fromId: string, toId: string) => {
    const existingIndex = model.connections.findIndex(c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId));
    if (existingIndex > -1) {
      setModel(prev => ({ ...prev, connections: prev.connections.filter((_, i) => i !== existingIndex) }));
    } else {
      const newConn: Connection = { id: `c-${Date.now()}`, from: fromId, to: toId, style: 'solid', label: 'Link' };
      setModel(prev => ({ ...prev, connections: [...prev.connections, newConn] }));
    }
  };

  const addNewItem = (type: 'team' | 'work' | 'ritual', level: LevelId, workType: WorkItemType = 'story') => {
    const id = `${type}-${Date.now()}`;
    if (type === 'team') {
      const newTeam: Team = { id, name: 'New Team', members: [], level };
      setModel(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
      setSelection({ type, id });
    } else if (type === 'work') {
      const newWork: WorkItem = { id, title: `New ${workType}`, type: workType, level };
      setModel(prev => ({ ...prev, workItems: [...prev.workItems, newWork] }));
      setSelection({ type, id });
    } else if (type === 'ritual') {
      const newRitual: Ritual = { id, title: 'New Ritual', level, participants: [], agendaItems: [], ritualFrequency: 'Weekly' };
      setModel(prev => ({ ...prev, rituals: [...prev.rituals, newRitual] }));
      setSelection({ type, id });
    }
  };

  const spawnFromInput = (inputId: string, level: LevelId) => {
    const id = `work-${Date.now()}`;
    const type: WorkItemType = level === 'strategic' ? 'initiative' : level === 'portfolio' ? 'epic' : 'story';
    const newWork: WorkItem = { id, title: `Derived from Input`, type, level };
    const newConn: Connection = { id: `c-${Date.now()}`, from: inputId, to: id, style: 'solid', label: 'Derived from' };
    
    setModel(prev => ({
      ...prev,
      workItems: [...prev.workItems, newWork],
      connections: [...prev.connections, newConn]
    }));
    setSelection({ type: 'work', id });
  };

  const getEntityName = (id: string) => {
    return model.teams.find(t => t.id === id)?.name || 
           model.workItems.find(w => w.id === id)?.title || 
           model.rituals.find(r => r.id === id)?.title || 
           'Unknown';
  };

  const getConnections = (id: string) => {
    return {
      upstream: model.connections.filter(c => c.to === id),
      downstream: model.connections.filter(c => c.from === id)
    };
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans text-slate-800">
      {/* Sidebar - Control & Inspector */}
      <div className="w-80 h-full border-r flex flex-col z-50 bg-white shadow-xl overflow-y-auto">
        <div className="p-6 border-b shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-indigo-200 shadow-lg">OF</div>
            <h1 className="text-xl font-black tracking-tight uppercase">OrgFlow</h1>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Organizational Blueprint</p>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {selection ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center">
                <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1 flex-1 mr-4">Inspector</h2>
                <button onClick={deleteItem} className="text-[10px] text-red-500 font-bold hover:underline">Delete</button>
              </div>

              {selectedTeam && (
                <div className="space-y-4">
                  <InputField label="Team Name" value={selectedTeam.name} onChange={v => updateTeam(selectedTeam.id, { name: v })} />
                  <SelectField label="Level" value={selectedTeam.level} options={['strategic', 'portfolio', 'team']} onChange={v => updateTeam(selectedTeam.id, { level: v as LevelId })} />
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Members (CSV)</label>
                    <input type="text" value={selectedTeam.members.join(', ')} onChange={e => updateTeam(selectedTeam.id, { members: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} className="w-full text-xs p-3 bg-slate-50 border-none rounded-xl font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
              )}

              {selectedWork && (
                <div className="space-y-4">
                  <InputField label="Title" value={selectedWork.title} onChange={v => updateWork(selectedWork.id, { title: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField label="Type" value={selectedWork.type} options={['input', 'initiative', 'epic', 'story']} onChange={v => updateWork(selectedWork.id, { type: v as WorkItemType })} />
                    <SelectField label="Level" value={selectedWork.level} options={['strategic', 'portfolio', 'team']} onChange={v => updateWork(selectedWork.id, { level: v as LevelId })} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Owner Team</label>
                    <select value={selectedWork.owningTeamId || ''} onChange={e => updateWork(selectedWork.id, { owningTeamId: e.target.value })} className="w-full text-xs font-bold p-2 bg-slate-50 border-none rounded-lg outline-none focus:ring-2 focus:ring-indigo-400">
                      <option value="">None</option>
                      {model.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  {selectedWork.type === 'input' && (
                    <button 
                      onClick={() => spawnFromInput(selectedWork.id, selectedWork.level)}
                      className="w-full py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-md active:scale-95"
                    >
                      Spawn Work Item from Signal
                    </button>
                  )}
                  <ConnectionManager 
                    id={selectedWork.id} 
                    model={model} 
                    onToggle={(to) => toggleConnection(selectedWork.id, to)}
                    getEntityName={getEntityName}
                  />
                </div>
              )}

              {selectedRitual && (
                <div className="space-y-4">
                  <InputField label="Ritual Title" value={selectedRitual.title} onChange={v => updateRitual(selectedRitual.id, { title: v })} />
                  <InputField label="Frequency" value={selectedRitual.ritualFrequency} onChange={v => updateRitual(selectedRitual.id, { ritualFrequency: v })} />
                  <SelectField label="Level" value={selectedRitual.level} options={['strategic', 'portfolio', 'team']} onChange={v => updateRitual(selectedRitual.id, { level: v as LevelId })} />
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Owning Team</label>
                    <select value={selectedRitual.owningTeamId || ''} onChange={e => updateRitual(selectedRitual.id, { owningTeamId: e.target.value })} className="w-full text-xs font-bold p-2 bg-slate-50 border-none rounded-lg outline-none focus:ring-2 focus:ring-indigo-400">
                      <option value="">None</option>
                      {model.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <ConnectionManager 
                    id={selectedRitual.id} 
                    model={model} 
                    onToggle={(to) => toggleConnection(selectedRitual.id, to)}
                    getEntityName={getEntityName}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="pt-12 text-center opacity-40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">Select an item in the explorer<br/>to edit details</p>
            </div>
          )}
        </div>
      </div>

      {/* Main View */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-slate-100">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between shadow-sm shrink-0 z-10">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Organizational Grid</h2>
          <div className="flex gap-4">
             <div className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
               Architect Mode
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          {ORG_LEVELS.map(level => {
            const levelInputs = model.workItems.filter(w => w.level === level.id && w.type === 'input');
            const levelWork = model.workItems.filter(w => w.level === level.id && w.type !== 'input');
            const levelRituals = model.rituals.filter(r => r.level === level.id);
            const levelTeams = model.teams.filter(t => t.level === level.id);

            return (
              <section key={level.id} className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-200 relative">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <span className={`w-3 h-3 rounded-full ${level.id === 'strategic' ? 'bg-red-400' : level.id === 'portfolio' ? 'bg-purple-400' : 'bg-blue-400'}`} />
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{level.label} Level</h2>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => addNewItem('work', level.id, 'input')} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">+ Add Input</button>
                    <button onClick={() => addNewItem('team', level.id)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">+ Add Team</button>
                    <button onClick={() => addNewItem('ritual', level.id)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">+ Add Ritual</button>
                    <button onClick={() => addNewItem('work', level.id, 'initiative')} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">+ Add Work</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
                  {/* Pillar 1: Inputs */}
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em] border-b border-amber-100 pb-2 flex items-center justify-between">
                      <span>Inputs (Signals)</span>
                      <span className="text-amber-300 font-bold">{levelInputs.length}</span>
                    </h3>
                    <div className="space-y-4">
                      {levelInputs.map(input => (
                        <CardWrapper 
                          key={input.id} 
                          id={input.id} 
                          selected={selection?.id === input.id} 
                          onClick={() => setSelection({ type: 'work', id: input.id })}
                          type="input"
                          connections={getConnections(input.id)}
                          getEntityName={getEntityName}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-[8px] font-black text-amber-600 uppercase">Signal</div>
                            {getConnections(input.id).downstream.length > 0 && (
                              <div className="text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full animate-bounce">
                                Spawning {getConnections(input.id).downstream.length}
                              </div>
                            )}
                          </div>
                          <h4 className="font-bold text-xs text-slate-800 leading-snug">{input.title}</h4>
                        </CardWrapper>
                      ))}
                      {levelInputs.length === 0 && <EmptyState text="No Inputs" />}
                    </div>
                  </div>

                  {/* Pillar 2: Who (Teams) */}
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2 flex items-center justify-between">
                      <span>Who (Teams)</span>
                      <span className="text-slate-300 font-bold">{levelTeams.length}</span>
                    </h3>
                    <div className="space-y-4">
                      {levelTeams.map(team => (
                        <div 
                          key={team.id} 
                          onClick={() => setSelection({ type: 'team', id: team.id })} 
                          className={`p-5 bg-slate-50 rounded-2xl border-2 transition-all cursor-pointer hover:bg-white hover:shadow-lg ${selection?.id === team.id ? 'border-indigo-500 bg-white ring-4 ring-indigo-50 shadow-md' : 'border-transparent'}`}
                        >
                          <h4 className="font-bold text-sm text-slate-800">{team.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed">
                            {team.members.length} Members
                          </p>
                        </div>
                      ))}
                      {levelTeams.length === 0 && <EmptyState text="No Teams" />}
                    </div>
                  </div>

                  {/* Pillar 3: How (Rituals) */}
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2 flex items-center justify-between">
                      <span>How (Rituals)</span>
                      <span className="text-slate-300 font-bold">{levelRituals.length}</span>
                    </h3>
                    <div className="space-y-4">
                      {levelRituals.map(ritual => {
                         const conns = getConnections(ritual.id);
                         return (
                          <div 
                            key={ritual.id} 
                            onClick={() => setSelection({ type: 'ritual', id: ritual.id })} 
                            className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden flex flex-col transition-all cursor-pointer hover:shadow-xl ${selection?.id === ritual.id ? 'border-indigo-500 ring-4 ring-indigo-50 scale-[1.02]' : 'border-slate-100'}`}
                          >
                            <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center">
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tight">{ritual.title}</span>
                            </div>
                            <div className="flex divide-x divide-slate-100 min-h-[90px]">
                              <div className="flex-1 p-3 space-y-1">
                                {ritual.agendaItems.map((item, i) => (
                                  <div key={i} className="text-[9px] text-slate-600 leading-tight flex gap-1.5">
                                    <span className="text-slate-300">•</span> {item}
                                  </div>
                                ))}
                              </div>
                              <div className="flex-1 p-3 space-y-1 bg-slate-50/30">
                                {ritual.participants.map((p, i) => (
                                  <div key={i} className="text-[9px] text-indigo-700 font-bold leading-tight uppercase tracking-tighter">{p}</div>
                                ))}
                              </div>
                            </div>
                            <ConnectionBadges connections={conns} getEntityName={getEntityName} />
                            <div className="px-4 py-1.5 bg-white border-t text-[8px] font-black text-slate-300 uppercase tracking-widest flex justify-between">
                              <span>{ritual.ritualFrequency}</span>
                            </div>
                          </div>
                        );
                      })}
                      {levelRituals.length === 0 && <EmptyState text="No Rituals" />}
                    </div>
                  </div>

                  {/* Pillar 4: What (Work Items) */}
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2 flex items-center justify-between">
                      <span>What (Work)</span>
                      <span className="text-slate-300 font-bold">{levelWork.length}</span>
                    </h3>
                    <div className="space-y-4">
                      {levelWork.map(work => (
                        <CardWrapper 
                          key={work.id} 
                          id={work.id} 
                          selected={selection?.id === work.id} 
                          onClick={() => setSelection({ type: 'work', id: work.id })}
                          type="work"
                          connections={getConnections(work.id)}
                          getEntityName={getEntityName}
                        >
                          <div>
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter mb-2 inline-block bg-slate-100 text-slate-500">{work.type}</span>
                            <h4 className="font-bold text-sm text-slate-900 leading-snug">{work.title}</h4>
                          </div>
                          {work.owningTeamId && (
                            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                               <span className="text-[8px] font-black text-slate-300 uppercase">Accountable</span>
                               <span className="text-[8px] font-bold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[80px]">{model.teams.find(t => t.id === work.owningTeamId)?.name}</span>
                            </div>
                          )}
                        </CardWrapper>
                      ))}
                      {levelWork.length === 0 && <EmptyState text="No Work Items" />}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ConnectionBadges: React.FC<{ 
  connections: { upstream: Connection[], downstream: Connection[] }, 
  getEntityName: (id: string) => string 
}> = ({ connections, getEntityName }) => {
  if (connections.upstream.length === 0 && connections.downstream.length === 0) return null;
  return (
    <div className="px-3 py-1.5 bg-slate-50 border-t flex flex-wrap gap-1">
      {connections.upstream.map(c => (
        <span key={c.id} title={`Source: ${getEntityName(c.from)}`} className="text-[7px] font-bold uppercase bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 truncate max-w-[120px]">
          ↑ {getEntityName(c.from)}
        </span>
      ))}
      {connections.downstream.map(c => (
        <span key={c.id} title={`Target: ${getEntityName(c.to)}`} className="text-[7px] font-bold uppercase bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-400 truncate max-w-[120px]">
          ↓ {getEntityName(c.to)}
        </span>
      ))}
    </div>
  );
};

const CardWrapper: React.FC<{ 
  id: string, 
  selected: boolean, 
  onClick: () => void, 
  children: React.ReactNode, 
  type: 'input' | 'work', 
  connections: { upstream: Connection[], downstream: Connection[] }, 
  getEntityName: (id: string) => string 
}> = ({ id, selected, onClick, children, type, connections, getEntityName }) => {
  const baseClasses = `p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-xl ${selected ? 'ring-4 ring-indigo-50 scale-[1.02]' : 'border-slate-100'}`;
  const typeClasses = type === 'input' 
    ? (selected ? 'border-amber-400 bg-white ring-amber-50' : 'bg-amber-50/50 border-transparent')
    : (selected ? 'border-indigo-500 bg-white' : 'bg-white border-slate-100');
    
  return (
    <div onClick={onClick} className={`${baseClasses} ${typeClasses}`}>
      <div className="mb-2">{children}</div>
      <ConnectionBadges connections={connections} getEntityName={getEntityName} />
    </div>
  );
};

const ConnectionManager: React.FC<{ 
  id: string, 
  model: WorkflowModel, 
  onToggle: (id: string) => void, 
  getEntityName: (id: string) => string 
}> = ({ id, model, onToggle, getEntityName }) => {
  const potentialTargets = [
    ...model.workItems.filter(w => w.id !== id),
    ...model.rituals.filter(r => r.id !== id)
  ];

  return (
    <div className="space-y-2 mt-4 pt-4 border-t">
      <label className="text-[9px] font-black text-slate-400 uppercase block">Connections & Links</label>
      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
        {potentialTargets.map(target => {
          const isConnected = model.connections.some(c => (c.from === id && c.to === target.id) || (c.from === target.id && c.to === id));
          return (
            <button 
              key={target.id} 
              onClick={() => onToggle(target.id)}
              className={`text-[10px] text-left p-2 rounded-lg transition-colors flex items-center justify-between ${isConnected ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="truncate">{target.title}</span>
              {isConnected && <span>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 font-bold uppercase text-[9px] tracking-widest">
    {text}
  </div>
);

const InputField: React.FC<{ label: string, value: string, onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-sm font-bold p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" />
  </div>
);

const SelectField: React.FC<{ label: string, value: string, options: string[], onChange: (v: string) => void }> = ({ label, value, options, onChange }) => (
  <div>
    <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-xs font-bold p-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default App;
