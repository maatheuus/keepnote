import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Note, User, AuthState, SortOption } from './types';
import { encryptData, decryptData, hashPassword, generateSalt } from './utils/crypto';
import AuthForm from './components/AuthForm';
import NoteCard from './components/NoteCard';
import NoteModal from './components/NoteModal';
import CustomSelect from './components/CustomSelect';
import PinPad from './components/PinPad';
import { MagnifyingGlass, Plus, SignOut, Moon, Sun, SortAscending, Archive, Trash, Note as NoteIcon, List, X, Shield, Key, CircleNotch } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

const APP_STORAGE_KEY = 'fortress_notes_data';
const USER_STORAGE_KEY = 'fortress_user_auth';

type ViewMode = 'notes' | 'archive' | 'trash';

const SORT_OPTIONS = [
  { label: 'Date (Newest)', value: SortOption.DATE_DESC },
  { label: 'Date (Oldest)', value: SortOption.DATE_ASC },
  { label: 'Title', value: SortOption.TITLE },
  { label: 'Priority', value: SortOption.PRIORITY },
];

function App() {
  // Theme State - Default to Dark
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Auth State
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    encryptionKey: null,
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  // Quick Access State
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [isQuickAccessMode, setIsQuickAccessMode] = useState(false);
  const [quickAccessError, setQuickAccessError] = useState<string | undefined>(undefined);

  // Notes State
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.DATE_DESC);
  const [viewMode, setViewMode] = useState<ViewMode>('notes');
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
       setTheme('light');
    } else {
       setTheme('dark'); // Default to dark
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Load User from Storage (Check if user exists and needs PIN)
  useEffect(() => {
    const checkAuth = async () => {
      const storedUserStr = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUserStr) {
        const storedUser: User = JSON.parse(storedUserStr);
        // If encryptedMasterKey exists, enable Quick Access Mode immediately
        if (storedUser.encryptedMasterKey) {
          setIsQuickAccessMode(true);
        }
      }
      setIsLoadingAuth(false);
    };
    checkAuth();
  }, []);

  // --- Auth Handlers ---

  const handleRegister = (username: string, password: string) => {
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    
    const newUser: User = { username, passwordHash, salt };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setAuthError(null);
    
    // Auto login after register
    handleLogin(username, password, true); // true = prompts for PIN setup
  };

  const handleLogin = (username: string, password: string, isRegistration = false) => {
    const storedUserStr = localStorage.getItem(USER_STORAGE_KEY);
    
    if (!storedUserStr) {
      setAuthError("User does not exist. Please create a vault.");
      return;
    }

    const storedUser: User = JSON.parse(storedUserStr);
    const attemptHash = hashPassword(password, storedUser.salt);

    if (attemptHash === storedUser.passwordHash) {
      // Success: Set state and load notes
      const derivedKey = password + storedUser.salt; 
      setAuthError(null);
      setIsQuickAccessMode(false);
      
      setAuthState({
        isAuthenticated: true,
        user: storedUser,
        encryptionKey: derivedKey
      });

      loadNotes(derivedKey);

      // Prompt for PIN setup if not exists or if it's a new registration
      if (!storedUser.encryptedMasterKey || isRegistration) {
        setShowPinSetup(true);
      }

    } else {
      setAuthError("Incorrect password or username. Access denied.");
    }
  };

  const handleQuickAccess = (pin: string) => {
    const storedUserStr = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUserStr) return;

    const storedUser: User = JSON.parse(storedUserStr);
    if (!storedUser.encryptedMasterKey) return;

    // Attempt to decrypt the master key with the PIN
    const derivedKey = decryptData(storedUser.encryptedMasterKey, pin);

    if (derivedKey && typeof derivedKey === 'string' && derivedKey.length > 10) {
      // Success
      setAuthState({
        isAuthenticated: true,
        user: storedUser,
        encryptionKey: derivedKey
      });
      loadNotes(derivedKey);
      setIsQuickAccessMode(false);
    } else {
      setQuickAccessError("Invalid PIN");
      setTimeout(() => setQuickAccessError(undefined), 1000);
    }
  };

  const handleSetupPin = (pin: string) => {
    if (!authState.user || !authState.encryptionKey) return;

    // Encrypt the current session key with the PIN
    const encryptedKey = encryptData(authState.encryptionKey, pin);
    
    const updatedUser: User = {
      ...authState.user,
      encryptedMasterKey: encryptedKey
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    setAuthState(prev => ({ ...prev, user: updatedUser }));
    setShowPinSetup(false);
    
    // Feedback
    // In a real app we might use a toast, here we just close the modal
  };

  const handleLogout = () => {
    setAuthState({ isAuthenticated: false, user: null, encryptionKey: null });
    setNotes([]);
    setAuthError(null);
    
    // Check if we should go to PIN mode or Auth Form
    const storedUserStr = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUserStr) {
       const u = JSON.parse(storedUserStr);
       if (u.encryptedMasterKey) {
         setIsQuickAccessMode(true);
       }
    }
  };

  // --- Note Data Handlers ---

  const loadNotes = (key: string) => {
    const encryptedNotes = localStorage.getItem(APP_STORAGE_KEY);
    if (encryptedNotes) {
      const decrypted = decryptData(encryptedNotes, key);
      if (decrypted) {
        setNotes(decrypted);
      }
    }
  };

  const saveNotesToStorage = (updatedNotes: Note[]) => {
    if (authState.encryptionKey) {
      const encrypted = encryptData(updatedNotes, authState.encryptionKey);
      localStorage.setItem(APP_STORAGE_KEY, encrypted);
    }
  };

  const handleSaveNote = (noteData: Partial<Note>) => {
    let updatedNotes = [...notes];
    
    if (noteData.id) {
      // Edit
      updatedNotes = updatedNotes.map(n => n.id === noteData.id ? { ...n, ...noteData } as Note : n);
    } else {
      // Create
      const newNote: Note = {
        id: uuidv4(),
        title: noteData.title || '',
        content: noteData.content || '',
        isPinned: noteData.isPinned || false,
        isArchived: noteData.isArchived || false,
        isTrashed: false,
        priority: noteData.priority || 'low',
        format: noteData.format || 'text',
        tags: noteData.tags || [],
        color: noteData.color || 'default',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        audioBase64: noteData.audioBase64,
        transcript: noteData.transcript
      };
      updatedNotes = [newNote, ...updatedNotes];
    }
    
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
  };

  const handleMoveToTrash = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedNotes = notes.map(n => n.id === id ? { ...n, isTrashed: true, isPinned: false } : n);
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
  };
  
  const handleRestore = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const updatedNotes = notes.map(n => n.id === note.id ? { ...n, isTrashed: false } : n);
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
  };

  const handleDeleteForever = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this note permanently? This cannot be undone.")) {
       const updatedNotes = notes.filter(n => n.id !== id);
       setNotes(updatedNotes);
       saveNotesToStorage(updatedNotes);
    }
  };

  const handlePinNote = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    const updatedNotes = notes.map(n => 
      n.id === note.id ? { ...n, isPinned: !n.isPinned } : n
    );
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
  };

  const handleArchiveNote = (e: React.MouseEvent, note: Note) => {
     e.stopPropagation();
     const updatedNotes = notes.map(n => 
       n.id === note.id ? { ...n, isArchived: !n.isArchived, isPinned: false } : n
     );
     setNotes(updatedNotes);
     saveNotesToStorage(updatedNotes);
  };

  // --- Filtering & Sorting ---

  const filteredNotes = useMemo(() => {
    let result = notes;

    // View Mode Filter
    if (viewMode === 'trash') {
       result = result.filter(n => n.isTrashed);
    } else if (viewMode === 'archive') {
       result = result.filter(n => n.isArchived && !n.isTrashed);
    } else {
       // Active Notes
       result = result.filter(n => !n.isArchived && !n.isTrashed);
    }

    // Search
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(lowerQ) || 
        n.content.toLowerCase().includes(lowerQ) ||
        n.tags.some(t => t.toLowerCase().includes(lowerQ)) ||
        (n.transcript && n.transcript.toLowerCase().includes(lowerQ))
      );
    }

    // Sort
    result.sort((a, b) => {
      // Always pin first (only for main view)
      if (viewMode === 'notes') {
         if (a.isPinned && !b.isPinned) return -1;
         if (!a.isPinned && b.isPinned) return 1;
      }

      switch (sortOption) {
        case SortOption.DATE_DESC:
          return b.updatedAt - a.updatedAt;
        case SortOption.DATE_ASC:
          return a.updatedAt - b.updatedAt;
        case SortOption.TITLE:
          return a.title.localeCompare(b.title);
        case SortOption.PRIORITY:
          const pMap = { high: 3, medium: 2, low: 1 };
          return (pMap[b.priority] || 1) - (pMap[a.priority] || 1);
        default:
          return 0;
      }
    });

    return result;
  }, [notes, searchQuery, sortOption, viewMode]);

  // --- Render ---

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-ink">
        <CircleNotch size={48} className="animate-spin text-marker" />
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    if (isQuickAccessMode) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-paper dark:bg-ink transition-colors p-4">
           <PinPad 
             onComplete={handleQuickAccess} 
             error={quickAccessError}
           />
           <button 
             onClick={() => setIsQuickAccessMode(false)}
             className="mt-6 text-sm text-gray-500 hover:text-marker transition-colors"
           >
             Log in with Password
           </button>
        </div>
      );
    }

    return (
      <AuthForm 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        theme={theme}
        toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        error={authError}
      />
    );
  }

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-marker rounded-lg flex items-center justify-center">
               <span className="text-ink font-bold font-mono">FN</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ink dark:text-paper">Fortress</h1>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-2 text-gray-500 hover:text-ink dark:hover:text-paper"
          >
            <X size={20} />
          </button>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        <button 
          onClick={() => { setViewMode('notes'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${viewMode === 'notes' ? 'bg-ink text-paper dark:bg-paper dark:text-ink' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          <NoteIcon size={20} weight={viewMode === 'notes' ? 'fill' : 'regular'} />
          My Notes
        </button>
        <button 
           onClick={() => { setViewMode('archive'); setIsSidebarOpen(false); }}
           className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${viewMode === 'archive' ? 'bg-ink text-paper dark:bg-paper dark:text-ink' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          <Archive size={20} weight={viewMode === 'archive' ? 'fill' : 'regular'} />
          Archive
        </button>
        <button 
           onClick={() => { setViewMode('trash'); setIsSidebarOpen(false); }}
           className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${viewMode === 'trash' ? 'bg-ink text-paper dark:bg-paper dark:text-ink' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
          <Trash size={20} weight={viewMode === 'trash' ? 'fill' : 'regular'} />
          Trash
        </button>
      </nav>

      {/* Settings Area */}
      <div className="px-4 py-2">
         <button 
            onClick={() => { setShowPinSetup(true); setIsSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
         >
           <Key size={20} />
           {authState.user?.encryptedMasterKey ? "Reset Quick Access PIN" : "Enable Quick Access"}
         </button>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-ink dark:text-paper transition-colors"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
          >
            <SignOut size={18} />
            <span>Lock Vault</span>
          </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-paper dark:bg-ink transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-[#1e1a1c] border-r border-gray-200 dark:border-gray-800 flex-col sticky top-0 h-screen z-20">
         <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Off-canvas) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#1e1a1c] z-50 shadow-2xl flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
           {/* Mobile Menu Trigger & Search */}
           <div className="flex items-center gap-2 w-full max-w-xl">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="md:hidden p-2.5 bg-white dark:bg-[#1e1a1c] border border-gray-200 dark:border-gray-800 rounded-xl text-ink dark:text-paper"
             >
               <List size={20} />
             </button>
             
             <div className="relative w-full">
              <MagnifyingGlass 
                size={20} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
              />
              <input 
                type="text"
                placeholder={`Search ${viewMode}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1e1a1c] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-marker outline-none transition-all shadow-sm text-sm"
              />
            </div>
           </div>

           <div className="flex gap-2 w-full sm:w-auto justify-end">
             <CustomSelect 
               value={sortOption}
               options={SORT_OPTIONS}
               onChange={(val) => setSortOption(val as SortOption)}
               icon={<SortAscending size={18} />}
               className="w-full sm:w-48"
             />
           </div>
        </div>

        {/* Masonry Layout */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          <AnimatePresence>
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={(n) => {
                  setEditingNote(n);
                  setIsModalOpen(true);
                }}
                onDelete={viewMode === 'trash' ? handleDeleteForever : handleMoveToTrash}
                onRestore={handleRestore}
                onPin={handlePinNote}
                onArchive={handleArchiveNote}
                permanentDelete={viewMode === 'trash'}
                searchQuery={searchQuery}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400 text-center">
             <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
               {viewMode === 'trash' ? <Trash size={32} /> : viewMode === 'archive' ? <Archive size={32} /> : <Plus size={32} />}
             </div>
             <p className="text-lg font-medium">
               {viewMode === 'trash' ? "Trash is empty." : 
                viewMode === 'archive' ? "No archived notes." : 
                "No notes found. Create your first secure note."}
             </p>
          </div>
        )}
      </main>

      {/* Floating Action Button (Only in Notes View) */}
      <AnimatePresence>
        {viewMode === 'notes' && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setEditingNote(null);
              setIsModalOpen(true);
            }}
            className="fixed bottom-8 right-8 w-14 h-14 bg-marker text-ink rounded-2xl shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow z-30"
          >
            <Plus size={28} weight="bold" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveNote}
        initialNote={editingNote}
      />

      {/* Pin Setup Modal */}
      <AnimatePresence>
        {showPinSetup && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-paper dark:bg-ink p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 text-center"
             >
                <PinPad 
                  isSetup 
                  onComplete={handleSetupPin}
                  onCancel={() => setShowPinSetup(false)}
                />
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
