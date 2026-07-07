'use client';
import { useState } from 'react';
import { db, storage, handleFirestoreError, OperationType } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { X, Upload, Loader2, ChevronDown } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { Case } from '@/lib/types';

interface EditExplorationModalProps {
  item: Case;
  onClose: () => void;
}

export function EditExplorationModal({ item, onClose }: EditExplorationModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: item.categoryId,
    titleEn: item.titleEn,
    titleRu: item.titleRu,
    descriptionEn: item.descriptionEn,
    descriptionRu: item.descriptionRu,
    prompt: item.prompt,
    altText: item.altText
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = item.imageUrl;
      let mediaType = item.mediaType;
      let altText = formData.altText;

      if (file) {
        const storageRef = ref(storage, `cases/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
        const isVideo = file.type.startsWith('video/');
        mediaType = isVideo ? 'video' : 'image';
        
        if (!altText && !isVideo) {
          setAnalyzing(true);
          const res = await fetch('/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl })
          });
          const data = await res.json();
          setAnalyzing(false);
          if (data.altText) altText = data.altText;
        } else if (!altText && isVideo) {
          altText = "Video exploration";
        }
      }

      try {
        await updateDoc(doc(db, 'cases', item.id), {
          ...formData,
          altText,
          imageUrl,
          thumbnailUrl: imageUrl,
          mediaType: mediaType || 'image',
        });
      } catch (firestoreErr: any) {
        handleFirestoreError(firestoreErr, OperationType.UPDATE, `cases/${item.id}`);
      }
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 lg:p-8">
      <div className="bg-[#111] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#222] shadow-2xl relative custom-scrollbar">
        <div className="sticky top-0 bg-[#111]/90 backdrop-blur-sm border-b border-[#222] p-4 flex items-center justify-between z-10">
          <h2 className="font-heading text-xl text-white">Edit Exploration</h2>
          <button onClick={onClose} className="p-2 bg-[#1A1A1A] rounded-full hover:bg-[#222] transition-colors border border-[#333]">
            <X size={20} className="text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {/* File Upload - Optional for edit */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-[#555] mb-2">Media (Optional: Replace current)</label>
            <div className="border-2 border-dashed border-[#222] rounded-xl p-8 flex flex-col items-center justify-center bg-[#151515] hover:bg-[#1A1A1A] transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="text-[#00F0FF] flex items-center gap-2">
                  <span className="truncate max-w-[200px] font-mono text-sm">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="text-[#444] mb-2" size={32} />
                  <span className="text-[#666] font-mono text-xs uppercase tracking-widest">Drop new media or click</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-[#555] mb-2">Category</label>
              <div className="relative">
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                  className="w-full bg-[#151515] border border-[#222] rounded-lg px-4 py-2 pr-10 text-[#E0E0E0] outline-none focus:border-[#00F0FF] transition-colors font-mono text-sm appearance-none cursor-pointer"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.nameEn}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555]">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-[#555] mb-2">Generated Alt Text</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.altText}
                  onChange={e => setFormData(p => ({ ...p, altText: e.target.value }))}
                  placeholder="Auto-generated on upload if empty"
                  className="w-full bg-[#151515] border border-[#222] rounded-lg px-4 py-2 pr-10 text-[#E0E0E0] outline-none focus:border-[#00F0FF] transition-colors text-sm"
                />
                {analyzing && <Loader2 className="absolute right-3 top-2.5 animate-spin text-[#00F0FF]" size={18} />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-[#555] mb-2">Title (EN)</label>
              <input required type="text" value={formData.titleEn} onChange={e => setFormData(p => ({ ...p, titleEn: e.target.value }))} className="w-full bg-[#151515] border border-[#222] rounded-lg px-4 py-2 text-[#E0E0E0] outline-none focus:border-[#00F0FF] transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-[#555] mb-2">Title (RU)</label>
              <input required type="text" value={formData.titleRu} onChange={e => setFormData(p => ({ ...p, titleRu: e.target.value }))} className="w-full bg-[#151515] border border-[#222] rounded-lg px-4 py-2 text-[#E0E0E0] outline-none focus:border-[#00F0FF] transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-[#555] mb-2">Description (EN)</label>
              <textarea required rows={3} value={formData.descriptionEn} onChange={e => setFormData(p => ({ ...p, descriptionEn: e.target.value }))} className="w-full bg-[#151515] border border-[#222] rounded-lg px-4 py-2 text-[#E0E0E0] outline-none focus:border-[#00F0FF] transition-colors resize-none custom-scrollbar" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-[#555] mb-2">Description (RU)</label>
              <textarea required rows={3} value={formData.descriptionRu} onChange={e => setFormData(p => ({ ...p, descriptionRu: e.target.value }))} className="w-full bg-[#151515] border border-[#222] rounded-lg px-4 py-2 text-[#E0E0E0] outline-none focus:border-[#00F0FF] transition-colors resize-none custom-scrollbar" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-[#555] mb-2">Generation Prompt</label>
            <textarea required rows={2} value={formData.prompt} onChange={e => setFormData(p => ({ ...p, prompt: e.target.value }))} className="w-full bg-[#151515] border border-[#222] rounded-lg px-4 py-2 text-[#E0E0E0] outline-none focus:border-[#00F0FF] transition-colors font-mono text-sm resize-none custom-scrollbar" />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || analyzing}
              className="bg-[#E0E0E0] text-black font-medium px-6 py-2.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {(loading || analyzing) ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
