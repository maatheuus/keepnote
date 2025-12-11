import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../types';
import { PushPin, Trash, SpeakerHigh, Tag, Archive, ArrowCounterClockwise, Copy, Check, CaretDown, BracketsCurly } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onRestore: (e: React.MouseEvent, note: Note) => void;
  onPin: (e: React.MouseEvent, note: Note) => void;
  onArchive: (e: React.MouseEvent, note: Note) => void;
  permanentDelete?: boolean;
  searchQuery?: string;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onDelete, onRestore, onPin, onArchive, permanentDelete, searchQuery }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const copyMenuRef = useRef<HTMLDivElement>(null);

  // Extract JSON logic
  const jsonContent = React.useMemo(() => {
    try {
      // 1. Try full parse
      const parsed = JSON.parse(note.content);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch (e) {
      // 2. Try partial regex match for JSON block
      const match = note.content.match(/{[\s\S]*?}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (typeof parsed === 'object' && parsed !== null) return parsed;
        } catch (e2) { return null; }
      }
    }
    return null;
  }, [note.content]);

  const hasJson = !!jsonContent;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (copyMenuRef.current && !copyMenuRef.current.contains(event.target as Node)) {
        setShowCopyMenu(false);
      }
    };
    if (showCopyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCopyMenu]);

  const handleCopy = (e: React.MouseEvent, text: string, keyName: string = 'full') => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
    setShowCopyMenu(false);
  };

  // Helper to highlight text
  const HighlightedText = ({ text, query }: { text: string, query?: string }) => {
    if (!query || !text) return <>{text}</>;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="search-highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const priorityColor = {
    low: 'border-l-4 border-l-gray-300 dark:border-l-gray-600',
    medium: 'border-l-4 border-l-yellow-400',
    high: 'border-l-4 border-l-red-500',
  };

  const bgColor = {
    default: 'bg-white dark:bg-[#2a2628]',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    dark: 'bg-[#241f21] text-paper dark:bg-black',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(note)}
      className={`
        relative group break-inside-avoid mb-4 rounded-xl border border-gray-200 dark:border-gray-700 
        p-4 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-visible
        ${bgColor[note.color as keyof typeof bgColor] || bgColor.default}
        ${priorityColor[note.priority || 'low']}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-semibold text-lg ${!note.title ? 'text-gray-400 italic' : ''} ${note.color === 'dark' ? 'text-paper' : ''}`}>
           <HighlightedText text={note.title || 'Untitled'} query={searchQuery} />
        </h3>
        <div className="flex gap-1">
          {hasJson && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-marker/20 text-marker-darker flex items-center gap-1">
              <BracketsCurly weight="bold" /> JSON
            </span>
          )}
          {!note.isTrashed && !note.isArchived && (
            <button
              onClick={(e) => onPin(e, note)}
              className={`p-1.5 rounded-full transition-colors ${
                note.isPinned 
                  ? 'bg-ink text-paper dark:bg-paper dark:text-ink' 
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-100 md:opacity-0 md:group-hover:opacity-100'
              }`}
            >
              <PushPin size={16} weight={note.isPinned ? 'fill' : 'regular'} />
            </button>
          )}
        </div>
      </div>

      <div className={`text-sm mb-3 font-sans overflow-hidden ${note.color === 'dark' ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>
        {note.format === 'json' ? (
          <pre className="p-2 bg-gray-100 dark:bg-black/30 rounded-md font-mono text-xs overflow-x-auto">
            {note.content}
          </pre>
        ) : (
           <div className="markdown-body prose dark:prose-invert prose-sm max-w-none line-clamp-[10]">
             <ReactMarkdown remarkPlugins={[remarkGfm]}>
               {note.content}
             </ReactMarkdown>
           </div>
        )}
      </div>

      {note.audioBase64 && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-black/30 rounded-lg border border-gray-100 dark:border-gray-800">
           <div className="flex items-center gap-2 mb-1 text-alert text-xs font-bold uppercase">
              <SpeakerHigh size={14} />
              <span>Voice Note</span>
           </div>
           <audio controls src={note.audioBase64} className="w-full h-8" />
           {note.transcript && (
             <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic pl-1 border-l-2 border-marker">
               "<HighlightedText text={note.transcript} query={searchQuery} />"
             </div>
           )}
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {note.tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
            <Tag size={10} />
            <HighlightedText text={tag} query={searchQuery} />
          </span>
        ))}
      </div>

      {/* Action Footer - Always visible on mobile, hover on desktop */}
      <div className="flex justify-between items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pt-2 border-t border-transparent group-hover:border-gray-100 dark:group-hover:border-gray-700">
        
        <div className="relative" ref={copyMenuRef}>
           <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasJson) {
                setShowCopyMenu(!showCopyMenu);
              } else {
                handleCopy(e, note.content);
              }
            }}
            className="flex items-center gap-1 p-1.5 text-gray-400 hover:text-marker hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
            title="Copy"
          >
            {copiedKey === 'full' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {hasJson && <CaretDown size={12} />}
          </button>

          <AnimatePresence>
            {showCopyMenu && hasJson && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 bottom-8 z-50 min-w-[160px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden"
              >
                <div className="p-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Smart Copy</div>
                  <button 
                     onClick={(e) => handleCopy(e, note.content, 'full')}
                     className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 rounded flex items-center justify-between"
                  >
                    <span>Full Note</span>
                    {copiedKey === 'full' && <Check size={12} className="text-green-500"/>}
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
                  {Object.keys(jsonContent).map(key => (
                     <button
                       key={key}
                       onClick={(e) => handleCopy(e, String(jsonContent[key]), key)}
                       className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 rounded flex items-center justify-between"
                       title={`Value: ${String(jsonContent[key]).substring(0, 50)}...`}
                     >
                       <span className="font-mono text-gray-600 dark:text-gray-400">{key}</span>
                       {copiedKey === key && <Check size={12} className="text-green-500"/>}
                     </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-1">
          {note.isTrashed ? (
            <button
              onClick={(e) => onRestore(e, note)}
              className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
              title="Restore"
            >
              <ArrowCounterClockwise size={16} />
            </button>
          ) : (
            <button
              onClick={(e) => onArchive(e, note)}
              className={`p-1.5 rounded-full transition-colors ${
                note.isArchived ? 'text-marker bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 hover:text-ink hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              title={note.isArchived ? "Unarchive" : "Archive"}
            >
              <Archive size={16} weight={note.isArchived ? "fill" : "regular"} />
            </button>
          )}

          <button
            onClick={(e) => onDelete(e, note.id)}
            className="p-1.5 text-gray-400 hover:text-alert hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title={permanentDelete ? "Delete Permanently" : "Move to Trash"}
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard;
