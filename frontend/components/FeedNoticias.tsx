import { useEffect, useState } from "react";
import { api } from "../lib/api";
import SkeletonNoticia from "./ui/SkeletonNoticia";

export interface Noticia {
  titulo: string;
  categoria: string;
  url: string;
  fecha: string;
  texto_completo: string;
  distancia_matematica: number;
}

export default function FeedNoticias({ email, modo, mostrarToast }: { email: string, modo: "feed" | "ultimahora", mostrarToast: (m: string) => void }) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [resumiendo, setResumiendo] = useState<Record<string, boolean>>({});
  const [resumenesIA, setResumenesIA] = useState<Record<string, string>>({});

  useEffect(() => {
    setCargando(true);
    setNoticias([]);
    const url = modo === "feed" ? `/noticias/feed/${email}` : `/noticias/ultimahora`;
    
    api.get(url)
      .then(res => setNoticias(res.data.noticias))
      .catch(() => mostrarToast("Error cargando noticias"))
      .finally(() => setCargando(false));
  }, [email, modo]);

  const generarResumen = async (noticia: Noticia) => {
    setResumiendo(prev => ({ ...prev, [noticia.titulo]: true }));
    try {
      const res = await api.post("/noticias/resumir", { email, texto_noticia: noticia.texto_completo });
      setResumenesIA(prev => ({ ...prev, [noticia.titulo]: res.data.resumen }));
      mostrarToast("Resumen generado con éxito");
    } catch {
      setResumenesIA(prev => ({ ...prev, [noticia.titulo]: "❌ Error en el motor IA." }));
    } finally {
      setResumiendo(prev => ({ ...prev, [noticia.titulo]: false }));
    }
  };

  const registrarClic = async (titulo: string) => {
    api.post("/usuarios/leer", { email, titulo }).catch(console.error);
  };

  const guardarNoticia = async (noticia: Noticia) => {
    try {
      await api.post("/usuarios/guardar_noticia", { email, noticia });
      mostrarToast("🔖 Noticia guardada en tu perfil");
    } catch {
      mostrarToast("Error al guardar la noticia");
    }
  };

  const enviarFeedback = async (categoria: string, tipo: "like" | "dislike") => {
    try {
      await api.post("/usuarios/feedback", { email, categoria, tipo });
      mostrarToast(tipo === "like" ? "👍 Añadido a tus intereses" : "👎 Verás menos de esto");
    } catch {
      mostrarToast("Error enviando feedback");
    }
  };

  const calcularTiempoLectura = (texto: string) => {
    const palabras = texto.trim().split(/\s+/).length;
    const minutos = Math.ceil(palabras / 200);
    return minutos === 0 ? 1 : minutos;
  };

  return (
    <div className="space-y-10">
      <header className="mb-8">
        <h2 className="text-4xl font-serif text-white mb-2">
          {modo === "feed" ? "Tu Selección Inteligente" : "Lo Último (Global)"}
        </h2>
        <p className="text-slate-400">
          {modo === "feed" ? "Filtrado por IA según tu comportamiento." : "Las noticias más recientes ingresadas al sistema."}
        </p>
      </header>

      {cargando && (
        <div className="space-y-8">
          <SkeletonNoticia />
          <SkeletonNoticia />
          <SkeletonNoticia />
        </div>
      )}

      {!cargando && noticias.length === 0 && <div className="text-center text-slate-500 py-10">No hay noticias disponibles.</div>}
      
      {!cargando && noticias.map((noticia, idx) => (
        <article key={idx} className="group flex flex-col gap-4 pb-10 border-b border-slate-800/50">
          <div className="flex items-center gap-3 text-xs font-bold tracking-widest text-slate-500">
            <span className="text-blue-500 uppercase">{noticia.categoria}</span>
            <span>•</span>
            <span className="flex items-center gap-1">⏱️ {calcularTiempoLectura(noticia.texto_completo)} min lectura</span>
            {modo === "feed" && noticia.distancia_matematica > 0 && (
              <><span>•</span><span>Match: {(1 - noticia.distancia_matematica).toFixed(2)}</span></>
            )}
          </div>
          
          <a href={noticia.url} target="_blank" rel="noopener noreferrer" onClick={() => registrarClic(noticia.titulo)}>
            <h3 className="text-3xl font-bold text-white leading-tight hover:text-blue-400 transition-colors">{noticia.titulo}</h3>
          </a>
          
          <p className="text-slate-400 text-lg leading-relaxed line-clamp-3">{noticia.texto_completo}</p>

          {resumenesIA[noticia.titulo] && (
            <div className="mt-2 p-5 bg-gradient-to-br from-indigo-900/40 to-blue-900/10 border border-indigo-500/30 rounded-xl">
              <p className="text-blue-400 font-bold mb-2 text-xs uppercase tracking-wider">🤖 Resumen IA</p>
              <p className="text-slate-200 text-base font-serif leading-relaxed">{resumenesIA[noticia.titulo]}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <div className="flex gap-2">
              <button onClick={() => generarResumen(noticia)} disabled={resumiendo[noticia.titulo]} className="px-4 py-2 bg-white text-black hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-500 text-sm font-bold rounded-full transition-colors flex items-center gap-2">
                {resumiendo[noticia.titulo] ? "⏳ Pensando..." : "✨ Resumir con Llama 3"}
              </button>
              <button onClick={() => guardarNoticia(noticia)} className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-bold rounded-full transition-colors">
                🔖 Guardar
              </button>
            </div>
            
            <div className="flex gap-2 bg-slate-900 rounded-full p-1 border border-slate-800">
              <button onClick={() => enviarFeedback(noticia.categoria, "like")} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-emerald-400" title="Me interesa más sobre esto">👍</button>
              <button onClick={() => enviarFeedback(noticia.categoria, "dislike")} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-red-400" title="No me interesa este tema">👎</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}