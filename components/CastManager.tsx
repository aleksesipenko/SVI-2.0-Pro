
import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  User as UserIcon, 
  Sparkles,
  Info
} from 'lucide-react';
import { Character } from '../types';

interface CastManagerProps {
  characters: Character[];
  onUpdate: (chars: Character[]) => void;
}

const CastManager: React.FC<CastManagerProps> = ({ characters, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editChar, setEditChar] = useState<Partial<Character>>({});

  const startNew = () => {
    const newChar: Character = {
      id: Date.now().toString(),
      name: 'New Character',
      portrait: '',
      tags: [],
      lastUsed: Date.now()
    };
    onUpdate([...characters, newChar]);
    setEditingId(newChar.id);
    setEditChar(newChar);
  };

  const save = () => {
    if (!editingId) return;
    const updated = characters.map(c => c.id === editingId ? { ...c, ...editChar } : c);
    onUpdate(updated);
    setEditingId(null);
  };

  const remove = (id: string) => {
    onUpdate(characters.filter(c => c.id !== id));
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto no-scrollbar animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Global Cast</h2>
            <p className="text-zinc-600 font-bold text-[10px] tracking-[0.3em] uppercase mt-1">Character Continuity & Portrait Bible</p>
          </div>
          <button 
            onClick={startNew}
            className="flex items-center gap-3 bg-purple-600 text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-purple-500 transition-all shadow-xl"
          >
            <Plus className="w-4 h-4" />
            New Identity
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* List */}
          <div className="space-y-4">
            {characters.length === 0 && (
              <div className="p-12 border-2 border-dashed border-zinc-900 rounded-[2.5rem] flex flex-col items-center text-center opacity-40">
                <Users className="w-12 h-12 text-zinc-700 mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-600">No actors in current studio</p>
              </div>
            )}
            {characters.map(char => (
              <div 
                key={char.id}
                onClick={() => { setEditingId(char.id); setEditChar(char); }}
                className={`p-6 bg-zinc-900/50 border rounded-[2rem] cursor-pointer transition-all flex items-center justify-between group ${editingId === char.id ? 'border-purple-500 ring-4 ring-purple-500/5' : 'border-zinc-800 hover:border-zinc-700'}`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <UserIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-white font-black uppercase tracking-tight text-lg">{char.name}</h4>
                    <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Portrait Bible Active</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); remove(char.id); }} className="p-3 text-zinc-700 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Editor */}
          {editingId ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6 sticky top-0 animate-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-3 mb-2">
                 <Sparkles className="w-5 h-5 text-purple-500" />
                 <h3 className="text-xl font-black text-white uppercase">Identity Forge</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Name / Label</label>
                <input 
                  value={editChar.name}
                  onChange={e => setEditChar({ ...editChar, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-3 text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Textual Portrait (T5 Invariants)</label>
                  <div className="group relative">
                    <Info className="w-3 h-3 text-zinc-700 cursor-help" />
                    <div className="absolute bottom-full right-0 w-64 p-3 bg-black border border-zinc-800 rounded-xl text-[10px] font-medium text-zinc-400 opacity-0 group-hover:opacity-100 transition-all pointer-events-none mb-2 shadow-2xl z-50">
                      Describe wardrobe, hair, age, and unique physical traits. These will be repeated in every clip for Wan 2.2 stability.
                    </div>
                  </div>
                </div>
                <textarea 
                  value={editChar.portrait}
                  onChange={e => setEditChar({ ...editChar, portrait: e.target.value })}
                  rows={8}
                  placeholder="e.g. A woman in a dark leather jacket with neon trim, short silver hair, industrial-style goggles..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-sm leading-relaxed text-zinc-300 focus:outline-none focus:border-purple-500/50 resize-none font-medium"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={save}
                  className="flex-1 bg-white text-black font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Portrait
                </button>
                <button 
                  onClick={() => setEditingId(null)}
                  className="px-6 py-4 border border-zinc-800 text-zinc-500 font-black rounded-2xl text-xs uppercase hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-[3rem] p-12 opacity-20">
               <Users className="w-16 h-16 text-zinc-800 mb-6" />
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-center">Select an identity to view <br/>or edit invariants</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CastManager;
