import { useState } from "react";
import FeedNoticias from "./FeedNoticias";
import VistaPerfil from "./VistaPerfil";

export default function PortalNoticias({ email, onCerrarSesion }: { email: string, onCerrarSesion: () => void }) {
  const [vista, setVista] = useState<"feed" | "ultimahora" | "perfil">("feed");
  const [toast, setToast] = useState<{ visible: boolean; mensaje: string }>({ visible: false, mensaje: "" });

  const mostrarToast = (mensaje: string) => {
    setToast({ visible: true, mensaje });
    setTimeout(() => setToast({ visible: false, mensaje: "" }), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 font-sans relative">
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 border border-slate-700 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          ✨ <span className="font-semibold">{toast.mensaje}</span>
        </div>
      )}

      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-black text-white tracking-tighter cursor-pointer" onClick={() => setVista("feed")}>
              News<span className="text-blue-500">AI</span>
            </h1>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <span onClick={() => setVista("feed")} className={`py-5 cursor-pointer border-b-2 transition-colors ${vista === "feed" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                Para ti
              </span>
              <span onClick={() => setVista("ultimahora")} className={`py-5 cursor-pointer border-b-2 transition-colors ${vista === "ultimahora" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                Última Hora
              </span>
              <span onClick={() => setVista("perfil")} className={`py-5 cursor-pointer border-b-2 transition-colors ${vista === "perfil" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                Mi Perfil
              </span>
            </div>
          </div>
          <button onClick={onCerrarSesion} className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-full font-bold">
            Salir
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {vista === "feed" && <FeedNoticias email={email} modo="feed" mostrarToast={mostrarToast} />}
        {vista === "ultimahora" && <FeedNoticias email={email} modo="ultimahora" mostrarToast={mostrarToast} />}
        {vista === "perfil" && <VistaPerfil email={email} />}
      </main>
    </div>
  );
}