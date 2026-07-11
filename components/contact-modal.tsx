'use client';

import { X } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface ContactModalProps {
  onClose: () => void;
}

export function ContactModal({ onClose }: ContactModalProps) {
  const { lang } = useLanguage();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#111] p-8 rounded-2xl w-full max-w-md border border-[#222] shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-[#1A1A1A] rounded-full hover:bg-[#222] transition-colors border border-[#333]"
        >
          <X size={20} className="text-white" />
        </button>

        <h2 className="font-heading text-2xl text-white mb-2">Stanislav Dovidenko</h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#00F0FF] mb-6">Product Designer</p>

        <div className="text-[#AAA] text-sm mb-8 space-y-4">
          <p>
            {lang === 'ru' 
              ? 'Продуктовый дизайнер с фокусом на AI, автомобильные интерфейсы и сложные системы. Создаю функциональные и эстетичные продукты для будущего.'
              : 'Product designer focusing on AI, automotive interfaces, and complex systems. Crafting functional and aesthetic products for the future.'}
          </p>
          <a 
            href="https://stanislavdovidenko.com/en.html#about" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#00F0FF] hover:underline text-xs inline-block"
          >
            {lang === 'ru' ? 'Читать подробнее →' : 'Read more about me →'}
          </a>
        </div>

        <div className="space-y-3">
          <a href="https://t.me/StasDoDesign" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-[#151515] border border-[#222] rounded-lg hover:border-[#00F0FF] hover:bg-[#1A1A1A] transition-all group">
            <span className="text-xs uppercase tracking-widest text-[#888] group-hover:text-[#00F0FF] w-24">Telegram</span>
            <span className="text-sm text-[#E0E0E0]">@StasDoDesign</span>
          </a>
          
          <a href="http://linkedin.com/in/stasdodesign" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-[#151515] border border-[#222] rounded-lg hover:border-[#00F0FF] hover:bg-[#1A1A1A] transition-all group">
            <span className="text-xs uppercase tracking-widest text-[#888] group-hover:text-[#00F0FF] w-24">LinkedIn</span>
            <span className="text-sm text-[#E0E0E0]">/in/stasdodesign</span>
          </a>
          
          <a href="https://instagram.com/stasdodesign" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-[#151515] border border-[#222] rounded-lg hover:border-[#00F0FF] hover:bg-[#1A1A1A] transition-all group">
            <span className="text-xs uppercase tracking-widest text-[#888] group-hover:text-[#00F0FF] w-24">Instagram</span>
            <span className="text-sm text-[#E0E0E0]">@stasdodesign</span>
          </a>
          
          <a href="mailto:stasdodesign@gmail.com" className="flex items-center gap-3 p-3 bg-[#151515] border border-[#222] rounded-lg hover:border-[#00F0FF] hover:bg-[#1A1A1A] transition-all group">
            <span className="text-xs uppercase tracking-widest text-[#888] group-hover:text-[#00F0FF] w-24">Email</span>
            <span className="text-sm text-[#E0E0E0] truncate">stasdodesign@gmail.com</span>
          </a>
        </div>
      </div>
    </div>
  );
}
