import { useEffect, useState } from "react";
import { api } from "../lib/api";
import SkeletonNoticia from "./ui/SkeletonNoticia";
import { Noticia } from "./FeedNoticias";

interface Perfil {
  nombre: string;
  email: string;
  intereses_explicitos: string[];
  historial_lectura: string[];
  noticias_guardadas: Noticia[];
}

export default function VistaPerfil({ email }: { email: string }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    api.get(`/usuarios/perfil/${email}`)
      .then(res => setPerfil(res.data))
      .catch(err => console.error("Error cargando perfil", err));
  }, [email]);

  if (!perfil) return (
    <div className="space-y-8">
      <SkeletonNoticia />
    </div>
  );

  const interesesSeguros = perfil.intereses_explicitos || [];
  const guardadasSeguras = perfil.noticias_guardadas || [];

  return (
    <div className="space-y-10">
      <header className="border-b border-slate-800 pb-8">
        <h2 className="text-4xl font-serif text-white mb-2">{perfil.nombre || "Usuario"}</h2>
        <p className="text-slate-400">{perfil.email}</p>
      </header>

      <section className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-xl font-bold text-white mb-6">Tus Intereses Vectoriales</h3>
        <div className="flex flex-wrap gap-2">
          {interesesSeguros.length === 0 ? (
            <p className="text-slate-500 text-sm">Aún no hay intereses. Dale a 👍 en las noticias.</p>
          ) : (
            interesesSeguros.map(tema => (
              <span key={tema} className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-sm font-semibold">
                {tema}
              </span>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">🔖 Guardadas para luego</h3>
        {guardadasSeguras.length === 0 ? (
          <div className="bg-slate-900/50 border border-dashed border-slate-700 p-8 rounded-xl text-center text-slate-500">
            Tu estantería está vacía. Haz clic en "Guardar" en cualquier noticia.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guardadasSeguras.map((noticia, idx) => (
              <a key={idx} href={noticia.url} target="_blank" rel="noopener noreferrer" className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-blue-500 transition-colors group block">
                <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">{noticia.categoria}</span>
                <h4 className="text-lg font-bold text-slate-200 mt-2 mb-2 group-hover:text-blue-400 line-clamp-2">{noticia.titulo}</h4>
                <p className="text-slate-500 text-sm">⏱️ {Math.ceil(noticia.texto_completo.split(/\s+/).length / 200)} min lectura</p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}