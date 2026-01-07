import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Sparkles,
  Loader2,
  Fingerprint,
  User as UserIcon,
  Eye,
  Shirt,
  Smile,
  Check,
  Star,
  Camera,
  X,
  UploadCloud,
  Maximize2,
  Wand2,
  Save
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { Character, CharacterProfile } from '../types';
import { useTranslation } from 'react-i18next';

interface CastManagerProps {
  characters: Character[];
  onUpdate: (chars: Character[]) => void;
}

const LOADING_PHRASES = [
  "Sequencing Genome...",
  "Calibrating Biometrics...",
  "Scouting Locations...",
  "Synthesizing Patterns...",
  "Extracting Actor DNA...",
  "Locking Texture Map...",
  "Initializing Identity Matrix..."
];

const PROFILE_SYSTEM_PROMPT = `You are a professional Casting Director AI for high-end cinematic productions. 
Analyze the provided character description and/or image to create a highly detailed, technically precise character profile for consistent video generation.

ANATOMICAL CONSISTENCY RULES:
1. For female characters, the 'build' field within 'appearance' MUST explicitly include descriptors for chest size and butt size. 
2. STRICT RULE: The 'build' field MUST NEVER describe character poses (e.g., "standing", "sitting", "looking away"). It describes ONLY physical body structure, measurements, and anatomical invariants.
3. This is critical for maintaining physical invariants across multiple shots and movement sequences.

You MUST extract data into the specified JSON format.
If an image is provided, focus on the visual traits shown (eyes, features, build).
Always include Species and Origin (e.g., "Human", "Na'vi (Avatar)", "Droid", "High Elf").`;

const REFINE_FIELD_PROMPT = `You are a cinematic character specialist. 
Your task is to refine a specific character trait to be more descriptive, precise, and visually grounded for AI video generation.
Keep the same core meaning but make it more 'professional' and technical. 
Output ONLY the refined text. No preamble.`;

