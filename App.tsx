
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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

const App: React.FC = () => {
  const [model, setModel] = React.useState<WorkflowModel>(INITIAL_MODEL);
  const [selection, setSelection] = React.useState<{ type: 'team' | 'work' | 'ritual' | 'input', id: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('architect');

  const selectedItem = useMemo(() => {
    if (!selection) return null;
    if (selection.type === 'team') return model.teams.find(t => t.id === selection.id);
    if (selection.type === 'work' || selection.type === 'input') return model.workItems.find(w => w.id === selection.id);
    if (selection.type === 'ritual') return model.rituals.find(r => r.id === selection.id);
    return null;
  }, [selection, model]);

  const updateItem = (id: string, updates: any) => {
    setModel(prev => ({
      ...prev,
      teams: prev.teams.map(t => t.id === id ? { ...t, ...updates } : t),
      workItems: prev.workItems.map(w => w.id === id ? { ...w, ...updates } : w),
      rituals: prev.rituals.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
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

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans bg-[#F4F5F7] text-[#172B4D]">
      <aside className="w-[360px] h-full border-r bg-white flex flex-col z-50 border-[#DFE1E6]">
        <div className="p-4 border-b border-[#DFE1E6] flex items-center gap-3 bg-white">
          <div className="w-8 h-8 bg-[#0747A6] rounded flex items-center justify-center text-white font-bold text-lg">O</div>
          <div>
            <h1 className="text-sm font-bold text-[#172B4D] tracking-tight">OrgFlow Modeler</h1>
            <span className="text-[10px] text-[#5E6C84] font-medium uppercase tracking-wider">Enterprise Edition</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {selection && selectedItem ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-[#EBECF0] pb-2">
                <span className="text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider">Issue Details</span>
                <button onClick={() => setSelection(null)} className="text-[#5E6C84] hover:bg-[#EBECF0] p-1 rounded transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                   <label className="text-[11px] font-bold text-[#5E6C84] mb-1 block uppercase tracking-wider">Title</label>
                   <input 
                    className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded p-2 text-sm font-medium text-[#172B4D] focus:bg-white focus:border-[#4C9AFF] outline-none transition-all"
                    value={(selectedItem as any).name || (selectedItem as any).title || ''} 
                    onChange={(e) => updateItem(selectedItem.id, { [(selectedItem as any).name !== undefined ? 'name' : 'title']: e.target.value })}
                   />
                </div>

                <div>
                   <label className="text-[11px] font-bold text-[#5E6C84] mb-1 block uppercase tracking-wider">Description</label>
                   <textarea 
                    className="w-full bg-[#FAFBFC] border border-[#DFE1E6] rounded p-2 text-sm font-medium text-[#172B4D] focus:bg-white focus:border-[#4C9AFF] outline-none transition-all h-32 resize-none leading-relaxed"
                    value={(selectedItem as any).description || ''} 
                    onChange={(e) => updateItem(selectedItem.id, { description: e.target.value })}
                    placeholder="Provide detailed operational context..."
                   />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5E6C84] mb-1 block uppercase tracking-wider">Org Tier</label>
                  <div className="flex bg-[#EBECF0] p-1 rounded">
                    {ORG_LEVELS.map(l => (
                      <button
                        key={l.id}
                        onClick={() => updateItem(selectedItem.id, { level: l.id })}
                        className={`flex-1 text-[10px] font-bold uppercase py-1.5 rounded transition-all ${selectedItem.level === l.id ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#5E6C84] hover:text-[#172B4D]'}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
               <p className="text-[11px] text-[#5E6C84] font-bold uppercase tracking-widest">Select an entity to view properties</p>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 h-full flex flex-col relative overflow-hidden bg-white">
        <header className="h-14 bg-white px-6 flex items-center justify-between z-[60] border-b border-[#DFE1E6]">
           <nav className="flex items-center gap-6">
              <div className="flex gap-2 items-center">
                 <span className="text-sm font-semibold text-[#172B4D]">Project:</span>
                 <span className="text-sm text-[#42526E]">Topology Architecture</span>
              </div>
              <div className="h-4 w-px bg-[#DFE1E6]" />
              <div className="flex bg-[#EBECF0] p-0.5 rounded">
                 <button 
                  onClick={() => setViewMode('architect')} 
                  className={`px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded ${viewMode === 'architect' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#5E6C84] hover:text-[#172B4D]'}`}
                 >
                   Architect View
                 </button>
                 <button 
                  onClick={() => setViewMode('connectivity')} 
                  className={`px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded ${viewMode === 'connectivity' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#5E6C84] hover:text-[#172B4D]'}`}
                 >
                   Connectivity Graph
                 </button>
              </div>
           </nav>
        </header>

        <main className="flex-1 relative overflow-hidden">
          {viewMode === 'architect' ? (
             <div className="absolute inset-0 overflow-auto p-8 custom-scrollbar bg-[#F4F5F7]">
               <div className="relative min-w-[1300px] space-y-12 animate-in fade-in duration-300">
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
             </div>
          ) : (
            <ConnectivityCanvas 
              model={model} 
              selection={selection} 
              setSelection={setSelection}
            />
          )}
        </main>
      </div>
    </div>
  );
};

const ConnectivityCanvas: React.FC<any> = ({ model, selection, setSelection }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Record<string, { x: number, y: number, vx: number, vy: number, fx?: number, fy?: number, type: string, item: any }>>({});
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.75 });
  const [dragging, setDragging] = useState<{ id: string, startX: number, startY: number } | null>(null);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    const allItems = [
      ...model.workItems.map(w => ({ id: w.id, type: w.type === 'input' ? 'input' : 'work', item: w })),
      ...model.teams.map(t => ({ id: t.id, type: 'team', item: t })),
      ...model.rituals.map(r => ({ id: r.id, type: 'ritual', item: r }))
    ];

    setNodes(prev => {
      const next: any = { ...prev };
      allItems.forEach((node, i) => {
        if (!next[node.id]) {
          const angle = (i / allItems.length) * Math.PI * 2;
          const radius = 500;
          next[node.id] = {
            x: 1000 + Math.cos(angle) * radius,
            y: 800 + Math.sin(angle) * radius,
            vx: 0, vy: 0, type: node.type, item: node.item
          };
        } else {
          next[node.id].item = node.item;
        }
      });
      return next;
    });
  }, [model]);

  const tick = useCallback(() => {
    setNodes(prev => {
      const next = { ...prev };
      const ids = Object.keys(next);
      if (ids.length === 0) return prev;

      const friction = 0.9;
      const charge = 10000;
      const spring = 0.05;
      const gravity = 0.003;
      const idealDist = 400;

      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = next[ids[i]];
          const b = next[ids[j]];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          if (dist < 1000) {
            const f = charge / distSq;
            const fx = (dx / dist) * f;
            const fy = (dy / dist) * f;
            if (a.fx === undefined) { a.vx -= fx; a.vy -= fy; }
            if (b.fx === undefined) { b.vx += fx; b.vy += fy; }
          }
        }
      }

      model.connections.forEach((conn: Connection) => {
        const a = next[conn.from];
        const b = next[conn.to];
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (dist - idealDist) * spring;
        const fx = (dx / dist) * f, fy = (dy / dist) * f;
        if (a.fx === undefined) { a.vx += fx; a.vy += fy; }
        if (b.fx === undefined) { b.vx -= fx; b.vy -= fy; }
      });

      const cx = 1000, cy = 800;
      ids.forEach(id => {
        const n = next[id];
        if (n.fx !== undefined && n.fy !== undefined) {
          n.x = n.fx; n.y = n.fy;
          n.vx = 0; n.vy = 0;
        } else {
          n.vx += (cx - n.x) * gravity;
          n.vy += (cy - n.y) * gravity;
          n.x += n.vx; n.y += n.vy;
          n.vx *= friction; n.vy *= friction;
        }
      });
      return next;
    });
    requestRef.current = requestAnimationFrame(tick);
  }, [model.connections]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [tick]);

  const onWheel = (e: React.WheelEvent) => {
    setTransform(prev => ({
      ...prev,
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY,
      scale: Math.max(0.2, Math.min(1.5, prev.scale - e.deltaY * 0.001))
    }));
  };

  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => ({ ...prev, [id]: { ...prev[id], fx: prev[id].x, fy: prev[id].y } }));
    setDragging({ id, startX: e.clientX, startY: e.clientY });
    setSelection({ type: nodes[id].type as any, id });
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden bg-[#FAFBFC] cursor-grab active:cursor-grabbing"
      onWheel={onWheel}
      onMouseMove={(e) => {
        if (dragging) {
          const dx = (e.clientX - dragging.startX) / transform.scale;
          const dy = (e.clientY - dragging.startY) / transform.scale;
          setNodes(prev => ({
            ...prev,
            [dragging.id]: { ...prev[dragging.id], fx: prev[dragging.id].fx! + dx, fy: prev[dragging.id].fy! + dy }
          }));
          setDragging({ ...dragging, startX: e.clientX, startY: e.clientY });
        }
      }}
      onMouseUp={() => setDragging(null)}
      onMouseLeave={() => setDragging(null)}
    >
      <div 
        className="absolute inset-0 canvas-grid opacity-10" 
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0' }} 
      />
      
      <div 
        className="w-[3000px] h-[3000px] pointer-events-none relative"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0' }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orientation="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#C1C7D0" />
            </marker>
            <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="22" refY="3.5" orientation="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#0052CC" />
            </marker>
          </defs>
          {model.connections.map((conn: Connection) => {
            const from = nodes[conn.from], to = nodes[conn.to];
            if (!from || !to) return null;
            const isSelected = selection?.id === conn.from || selection?.id === conn.to;
            const dx = to.x - from.x, dy = to.y - from.y;
            const cx1 = from.x + (dx * 0.3), cy1 = from.y + (dy * 0.1);
            const cx2 = to.x - (dx * 0.3), cy2 = to.y - (dy * 0.1);
            return (
              <path
                key={conn.id}
                d={`M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`}
                stroke={isSelected ? '#0052CC' : '#C1C7D0'}
                strokeWidth={isSelected ? 3 : 1.5}
                fill="none"
                strokeDasharray={conn.style === 'dashed' ? '8,6' : 'none'}
                markerEnd={isSelected ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
              />
            );
          })}
        </svg>

        {Object.entries(nodes).map(([id, n]: [string, any]) => (
          <div 
            key={id}
            onMouseDown={(e) => handleNodeMouseDown(id, e)}
            style={{ left: n.x, top: n.y, transform: `translate(-50%, -50%)` }}
            className="absolute w-[240px] pointer-events-auto z-20"
          >
            <ConnectivityNode 
              item={n.item} 
              type={n.type} 
              isSelected={selection?.id === id}
              isPinned={n.fx !== undefined}
              onRelease={() => setNodes(p => ({ ...p, [id]: { ...p[id], fx: undefined, fy: undefined } }))}
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-50">
         <div className="bg-white rounded border border-[#DFE1E6] shadow-sm flex flex-col">
            <button onClick={() => setTransform(t => ({ ...t, scale: Math.min(1.5, t.scale + 0.1) }))} className="p-2 hover:bg-[#F4F5F7] text-[#42526E] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </button>
            <button onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.2, t.scale - 0.1) }))} className="p-2 hover:bg-[#F4F5F7] border-t border-[#DFE1E6] text-[#42526E] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
            </button>
         </div>
         <button onClick={() => setTransform({ x: 0, y: 0, scale: 0.75 })} className="bg-white rounded border border-[#DFE1E6] shadow-sm px-3 py-1.5 text-[10px] font-bold uppercase text-[#42526E] hover:text-[#0052CC] transition-colors">
           Reset
         </button>
      </div>
    </div>
  );
};

const ConnectivityNode: React.FC<any> = ({ item, type, isSelected, isPinned, onRelease }) => {
  const color = TYPE_COLORS[type] || TYPE_COLORS.work;
  const level = ORG_LEVELS.find(l => l.id === item.level);
  
  return (
    <div className={`bg-white border rounded shadow-md transition-all duration-150 relative select-none
      ${isSelected ? 'border-[#4C9AFF] ring-2 ring-[#4C9AFF]/20 z-50' : 'border-[#DFE1E6] hover:border-[#C1C7D0]'}
    `}>
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${color.accent}`} />
      
      {isPinned && (
        <button 
          onMouseDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRelease(); }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-[#0052CC] text-white rounded-full flex items-center justify-center shadow hover:bg-[#0747A6] transition-colors z-[100]"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}

      <div className="p-3 pl-4 space-y-2">
        <div className="flex justify-between items-center gap-2">
           <span className="text-[9px] font-bold uppercase text-[#5E6C84] bg-[#EBECF0] px-1.5 py-0.5 rounded">
             {level?.label}
           </span>
           <span className="text-[9px] font-medium text-[#A5ADBA] uppercase tracking-tighter">{item.id}</span>
        </div>
        
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-[#172B4D] leading-tight truncate">{item.name || item.title}</h4>
          <div className="flex flex-wrap gap-1">
             <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded border ${color.bg} ${color.text} ${color.border}`}>
               {type}
             </span>
          </div>
        </div>

        {item.description && (
          <p className="text-[10px] text-[#5E6C84] leading-relaxed line-clamp-1 italic border-t border-[#F4F5F7] pt-2">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
};

const LevelGrid: React.FC<any> = ({ level, model, selection, setSelection, addItem }) => {
  const pillars = [
    { label: 'Signals', type: 'input' as PillarType, items: model.workItems.filter((w: any) => w.level === level.id && w.type === 'input') },
    { label: 'Teams', type: 'team' as PillarType, items: model.teams.filter((t: any) => t.level === level.id) },
    { label: 'Rituals', type: 'ritual' as PillarType, items: model.rituals.filter((r: any) => r.level === level.id) },
    { label: 'Work', type: 'work' as PillarType, items: model.workItems.filter((w: any) => w.level === level.id && w.type !== 'input') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
         <span className={`w-2 h-2 rounded-full ${level.id === 'strategic' ? 'bg-[#DE350B]' : level.id === 'portfolio' ? 'bg-[#6554C0]' : 'bg-[#00B8D9]'}`} />
         <h2 className="text-[11px] font-bold text-[#5E6C84] uppercase tracking-widest">{level.label} Flight Level</h2>
         <div className="h-px flex-1 bg-[#DFE1E6]" />
      </div>

      <div className="grid grid-cols-4 gap-6">
        {pillars.map(pillar => (
          <div key={pillar.label} className="bg-[#EBECF0]/40 rounded border border-[#DFE1E6] p-4 space-y-4 min-h-[160px] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase text-[#5E6C84] tracking-wider">{pillar.label}</h3>
              <button 
                onClick={() => addItem(level.id, pillar.type)}
                className="w-6 h-6 rounded bg-white border border-[#DFE1E6] flex items-center justify-center text-[#42526E] hover:bg-[#F4F5F7] hover:border-[#C1C7D0] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <div className="space-y-3 flex-1">
              {pillar.items.map((item: any) => (
                <JiraCard 
                  key={item.id} 
                  item={item} 
                  type={pillar.type} 
                  isSelected={selection?.id === item.id}
                  onSelect={() => setSelection({ type: pillar.type as any, id: item.id })}
                />
              ))}
              {pillar.items.length === 0 && (
                <div className="h-16 rounded border border-dashed border-[#C1C7D0] flex items-center justify-center opacity-40">
                  <span className="text-[9px] font-bold text-[#5E6C84] uppercase">No issues</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const JiraCard: React.FC<any> = ({ item, type, isSelected, onSelect }) => {
  const color = TYPE_COLORS[type] || TYPE_COLORS.work;

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`bg-white border rounded shadow-sm transition-all duration-100 cursor-pointer flex flex-col relative overflow-hidden
        ${isSelected ? 'border-[#4C9AFF] ring-2 ring-[#4C9AFF]/20 z-20' : 'border-[#DFE1E6] hover:bg-[#F4F5F7]'} 
        w-full
      `}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.accent}`} />
      <div className="p-3 pl-4 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <span className="text-[11px] font-medium text-[#172B4D] leading-tight line-clamp-2">
            {item.name || item.title}
          </span>
          <div className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded whitespace-nowrap ${color.bg} ${color.text} border ${color.border} flex-shrink-0`}>
             {type}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
           <span className="text-[9px] font-medium text-[#7A869A] uppercase tracking-tight">{item.id}</span>
           {item.ritualFrequency && <span className="text-[9px] font-bold text-[#0052CC] uppercase">{item.ritualFrequency}</span>}
        </div>
      </div>
    </div>
  );
};

export default App;
