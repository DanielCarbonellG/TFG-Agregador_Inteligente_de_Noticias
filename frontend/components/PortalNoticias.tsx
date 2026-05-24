import { useState, useEffect } from "react";
import { api } from "../lib/api";
import FeedNoticias from "./FeedNoticias";
import VistaPerfil from "./VistaPerfil";
import Logo from "./Logo";
import Icono from "./Icono";

export default function PortalNoticias({ 
  email, 
  onCerrarSesion, 
  esInvitado 
}: { 
  email: string, 
  onCerrarSesion: () => void, 
  esInvitado: boolean 
}) {
  const [vista, setVista] = useState<"feed" | "ultimahora" | "perfil" | "">(esInvitado ? "ultimahora" : "feed");
  const [toast, setToast] = useState<{ visible: boolean; mensaje: string }>({ visible: false, mensaje: "" });
  const [avatar, setAvatar] = useState<string>(""); 
  const [nombre, setNombre] = useState<string>(""); 

  useEffect(() => {
    if (esInvitado) {
      setVista("ultimahora");
    } else if (email && email !== "invitado@nova.com") {
      setVista("feed");
    }
  }, [esInvitado, email]);

  const mostrarToast = (mensaje: string) => {
    setToast({ visible: true, mensaje });
    setTimeout(() => setToast({ visible: false, mensaje: "" }), 3000);
  };

  useEffect(() => {
    if (!esInvitado && email && email !== "invitado@nova.com") {
      api.get(`/usuarios/perfil/${email}`)
        .then(res => {
          setAvatar(res.data.avatar || "");
          setNombre(res.data.nombre || email.split("@")[0]);
        })
        .catch(err => {
          if (err.response?.status !== 404) {
             console.error("Error cargando datos en navbar", err);
          }
        });
    }
  }, [email, esInvitado]);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-slate-300 font-sans relative">
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800/90 backdrop-blur-md border border-slate-700 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="font-semibold">{toast.mensaje}</span>
        </div>
      )}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-[#0a0a0a]/60 border-b border-slate-800/50 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            <div onClick={() => !esInvitado && setVista("feed")} className={esInvitado ? "cursor-default" : "cursor-pointer"}>
              <Logo />
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              {!esInvitado && (
                <span onClick={() => setVista("feed")} className={`py-5 cursor-pointer border-b-2 transition-colors ${vista === "feed" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                  Para ti
                </span>
              )}
              <span onClick={() => setVista("ultimahora")} className={`py-5 cursor-pointer border-b-2 transition-colors ${vista === "ultimahora" ? "border-blue-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                Última Hora
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!esInvitado && (
              <button 
                onClick={() => setVista("perfil")} 
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all ${vista === "perfil" ? "bg-slate-800/80 border-blue-500/50" : "border-transparent hover:bg-slate-800/50"}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white shadow-inner overflow-hidden border border-slate-700">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Icono name="user" className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-bold text-slate-200 tracking-tight">
                  {nombre || email.split("@")[0]}
                </span>
              </button>
            )}
            <button onClick={onCerrarSesion} className="bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 backdrop-blur-md border border-slate-700 text-white text-xs px-4 py-2 rounded-full font-bold transition-all">
              {esInvitado ? "Iniciar Sesión" : "Salir"}
            </button>
          </div>

        </div>
      </nav>
      <main className="w-full max-w-7xl mx-auto px-4 py-12 flex-grow">
        {vista === "feed" && !esInvitado && <FeedNoticias email={email} modo="feed" mostrarToast={mostrarToast} />}
        {vista === "ultimahora" && <FeedNoticias email={email} modo="ultimahora" mostrarToast={mostrarToast} />}
        {vista === "perfil" && !esInvitado && (
          <VistaPerfil 
            email={email} 
            onPerfilActualizado={(nuevoNombre, nuevoAvatar) => {
              setNombre(nuevoNombre);
              setAvatar(nuevoAvatar);
            }} 
          />
        )}
      </main>
      <footer className="border-t border-slate-800/50 py-8 mt-auto backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
          <Logo className="h-6 w-auto opacity-50 grayscale" />
          <p className="text-slate-500 text-xs text-center font-medium">
            © {new Date().getFullYear()} NovaNews. Proyecto de Trabajo de Fin de Grado.
          </p>
          <p className="text-slate-600 text-xs text-center">
            Noticias y datos recopilados gracias a la integración con{' '}
            <a 
              href="https://worldnewsapi.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:text-blue-400 underline underline-offset-4 decoration-blue-500/30 transition-colors"
            >
              World News API
            </a>.
          </p>
        </div>
      </footer>
    </div>
  );
}