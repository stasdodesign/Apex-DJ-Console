import DJConsole from "@/components/dj-console";
import CybotronTribute from "@/components/cybotron-tribute";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#040404]">
      <DJConsole />
      <CybotronTribute />
    </main>
  );
}
