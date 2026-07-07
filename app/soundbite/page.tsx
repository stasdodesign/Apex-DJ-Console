import SoundBitePro from "@/components/soundbite-pro";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SoundBitePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#040404] p-8">
      <div className="max-w-4xl mx-auto w-full mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-mono">
          <ArrowLeft className="w-4 h-4" /> BACK TO DJ CONSOLE
        </Link>
      </div>
      <SoundBitePro />
    </main>
  );
}
