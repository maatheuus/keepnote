import React, { useState, useEffect } from 'react';
import { Note, Priority, NoteFormat } from '../types';
import { X, PushPin, Tag, Plus, Trash, Copy, TextAa, Code, MagicWand, Archive, Check } from '@phosphor-icons/react';
import AudioRecorder from './AudioRecorder';
import { motion, AnimatePresence } from 'framer-motion';
import { autocompleteText } from '../services/geminiService';
import CustomSelect from './CustomSelect';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Partial<Note>) => void;
  initialNote?: Note | null;
}

const COLORS = [
  { id: 'default', bg: 'bg-white', border: 'border-gray-200' },
  { id: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-200' },
  { id: 'red', bg: 'bg-red-100', border: 'border-red-200' },
  { id: 'dark', bg: 'bg-gray-900', border: 'border-gray-800' },
];

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low', color: 'text-gray-500' },
  { label: 'Medium', value: 'medium', color: 'text-yellow-600' },
  { label: 'High', value: 'high', color: 'text-red-600' },
];

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSave, initialNote }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [priority, setPriority] = useState<Priority>('low');
  const [format, setFormat] = useState<NoteFormat>('text');
  const [color, setColor] = useState('default');
  const [audioData, setAudioData] = useState<{base64: string, transcript: string} | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setIsPinned(initialNote.isPinned);
      setIsArchived(initialNote.isArchived || false);
      setTags(initialNote.tags);
      setPriority(initialNote.priority || 'low');
      setFormat(initialNote.format || 'text');
      setColor(initialNote.color || 'default');
      if (initialNote.audioBase64) {
        setAudioData({
          base64: initialNote.audioBase64,
          transcript: initialNote.transcript || ''
        });
      } else {
        setAudioData(null);
      }
    } else {
      resetForm();
    }
  }, [initialNote, isOpen]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsPinned(false);
    setIsArchived(false);
    setTags([]);
    setNewTag('');
    setPriority('low');
    setFormat('text');
    setColor('default');
    setAudioData(null);
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim() && !audioData) {
      onClose();
      return;
    }

    onSave({
      id: initialNote?.id,
      title,
      content,
      isPinned,
      isArchived,
      priority,
      format,
      color,
      tags,
      audioBase64: audioData?.base64,
      transcript: audioData?.transcript,
      createdAt: initialNote ? initialNote.createdAt : Date.now(),
      updatedAt: Date.now()
    });
    onClose();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const insertTemplate = () => {
    const template = `Website: \nURL: \n\n{\n  "user": "username",\n  "password": "password"\n}`;
    setContent(prev => prev + (prev ? '\n\n' : '') + template);
    setFormat('json');
  };

  const handleAutocomplete = async () => {
    if (!content) return;
    setIsCompleting(true);
    const completion = await autocompleteText(content);
    if (completion) {
      setContent(prev => prev + " " + completion);
    }
    setIsCompleting(false);
  };

  const wrapText = (symbol: string) => {
    const textarea = document.getElementById('note-content-area') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + `${symbol}${selectedText}${symbol}` + content.substring(end);
    setContent(newText);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSave}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className={`relative w-full max-w-2xl bg-paper dark:bg-[#241f21] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col ${color === 'dark' ? 'bg-gray-900' : ''}`}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 gap-4 rounded-t-2xl bg-inherit">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-xl font-bold placeholder-gray-400 text-ink dark:text-paper outline-none w-full"
            />
            <div className="flex items-center gap-2 shrink-0">
               {/* Priority Selector */}
               <CustomSelect 
                 value={priority}
                 options={PRIORITY_OPTIONS}
                 onChange={(val) => setPriority(val as Priority)}
                 className="w-fit"
               />

              <button
                onClick={() => setIsPinned(!isPinned)}
                className={`p-2 rounded-full transition-colors ${
                  isPinned ? 'bg-ink text-paper dark:bg-paper dark:text-ink' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Pin Note"
              >
                <PushPin size={20} weight={isPinned ? 'fill' : 'regular'} />
              </button>
              
              <button
                onClick={() => setIsArchived(!isArchived)}
                className={`p-2 rounded-full transition-colors ${
                  isArchived ? 'bg-marker text-ink' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Archive Note"
              >
                <Archive size={20} weight={isArchived ? 'fill' : 'regular'} />
              </button>

              <button
                onClick={handleSave}
                className="p-2 text-gray-400 hover:text-alert transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 p-2 px-4 bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
             <button onClick={() => setFormat(prev => prev === 'text' ? 'json' : 'text')} className={`p-1.5 rounded flex items-center gap-1 text-xs font-bold ${format === 'json' ? 'bg-ink text-paper' : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
                <Code size={16} /> {format === 'json' ? 'CODE' : 'TEXT'}
             </button>
             
             <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

             <button onClick={insertTemplate} className="p-1.5 rounded text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 text-xs font-medium" title="Insert JSON Credential Template">
                JSON Template
             </button>
             
             <button onClick={() => wrapText('**')} className="p-1.5 rounded text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 font-bold" title="Bold">B</button>
             <button onClick={() => wrapText('_')} className="p-1.5 rounded text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 italic" title="Italic">I</button>
             
             <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

             <button 
               onClick={handleAutocomplete} 
               disabled={isCompleting}
               className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-2 py-1 rounded"
              >
                {isCompleting ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div> : <MagicWand size={16} />}
                AI Complete
             </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
            <textarea
              id="note-content-area"
              placeholder={format === 'json' ? '{\n  "key": "value"\n}' : "Take a note... (Markdown supported)"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full h-64 bg-transparent resize-none outline-none text-ink dark:text-paper text-sm leading-relaxed ${format === 'json' ? 'font-mono text-xs' : 'font-sans'}`}
            />

            {/* Audio Section */}
            <div className="mt-4">
              {audioData ? (
                <div className="relative p-3 bg-gray-50 dark:bg-black/20 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-xs font-bold text-gray-500 uppercase">Voice Note</span>
                     <button onClick={() => setAudioData(null)} className="text-alert hover:text-red-600">
                        <Trash size={16} />
                     </button>
                  </div>
                  <audio controls src={audioData.base64} className="w-full h-8 mb-2" />
                  {audioData.transcript && (
                     <div className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-black/40 p-2 rounded">
                        {audioData.transcript}
                     </div>
                  )}
                </div>
              ) : (
                <AudioRecorder 
                  onAudioReady={(base64, transcript) => setAudioData({ base64, transcript })} 
                />
              )}
            </div>

            {/* Tags Input */}
            <div className="mt-6">
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-alert">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-[200px]">
                  <Tag size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag"
                    className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 border-none outline-none text-sm focus:ring-1 focus:ring-marker"
                  />
                </div>
                <button 
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Footer Action */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center rounded-b-2xl bg-inherit">
            
            {/* Color Palette */}
            <div className="flex gap-2">
               {COLORS.map(c => (
                 <button
                   key={c.id}
                   onClick={() => setColor(c.id)}
                   className={`w-6 h-6 rounded-full border ${c.bg} ${c.border} ${color === c.id ? 'ring-2 ring-offset-2 ring-ink dark:ring-paper' : ''}`}
                   title={c.id}
                 />
               ))}
            </div>

            <button
              onClick={handleSave}
              className="px-6 py-2 bg-ink dark:bg-paper text-paper dark:text-ink font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Close & Save
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NoteModal;