const CastManager: React.FC<CastManagerProps> = ({ characters, onUpdate }) => {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editChar, setEditChar] = useState<Partial<Character>>({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fullScreenImg, setFullScreenImg] = useState<string | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  
  // State for specific field editing
  const [activeEdit, setActiveEdit] = useState<{ section: keyof CharacterProfile; key: string; value: string } | null>(null);
  const [isRefiningField, setIsRefiningField] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    let interval: any;
    if (isEnhancing) {
      interval = setInterval(() => {
        setCurrentPhraseIndex(prev => (prev + 1) % LOADING_PHRASES.length);
      }, 2000); 
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEnhancing]);

  const getProfile = (char: Partial<Character>): CharacterProfile | null => {
    try {
      if (!char.portrait?.trim().startsWith('{')) return null;
      return JSON.parse(char.portrait);
    } catch (e) { return null; }
  };

  const currentProfile = getProfile(editChar);
  const isStructured = !!currentProfile;

  const startNew = () => {
    const newChar: Character = { 
      id: crypto.randomUUID(), 
      name: t('unnamed_subject'), 
      portrait: '', 
      rawPortrait: '', 
      tags: [], 
      lastUsed: Date.now() 
    };
    onUpdate([...characters, newChar]);
    setEditingId(newChar.id);
    setEditChar(newChar);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this actor?")) {
      onUpdate(characters.filter(c => c.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setEditChar(prev => ({ ...prev, referenceImage: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleEnhance = async () => {
    const inputContent = editChar.rawPortrait || (editChar.portrait && !editChar.portrait.startsWith('{') ? editChar.portrait : '');
    if ((!inputContent?.trim() && !editChar.referenceImage) || isEnhancing) return;
    
    setIsEnhancing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contents: any[] = [];
      if (inputContent.trim()) contents.push({ text: `Analyze this character description: ${inputContent}` });
      if (editChar.referenceImage) {
        const [prefix, base64Data] = editChar.referenceImage.split(';base64,');
        const mimeType = prefix.split(':')[1];
        contents.push({ inlineData: { mimeType, data: base64Data } });
        contents.push({ text: "Analyze visual reference for traits. If female, provide specific anatomical descriptors for 'build' (chest/butt size). DO NOT describe poses, only physical build." });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: contents,
        config: { 
          systemInstruction: PROFILE_SYSTEM_PROMPT, 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              identity: {
                type: Type.OBJECT,
                properties: { gender: { type: Type.STRING }, age: { type: Type.STRING }, species: { type: Type.STRING }, archetype: { type: Type.STRING } },
                required: ["gender", "age", "species", "archetype"]
              },
              appearance: {
                type: Type.OBJECT,
                properties: { features: { type: Type.STRING }, hair: { type: Type.STRING }, hairstyle: { type: Type.STRING }, eyes: { type: Type.STRING }, build: { type: Type.STRING, description: "Physical stature, including anatomical sizes for chest and butt if female. NEVER include pose descriptions." } },
                required: ["features", "hair", "hairstyle", "eyes", "build"]
              },
              wardrobe: {
                type: Type.OBJECT,
                properties: { description: { type: Type.STRING }, accessories: { type: Type.STRING } },
                required: ["description", "accessories"]
              },
              vibe: {
                type: Type.OBJECT,
                properties: { mood: { type: Type.STRING }, style: { type: Type.STRING } },
                required: ["mood", "style"]
              },
              special: {
                type: Type.OBJECT,
                properties: { distinctive_features: { type: Type.STRING }, behavior: { type: Type.STRING }, likes: { type: Type.STRING } },
                required: ["distinctive_features", "behavior", "likes"]
              }
            },
            required: ["name", "identity", "appearance", "wardrobe", "vibe", "special"]
          }
        }
      });
      
      const prof = JSON.parse(response.text || "{}");
      setEditChar(prev => ({ ...prev, name: prof.name || prev.name, portrait: JSON.stringify(prof, null, 2), rawPortrait: inputContent }));
    } catch (error) { 
      console.error(error); 
      alert("Failed to extract traits.");
    } finally { setIsEnhancing(false); }
  };

  const handleRefineField = async () => {
    if (!activeEdit || isRefiningField) return;
    setIsRefiningField(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Refine this trait for a character named ${editChar.name}: "${activeEdit.value}"`,
        config: { systemInstruction: REFINE_FIELD_PROMPT }
      });
      if (response.text) {
        setActiveEdit({ ...activeEdit, value: response.text.trim() });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefiningField(false);
    }
  };

  const saveFieldUpdate = () => {
    if (!activeEdit || !currentProfile) return;
    const updatedProfile = { ...currentProfile };
    const section = updatedProfile[activeEdit.section] as any;
    if (section) {
      section[activeEdit.key] = activeEdit.value;
    }
    setEditChar({ ...editChar, portrait: JSON.stringify(updatedProfile, null, 2) });
    setActiveEdit(null);
  };

  const save = () => {
    if (!editingId) return;
    onUpdate(characters.map(c => c.id === editingId ? { ...c, ...editChar } : c));
    setEditingId(null);
  };

  return (
    <div 
      className="h-full flex flex-col bg-white dark:bg-[#212121] overflow-hidden relative"
      onDragEnter={(e) => { e.preventDefault(); dragCounter.current++; if (editingId) setIsDragging(true); }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); dragCounter.current = 0; if (editingId && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
    >
      {/* FULL SCREEN MODALS */}
      {fullScreenImg && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setFullScreenImg(null)}>
          <button className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-[210]"><X className="w-6 h-6" /></button>
          <img src={fullScreenImg} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95" alt="Full screen preview" />
        </div>
      )}

      {/* SMART FIELD EDITOR POPOVER */}
      {activeEdit && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveEdit(null)} />
          <div className="w-full max-w-lg bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/10 relative overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-black/20">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{activeEdit.key.replace('_', ' ')}</span>
              </div>
              <button onClick={() => setActiveEdit(null)} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              <textarea 
                autoFocus
                value={activeEdit.value}
                onChange={e => setActiveEdit({ ...activeEdit, value: e.target.value })}
                className="w-full h-32 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-xl p-4 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none font-medium leading-relaxed"
                placeholder="Type manually or refine with AI..."
              />
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={handleRefineField}
                  disabled={isRefiningField || !activeEdit.value.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-[#2f2f2f] hover:bg-zinc-200 dark:hover:bg-[#424242] rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {isRefiningField ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
                  {t('refine')}
                </button>
                <button 
                  onClick={saveFieldUpdate}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  {t('save_profile')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDragging && editingId && (
        <div className="absolute inset-0 z-[100] bg-zinc-900/80 dark:bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in">
          <div className="w-64 h-64 border-2 border-dashed border-amber-500 rounded-3xl flex flex-col items-center justify-center gap-4 text-amber-500 animate-pulse">
            <UploadCloud className="w-16 h-16" />
            <p className="text-sm font-black uppercase tracking-[0.2em]">Drop to Sync DNA</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Registry Sidebar */}
        <div className="w-80 border-r border-zinc-200 dark:border-white/5 flex flex-col bg-[#f9f9f9] dark:bg-[#171717]">
          <div className="p-4 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{t('casting')}</h3>
            <button onClick={startNew} className="p-1.5 rounded-lg bg-zinc-200 dark:bg-[#2f2f2f] hover:bg-zinc-300 dark:hover:bg-[#424242] transition-all"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
            {characters.length === 0 ? (
               <div className="p-4 text-center mt-10 opacity-30">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">{t('no_profiles')}</p>
               </div>
            ) : characters.map(char => (
              <button 
                key={char.id}
                onClick={() => { setEditingId(char.id); setEditChar(char); }}
                className={`w-full p-3 rounded-lg flex items-center gap-3 text-left transition-all group ${editingId === char.id ? 'bg-zinc-200 dark:bg-[#2f2f2f] shadow-sm' : 'hover:bg-zinc-100 dark:hover:bg-[#212121]'}`}
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-300 dark:bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {char.referenceImage ? <img src={char.referenceImage} className="w-full h-full object-cover" alt={char.name} /> : <UserIcon className="w-5 h-5 text-zinc-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{char.name}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">{getProfile(char) ? t('structured') : t('draft')}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(char.id, e); }} className="opacity-0 group-hover:opacity-40 hover:!opacity-100 p-1 rounded hover:bg-red-500/10 hover:text-red-500 transition-all"><X className="w-3.5 h-3.5" /></button>
              </button>
            ))}
          </div>
        </div>

        {/* Workbench */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-[#212121]">
          {editingId ? (
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-[#212121]/50 backdrop-blur-sm z-10">
                <input 
                  value={editChar.name || ''}
                  onChange={e => setEditChar({ ...editChar, name: e.target.value })}
                  className="bg-transparent text-xl font-bold text-zinc-900 dark:text-white focus:outline-none placeholder:text-zinc-300 w-full max-w-md"
                  placeholder={t('unnamed_subject')}
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase transition-colors">Cancel</button>
                  <button onClick={save} className="px-6 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold uppercase transition-all shadow-sm active:scale-95">{t('save_profile')}</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 no-scrollbar max-w-4xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
                  
                  {/* Visual Reference Card */}
                  <div className="lg:col-span-4 space-y-4">
                    <div 
                      className={`aspect-square rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col items-center justify-center relative group ${editChar.referenceImage ? 'cursor-zoom-in' : ''}`}
                      onClick={() => editChar.referenceImage && setFullScreenImg(editChar.referenceImage)}
                    >
                      {editChar.referenceImage ? (
                        <>
                          <img src={editChar.referenceImage} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Reference" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditChar({ ...editChar, referenceImage: undefined }); }}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                          <Camera className="w-10 h-10 opacity-20" />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Identity Source</span>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 rounded-xl border border-dashed border-zinc-300 dark:border-white/10 hover:border-zinc-400 dark:hover:border-white/20 text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-all">{editChar.referenceImage ? "Update Portrait" : "Upload Reference"}</button>
                  </div>

                  {/* Main Data Section */}
                  <div className="lg:col-span-8 space-y-6">
                    {!isStructured ? (
                      <div className="bg-zinc-50 dark:bg-[#2f2f2f] rounded-2xl border border-zinc-200 dark:border-white/5 p-6 flex flex-col h-[400px]">
                        <textarea 
                          value={editChar.rawPortrait || editChar.portrait || ''}
                          onChange={e => setEditChar({ ...editChar, rawPortrait: e.target.value, portrait: e.target.value })}
                          placeholder="Describe character's unique traits..."
                          className="w-full flex-1 bg-transparent text-lg font-medium text-zinc-900 dark:text-white focus:outline-none resize-none leading-relaxed"
                        />
                        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 dark:border-white/5 pt-4">
                           <div className="flex items-center gap-2 text-zinc-400">
                              {isEnhancing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              <span className="text-[10px] font-bold uppercase tracking-widest">{isEnhancing ? LOADING_PHRASES[currentPhraseIndex] : "Drafting Mode"}</span>
                           </div>
                           <button onClick={handleEnhance} disabled={isEnhancing || (!editChar.rawPortrait?.trim() && !editChar.referenceImage)} className="flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all bg-gradient-to-r from-amber-400 to-yellow-600 text-black hover:scale-[1.02] disabled:opacity-50"><Sparkles className="w-4 h-4" />{t('generate_profile')}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProfileSection 
                          icon={<Fingerprint className="w-3.5 h-3.5" />} 
                          title={t('identity')} 
                          data={currentProfile.identity} 
                          onEditField={(k, v) => setActiveEdit({ section: 'identity', key: k, value: v })}
                        />
                        <ProfileSection 
                          icon={<Eye className="w-3.5 h-3.5" />} 
                          title={t('appearance')} 
                          data={currentProfile.appearance} 
                          onEditField={(k, v) => setActiveEdit({ section: 'appearance', key: k, value: v })}
                        />
                        <ProfileSection 
                          icon={<Shirt className="w-3.5 h-3.5" />} 
                          title={t('wardrobe')} 
                          data={currentProfile.wardrobe} 
                          onEditField={(k, v) => setActiveEdit({ section: 'wardrobe', key: k, value: v })}
                        />
                        <ProfileSection 
                          icon={<Smile className="w-3.5 h-3.5" />} 
                          title={t('vibe_style')} 
                          data={currentProfile.vibe} 
                          onEditField={(k, v) => setActiveEdit({ section: 'vibe', key: k, value: v })}
                        />
                        <div className="md:col-span-2">
                           <ProfileSection 
                            icon={<Star className="w-3.5 h-3.5" />} 
                            title={t('special_traits')} 
                            data={currentProfile.special} 
                            onEditField={(k, v) => setActiveEdit({ section: 'special', key: k, value: v })}
                           />
                        </div>
                        <div className="md:col-span-2 pt-4">
                           <button onClick={() => setEditChar({ ...editChar, portrait: editChar.rawPortrait })} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"><Smile className="w-3 h-3" />Reset to Draft View</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8">
              <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-white/5 flex items-center justify-center mb-6"><Users className="w-10 h-10 opacity-20" /></div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-50 mb-2">{t('select_create')}</p>
              <p className="text-[10px] font-medium opacity-30 max-w-xs text-center">Manage your character invariants to maintain temporal consistency across sequences.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileSection: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  data: Record<string, string>; 
  onEditField: (key: string, val: string) => void;
}> = ({ icon, title, data, onEditField }) => (
  <div className="bg-[#f9f9f9] dark:bg-[#2f2f2f] border border-zinc-200 dark:border-white/5 rounded-xl p-4 transition-all hover:border-zinc-300 dark:hover:border-white/10 h-full">
    <div className="flex items-center gap-2 mb-3 opacity-60">
      {icon}
      <span className="text-[9px] font-black uppercase tracking-widest">{title}</span>
    </div>
    <div className="space-y-4">
      {Object.entries(data || {}).map(([key, val]) => (
        <div 
          key={key} 
          onClick={() => onEditField(key, val)}
          className="group cursor-pointer p-2 -m-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/5 transition-all relative"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">{key.replace('_', ' ')}</p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-amber-500">
              <Wand2 className="w-3 h-3" />
              <span className="text-[8px] font-black uppercase">Edit</span>
            </div>
          </div>
          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed pr-6">{val}</p>
        </div>
      ))}
    </div>
  </div>
);

export default CastManager;