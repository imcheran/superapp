import React, { useState, useRef, useEffect } from 'react';
import { Note, NoteItem, UserSettings } from '../types';
import { Plus, X, Pin, Palette, Image as ImageIcon, CheckSquare, MoreVertical, Archive, Trash2, Lock, Lightbulb, RotateCcw, ShieldCheck, Search, Tag, Book, Grid, List } from 'lucide-react';

interface NotesProps {
  notes: Note[];
  onUpdate: (notes: Note[]) => void;
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
}

const COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#fecaca' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Teal', value: '#99f6e4' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Purple', value: '#e9d5ff' },
];

const Notes: React.FC<NotesProps> = ({ notes, onUpdate, settings, onUpdateSettings }) => {
  // View State
  const [activeView, setActiveView] = useState<'NOTES' | 'TRASH' | 'ARCHIVE' | 'NOTEBOOKS'>('NOTES');
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Input State
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [inputTitle, setInputTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [inputItems, setInputItems] = useState<NoteItem[]>([]);
  const [inputType, setInputType] = useState<'text' | 'list'>('text');
  const [inputColor, setInputColor] = useState('#ffffff');
  const [inputPinned, setInputPinned] = useState(false);
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [inputLabels, setInputLabels] = useState<string[]>([]);
  const [newLabelInput, setNewLabelInput] = useState('');
  
  // Modal/Edit/Lock State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [pinPrompt, setPinPrompt] = useState<{ mode: 'SETUP' | 'UNLOCK', noteId?: string, attempt: string }>({ mode: 'UNLOCK', attempt: '' });
  const [showPinModal, setShowPinModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [labelMenuOpen, setLabelMenuOpen] = useState(false);

  const inputRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract unique labels
  const labelSet = new Set<string>();
  notes.forEach(n => {
      if (n.labels) {
          n.labels.forEach(l => labelSet.add(l));
      }
  });
  const allLabels = Array.from(labelSet).sort();

  // --- Click Outside Logic ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        if (isInputExpanded) {
            // Save and collapse
            addNote();
        }
      }
      
      // Close dropdown menus if clicking outside
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setMenuOpenId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isInputExpanded, inputTitle, inputText, inputItems, inputType, inputColor, inputPinned, inputImage, inputLabels]);

  // --- Actions ---

  const addNote = () => {
      // Only save if there is content
      if (!inputTitle.trim() && !inputText.trim() && inputItems.length === 0 && !inputImage) {
          resetInput();
          return;
      }

      const newNote: Note = {
          id: crypto.randomUUID(),
          title: inputTitle,
          content: inputText,
          items: inputItems,
          type: inputType,
          color: inputColor,
          isPinned: inputPinned,
          isTrashed: false,
          isLocked: false,
          image: inputImage || undefined,
          labels: inputLabels,
          createdAt: new Date().toISOString()
      };

      onUpdate([newNote, ...notes]);
      resetInput();
  };

  const resetInput = () => {
      setInputTitle('');
      setInputText('');
      setInputItems([]);
      setInputType('text');
      setInputColor('#ffffff');
      setInputPinned(false);
      setInputImage(null);
      setInputLabels([]);
      setIsInputExpanded(false);
      setLabelMenuOpen(false);
  };

  const updateNote = (updated: Note) => {
      onUpdate(notes.map(n => n.id === updated.id ? updated : n));
  };

  const trashNote = (id: string) => {
      onUpdate(notes.map(n => n.id === id ? { ...n, isTrashed: true, isPinned: false } : n));
  };

  const restoreNote = (id: string) => {
      onUpdate(notes.map(n => n.id === id ? { ...n, isTrashed: false } : n));
  };

  const deleteNotePermanently = (id: string) => {
      onUpdate(notes.filter(n => n.id !== id));
      if (editingNote?.id === id) setEditingNote(null);
  };

  const togglePin = (note: Note, e: React.MouseEvent) => {
      e.stopPropagation();
      updateNote({ ...note, isPinned: !note.isPinned });
  };

  const changeColor = (note: Note, color: string) => {
      updateNote({ ...note, color });
  };

  // --- Image Handling ---
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = false) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 500000) { // Limit to ~500KB for localStorage safety
              alert("Image too large. Please use an image under 500KB.");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              if (isEditMode && editingNote) {
                  setEditingNote({ ...editingNote, image: base64 });
              } else {
                  setInputImage(base64);
                  if (!isInputExpanded) setIsInputExpanded(true);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const removeImage = (isEditMode: boolean = false) => {
      if (isEditMode && editingNote) {
          setEditingNote({ ...editingNote, image: undefined });
      } else {
          setInputImage(null);
      }
  };

  // --- Label Handling ---

  const toggleLabel = (label: string, isEditMode: boolean = false) => {
      if (isEditMode && editingNote) {
          const currentLabels = editingNote.labels || [];
          const newLabels = currentLabels.includes(label) 
              ? currentLabels.filter(l => l !== label)
              : [...currentLabels, label];
          setEditingNote({ ...editingNote, labels: newLabels });
      } else {
          const newLabels = inputLabels.includes(label)
              ? inputLabels.filter(l => l !== label)
              : [...inputLabels, label];
          setInputLabels(newLabels);
      }
  };

  const addNewLabel = (isEditMode: boolean = false) => {
      if (!newLabelInput.trim()) return;
      toggleLabel(newLabelInput.trim(), isEditMode);
      setNewLabelInput('');
  };

  // --- Lock Logic ---

  const initiateLock = (note: Note) => {
      if (note.isLocked) {
          // Unlock
          updateNote({ ...note, isLocked: false });
      } else {
          // Lock
          if (!settings.notesPin) {
              setPinPrompt({ mode: 'SETUP', noteId: note.id, attempt: '' });
              setShowPinModal(true);
          } else {
              updateNote({ ...note, isLocked: true });
          }
      }
      setMenuOpenId(null);
  };

  const handlePinSubmit = () => {
      if (pinPrompt.mode === 'SETUP') {
          if (pinPrompt.attempt.length === 4) {
              onUpdateSettings({ ...settings, notesPin: pinPrompt.attempt });
              if (pinPrompt.noteId) {
                  const note = notes.find(n => n.id === pinPrompt.noteId);
                  if (note) updateNote({ ...note, isLocked: true });
              }
              setShowPinModal(false);
          } else {
              alert("PIN must be 4 digits");
          }
      } else if (pinPrompt.mode === 'UNLOCK') {
          if (pinPrompt.attempt === settings.notesPin) {
              const note = notes.find(n => n.id === pinPrompt.noteId);
              if (note) setEditingNote(note);
              setShowPinModal(false);
          } else {
              alert("Incorrect PIN");
              setPinPrompt({ ...pinPrompt, attempt: '' });
          }
      }
  };

  const openNote = (note: Note) => {
      if (note.isTrashed) return;
      
      if (note.isLocked) {
          setPinPrompt({ mode: 'UNLOCK', noteId: note.id, attempt: '' });
          setShowPinModal(true);
      } else {
          setEditingNote(note);
      }
  };

  // --- Checkbox Logic ---

  const toggleItem = (note: Note, itemId: string) => {
      const newItems = note.items.map(item => {
          if (item.id === itemId) return { ...item, done: !item.done };
          return item;
      });
      const sorted = [...newItems].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
      updateNote({ ...note, items: sorted });
  };

  const addInputItem = (text: string) => {
      if(!text.trim()) return;
      setInputItems([...inputItems, { id: crypto.randomUUID(), text, done: false }]);
  };

  // --- Views Filtering ---
  
  const filteredNotes = notes.filter(n => {
      // SAFEGUARDS: Use default values to prevent crash on missing properties
      const safeTitle = n.title || '';
      const safeContent = n.content || '';
      const safeItems = n.items || [];

      const matchesSearch = searchQuery 
          ? (safeTitle.toLowerCase().includes(searchQuery.toLowerCase()) || safeContent.toLowerCase().includes(searchQuery.toLowerCase()) || safeItems.some(i => (i.text || '').toLowerCase().includes(searchQuery.toLowerCase())))
          : true;
      
      const matchesLabel = activeLabel ? n.labels?.includes(activeLabel as string) : true;
      const matchesTrash = activeView === 'TRASH' ? n.isTrashed : !n.isTrashed;
      
      return matchesTrash && matchesSearch && matchesLabel;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const NoteCard: React.FC<{ note: Note }> = ({ note }) => (
      <div 
        onClick={() => openNote(note)}
        className="rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-default break-inside-avoid mb-4 group relative overflow-visible flex flex-col"
        style={{ backgroundColor: note.isLocked ? '#f8fafc' : note.color }}
      >
          {/* Note Selection/Pin Overlay */}
          {!note.isTrashed && !note.isLocked && (
             <button 
                onClick={(e) => togglePin(note, e)}
                className={`absolute top-2 right-2 p-2 rounded-full transition-colors z-20 ${note.isPinned ? 'bg-slate-900 text-white' : 'bg-black/5 opacity-0 group-hover:opacity-100 hover:bg-black/10'}`}
             >
                 <Pin size={14} className={note.isPinned ? 'fill-current' : ''} />
             </button>
          )}
            
          {/* Image Header */}
          {note.image && !note.isLocked && (
              <div className="w-full h-40 overflow-hidden relative border-b border-black/5">
                  <img src={note.image} alt="Note Attachment" className="w-full h-full object-cover" />
              </div>
          )}

          <div className="p-4 relative flex-1">
              {note.isLocked ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 gap-2">
                      <Lock size={32} />
                      <p className="text-sm font-bold">Locked Note</p>
                  </div>
              ) : (
                  <>
                    {note.title && <h3 className="font-bold text-slate-800 mb-2 pr-6">{note.title}</h3>}
                    
                    {note.type === 'text' ? (
                        <p className="text-slate-700 text-sm whitespace-pre-wrap max-h-[300px] overflow-hidden text-ellipsis">{note.content}</p>
                    ) : (
                        <div className="space-y-1">
                            {note.items && note.items.slice(0, 8).map(item => (
                                <div key={item.id} className="flex items-start gap-2 text-sm">
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); toggleItem(note, item.id); }}
                                        className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center cursor-pointer ${item.done ? 'bg-slate-400 border-slate-400' : 'border-slate-400'}`}
                                    >
                                        {item.done && <X size={12} className="text-white" />}
                                    </div>
                                    <span className={`${item.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.text}</span>
                                </div>
                            ))}
                            {note.items && note.items.length > 8 && <p className="text-xs text-slate-400 italic">+{note.items.length - 8} more items</p>}
                        </div>
                    )}
                    
                    {/* Labels */}
                    {note.labels && note.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {note.labels.map(label => (
                                <span key={label} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 text-slate-600">
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}
                  </>
              )}
          </div>

          {/* Hover Actions */}
          <div className="px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between relative z-20">
              <div className="flex items-center gap-1">
                   {!note.isTrashed && !note.isLocked && (
                       <>
                           <div className="relative group/color" onClick={e => e.stopPropagation()}>
                               <button className="p-2 hover:bg-black/10 rounded-full"><Palette size={14} /></button>
                               <div className="absolute bottom-full left-0 mb-2 bg-white shadow-xl border border-slate-100 p-2 rounded-lg flex gap-1 hidden group-hover/color:flex z-50">
                                   {COLORS.map(c => (
                                       <button 
                                        key={c.value} 
                                        onClick={(e) => { e.stopPropagation(); changeColor(note, c.value); }}
                                        className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform"
                                        style={{backgroundColor: c.value}} 
                                        title={c.name}
                                       />
                                   ))}
                               </div>
                           </div>
                       </>
                   )}
                   
                   {note.isTrashed ? (
                       <button onClick={(e) => {e.stopPropagation(); restoreNote(note.id)}} className="p-2 hover:bg-emerald-100 text-emerald-600 rounded-full" title="Restore"><RotateCcw size={14} /></button>
                   ) : (
                       <div className="relative" onClick={e => e.stopPropagation()}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === note.id ? null : note.id); }} 
                                className="p-2 hover:bg-black/10 rounded-full"
                            >
                                <MoreVertical size={14} />
                            </button>
                            {/* Three Dots Menu */}
                            {menuOpenId === note.id && (
                                <div ref={menuRef} className="absolute bottom-full left-0 mb-2 w-32 bg-white shadow-xl border border-slate-100 rounded-lg overflow-hidden z-50 flex flex-col">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); trashNote(note.id); }}
                                        className="px-4 py-2 text-left text-xs hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); initiateLock(note); }}
                                        className="px-4 py-2 text-left text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                                    >
                                        {note.isLocked ? <><ShieldCheck size={12} /> Unlock</> : <><Lock size={12} /> Lock</>}
                                    </button>
                                </div>
                            )}
                       </div>
                   )}
                   
                   {note.isTrashed && (
                       <button onClick={(e) => {e.stopPropagation(); deleteNotePermanently(note.id)}} className="p-2 hover:bg-rose-100 text-rose-600 rounded-full" title="Delete Permanently"><Trash2 size={14} /></button>
                   )}
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white md:bg-transparent">
        
        {/* SIDEBAR (Mini) */}
        <div className="w-16 md:w-56 flex-shrink-0 border-r border-slate-200 p-4 flex flex-col gap-2 bg-white">
            <button 
                onClick={() => { setActiveView('NOTES'); setActiveLabel(null); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-full md:rounded-xl transition-all ${activeView === 'NOTES' && !activeLabel ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <Lightbulb size={20} />
                <span className="hidden md:inline">Notes</span>
            </button>
            <button 
                onClick={() => { setActiveView('NOTEBOOKS'); setActiveLabel(null); }}
                className={`flex items-center gap-3 px-3 py-3 rounded-full md:rounded-xl transition-all ${activeView === 'NOTEBOOKS' ? 'bg-indigo-100 text-indigo-900 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                <Book size={20} />
                <span className="hidden md:inline">Notebooks</span>
            </button>
            
            {/* Labels List */}
            <div className="py-2 hidden md:block">
                <p className="px-3 text-xs font-bold text-slate-400 uppercase mb-1">Labels</p>
                {allLabels.map(label => (
                    <button 
                        key={label}
                        onClick={() => { setActiveLabel(label); setActiveView('NOTES'); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${activeLabel === label ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Tag size={14} />
                        <span className="truncate">{label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-auto">
                <button 
                    onClick={() => setActiveView('TRASH')}
                    className={`flex items-center gap-3 px-3 py-3 rounded-full md:rounded-xl transition-all ${activeView === 'TRASH' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Trash2 size={20} />
                    <span className="hidden md:inline">Bin</span>
                </button>
            </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col overflow-hidden font-sans">
            
            {/* SEARCH BAR */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
                <div className="flex-1 bg-slate-100 rounded-lg flex items-center px-4 py-2 transition-all focus-within:bg-white focus-within:shadow focus-within:ring-2 focus-within:ring-slate-200">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search notes, labels..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none px-3 text-slate-700 placeholder:text-slate-400"
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')}><X size={16} className="text-slate-400" /></button>}
                </div>
                {activeView === 'NOTES' && (
                    <div className="flex items-center gap-2 text-slate-400">
                        <Grid size={20} className="cursor-pointer hover:text-slate-600" />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                
                {/* INPUT AREA (Only in Notes View) */}
                {activeView === 'NOTES' && !activeLabel && (
                    <div className="flex justify-center mb-10">
                        <div 
                            ref={inputRef}
                            className={`w-full max-w-2xl bg-white rounded-lg shadow-md border border-slate-200 transition-all duration-300 overflow-visible ${isInputExpanded ? 'p-0' : 'p-0 flex items-center'}`}
                            style={{ backgroundColor: inputColor }}
                        >
                            {!isInputExpanded ? (
                                <div className="w-full flex items-center justify-between p-3 cursor-text" onClick={() => setIsInputExpanded(true)}>
                                    <span className="font-bold text-slate-500 ml-2">Take a note...</span>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsInputExpanded(true); setInputType('list'); }} 
                                            className="p-2 hover:bg-slate-100 rounded-full"
                                        >
                                            <CheckSquare size={20} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIsInputExpanded(true); fileInputRef.current?.click(); }}
                                            className="p-2 hover:bg-slate-100 rounded-full"
                                        >
                                            <ImageIcon size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full">
                                    {/* Image Preview */}
                                    {inputImage && (
                                        <div className="relative w-full h-48 group">
                                            <img src={inputImage} alt="Upload" className="w-full h-full object-cover rounded-t-lg" />
                                            <button 
                                                onClick={() => removeImage()}
                                                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Title & Pin */}
                                    <div className="flex items-start justify-between p-4 pb-2">
                                        <input 
                                            type="text" 
                                            placeholder="Title" 
                                            value={inputTitle}
                                            onChange={e => setInputTitle(e.target.value)}
                                            className="w-full text-lg font-bold placeholder-slate-500 bg-transparent outline-none"
                                            autoFocus
                                        />
                                        <button 
                                            onClick={() => setInputPinned(!inputPinned)}
                                            className={`p-2 rounded-full hover:bg-black/10 ${inputPinned ? 'text-slate-900 bg-black/5' : 'text-slate-400'}`}
                                        >
                                            <Pin size={20} className={inputPinned ? 'fill-current' : ''} />
                                        </button>
                                    </div>

                                    {/* Content Body */}
                                    <div className="px-4 pb-4">
                                        {inputType === 'text' ? (
                                            <textarea 
                                                placeholder="Take a note..." 
                                                value={inputText}
                                                onChange={e => setInputText(e.target.value)}
                                                className="w-full resize-none text-sm bg-transparent outline-none min-h-[100px]"
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                {inputItems.map((item, idx) => (
                                                    <div key={item.id} className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border border-slate-400 rounded"></div>
                                                        <input 
                                                            value={item.text} 
                                                            onChange={e => {
                                                                const newItems = [...inputItems];
                                                                newItems[idx].text = e.target.value;
                                                                setInputItems(newItems);
                                                            }}
                                                            className="flex-1 bg-transparent outline-none text-sm"
                                                        />
                                                        <button onClick={() => setInputItems(inputItems.filter(i => i.id !== item.id))}><X size={14} className="text-slate-400" /></button>
                                                    </div>
                                                ))}
                                                <div className="flex items-center gap-2 text-slate-500 border-t border-black/5 pt-2 mt-2">
                                                    <Plus size={16} />
                                                    <input 
                                                        placeholder="List item" 
                                                        className="flex-1 bg-transparent outline-none text-sm"
                                                        onKeyDown={(e) => {
                                                            if(e.key === 'Enter') {
                                                                addInputItem(e.currentTarget.value);
                                                                e.currentTarget.value = '';
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {/* Labels */}
                                        {inputLabels.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {inputLabels.map(label => (
                                                    <span key={label} className="text-xs px-2 py-1 bg-black/5 rounded-full flex items-center gap-1">
                                                        {label}
                                                        <button onClick={() => toggleLabel(label)}><X size={10} /></button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Toolbar */}
                                    <div className="flex items-center justify-between px-2 py-2 border-t border-black/5 bg-black/5 relative">
                                        <div className="flex items-center gap-1">
                                            <div className="relative group/inputcolor" onClick={e => e.stopPropagation()}>
                                                <button className="p-2 hover:bg-black/10 rounded-full text-slate-600"><Palette size={16} /></button>
                                                <div className="absolute bottom-full left-0 mb-2 bg-white shadow-xl border border-slate-100 p-2 rounded-lg flex gap-1 hidden group-hover/inputcolor:flex z-50">
                                                    {COLORS.map(c => (
                                                        <button 
                                                            key={c.value} 
                                                            onClick={(e) => setInputColor(c.value)}
                                                            className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform"
                                                            style={{backgroundColor: c.value}} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-black/10 rounded-full text-slate-600"><ImageIcon size={16} /></button>
                                            
                                            {/* Label Menu */}
                                            <div className="relative">
                                                <button onClick={() => setLabelMenuOpen(!labelMenuOpen)} className="p-2 hover:bg-black/10 rounded-full text-slate-600"><Tag size={16} /></button>
                                                {labelMenuOpen && (
                                                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white shadow-xl border border-slate-100 rounded-lg p-2 z-50">
                                                        <p className="text-xs font-bold text-slate-400 mb-2 px-2">Label note</p>
                                                        <input 
                                                            autoFocus
                                                            placeholder="Enter label name"
                                                            value={newLabelInput}
                                                            onChange={e => setNewLabelInput(e.target.value)}
                                                            onKeyDown={e => { if(e.key === 'Enter') addNewLabel(); }}
                                                            className="w-full text-sm border-b border-slate-200 outline-none pb-1 mb-2 px-2"
                                                        />
                                                        <div className="max-h-32 overflow-y-auto">
                                                            {allLabels.map(l => (
                                                                <div key={l} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 cursor-pointer" onClick={() => toggleLabel(l)}>
                                                                    <div className={`w-3 h-3 border rounded ${inputLabels.includes(l) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}></div>
                                                                    <span className="text-sm truncate">{l}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={() => setInputType(inputType === 'text' ? 'list' : 'text')} className="p-2 hover:bg-black/10 rounded-full text-slate-600"><CheckSquare size={16} /></button>
                                        </div>
                                        <button onClick={addNote} className="px-6 py-2 font-bold text-sm hover:bg-black/5 rounded-md transition-colors">Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e)}
                />

                {/* --- VIEWS --- */}

                {/* NOTEBOOKS VIEW (Image 4 Style) */}
                {activeView === 'NOTEBOOKS' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800">Notebooks</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {allLabels.map(label => {
                                const count = notes.filter(n => n.labels?.includes(label) && !n.isTrashed).length;
                                return (
                                    <div 
                                        key={label}
                                        onClick={() => { setActiveLabel(label); setActiveView('NOTES'); }}
                                        className="aspect-[3/4] rounded-r-xl rounded-l-sm bg-indigo-50 border-l-8 border-indigo-600 shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between p-4 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                                        <div className="relative z-10">
                                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-900">{label}</h3>
                                            <p className="text-xs text-slate-500">{count} notes</p>
                                        </div>
                                        <Book size={32} className="text-indigo-200 absolute bottom-4 right-4" />
                                    </div>
                                )
                            })}
                             {allLabels.length === 0 && <p className="text-slate-400">No labels created yet. Add a label to a note to start.</p>}
                        </div>
                    </div>
                )}

                {/* TRASH VIEW HEADER */}
                {activeView === 'TRASH' && (
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-500 italic">Bin</h2>
                        <button 
                            onClick={() => {
                                if(confirm("Empty Bin? This cannot be undone.")) {
                                    onUpdate(notes.filter(n => !n.isTrashed));
                                }
                            }} 
                            className="text-xs text-rose-500 font-bold hover:underline"
                        >
                            Empty Bin
                        </button>
                    </div>
                )}

                {/* LABELS VIEW HEADER */}
                {activeLabel && activeView === 'NOTES' && (
                    <div className="mb-6 flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Tag className="text-indigo-500" /> {activeLabel}
                        </h2>
                        <button onClick={() => setActiveLabel(null)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200"><X size={14} /></button>
                    </div>
                )}

                {/* NOTES GRID */}
                {(activeView === 'NOTES' || activeView === 'TRASH') && (
                    <>
                        {/* Pinned Section */}
                        {pinnedNotes.length > 0 && activeView === 'NOTES' && !searchQuery && (
                            <div className="space-y-2 mb-8">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Pinned</h4>
                                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                                    {pinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
                                </div>
                            </div>
                        )}

                        {/* Others/Main Section */}
                        <div className="space-y-2">
                            {pinnedNotes.length > 0 && activeView === 'NOTES' && !searchQuery && <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Others</h4>}
                            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                                {otherNotes.map(note => <NoteCard key={note.id} note={note} />)}
                            </div>
                        </div>

                        {filteredNotes.length === 0 && !isInputExpanded && (
                            <div className="flex flex-col items-center justify-center pt-20 opacity-50">
                                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                                    {activeView === 'TRASH' ? <Trash2 size={48} className="text-slate-400" /> : <Search size={48} className="text-slate-400" />}
                                </div>
                                <p className="text-slate-500 font-medium">
                                    {searchQuery ? 'No matching notes found' : activeView === 'TRASH' ? 'Bin is empty' : 'Notes you add appear here'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

        {/* --- EDIT MODAL --- */}
        {editingNote && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingNote(null)}>
                <div 
                    className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col"
                    onClick={e => e.stopPropagation()}
                    style={{ backgroundColor: editingNote.color }}
                >
                     {/* Edit Modal Image */}
                     {editingNote.image && (
                         <div className="relative w-full h-64 shrink-0 bg-black/5">
                             <img src={editingNote.image} className="w-full h-full object-contain" />
                             <button onClick={() => removeImage(true)} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full"><Trash2 size={16} /></button>
                         </div>
                     )}

                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div className="flex justify-between items-start">
                            <input 
                                value={editingNote.title} 
                                onChange={e => setEditingNote({...editingNote, title: e.target.value})}
                                className="text-xl font-bold bg-transparent outline-none w-full"
                                placeholder="Title"
                            />
                            <button onClick={(e) => togglePin(editingNote, e)} className="p-2 hover:bg-black/10 rounded-full">
                                <Pin size={20} className={editingNote.isPinned ? 'fill-current' : ''} />
                            </button>
                        </div>
                        
                        {editingNote.type === 'text' ? (
                            <textarea 
                                value={editingNote.content}
                                onChange={e => setEditingNote({...editingNote, content: e.target.value})}
                                className="w-full min-h-[200px] bg-transparent outline-none resize-none text-slate-800"
                            />
                        ) : (
                            <div className="space-y-2">
                                {editingNote.items.map((item, idx) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <button 
                                            onClick={() => {
                                                const newItems = [...editingNote.items];
                                                newItems[idx].done = !newItems[idx].done;
                                                setEditingNote({...editingNote, items: newItems});
                                            }}
                                            className={`w-5 h-5 border rounded flex items-center justify-center ${item.done ? 'bg-slate-500 border-slate-500 text-white' : 'border-slate-400'}`}
                                        >
                                            {item.done && <X size={14} />}
                                        </button>
                                        <input 
                                            value={item.text}
                                            onChange={e => {
                                                const newItems = [...editingNote.items];
                                                newItems[idx].text = e.target.value;
                                                setEditingNote({...editingNote, items: newItems});
                                            }}
                                            className={`flex-1 bg-transparent outline-none ${item.done ? 'line-through text-slate-500' : ''}`}
                                        />
                                        <button onClick={() => setEditingNote({...editingNote, items: editingNote.items.filter(i => i.id !== item.id)})}>
                                            <X size={16} className="text-slate-400 hover:text-rose-500" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Labels in Modal */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            {editingNote.labels?.map(label => (
                                <span key={label} className="text-xs px-2 py-1 bg-black/5 rounded-full flex items-center gap-1">
                                    {label}
                                    <button onClick={() => toggleLabel(label, true)}><X size={10} /></button>
                                </span>
                            ))}
                            <div className="relative">
                                <button onClick={() => setLabelMenuOpen(!labelMenuOpen)} className="text-xs px-2 py-1 bg-black/5 rounded-full flex items-center gap-1 hover:bg-black/10">
                                    <Plus size={10} /> Add Label
                                </button>
                                {labelMenuOpen && (
                                     <div className="absolute bottom-full left-0 mb-2 w-48 bg-white shadow-xl border border-slate-100 rounded-lg p-2 z-50">
                                        <input 
                                            autoFocus
                                            placeholder="Label name"
                                            value={newLabelInput}
                                            onChange={e => setNewLabelInput(e.target.value)}
                                            onKeyDown={e => { if(e.key === 'Enter') addNewLabel(true); }}
                                            className="w-full text-sm border-b border-slate-200 outline-none pb-1 mb-2 px-2"
                                        />
                                        <div className="max-h-32 overflow-y-auto">
                                            {allLabels.map(l => (
                                                <div key={l} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 cursor-pointer" onClick={() => toggleLabel(l, true)}>
                                                    <div className={`w-3 h-3 border rounded ${editingNote.labels?.includes(l) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}></div>
                                                    <span className="text-sm truncate">{l}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/5 p-3 flex justify-between items-center mt-auto">
                        <div className="flex gap-2">
                            <button onClick={() => { trashNote(editingNote.id); setEditingNote(null); }} className="p-2 hover:bg-rose-100 text-rose-600 rounded-full text-xs font-bold px-3">Delete</button>
                            
                            <div className="relative group/editcolor" onClick={e => e.stopPropagation()}>
                                <button className="p-2 hover:bg-black/10 rounded-full text-slate-600"><Palette size={16} /></button>
                                <div className="absolute bottom-full left-0 mb-2 bg-white shadow-xl border border-slate-100 p-2 rounded-lg flex gap-1 hidden group-hover/editcolor:flex z-50">
                                    {COLORS.map(c => (
                                        <button 
                                            key={c.value} 
                                            onClick={(e) => setEditingNote({...editingNote, color: c.value})}
                                            className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform"
                                            style={{backgroundColor: c.value}} 
                                        />
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => { fileInputRef.current?.click(); setInputImage(null); /* hack to reset ref if needed */ }} className="p-2 hover:bg-black/10 rounded-full text-slate-600">
                                <ImageIcon size={16} />
                                {/* Hidden input for modal */}
                                <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, true)} onClick={e => e.stopPropagation()} />
                            </button>
                        </div>
                        <button 
                            onClick={() => { updateNote(editingNote); setEditingNote(null); }}
                            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800"
                        >
                            Save & Close
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- PIN MODAL --- */}
        {showPinModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900">
                        <Lock size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                        {pinPrompt.mode === 'SETUP' ? 'Set Privacy Passcode' : 'Enter Passcode'}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        {pinPrompt.mode === 'SETUP' ? 'Create a 4-digit code to lock notes.' : 'This note is locked.'}
                    </p>
                    
                    <input 
                        type="password"
                        maxLength={4}
                        value={pinPrompt.attempt}
                        onChange={e => setPinPrompt({...pinPrompt, attempt: e.target.value.replace(/[^0-9]/g, '')})}
                        className="text-4xl font-bold tracking-[0.5em] text-center w-full mb-6 border-b-2 border-slate-200 focus:border-indigo-600 outline-none pb-2 bg-transparent"
                        autoFocus
                    />

                    <div className="flex gap-3">
                        <button onClick={() => setShowPinModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
                        <button 
                            onClick={handlePinSubmit}
                            className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                            disabled={pinPrompt.attempt.length !== 4}
                        >
                            {pinPrompt.mode === 'SETUP' ? 'Set Code' : 'Unlock'}
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default Notes;