import { useEffect, useState, FormEvent, useRef } from "react";
import { api } from "../lib/api";
import SkeletonNoticia from "./ui/SkeletonNoticia";
import { Noticia } from "./FeedNoticias";
import Icono from "./Icono";

interface Perfil {
  nombre: string;
  email: string;
  avatar?: string;
  intereses_explicitos: string[];
  categorias_penalizadas: string[];
  historial_lectura: string[];
  noticias_guardadas: Noticia[];
}

export default function VistaPerfil({ 
  email, 
  onPerfilActualizado 
}: { 
  email: string, 
  onPerfilActualizado?: (nuevoNombre: string, nuevoAvatar: string) => void 
}) {

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nuevoInteres, setNuevoInteres] = useState("");
  const [nuevaPenalizacion, setNuevaPenalizacion] = useState("");
  const [editando, setEditando] = useState(false);
  const [nombreForm, setNombreForm] = useState("");
  const [avatarBase64, setAvatarBase64] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarPerfil = () => {
    api.get(`/usuarios/perfil/${email}`)
      .then(res => {
        setPerfil(res.data);
        setNombreForm(res.data.nombre || "");
        setAvatarBase64(res.data.avatar || "");
      })
      .catch(err => console.error("Error cargando perfil", err));
  };

  useEffect(() => {
    cargarPerfil();
  }, [email]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarEdicion = async () => {
    try {
      await api.put("/usuarios/actualizar_perfil", { 
        email, 
        nombre: nombreForm, 
        avatar: avatarBase64 
      });
      setPerfil(prev => prev ? { ...prev, nombre: nombreForm, avatar: avatarBase64 } : null);
      if (onPerfilActualizado) onPerfilActualizado(nombreForm, avatarBase64);
      setEditando(false);
    } catch (err) {
      console.error("Error guardando perfil", err);
      setPerfil(prev => prev ? { ...prev, nombre: nombreForm, avatar: avatarBase64 } : null);
      if (onPerfilActualizado) onPerfilActualizado(nombreForm, avatarBase64);
      setEditando(false);
    }
  };

  const agregarInteresLibre = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevoInteres.trim()) return;
    const interesFormateado = nuevoInteres.trim().charAt(0).toUpperCase() + nuevoInteres.trim().slice(1).toLowerCase();
    try {
      await api.post("/usuarios/feedback", { email, categoria: interesFormateado, tipo: "like" });
      setNuevoInteres(""); 
      cargarPerfil(); 
    } catch (err) {}
  };

  const agregarPenalizacionLibre = async (e: FormEvent) => {
    e.preventDefault();
    if (!nuevaPenalizacion.trim()) return;
    const penalizacionFormateada = nuevaPenalizacion.trim().charAt(0).toUpperCase() + nuevaPenalizacion.trim().slice(1).toLowerCase();
    try {
      await api.post("/usuarios/feedback", { email, categoria: penalizacionFormateada, tipo: "dislike" });
      setNuevaPenalizacion(""); 
      cargarPerfil(); 
    } catch (err) {}
  };

  const eliminarInteres = async (interes: string) => {
    if (!perfil) return;
    const nuevaLista = perfil.intereses_explicitos.filter(i => i !== interes);
    try { 
      await api.put("/usuarios/intereses", { email, intereses: nuevaLista }); 
      cargarPerfil(); 
    } catch (err) {}
  };

  const eliminarPenalizacion = async (categoria: string) => {
    if (!perfil) return;
    const nuevaLista = perfil.categorias_penalizadas.filter(c => c !== categoria);
    try { 
      await api.put("/usuarios/penalizaciones", { email, categorias: nuevaLista }); 
      cargarPerfil(); 
    } catch (err) {}
  };

  const quitarNoticiaGuardada = async (titulo: string) => {
    if (!perfil) return;
    try {
      await api.post("/usuarios/quitar_noticia", { email, titulo });
      setPerfil(prev => prev ? {
        ...prev,
        noticias_guardadas: prev.noticias_guardadas.filter(n => n.titulo !== titulo)
      } : null);
    } catch (err) {
      console.error("Error al quitar la noticia", err);
    }
  };

  if (!perfil) return <SkeletonNoticia />;

  return (
    <div className="space-y-10 pb-20 max-w-4xl mx-auto">
      <header className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-900/40 to-indigo-900/20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 mt-12">
          <div className="relative group">
            <div className={`w-32 h-32 rounded-full border-4 border-slate-900 overflow-hidden bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center shadow-xl ${editando ? 'cursor-pointer' : ''}`} onClick={() => editando && fileInputRef.current?.click()}>
              {(editando ? avatarBase64 : perfil.avatar) ? (
                <img src={editando ? avatarBase64 : perfil.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Icono name="user" className="w-12 h-12 text-slate-500" />
              )}
            </div>
            {editando && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border-4 border-transparent">
                <Icono name="camera" className="w-8 h-8 text-white" />
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
          <div className="flex-1 text-center md:text-left">
            {editando ? (
              <div className="space-y-2 mb-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider ml-1">Nombre Público</label>
                <input 
                  type="text" 
                  value={nombreForm} 
                  onChange={(e) => setNombreForm(e.target.value)}
                  className="bg-slate-950 border border-blue-500/50 rounded-xl px-4 py-2.5 text-white w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <h2 className="text-4xl font-serif font-black text-white mb-1">{perfil.nombre || "Usuario Nova"}</h2>
            )}
            <p className="text-slate-400 text-sm font-medium flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {perfil.email}
            </p>
          </div>
          <div className="flex gap-3">
            {editando ? (
              <>
                <button onClick={() => { setEditando(false); setNombreForm(perfil.nombre); setAvatarBase64(perfil.avatar || ""); }} className="px-5 py-2.5 rounded-full text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors">
                  Cancelar
                </button>
                <button onClick={guardarEdicion} className="px-5 py-2.5 rounded-full text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
                  <Icono name="save" className="w-4 h-4" /> Guardar
                </button>
              </>
            ) : (
              <button onClick={() => setEditando(true)} className="px-5 py-2.5 rounded-full text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-2 border border-slate-700">
                <Icono name="edit" className="w-4 h-4" /> Editar Perfil
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-xl font-bold text-white">Lo que te gusta</h3>
          <form onSubmit={agregarInteresLibre} className="flex gap-2">
            <input type="text" value={nuevoInteres} onChange={(e) => setNuevoInteres(e.target.value)} placeholder="Ej: Exploración Espacial" className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 w-full md:w-auto" />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors">Añadir</button>
          </form>
        </div>
        <div className="flex flex-wrap gap-2">
          {perfil.intereses_explicitos?.length === 0 ? (
            <p className="text-slate-500 text-sm">Aún no hay intereses. Añade uno arriba.</p>
          ) : (
            perfil.intereses_explicitos?.map(tema => (
              <span key={tema} className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2 group">
                {tema}
                <button onClick={() => eliminarInteres(tema)} className="text-blue-500/50 hover:text-red-400 transition-colors" title="Eliminar">×</button>
              </span>
            ))
          )}
        </div>
      </section>

      <section className="bg-slate-900/30 border border-red-900/30 p-6 md:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Lo que estás evitando</h3>
            <p className="text-slate-500 text-sm max-w-sm">No se mostrará cualquier noticia de esta categoría.</p>
          </div>
          <form onSubmit={agregarPenalizacionLibre} className="flex gap-2">
            <input type="text" value={nuevaPenalizacion} onChange={(e) => setNuevaPenalizacion(e.target.value)} placeholder="Ej: Boxeo, Política..." className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 w-full md:w-auto" />
            <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm transition-colors">Bloquear</button>
          </form>
        </div>
        <div className="flex flex-wrap gap-2">
          {perfil.categorias_penalizadas?.length === 0 ? (
            <p className="text-slate-600 text-sm italic">No tienes ningún tema bloqueado.</p>
          ) : (
            perfil.categorias_penalizadas?.map(tema => (
              <span key={tema} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-sm font-semibold flex items-center gap-2 group">
                {tema}
                <button onClick={() => eliminarPenalizacion(tema)} className="text-red-500/50 hover:text-emerald-400 transition-colors" title="Volver a ver noticias">×</button>
              </span>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">Guardadas para luego</h3>
        {perfil.noticias_guardadas?.length === 0 ? (
          <div className="bg-slate-900/50 border border-dashed border-slate-700 p-8 rounded-3xl text-center text-slate-500">
            Tu estantería está vacía. Haz clic en "Guardar" en cualquier noticia del Feed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {perfil.noticias_guardadas?.map((noticia, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:border-blue-500/50 transition-all group flex flex-col justify-between">
                <a href={noticia.url} target="_blank" rel="noopener noreferrer" className="block flex-grow mb-4">
                  <span className="text-blue-500 bg-blue-500/10 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">{noticia.categoria}</span>
                  <h4 className="text-xl font-serif font-bold text-slate-200 mt-3 mb-2 group-hover:text-blue-400 line-clamp-2">{noticia.titulo}</h4>
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                     <Icono name="time" className="w-3.5 h-3.5" /> {Math.ceil(noticia.texto_completo.split(/\s+/).length / 200)} min lectura
                  </p>
                </a>
                <div className="border-t border-slate-800/50 pt-4 flex justify-end">
                  <button 
                    onClick={() => quitarNoticiaGuardada(noticia.titulo)}
                    className="text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/20 transition-colors whitespace-nowrap"
                  >
                    <Icono name="cross" className="w-4 h-4 text-red" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}