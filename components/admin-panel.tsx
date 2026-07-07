'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/categories';
import { db, storage, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Upload, Loader2, LogOut, ChevronDown, Activity } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { runStorageDiagnostics, DiagnosticResult } from '@/lib/diagnostics';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[] | null>(null);
  const [formData, setFormData] = useState({
    categoryId: CATEGORIES[0].id,
    titleEn: '',
    titleRu: '',
    descriptionEn: '',
    descriptionRu: '',
    prompt: '',
    altText: ''
  });

  const handleRunDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      const results = await runStorageDiagnostics();
      setDiagnostics(results);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      console.log('AUTH USER:', auth.currentUser);
      const storageRef = ref(storage, `cases/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);

      let altText = formData.altText;
      const isVideo = file.type.startsWith('video/');

      if (!altText && !isVideo) {
        setAnalyzing(true);
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ imageUrl })
        });
        const data = await res.json();
        setAnalyzing(false);
        if (data.altText) altText = data.altText;
      } else if (!altText && isVideo) {
        altText = "Video exploration";
      }

      try {
        await addDoc(collection(db, 'cases'), {
          ...formData,
          altText,
          imageUrl,
          thumbnailUrl: imageUrl,
          mediaType: isVideo ? 'video' : 'image',
          createdAt: serverTimestamp(),
        });
      } catch (firestoreErr: any) {
        handleFirestoreError(firestoreErr, OperationType.CREATE, 'cases');
      }

      onClose();
    } catch (err: any) {
      console.error('Upload Error:', err);
      // Auto-run diagnostics on failure to help the user immediately
      handleRunDiagnostics();
      alert(`Upload failed: ${err.message}. Running diagnostics below...`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 lg:p-8">
      <div className="bg-[#111] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#222] shadow-2xl relative custom-scrollbar">
        <div className="sticky top-0 bg-[#111]/90 backdrop-blur-sm border-b border-[#222] p-4 flex items-center justify-between z-10">
          <h2 className="font-heading text-xl text-white">Add New Exploration</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                signOut(auth);
                onClose();
              }}
              className="text-[#888] hover:text-[#00F0FF] transition-colors flex items-center gap-1 text-sm font-mono uppercase tracking-widest"
            >
              <LogOut size={16} /> Sign out
            </button>
            <button onClick={onClose} className="p-2 bg-[#1A1A1A] rounded-full hover:bg-[#222] transition-colors border border-[#333]">
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {/* File Upload */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-[#555] mb-2">Media (Image or Video)</label>
            <div className="border-2 border-dashed border-[#222] rounded-xl p-8 flex flex-col items-center justify-center bg-[#151515] hover:bg-[#1A1A1A] transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*,video/*"
                required
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
                  <span className="text-[#666] font-mono text-xs uppercase tracking-widest">Drop media here or click</span>
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

          {diagnostics && (
            <div className="border border-[#222] bg-[#0A0A0A] rounded-lg p-4 flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#222] pb-2">
                <span className="text-[#00F0FF] uppercase tracking-wider font-bold">Storage Diagnostics Run</span>
                <button 
                  type="button" 
                  onClick={() => setDiagnostics(null)}
                  className="text-gray-500 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                {diagnostics.map((d, idx) => (
                  <div key={idx} className="border-l-2 pl-2.5 py-1" style={{ borderColor: d.status === 'SUCCESS' ? '#00FF41' : d.status === 'ERROR' ? '#FF3366' : '#FFDD57' }}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span style={{ color: d.status === 'SUCCESS' ? '#00FF41' : d.status === 'ERROR' ? '#FF3366' : '#FFDD57' }}>
                        [{d.status}]
                      </span>
                      <span className="text-[#AAA]">{d.step}</span>
                    </div>
                    <div className="text-[#888] mt-0.5">{d.message}</div>
                    {d.details?.troubleshooting && (
                      <div className="text-[#FFDD57] mt-1 text-[11px] bg-[#FFDD57]/5 p-1.5 rounded border border-[#FFDD57]/10">
                        Recommendation: {d.details.troubleshooting}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-[#222]">
            <button
              type="button"
              onClick={handleRunDiagnostics}
              disabled={runningDiagnostics}
              className="text-xs font-mono uppercase tracking-widest text-[#888] hover:text-[#00F0FF] transition-colors flex items-center gap-1.5"
            >
              <Activity size={14} className={runningDiagnostics ? "animate-pulse text-[#00F0FF]" : ""} />
              {runningDiagnostics ? 'Diagnosing...' : 'Test Connection / Diagnose'}
            </button>
            <button
              type="submit"
              disabled={loading || !file || analyzing}
              className="bg-[#E0E0E0] text-black font-medium px-6 py-2.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {(loading || analyzing) ? <Loader2 className="animate-spin" size={20} /> : 'Publish Exploration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
