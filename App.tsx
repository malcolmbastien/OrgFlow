
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { WorkflowModel, WorkItem, Ritual, Team, LevelId, WorkItemType, Connection, TeamType, InteractionMode } from './types';
import { INITIAL_MODEL, ORG_LEVELS } from './constants';

type ViewMode = 'architect' | 'connectivity';

const TYPE_COLORS: Record<string, { border: string, bg: string, text: string, accent: string }> = {
  'input': { border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', accent: 'bg-amber-500' },
  'team': { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700', accent: 'bg-indigo-500' },
  'ritual': { border: 'border-teal-200', bg: 'bg-teal-50', text: 'text-teal-700', accent: 'bg-teal-500' },
  'work': { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', accent: 'bg-blue-600' },
};

const App: React.FC = () => {
  const [model, setModel] = React.useState<WorkflowModel>(INITIAL_MODEL);
  const [selection, setSelection] = React.useState<{ type: 'team' | 'work' | 'ritual', id: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('architect');
  const [highlightedPath, setHighlightedPath] = useState<Set<string>>(new Set());
  
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({});
  const [, forceUpdate] = useState({});

  const selectedItem = useMemo(() => {
    if (!selection) return null;
    if (selection.type === 'team') return model.teams.find(t => t.id === selection.id);
    if (selection.type === 'work') return model.workItems.find(w => w.id === selection.id);
    if (selection.type === 'ritual') return model.rituals.find(r => r.id === selection.id);
    return null;
  }, [selection, model]);

  useEffect(() => {
    if (selection) {
      const path = new Set<string>();
      const findPath = (id: string, visited: Set<string>) => {
        if (visited.has(id)) return;
        visited.add(id);
        path.add(id);
        model.connections.filter(c => c.to === id).forEach(c => findPath(c.from, visited));
        model.connections.filter(c => c.from === id).forEach(c => findPath(c.to, visited));
      };
      findPath(selection.id, new Set());
      setHighlightedPath(path);
    } else {
      setHighlightedPath(new Set());
    }
  }, [selection, model.connections]);

  useLayoutEffect(() => {
    const timer = setTimeout(() => forceUpdate({}), 100);
    return () => clearTimeout(timer);
  }, [viewMode, model, selection]);

  const toggleConnection = (fromId: string, toId: string) => {
    const existingIndex = model.connections.findIndex(c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId));
    if (existingIndex > -1) {
      setModel(prev => ({ ...prev, connections: prev.connections.filter((_, i) => i !== existingIndex) }));
    } else {
      setModel(prev => ({ ...prev, connections: [...prev.connections, { id: `c-${Date.now()}`, from: fromId, to: toId, style: 'solid', label: 'Flow' }] }));
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

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-gray-50 text-slate-900">
      <aside className="w-[340px] h-full border-r bg-white flex flex-col z-50 shadow-sm border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center gap-3 bg-gray-50/50">
          <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl">O</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">OrgFlow</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {selection && selectedItem ? (
            <div className="space-y-7">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inspector</span>
                <button onClick={() => setSelection(null)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              <div className="space-y-5">
                <div>
                   <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Title</label>
                   <input 
                    className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-base focus:border-blue-500 outline-none transition-all shadow-sm"
                    value={(selectedItem as any).name || (selectedItem as any).title} 
                    onChange={(e) => updateItem(selectedItem.id, { [(selectedItem as any).name ? 'name' : 'title']: e.target.value })}
                   />
                </div>

                {selection.type === 'team' && (selectedItem as Team).collaborators && (
                   <div>
                     <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Collaboration Context</label>
                     <div className="space-y-1.5">
                        {(selectedItem as Team).collaborators?.map((c, i) => (
                           <div key={i} className="text-sm text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded border border-indigo-100">{c}</div>
                        ))}
                     </div>
                   </div>
                )}

                {(selectedItem as any).source && (
                   <div>
                     <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Origin / Source</label>
                     <div className="text-sm font-bold text-amber-700 bg-amber-50 px-3 py-2.5 rounded border border-amber-100">
                        { (selectedItem as any).source }
                     </div>
                   </div>
                )}

                {(selectedItem as any).owningTeamId && (
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1.5 block">Responsible Team</label>
                    <div className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-2.5 rounded border border-indigo-100">
                      {model.teams.find(t => t.id === (selectedItem as any).owningTeamId)?.name || 'Unknown Team'}
                    </div>
                  </div>
                )}

                <div>
                   <label className="text-sm font-semibold text-gray-600 mb-2.5 block">Flow Links</label>
                   <div className="border rounded divide-y divide-gray-100 max-h-[300px] overflow-y-auto custom-scrollbar bg-gray-50/30">
                      {[...model.workItems, ...model.rituals].filter(i => i.id !== selection.id).map(target => {
                        const isConnected = model.connections.some(c => (c.from === selection.id && c.to === target.id) || (c.from === target.id && c.to === selection.id));
                        return (
                          <button 
                            key={target.id}
                            onClick={() => toggleConnection(selection.id, target.id)}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-gray-100 transition-colors ${isConnected ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600'}`}
                          >
                            <span className="truncate">{(target as any).title || (target as any).name}</span>
                            {isConnected && <span className="text-blue-500 text-xs font-bold uppercase tracking-tighter">Active</span>}
                          </button>
                        )
                      })}
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5 opacity-50">
               <svg className="w-14 h-14 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
                 <button 
                   onClick={() => setViewMode('architect')} 
                   className={`text-sm font-bold pb-5 -mb-5 transition-all border-b-2 tracking-tight ${viewMode === 'architect' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                   Architect
                 </button>
                 <button 
                   onClick={() => setViewMode('connectivity')} 
                   className={`text-sm font-bold pb-5 -mb-5 transition-all border-b-2 tracking-tight ${viewMode === 'connectivity' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                   Connectivity
                 </button>
              </div>
           </nav>
        </header>

        <main className={`flex-1 overflow-auto p-12 transition-all duration-300 custom-scrollbar ${viewMode === 'connectivity' ? 'canvas-grid' : ''}`}>
          <div className="relative min-w-[1600px] space-y-20">
            
            {viewMode === 'connectivity' && <ConnectivitySVG model={model} nodeRefs={nodeRefs} highlightedPath={highlightedPath} selection={selection} />}

            {ORG_LEVELS.map(level => (
              <LevelGrid 
                key={level.id} 
                level={level} 
                model={model} 
                viewMode={viewMode} 
                selection={selection} 
                setSelection={setSelection} 
                nodeRefs={nodeRefs} 
                highlightedPath={highlightedPath}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

const LevelGrid: React.FC<any> = ({ level, model, viewMode, selection, setSelection, nodeRefs, highlightedPath }) => {
  const pillars = [
    { label: 'Inputs (Why)', items: model.workItems.filter((w: any) => w.level === level.id && w.type === 'input'), type: 'input' },
    { label: 'Teams (Who)', items: model.teams.filter((t: any) => t.level === level.id), type: 'team' },
    { label: 'Rituals (How)', items: model.rituals.filter((r: any) => r.level === level.id), type: 'ritual' },
    { label: 'Work (What)', items: model.workItems.filter((w: any) => w.level === level.id && w.type !== 'input'), type: 'work' },
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
          <div key={pillar.label} className="bg-gray-200/30 rounded-xl p-6 space-y-5 min-h-[180px] border border-gray-200/50">
            <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">{pillar.label}</h3>
            <div className="space-y-5">
              {pillar.items.map((item: any) => (
                <JiraCard 
                  key={item.id} 
                  item={item} 
                  type={pillar.type} 
                  isSelected={selection?.id === item.id}
                  isHighlighted={highlightedPath.size === 0 || highlightedPath.has(item.id)}
                  onSelect={() => setSelection({ type: pillar.type as any, id: item.id })}
                  nodeRef={(el: any) => nodeRefs.current[item.id] = el}
                  viewMode={viewMode}
                  model={model}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const JiraCard: React.FC<any> = ({ item, type, isSelected, isHighlighted, onSelect, nodeRef, viewMode, model }) => {
  const color = TYPE_COLORS[type] || TYPE_COLORS.work;
  const owningTeam = item.owningTeamId ? model.teams.find((t: any) => t.id === item.owningTeamId) : null;

  return (
    <div 
      ref={nodeRef}
      onClick={onSelect}
      className={`bg-white border rounded-lg shadow-sm transition-all duration-200 cursor-pointer flex flex-col relative overflow-hidden
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 border-blue-400 z-10' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'} 
        ${!isHighlighted && viewMode === 'connectivity' ? 'opacity-20 grayscale' : 'opacity-100'}
        w-full
      `}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${color.accent}`} />

      <div className="p-5 pl-6 space-y-5">
        {/* Card Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-base font-semibold text-slate-800 leading-tight">
              {item.name || item.title}
            </span>
          </div>
          <div className={`text-xs font-black uppercase px-2.5 py-1 rounded-md whitespace-nowrap ${color.bg} ${color.text}`}>
             {item.type || type}
          </div>
        </div>

        {/* Detailed Body based on type */}
        <div className="space-y-4">
          {type === 'team' ? (
            <div className="space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-gray-400 font-bold uppercase tracking-widest">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Personnel
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.members.map((m: string) => (
                    <span key={m} className="bg-gray-50 px-2.5 py-1 rounded border border-gray-200 text-xs font-medium text-gray-600 shadow-sm">{m}</span>
                  ))}
                </div>
              </div>

              {item.collaborators && item.collaborators.length > 0 && (
                 <div className="space-y-2.5 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2.5 text-xs text-gray-400 font-bold uppercase tracking-widest">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      Collaboration Partners
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {item.collaborators.map((c: string) => (
                          <span key={c} className="bg-indigo-50/50 px-2.5 py-1 rounded border border-indigo-100 text-xs font-bold text-indigo-500 whitespace-nowrap">
                             {c}
                          </span>
                       ))}
                    </div>
                 </div>
              )}
              
              <div className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1 border-t border-gray-50 pt-2">{item.teamType || 'Core Squad'}</div>
            </div>
          ) : type === 'ritual' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                 <div className="flex items-center gap-2.5 text-xs text-gray-400 font-bold uppercase tracking-widest mb-1.5">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                   Agenda Focus
                 </div>
                 {item.agendaItems.map((ai: string, idx: number) => (
                   <div key={idx} className="text-sm text-slate-600 pl-2.5 border-l-2 border-teal-100 py-1 leading-tight">{ai}</div>
                 ))}
              </div>
              <div className="space-y-2">
                 <div className="flex items-center gap-2.5 text-xs text-gray-400 font-bold uppercase tracking-widest mb-1.5">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                   Key Roles
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {item.participants.map((p: string) => (
                     <span key={p} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100"> {p} </span>
                   ))}
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 leading-relaxed italic">
                {item.description || 'Definition of the work stream, operational focus, or signal metrics.'}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {item.status && (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.status}</span>
                  </div>
                )}
                {item.source && (
                  <div className="flex items-center gap-2 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-tight">Source: {item.source}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/20 -mx-5 -mb-5 p-4 pl-5">
           <div className="flex items-center gap-3 overflow-hidden">
              {item.ritualFrequency && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 whitespace-nowrap">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {item.ritualFrequency}
                </div>
              )}
              {owningTeam && (
                <div className="flex items-center gap-2 overflow-hidden">
                   <div className="w-4 h-4 rounded bg-indigo-100 flex-shrink-0 flex items-center justify-center text-[8px] font-black text-indigo-600 border border-indigo-200">T</div>
                   <span className="text-xs font-bold text-indigo-400 uppercase truncate" title={`Owned by ${owningTeam.name}`}>
                     {owningTeam.name}
                   </span>
                </div>
              )}
           </div>
           <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 ml-3">
             <span className="uppercase tracking-widest">{item.level}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

const ConnectivitySVG: React.FC<any> = ({ model, nodeRefs, highlightedPath, selection }) => {
  const [paths, setPaths] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const update = () => {
      const newPaths: React.ReactNode[] = [];
      model.connections.forEach(conn => {
        const fromEl = nodeRefs.current[conn.from];
        const toEl = nodeRefs.current[conn.to];
        if (!fromEl || !toEl) return;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const container = fromEl.closest('.overflow-auto');
        if (!container) return;
        const containerRect = container.getBoundingClientRect();

        const x1 = fromRect.left + fromRect.width / 2 - containerRect.left + container.scrollLeft;
        const y1 = fromRect.top + fromRect.height / 2 - containerRect.top + container.scrollTop;
        const x2 = toRect.left + toRect.width / 2 - containerRect.left + container.scrollLeft;
        const y2 = toRect.top + toRect.height / 2 - containerRect.top + container.scrollTop;

        const isHighlighted = highlightedPath.size > 0 && highlightedPath.has(conn.from) && highlightedPath.has(conn.to);
        const strokeColor = isHighlighted ? '#3b82f6' : '#94a3b8';
        const strokeWidth = isHighlighted ? 3 : 1;
        const opacity = highlightedPath.size > 0 ? (isHighlighted ? 1 : 0.05) : 0.4;

        // Subtle curve for connection lines
        const dy = y2 - y1;
        const cpOffset = Math.min(Math.abs(dy) * 0.5, 300);
        const pathD = `M ${x1} ${y1} C ${x1} ${y1 + (dy > 0 ? cpOffset : -cpOffset)}, ${x2} ${y2 - (dy > 0 ? cpOffset : -cpOffset)}, ${x2} ${y2}`;

        newPaths.push(
          <g key={conn.id}>
            <path 
              d={pathD} 
              fill="none" 
              stroke={strokeColor} 
              strokeWidth={strokeWidth} 
              strokeDasharray={conn.style === 'dashed' ? '4,4' : 'none'}
              markerEnd={`url(#arrow-${isHighlighted ? 'active' : 'idle'})`}
              style={{ opacity, transition: 'all 0.3s' }}
            />
            {isHighlighted && (
              <circle r="4" fill="#3b82f6" className="animate-pulse">
                <animateMotion dur="2.5s" repeatCount="indefinite" path={pathD} />
              </circle>
            )}
          </g>
        );
      });
      setPaths(newPaths);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [model, highlightedPath, selection]);

  return (
    <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none z-10 overflow-visible">
      <defs>
        <marker id="arrow-idle" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-active" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
        </marker>
      </defs>
      {paths}
    </svg>
  );
};

export default App;
