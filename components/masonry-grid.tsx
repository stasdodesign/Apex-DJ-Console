'use client';

import { useEffect, useState } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import Image from 'next/image';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { Case } from '@/lib/types';
import { useLanguage } from '@/hooks/use-language';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { Edit, Trash2, X, Copy, Check, Calendar, Sparkles, Eye, Compass } from 'lucide-react';
import { EditExplorationModal } from './edit-exploration-modal';


interface MasonryGridProps {
  activeCategory: string | null;
}

export function MasonryGrid({ activeCategory }: MasonryGridProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [editingItem, setEditingItem] = useState<Case | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Case | null>(null);
  const [copied, setCopied] = useState(false);

  const { lang } = useLanguage();

  useEffect(() => {
    let q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
    
    if (activeCategory) {
      q = query(collection(db, 'cases'), where('categoryId', '==', activeCategory), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCases = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Case[];
      setCases(fetchedCases);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'cases');
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => {
      unsubscribe();
      unsubscribeAuth();
    };
  }, [activeCategory]);

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        await deleteDoc(doc(db, 'cases', itemToDelete));
        if (selectedItem?.id === itemToDelete) {
          setSelectedItem(null);
        }
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, `cases/${itemToDelete}`);
      } finally {
        setItemToDelete(null);
      }
    }
  };

  const handleCopyPrompt = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-[#00F0FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#777]">
        <p className="font-heading text-xl mb-2">No Explorations Found</p>
        <p className="text-sm">Select another category or upload new cases.</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 overflow-hidden">
      <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 1200: 3 }}>
        <Masonry gutter="20px">
          <AnimatePresence>
            {cases.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                onClick={() => setSelectedItem(item)}
                className="group relative bg-[#0C0C0C] rounded-xl border border-[#1A1A1A] hover:border-[#333] transition-all duration-300 overflow-hidden cursor-pointer flex flex-col shadow-lg hover:shadow-2xl hover:shadow-[#00F0FF]/5"
              >
                {/* Media Container */}
                <div className="relative overflow-hidden w-full bg-[#050505] border-b border-[#151515]">
                  {item.mediaType === 'video' ? (
                    <video
                      src={item.imageUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  ) : (
                    <img
                      src={item.imageUrl}
                      alt={item.altText || item.titleEn}
                      className="w-full h-auto block transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    />
                  )}
                </div>

                {/* Footer Content */}
                <div className="p-4 flex flex-col bg-[#0D0D0D] group-hover:bg-[#111] transition-colors duration-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF]">
                      #{item.categoryId}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {item.mediaType === 'video' ? 'VIDEO' : 'IMAGE'}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-medium text-[#E0E0E0] group-hover:text-[#00F0FF] transition-colors duration-300 line-clamp-1 mb-1.5">
                    {lang === 'ru' ? item.titleRu : item.titleEn}
                  </h3>
                  
                  <p className="text-xs text-[#888] line-clamp-2 leading-relaxed mb-3">
                    {lang === 'ru' ? item.descriptionRu : item.descriptionEn}
                  </p>

                  {item.prompt && (
                    <div className="pt-2 border-t border-[#1F1F1F] flex items-center justify-between text-[10px] font-mono text-gray-500 group-hover:text-gray-400 transition-colors">
                      <span className="truncate max-w-[80%]">
                        Prompt: {item.prompt}
                      </span>
                      <span className="text-[9px] text-[#00F0FF]/70 shrink-0 flex items-center gap-1 group-hover:underline">
                        Details <Eye size={10} />
                      </span>
                    </div>
                  )}
                </div>

                {/* Admin Actions Overlay (Only visible on hover) */}
                {user && (
                  <div className="absolute top-3 right-3 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingItem(item); 
                      }} 
                      className="p-2 bg-[#141414]/90 backdrop-blur-md rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-[#00F0FF] hover:border-[#00F0FF]/50 transition-all shadow-lg"
                      title="Edit Item"
                    >
                      <Edit size={13} />
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setItemToDelete(item.id); 
                      }}
                      className="p-2 bg-[#141414]/90 backdrop-blur-md rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-[#FF3366] hover:border-[#FF3366]/50 transition-all shadow-lg"
                      title="Delete Item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </Masonry>
      </ResponsiveMasonry>

      {/* Immersive Full-Screen Lightbox / Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 lg:p-8 overflow-y-auto"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="bg-[#0D0D0D] w-full max-w-5xl rounded-2xl border border-[#222] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:max-h-[85vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button top-right corner of entire modal */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-30 p-2.5 bg-black/60 hover:bg-[#FF3366]/20 text-gray-400 hover:text-white rounded-full border border-white/10 hover:border-[#FF3366]/50 transition-all"
                title="Close"
              >
                <X size={18} />
              </button>

              {/* LEFT COLUMN: Asset Showcase (span 7) */}
              <div className="md:col-span-7 bg-[#050505] flex items-center justify-center relative p-4 border-b md:border-b-0 md:border-r border-[#1C1C1C] min-h-[300px] md:h-full overflow-hidden">
                {selectedItem.mediaType === 'video' ? (
                  <video
                    src={selectedItem.imageUrl}
                    autoPlay
                    loop
                    controls
                    className="max-w-full max-h-[50vh] md:max-h-[75vh] object-contain rounded-lg"
                  />
                ) : (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.altText || selectedItem.titleEn}
                    className="max-w-full max-h-[50vh] md:max-h-[75vh] object-contain rounded-lg shadow-2xl"
                  />
                )}
              </div>

              {/* RIGHT COLUMN: Full Text Metadata & Descriptions (span 5) */}
              <div className="md:col-span-5 p-6 md:p-8 flex flex-col justify-between h-full overflow-y-auto custom-scrollbar bg-[#0D0D0D] max-h-[40vh] md:max-h-full">
                <div className="flex flex-col gap-5">
                  {/* Category Header */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#00F0FF] bg-[#00F0FF]/10 rounded border border-[#00F0FF]/20">
                      #{selectedItem.categoryId}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 uppercase">
                      {selectedItem.mediaType || 'image'}
                    </span>
                  </div>

                  {/* Dynamic Prominent Title */}
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight mb-2">
                      {lang === 'ru' ? selectedItem.titleRu : selectedItem.titleEn}
                    </h2>
                    {/* Secondary language title if available */}
                    <div className="text-xs text-gray-500 italic">
                      {lang === 'ru' ? `Original: ${selectedItem.titleEn}` : `На русском: ${selectedItem.titleRu}`}
                    </div>
                  </div>

                  {/* Main User-configured Description */}
                  <div className="border-t border-[#1C1C1C] pt-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                      <Compass size={12} className="text-[#00F0FF]" /> Description
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {lang === 'ru' ? selectedItem.descriptionRu : selectedItem.descriptionEn}
                    </p>
                  </div>

                  {/* AI Vision/Alt-Text description (Very Important because Gemini writes this!) */}
                  {selectedItem.altText && (
                    <div className="border-t border-[#1C1C1C] pt-4 bg-[#0A0A0A] p-3 rounded-xl border border-[#1A1A1A]">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-[#00F0FF] mb-1.5 flex items-center gap-1.5">
                        <Sparkles size={12} /> AI Visual Interpretation
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed italic">
                        "{selectedItem.altText}"
                      </p>
                    </div>
                  )}

                  {/* Copyable Generation Prompt */}
                  {selectedItem.prompt && (
                    <div className="border-t border-[#1C1C1C] pt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400">
                          Generation Prompt
                        </h4>
                        <button
                          onClick={() => handleCopyPrompt(selectedItem.prompt)}
                          className="text-xs font-mono text-[#00F0FF] hover:text-[#00F0FF]/80 flex items-center gap-1 transition-colors"
                        >
                          {copied ? (
                            <>
                              Copied! <Check size={12} className="text-green-400" />
                            </>
                          ) : (
                            <>
                              Copy <Copy size={11} />
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-[#050505] border border-[#1F1F1F] rounded-lg p-3 font-mono text-xs text-gray-400 select-all break-all select-text max-h-[120px] overflow-y-auto custom-scrollbar leading-relaxed">
                        {selectedItem.prompt}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="mt-8 pt-4 border-t border-[#1C1C1C] flex items-center justify-between text-[11px] text-gray-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>
                      {selectedItem.createdAt 
                        ? new Date(selectedItem.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })
                        : 'Unknown Date'}
                    </span>
                  </div>
                  {user && (
                    <button
                      onClick={() => {
                        setEditingItem(selectedItem);
                      }}
                      className="text-[#00F0FF] hover:underline"
                    >
                      Quick Edit
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingItem && (
        <EditExplorationModal item={editingItem} onClose={() => setEditingItem(null)} />
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#111] p-6 rounded-2xl border border-[#222] shadow-2xl max-w-sm w-full">
            <h3 className="text-xl text-white font-heading mb-2">Delete Exploration?</h3>
            <p className="text-[#888] mb-6 text-sm">This action cannot be undone. Are you sure you want to remove this case?</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-white transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-[#FF3366] hover:bg-[#FF1A53] text-white transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


