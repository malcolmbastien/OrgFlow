
import React, { useState, useMemo } from 'react';
import { WorkflowModel, Team, LevelId, Connection, Ritual, WorkItem, TeamType } from './types';
import { INITIAL_MODEL, ORG_LEVELS } from './constants';

type ViewMode = 'architect' | 'connectivity';
type PillarType = 'input' | 'team' | 'ritual' | 'work';
type TargetCategory = 'team' | 'ritual' | 'work' | 'input';

const TYPE_COLORS: Record<string, { border: string, bg: string, text: string, accent: string }> = {
  'input': { border: 'border-[#FFFAE6]', bg: 'bg-[#FFF9E6]', text: 'text-[#974F0C]', accent: 'bg-[#FFAB00]' },
  'team': { border: 'border-[#DFE1E6]', bg: 'bg-[#EAE6FF]', text: 'text-[#403294]', accent: 'bg-[#6554C0]' },
  'ritual': { border: 'border-[#DFE1E6]', bg: 'bg-[#E6FCFF]', text: 'text-[#006575]', accent: 'bg-[#00B8D9]' },
  'work': { border: 'border-[#DFE1E6]', bg: 'bg-[#DEEBFF]', text: 'text-[#0747A6]', accent: 'bg-[#0052CC]' },
};

const TIER_DOT_COLORS: Record<LevelId, string> = {
  'strategic': 'bg-[#DE350B]',
  'portfolio': 'bg-[#6554C0]',
  'team': 'bg-[#00B8D9]'
};

const LEVEL_WEIGHTS: Record<LevelId, number> = {
  'strategic': 0,
  'portfolio': 1,
  'team': 2
};

const TEAM_TYPES: { value: TeamType; label: string }[] = [
  { value: 'stream-aligned', label: 'Stream-Aligned' },
  { value: 'enabling', label: 'Enabling' },
  { value: 'complicated-subsystem', label: 'Complicated Subsystem' },
  { value: 'platform', label: 'Platform' },
];

const RITUAL_FREQUENCIES = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'As Needed'];

const App: React.FC = () => {
  const [model, setModel] = React.useState<WorkflowModel>(INITIAL_MODEL);
  const [selection, setSelection] = React.useState<{ type: TargetCategory, id: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('architect');
  const [linkSearch, setLinkSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TargetCategory>('team');
  const [newListItem, setNewListItem] = useState('');

  const selectedItem = useMemo(() => {
    if (!selection) return null;
    if (selection.type === 'team') return model.teams.find(t => t.id === selection.id);
    if (selection.type === 'work' || selection.type === 'input') return model.workItems.find(w => w.id === selection.id);
    if (selection.type === 'ritual') return model.rituals.find(r => r.id === selection.id);
    return null;
  }, [selection, model]);

  const outgoingConnections = useMemo(() => {
    if (!selection) return [];
    return model.connections.filter(c => c.from === selection.id);
  }, [selection, model.connections]);

  const findEntity = (id: string) => {
    const team = model.teams.find(t => t.id === id);
    if (team) return { ...team, category: 'team' as TargetCategory };
    const ritual = model.rituals.find(r => r.id === id);
    if (ritual) return { ...ritual, category: 'ritual' as TargetCategory };
    const work = model.workItems.find(w => w.id === id);
    if (work) return { ...work, category: work.type === 'input' ? 'input' as TargetCategory : 'work' as TargetCategory };
    return null;
  };

  const getEntityTitle = (id: string) => {
    const ent = findEntity(id);
    if (!ent) return 'Unknown Entity';
    return (ent as any).name || (ent as any).title;
  };

  const getConnectionInfo = (fromId: string, toId: string) => {
    const from = findEntity(fromId);
    const to = findEntity(toId);
    if (!from || !to) return { label: 'Link', color: 'bg-[#EBECF0] text-[#42526E]', border: 'border-[#DFE1E6]' };

    const fromLevel = LEVEL_WEIGHTS[from.level];
    const toLevel = LEVEL_WEIGHTS[to.level];

    if (from.category === 'input') return { label: 'Signal', color: 'bg-[#FFF0B3] text-[#974F0C]', border: 'border-[#FFE380]' };
    if (to.category === 'ritual') return { label: 'Processing', color: 'bg-[#E6FCFF] text-[#006575]', border: 'border-[#00B8D9]' };
    if (fromLevel < toLevel) return { label: 'Flow Down', color: 'bg-[#EAE6FF] text-[#403294]', border: 'border-[#D2CCFF]' };
    if (fromLevel > toLevel) return { label: 'Roll Up', color: 'bg-[#FFEBE6] text-[#BF2600]', border: 'border-[#FFBDAD]' };
    
    return { label: 'Horizontal', color: 'bg-[#DEEBFF] text-[#0747A6]', border: 'border-[#B3D4FF]' };
  };

  const categoryItems = useMemo(() => {
    if (!selection) return [];
    let items: { id: string, name: string, level: LevelId }[] = [];
    
    if (activeTab === 'team') items = model.teams.map(t => ({ id: t.id, name: t.name, level: t.level }));
    else if (activeTab === 'ritual') items = model.rituals.map(r => ({ id: r.id, name: r.title, level: r.level }));
    else if (activeTab === 'input') items = model.workItems.filter(w => w.type === 'input').map(w => ({ id: w.id, name: w.title, level: w.level }));
    else items = model.workItems.filter(w => w.type !== 'input').map(w => ({ id: w.id, name: w.title, level: w.level }));

    return items
      .filter(t => t.id !== selection.id)
      .filter(t => t.name.toLowerCase().includes(linkSearch.toLowerCase()))
      .sort((a, b) => LEVEL_WEIGHTS[a.level] - LEVEL_WEIGHTS[b.level]);
  }, [model, selection, activeTab, linkSearch]);

  const updateItem = (id: string, updates: any) => {
    setModel(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.id === id ? { ...t, ...updates } : t),
      workItems: prev.workItems.map(w => w.id === id ? { ...w, ...updates } : w),
      rituals: prev.rituals.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const addItemToList = (id: string, field: string, value: string) => {
    if (!value.trim()) return;
    const item: any = selectedItem;
    const currentList = item[field] || [];
    if (currentList.includes(value.trim())) return;
    updateItem(id, { [field]: [...currentList, value.trim()] });
    setNewListItem('');
  };

  const removeItemFromList = (id: string, field: string, value: string) => {
    const item: any = selectedItem;
    const currentList = item[field] || [];
    updateItem(id, { [field]: currentList.filter((i: string) => i !== value) });
  };

  const toggleConnection = (toId: string) => {
    if (!selection) return;
    const existingConn = outgoingConnections.find(c => c.to === toId);
    if (existingConn) {
      removeConnection(existingConn.id);
    } else {
      const newConnection: Connection = {
        id: `c-${Date.now()}`,
        from: selection.id,
        to: toId,
        style: 'solid'
      };
      setModel(prev => ({ ...prev, connections: [...prev.connections, newConnection] }));
    }
  };

  const removeConnection = (connId: string) => {
    setModel(prev => ({ ...prev, connections: prev.connections.filter(c => c.id !== connId) }));
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
        title: isInput ? 'New Work Source' : 'New Initiative', 
        type: isInput ? 'input' : 'initiative', 
        level: levelId, 
      };
      setModel(prev => ({ ...prev, workItems: [...prev.workItems, newItem] }));
      setSelection({ type: isInput ? 'input' : 'work', id });
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-[#F4F5F7] text-[#172B4D]">
      <aside className="w-[360px] h-full border-r bg-white flex flex-col z-50 border-[#DFE1E6] shadow-xl">
        <div className="p-4 border-b border-[#DFE1E6] flex items-center gap-3 bg-white">
          <div className="w-8 h-8 bg-[#0747A6] rounded flex items-center justify-center text-white font-bold text-lg">O</div>
          <div>
            <h1 className="text-sm font-bold text-[#172B4D] tracking-tight">OrgFlow Modeler</h1>
            <span className="text-[10px] text-[#5E6C84] font-medium uppercase tracking-wider">Enterprise Edition</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          {selection && selectedItem ? (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-[#EBECF0] pb-2">
                <span className="text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider">Entity Details</span>
                <button onClick={() => setSelection(null)} className="text-[#5E6C84] hover:bg-[#EBECF0] p-1 rounded transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                   <label className="text-[11px] font-bold text-[#5E6C84] mb-1.5 block uppercase tracking-wider">
                     {selection.type === 'input' ? 'Source Name' : 'Title'}
                   </label>
                   <input 
                    className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded p-2.5 text-sm font-medium text-[#172B4D] focus:bg-white focus:border-[#4C9AFF] outline-none transition-all shadow-sm"
                    value={(selectedItem as any).name || (selectedItem as any).title || ''} 
                    onChange={(e) => updateItem(selectedItem.id, { [(selectedItem as any).name !== undefined ? 'name' : 'title']: e.target.value })}
                   />
                </div>

                {selection.type === 'team' && (
                  <div>
                    <label className="text-[11px] font-bold text-[#5E6C84] mb-1.5 block uppercase tracking-wider">Team Type</label>
                    <select 
                      className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded p-2.5 text-sm font-medium text-[#172B4D] focus:bg-white focus:border-[#4C9AFF] outline-none transition-all shadow-sm"
                      value={(selectedItem as Team).teamType || 'stream-aligned'}
                      onChange={(e) => updateItem(selectedItem.id, { teamType: e.target.value })}
                    >
                      {TEAM_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {selection.type === 'ritual' && (
                  <div>
                    <label className="text-[11px] font-bold text-[#5E6C84] mb-1.5 block uppercase tracking-wider">Ritual Frequency</label>
                    <select 
                      className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded p-2.5 text-sm font-medium text-[#172B4D] focus:bg-white focus:border-[#4C9AFF] outline-none transition-all shadow-sm"
                      value={(selectedItem as Ritual).ritualFrequency || 'Weekly'}
                      onChange={(e) => updateItem(selectedItem.id, { ritualFrequency: e.target.value })}
                    >
                      {RITUAL_FREQUENCIES.map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(selection.type === 'team' || selection.type === 'ritual') && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-[#5E6C84] block uppercase tracking-wider">
                      {selection.type === 'team' ? 'Roles & Members' : 'Participants'}
                    </label>
                    <div className="relative">
                      <input 
                        placeholder={`Add ${selection.type === 'team' ? 'role/name' : 'participant'}...`}
                        className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded p-2 text-xs font-medium focus:bg-white focus:border-[#4C9AFF] outline-none transition-all"
                        value={newListItem}
                        onChange={(e) => setNewListItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItemToList(selectedItem.id, selection.type === 'team' ? 'members' : 'participants', newListItem)}
                      />
                      <button onClick={() => addItemToList(selectedItem.id, selection.type === 'team' ? 'members' : 'participants', newListItem)} className="absolute right-2 top-2 text-[#0052CC]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {((selectedItem as any)[selection.type === 'team' ? 'members' : 'participants'] || []).map((m: string) => (
                        <span key={m} className="group flex items-center gap-1.5 bg-[#EBECF0] text-[#172B4D] px-2 py-1.5 rounded text-[11px] font-bold uppercase tracking-tight border border-[#DFE1E6]">
                          {m}
                          <button onClick={() => removeItemFromList(selectedItem.id, selection.type === 'team' ? 'members' : 'participants', m)} className="text-[#5E6C84] hover:text-[#BF2600]">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                   <label className="text-[11px] font-bold text-[#5E6C84] mb-1.5 block uppercase tracking-wider">Description</label>
                   <textarea className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded p-2.5 text-sm font-medium text-[#172B4D] focus:bg-white focus:border-[#4C9AFF] h-24 resize-none shadow-sm" value={(selectedItem as any).description || ''} onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })} placeholder="Describe the structural purpose..." />
                </div>

                <div className="pt-4 border-t border-[#EBECF0] space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <label className="text-[11px] font-bold text-[#5E6C84] block uppercase tracking-wider">Active Links</label>
                       <span className="text-[10px] font-bold text-[#0052CC] bg-[#DEEBFF] px-1.5 rounded">{outgoingConnections.length}</span>
                    </div>
                    {outgoingConnections.length > 0 ? (
                      <ul className="space-y-1.5">
                        {outgoingConnections.map(c => {
                          const info = getConnectionInfo(c.from, c.to);
                          return (
                            <li key={c.id} className="group flex items-center justify-between p-2.5 bg-[#FAFBFC] border border-[#DFE1E6] rounded-md hover:border-[#4C9AFF] shadow-sm">
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-[11px] font-bold text-[#172B4D] truncate uppercase">{getEntityTitle(c.to)}</span>
                                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border mt-1 self-start ${info.color} ${info.border}`}>
                                  {info.label}
                                </span>
                              </div>
                              <button onClick={() => removeConnection(c.id)} className="text-[#BF2600] opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#FFEBE6] rounded-full"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="p-4 border border-dashed border-[#C1C7D0] rounded flex items-center justify-center opacity-40">
                         <span className="text-[10px] font-bold text-[#5E6C84] uppercase">No connections</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="text-[11px] font-bold text-[#5E6C84] block uppercase tracking-wider">Add Connection</label>
                    <div className="relative">
                      <input className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded p-2 pl-8 text-xs font-medium focus:bg-white focus:border-[#4C9AFF]" value={linkSearch} onChange={(e) => setLinkSearch(e.target.value)} placeholder="Search..." />
                      <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#5E6C84]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div className="bg-[#EBECF0] p-1 rounded-md flex gap-1">
                      {(['team', 'ritual', 'input', 'work'] as TargetCategory[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 text-[9px] font-black uppercase py-1.5 rounded transition-all ${activeTab === tab ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#5E6C84]'}`}>{tab === 'input' ? 'Sources' : tab + 's'}</button>
                      ))}
                    </div>
                    <div className="max-h-72 overflow-y-auto border border-[#DFE1E6] rounded bg-white shadow-inner custom-scrollbar">
                      {categoryItems.length > 0 ? (
                        <div className="p-1 space-y-4">
                          {ORG_LEVELS.map(level => {
                            const levelItems = categoryItems.filter(t => t.level === level.id);
                            if (levelItems.length === 0) return null;
                            return (
                              <div key={level.id} className="space-y-1">
                                <div className="px-2 py-1 text-[8px] font-black text-[#7A869A] uppercase tracking-[0.15em] border-b border-[#F4F5F7] mb-1">{level.label} Tier</div>
                                {levelItems.map(target => {
                                  const isConnected = outgoingConnections.some(c => c.to === target.id);
                                  return (
                                    <div key={target.id} className="group w-full flex items-center justify-between p-2 hover:bg-[#F4F5F7] rounded-md border border-transparent">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TIER_DOT_COLORS[target.level]}`} />
                                        <span className="text-[11px] font-semibold text-[#172B4D] uppercase truncate leading-none">{target.name}</span>
                                      </div>
                                      <button onClick={() => toggleConnection(target.id)} className={`ml-2 px-2 py-1 rounded text-[9px] font-black uppercase transition-all shadow-sm ${isConnected ? 'bg-[#36B37E]/20 text-[#36B37E] border border-[#36B37E]/40' : 'bg-[#0052CC] text-white hover:bg-[#0747A6]'}`}>
                                        {isConnected ? 'Linked' : 'Link'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      ) : <div className="p-6 text-center text-[10px] font-bold text-[#5E6C84] uppercase opacity-50">No results</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
               <div className="w-12 h-12 bg-[#F4F5F7] rounded-full flex items-center justify-center mb-4"><svg className="w-6 h-6 text-[#A5ADBA]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
               <p className="text-[12px] text-[#5E6C84] font-bold uppercase tracking-widest leading-relaxed">Select an object to<br/>view connections</p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 h-full flex flex-col relative overflow-hidden bg-white">
        <header className="h-14 bg-white px-6 flex items-center justify-between z-[60] border-b border-[#DFE1E6]">
           <div className="flex bg-[#EBECF0] p-0.5 rounded shadow-inner">
              <button onClick={() => setViewMode('architect')} className={`px-5 py-1.5 text-[11px] font-bold uppercase rounded ${viewMode === 'architect' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#5E6C84]'}`}>Architect</button>
              <button onClick={() => setViewMode('connectivity')} className={`px-5 py-1.5 text-[11px] font-bold uppercase rounded ${viewMode === 'connectivity' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#5E6C84]'}`}>Connectivity</button>
           </div>
        </header>

        <main className="flex-1 relative overflow-auto bg-[#F4F5F7] custom-scrollbar">
          {viewMode === 'architect' ? (
             <div className="p-8"><div className="relative min-w-[1300px] space-y-12">{ORG_LEVELS.map(level => (
               <LevelGrid key={level.id} level={level} model={model} selection={selection} setSelection={setSelection} addItem={addItem} />
             ))}</div></div>
          ) : (
            <ConnectivityDiagram model={model} selection={selection} setSelection={setSelection} />
          )}
        </main>
      </div>
    </div>
  );
};

const ConnectivityDiagram: React.FC<any> = ({ model, selection, setSelection }) => {
  const LEVEL_HEIGHT = 400; const PILLAR_WIDTH = 300; const NODE_HEIGHT = 100; const NODE_WIDTH = 240; const PADDING = 100;
  const diagramNodes = useMemo(() => {
    const nodes: any[] = []; const levelOrder: LevelId[] = ['strategic', 'portfolio', 'team']; const pillarOrder: PillarType[] = ['input', 'team', 'ritual', 'work'];
    levelOrder.forEach((level, lIdx) => {
      pillarOrder.forEach((pillar, pIdx) => {
        let items: any[] = [];
        if (pillar === 'team') items = model.teams.filter((t: any) => t.level === level);
        else if (pillar === 'ritual') items = model.rituals.filter((r: any) => r.level === level);
        else if (pillar === 'input') items = model.workItems.filter((w: any) => w.level === level && w.type === 'input');
        else items = model.workItems.filter((w: any) => w.level === level && w.type !== 'input');
        items.forEach((item, iIdx) => nodes.push({ id: item.id, item, type: pillar, level, x: PADDING + pIdx * PILLAR_WIDTH + (PILLAR_WIDTH - NODE_WIDTH) / 2, y: PADDING + lIdx * LEVEL_HEIGHT + iIdx * (NODE_HEIGHT + 30), width: NODE_WIDTH, height: NODE_HEIGHT }));
      });
    });
    return nodes;
  }, [model]);
  const findNode = (id: string) => diagramNodes.find(n => n.id === id);
  return (
    <div className="p-12 min-w-[1400px] min-h-[1400px] relative">
      <svg className="absolute inset-0 pointer-events-none overflow-visible"><defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orientation="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#C1C7D0" /></marker><marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orientation="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#0052CC" /></marker></defs>
        {model.connections.map((conn: Connection) => {
          const from = findNode(conn.from); const to = findNode(conn.to); if (!from || !to) return null;
          const isSelected = selection?.id === conn.from || selection?.id === conn.to;
          const x1 = from.x + from.width; const y1 = from.y + from.height / 2; const x2 = to.x; const y2 = to.y + to.height / 2;
          return <path key={conn.id} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={isSelected ? '#0052CC' : '#C1C7D0'} strokeWidth={isSelected ? 2 : 1.5} fill="none" markerEnd={isSelected ? 'url(#arrowhead-active)' : 'url(#arrowhead)'} />;
        })}
      </svg>
      {ORG_LEVELS.map((level, i) => (
         <div key={level.id} className="absolute border border-dashed border-[#DFE1E6] rounded pointer-events-none" style={{ left: PADDING - 40, top: PADDING + i * LEVEL_HEIGHT - 30, width: PILLAR_WIDTH * 4 + 80, height: LEVEL_HEIGHT - 40, zIndex: 0 }}>
           <span className="absolute -top-3 left-4 bg-[#F4F5F7] px-2 text-xs font-bold text-[#5E6C84] uppercase tracking-widest">{level.label} Tier</span>
         </div>
      ))}
      {diagramNodes.map(n => {
        const color = TYPE_COLORS[n.type] || TYPE_COLORS.work;
        return (
          <div key={n.id} onClick={() => setSelection({ type: n.type as any, id: n.id })} style={{ left: n.x, top: n.y, width: n.width, height: n.height }} className={`absolute bg-white border rounded shadow-sm flex flex-col overflow-hidden cursor-pointer transition-all ${selection?.id === n.id ? 'border-[#0052CC] ring-2 ring-[#0052CC]/10 z-10' : 'border-[#DFE1E6] hover:bg-[#FAFBFC]'}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.accent}`} />
            <div className="flex-1 p-3 pl-4 flex flex-col justify-between">
              <div className="flex justify-between items-start gap-2"><h4 className="text-xs font-bold text-[#172B4D] uppercase leading-tight">{n.item.name || n.item.title}</h4><div className={`text-[9px] font-black uppercase px-1 py-0.5 rounded ${color.bg} ${color.text} border ${color.border}`}>{n.type === 'input' ? 'Source' : n.type}</div></div>
              <div className="flex items-center justify-between border-t border-[#F4F5F7] pt-1.5 mt-1.5"><span className="text-[9px] font-bold text-[#5E6C84] uppercase">{n.level}</span></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const LevelGrid: React.FC<any> = ({ level, model, selection, setSelection, addItem }) => {
  const pillars = [
    { label: 'Work Sources', type: 'input' as PillarType, items: model.workItems.filter((w: any) => w.level === level.id && w.type === 'input') },
    { label: 'Teams', type: 'team' as PillarType, items: model.teams.filter((t: any) => t.level === level.id) },
    { label: 'Rituals', type: 'ritual' as PillarType, items: model.rituals.filter((r: any) => r.level === level.id) },
    { label: 'Active Work', type: 'work' as PillarType, items: model.workItems.filter((w: any) => w.level === level.id && w.type !== 'input') },
  ];

  const findEntity = (id: string) => {
    const team = model.teams.find(t => t.id === id);
    if (team) return { ...team, category: 'team' as TargetCategory };
    const ritual = model.rituals.find(r => r.id === id);
    if (ritual) return { ...ritual, category: 'ritual' as TargetCategory };
    const work = model.workItems.find(w => w.id === id);
    if (work) return { ...work, category: work.type === 'input' ? 'input' as TargetCategory : 'work' as TargetCategory };
    return null;
  };

  const getEntityTitle = (id: string) => {
    const ent = findEntity(id);
    if (!ent) return 'Unknown Entity';
    return (ent as any).name || (ent as any).title;
  };

  const getConnectionInfo = (fromId: string, toId: string) => {
    const from = findEntity(fromId);
    const to = findEntity(toId);
    if (!from || !to) return { label: 'Link', color: 'bg-[#EBECF0] text-[#42526E]', border: 'border-[#DFE1E6]' };
    const fromLevel = LEVEL_WEIGHTS[from.level];
    const toLevel = LEVEL_WEIGHTS[to.level];
    if (from.category === 'input') return { label: 'Signal', color: 'bg-[#FFF0B3] text-[#974F0C]', border: 'border-[#FFE380]' };
    if (to.category === 'ritual') return { label: 'Processing', color: 'bg-[#E6FCFF] text-[#006575]', border: 'border-[#00B8D9]' };
    if (fromLevel < toLevel) return { label: 'Flow Down', color: 'bg-[#EAE6FF] text-[#403294]', border: 'border-[#D2CCFF]' };
    if (fromLevel > toLevel) return { label: 'Roll Up', color: 'bg-[#FFEBE6] text-[#BF2600]', border: 'border-[#FFBDAD]' };
    return { label: 'Horizontal', color: 'bg-[#DEEBFF] text-[#0747A6]', border: 'border-[#B3D4FF]' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4"><span className={`w-2.5 h-2.5 rounded-full ${TIER_DOT_COLORS[level.id as LevelId]}`} /><h2 className="text-xs font-bold text-[#5E6C84] uppercase tracking-widest">{level.label} Tier</h2><div className="h-px flex-1 bg-[#DFE1E6]" /></div>
      <div className="grid grid-cols-4 gap-6">{pillars.map(pillar => (
        <div key={pillar.label} className="bg-[#EBECF0]/40 rounded border border-[#DFE1E6] p-4 space-y-4 min-h-[160px] flex flex-col shadow-sm">
          <div className="flex items-center justify-between"><h3 className="text-[11px] font-bold uppercase text-[#5E6C84] tracking-wider">{pillar.label}</h3><button onClick={() => addItem(level.id, pillar.type)} className="w-7 h-7 rounded bg-white border border-[#DFE1E6] flex items-center justify-center shadow-sm text-gray-500 hover:text-blue-600 transition-colors font-bold">+</button></div>
          <div className="space-y-4 flex-1">
            {pillar.items.map((item: any) => {
              const connections = model.connections
                .filter((c: any) => c.from === item.id)
                .map(c => {
                  const target = findEntity(c.to);
                  return {
                    targetName: getEntityTitle(c.to),
                    targetCategory: target?.category,
                    ...getConnectionInfo(c.from, c.to)
                  };
                });
              return (
                <JiraCard 
                  key={item.id} 
                  item={item} 
                  type={pillar.type} 
                  isSelected={selection?.id === item.id} 
                  connections={connections}
                  onSelect={() => setSelection({ type: pillar.type as any, id: item.id })} 
                />
              );
            })}
            {pillar.items.length === 0 && <div className="p-4 border border-dashed rounded flex items-center justify-center opacity-30 text-[9px] font-bold uppercase">Empty</div>}
          </div>
        </div>
      ))}</div>
    </div>
  );
};

const JiraCard: React.FC<any> = ({ item, type, isSelected, onSelect, connections }) => {
  const color = TYPE_COLORS[type] || TYPE_COLORS.work;
  return (
    <div onClick={(e) => { e.stopPropagation(); onSelect(); }} className={`bg-white border rounded shadow-sm transition-all duration-200 cursor-pointer flex flex-col relative overflow-hidden ${isSelected ? 'border-[#4C9AFF] ring-2 ring-[#4C9AFF]/20 z-20 shadow-md translate-y-[-2px]' : 'border-[#DFE1E6] hover:bg-[#FAFBFC]'}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.accent}`} />
      <div className="p-4 pl-5 space-y-4">
        <div className="flex justify-between items-start gap-2"><span className="text-sm font-bold text-[#172B4D] uppercase leading-tight line-clamp-2">{item.name || item.title}</span><div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${color.bg} ${color.text} border ${color.border}`}>{type === 'input' ? 'Source' : type}</div></div>
        
        {(item.members || item.participants)?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(item.members || item.participants).slice(0, 3).map((m: string, idx: number) => (
              <span key={idx} className="text-[10px] font-bold bg-[#EBECF0] text-[#172B4D] px-2 py-1.5 rounded uppercase border border-[#DFE1E6]">
                {m}
              </span>
            ))}
            {(item.members || item.participants).length > 3 && (
              <span className="text-[10px] font-bold text-gray-400 py-1 px-1">+{(item.members || item.participants).length - 3}</span>
            )}
          </div>
        )}

        {connections && connections.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[#F4F5F7]">
            <div className="text-[8px] font-black text-[#7A869A] uppercase tracking-widest">Active Links</div>
            <div className="space-y-1.5">
              {connections.slice(0, 3).map((conn: any, idx: number) => {
                const targetColor = TYPE_COLORS[conn.targetCategory] || TYPE_COLORS.work;
                return (
                  <div key={idx} className="flex items-center gap-1.5 group/link">
                    <span className={`text-[7px] font-black uppercase tracking-tighter px-1 rounded border leading-none py-0.5 shrink-0 ${conn.color} ${conn.border}`}>
                      {conn.label}
                    </span>
                    <span className={`text-[7px] font-black uppercase tracking-tighter px-1 rounded border leading-none py-0.5 shrink-0 ${targetColor.bg} ${targetColor.text} ${targetColor.border}`}>
                      {conn.targetCategory === 'input' ? 'Source' : conn.targetCategory}
                    </span>
                    <span className="text-[9px] font-bold text-[#172B4D] uppercase truncate flex-1 leading-none">{conn.targetName}</span>
                  </div>
                );
              })}
              {connections.length > 3 && (
                <div className="text-[8px] font-bold text-[#0052CC] uppercase">+{connections.length - 3} more links</div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[#F4F5F7]">
           <div className="flex items-center gap-2">
             {item.ritualFrequency && <span className="text-[11px] font-black text-[#0052CC] uppercase tracking-wider">{item.ritualFrequency}</span>}
             {item.teamType && <span className="text-[10px] font-black text-[#403294] uppercase bg-[#EAE6FF] px-2 py-0.5 rounded border border-[#D2CCFF]">{item.teamType.split('-')[0]}</span>}
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
