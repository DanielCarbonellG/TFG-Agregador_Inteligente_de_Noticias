import { useEffect, useState } from "react";
import { api } from "../lib/api";
import SkeletonNoticia from "./ui/SkeletonNoticia";
import Icono from "./Icono";

export interface Noticia {
  titulo: string;
  categoria: string;
  url: string;
  fecha: string;
  texto_completo: string;
  distancia_matematica: number;
  imagen?: string;
}

export default function FeedNoticias({ email, modo, mostrarToast }: { email: string, modo: "feed" | "ultimahora", mostrarToast: (m: string) => void }) {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrandoTemporales, setMostrandoTemporales] = useState(false);
  const [resumiendo, setResumiendo] = useState<Record<string, boolean>>({});
  const [resumenesIA, setResumenesIA] = useState<Record<string, string>>({});
  
  const [guardadas, setGuardadas] = useState<Record<string, boolean>>({});
  const [interesesUsuario, setInteresesUsuario] = useState<string[]>([]);
  const [categoriasPenalizadas, setCategoriasPenalizadas] = useState<string[]>([]);
  
  const [pagina, setPagina] = useState(0);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [hayMas, setHayMas] = useState(true);

  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");
  const [inputCategoria, setInputCategoria] = useState<string>("");

  const esInvitadoReal = !email || email === "invitado@nova.com";

  useEffect(() => {
    if (!esInvitadoReal) {
      api.get(`/usuarios/perfil/${email}`).then(res => {
        if (res.data.intereses_explicitos) {
          setInteresesUsuario(res.data.intereses_explicitos);
        }
        if (res.data.categorias_penalizadas) {
          setCategoriasPenalizadas(res.data.categorias_penalizadas);
        }
        if (res.data.noticias_guardadas) {
          const mapaGuardadas: Record<string, boolean> = {};
          res.data.noticias_guardadas.forEach((n: any) => {
            mapaGuardadas[n.titulo] = true;
          });
          setGuardadas(mapaGuardadas);
        }
      }).catch(console.error);
    }
  }, [email, esInvitadoReal]);

  const cargarNoticias = () => {
    setCargando(true);
    setNoticias([]);
    setPagina(0);
    setHayMas(true);
    setMostrandoTemporales(false);
    let feedPersonalizadoCompletado = false; 
    if (modo === "ultimahora") {
      api.get("/noticias/ultimahora?rapida=true&skip=0")
        .then(res => setNoticias(res.data.noticias))
        .catch(() => mostrarToast("Error cargando noticias"))
        .finally(() => setCargando(false));
    } else {
        const urlPersonalizada = categoriaFiltro 
          ? `/noticias/feed/${email}?skip=0&categoria=${encodeURIComponent(categoriaFiltro)}`
          : `/noticias/feed/${email}?skip=0`;
          
        api.get(urlPersonalizada)
        .then(res => {
          feedPersonalizadoCompletado = true;
          setNoticias(res.data.noticias);
          setMostrandoTemporales(false); 
        })
        .catch(() => mostrarToast("Error cargando tu feed personalizado"))
        .finally(() => setCargando(false));
        
      api.get("/noticias/ultimahora?rapida=true&skip=0")
        .then(res => {
          if (!feedPersonalizadoCompletado) {
            setNoticias(res.data.noticias);
            setMostrandoTemporales(true);
            setCargando(false); 
          }
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    cargarNoticias();
  }, [email, modo, categoriaFiltro]);

  const cargarMasNoticias = async () => {
    setCargandoMas(true);
    const nuevaPagina = pagina + 1;
    const skipAmount = nuevaPagina * 10;
    try {
      let url = modo === "ultimahora" 
        ? `/noticias/ultimahora?rapida=false&skip=${skipAmount}` 
        : `/noticias/feed/${email}?skip=${skipAmount}`;
        
      if (modo === "feed" && categoriaFiltro) {
        url += `&categoria=${encodeURIComponent(categoriaFiltro)}`;
      }
      const res = await api.get(url);
      const nuevasNoticias = res.data.noticias;
      if (nuevasNoticias.length < 10) {
        setHayMas(false); 
      }
      setNoticias(prev => [...prev, ...nuevasNoticias]);
      setPagina(nuevaPagina);
    } catch (error) {
      mostrarToast("Error al cargar más noticias");
    } finally {
      setCargandoMas(false);
    }
  };

  const generarResumen = async (noticia: Noticia) => {
    if (esInvitadoReal) { mostrarToast("Inicia sesión para usar IA"); return; }
    setResumiendo(prev => ({ ...prev, [noticia.titulo]: true }));
    try {
      const res = await api.post("/noticias/resumir", { email, texto_noticia: noticia.texto_completo });
      setResumenesIA(prev => ({ ...prev, [noticia.titulo]: res.data.resumen }));
      mostrarToast("Resumen generado con éxito");
    } catch {
      setResumenesIA(prev => ({ ...prev, [noticia.titulo]: "No se ha podido procesar el resumen en este momento debido a un error del motor de IA." }));
    } finally {
      setResumiendo(prev => ({ ...prev, [noticia.titulo]: false }));
    }
  };

  const registrarClic = async (titulo: string) => {
    if (esInvitadoReal) return;
    try { await api.post("/usuarios/leer", { email, titulo }); } catch (e) { console.error(e); }
  };

  const guardarNoticia = async (noticia: Noticia) => {
    if (esInvitadoReal) { mostrarToast("Inicia sesión para guardar"); return; }
    const estaGuardada = guardadas[noticia.titulo];
    
    setGuardadas(prev => ({ ...prev, [noticia.titulo]: !estaGuardada }));
    
    try {
      if (estaGuardada) {
        await api.post("/usuarios/quitar_noticia", { email, titulo: noticia.titulo });
        mostrarToast("Noticia eliminada de guardados");
      } else {
        await api.post("/usuarios/guardar_noticia", { email, noticia });
        mostrarToast("Noticia guardada en tu perfil");
      }
    } catch {
      setGuardadas(prev => ({ ...prev, [noticia.titulo]: estaGuardada }));
      mostrarToast("Error modificando guardados");
    }
  };

  const enviarFeedback = async (categoria: string, tipo: "like" | "dislike") => {
    if (esInvitadoReal) { mostrarToast("Inicia sesión para votar"); return; }
    
    const esLikeActual = interesesUsuario.includes(categoria);
    const esDislikeActual = categoriasPenalizadas.includes(categoria);
    
    let retirar = false;
    if (tipo === "like" && esLikeActual) retirar = true;
    if (tipo === "dislike" && esDislikeActual) retirar = true;

    if (tipo === "like") {
      if (retirar) {
        setInteresesUsuario(prev => prev.filter(c => c !== categoria));
      } else {
        setInteresesUsuario(prev => [...prev, categoria]);
        setCategoriasPenalizadas(prev => prev.filter(c => c !== categoria)); 
      }
    } else {
      if (retirar) {
        setCategoriasPenalizadas(prev => prev.filter(c => c !== categoria));
      } else {
        setCategoriasPenalizadas(prev => [...prev, categoria]);
        setInteresesUsuario(prev => prev.filter(c => c !== categoria));
      }
    }

    try {
      if (retirar) {
        await api.post("/usuarios/quitar_feedback", { email, categoria, tipo });
        mostrarToast("Voto retirado");
      } else {
        await api.post("/usuarios/feedback", { email, categoria, tipo });
        mostrarToast(tipo === "like" ? "Añadido a tus intereses" : "Verás menos de esto");
      }
    } catch {
      mostrarToast("Error enviando feedback");
    }
  };

  const calcularTiempoLectura = (texto: string) => {
    const palabras = texto.trim().split(/\s+/).length;
    return Math.ceil(palabras / 200) === 0 ? 1 : Math.ceil(palabras / 200);
  };
  
  const noticiaPrincipal = noticias.length > 0 ? noticias[0] : null;
  const noticiasSidebar = noticias.length > 1 ? noticias.slice(1, 3) : []; 
  const restoNoticias = noticias.length > 3 ? noticias.slice(3) : []; 

  const renderBotonesInteraccion = (noticia: Noticia) => {
    const isLiked = interesesUsuario.includes(noticia.categoria);
    const isDisliked = categoriasPenalizadas.includes(noticia.categoria);
    const isSaved = guardadas[noticia.titulo];

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 mt-auto pt-4 border-t border-slate-800/50">
        <div className="flex gap-2">
          <button onClick={() => generarResumen(noticia)} disabled={resumiendo[noticia.titulo]} className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white disabled:from-slate-800 text-xs font-bold rounded-full transition-all">
            {resumiendo[noticia.titulo] ? <Icono name="loading" className="w-5 h-5 animate-spin" /> : <Icono name="resume" className="w-5 h-5" />}
          </button>
          <button onClick={() => guardarNoticia(noticia)} className={`px-3 py-2 text-xs font-bold rounded-full transition-colors border ${isSaved ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/50'}`}>
            <Icono name="save" className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-1 bg-slate-900/80 rounded-full p-1 border border-slate-800">
          <button onClick={() => enviarFeedback(noticia.categoria, "like")} className={`p-1.5 rounded-full transition-colors border ${isLiked ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'border-transparent hover:bg-slate-800 text-slate-500 hover:text-emerald-400'}`}>
            <Icono name="like" className="w-5 h-5" />
          </button>
          <button onClick={() => enviarFeedback(noticia.categoria, "dislike")} className={`p-1.5 rounded-full transition-colors border ${isDisliked ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'border-transparent hover:bg-slate-800 text-slate-500 hover:text-red-400'}`}>
            <Icono name="dislike" className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="mb-10 text-center md:text-left">
        <h2 className="text-4xl md:text-5xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 tracking-tight">
          {modo === "feed" ? "Tu Selección Inteligente" : "Lo Último (Global)"}
        </h2>
        <p className="text-slate-400 text-lg font-light">
          {modo === "feed" ? "La selección de noticias según tu comportamiento y preferencias." : "Las noticias más recientes ingresadas al ecosistema NovaNews."}
        </p>
      </header>
      
      {modo === "feed" && (
        <div className="flex flex-wrap items-center gap-3 mb-8 pb-4 border-b border-slate-800/50">
          <span className="text-slate-500 text-sm font-medium mr-2">Filtrar selección:</span>
          
          <button 
            onClick={() => { setCategoriaFiltro(""); setInputCategoria(""); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${categoriaFiltro === "" ? "bg-blue-600 text-white border-blue-500" : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700"}`}
          >
            Todas
          </button>
          
          {interesesUsuario.map((interes, idx) => (
            <button 
              key={idx}
              onClick={() => { setCategoriaFiltro(interes); setInputCategoria(""); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${categoriaFiltro === interes ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200"}`}
            >
              {interes.toUpperCase()}
            </button>
          ))}

          <div className="flex items-center gap-3 ml-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (inputCategoria.trim() !== "") setCategoriaFiltro(inputCategoria.trim());
              }}
              className="relative flex items-center"
            >
              <div className="absolute left-3 text-slate-500 pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input 
                type="text"
                value={inputCategoria}
                onChange={(e) => setInputCategoria(e.target.value)}
                placeholder="Escribe otra temática..."
                className={`pl-9 pr-4 py-1.5 w-42 rounded-full text-xs transition-all border outline-none ${
                  categoriaFiltro === inputCategoria && inputCategoria !== "" 
                  ? "bg-blue-900/30 border-blue-500 text-white" 
                  : "bg-slate-900 border-slate-700 text-slate-300 focus:border-slate-500"
                }`}
              />
            </form>

            <button
              onClick={() => {
                setPagina(0); 
                cargarNoticias(); 
                mostrarToast("Actualizando recomendaciones con tu perfil reciente...");
              }}
              disabled={cargando}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white rounded-full text-xs font-bold transition-all shadow-md disabled:opacity-50"
              title="Recargar recomendaciones con la IA"
            >
              <Icono name="reload" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {mostrandoTemporales && (
        <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/20 backdrop-blur-md border border-blue-500/30 p-5 rounded-2xl flex items-center gap-5 shadow-[0_0_30px_rgba(59,130,246,0.15)] animate-pulse mb-8">
          <div className="text-3xl animate-spin"><Icono name="loading" className="w-5 h-5" /></div>
          <div>
            <h4 className="text-blue-400 font-bold text-base">Buscando las mejores noticias para ti...</h4>
            <p className="text-slate-300 text-sm mt-1 font-light">Mostrando las noticias de última hora mientras elegimos la mejor opción.</p>
          </div>
        </div>
      )}

      {cargando && (
        <div className="space-y-8 mt-8">
          <SkeletonNoticia />
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            <SkeletonNoticia />
            <SkeletonNoticia />
          </div>
        </div>
      )}

      {!cargando && noticias.length === 0 && (
        <div className="text-center bg-slate-900/30 border border-dashed border-slate-700 p-12 rounded-2xl text-slate-500">
          No hay noticias disponibles en este momento.
        </div>
      )}
      
      {!cargando && noticias.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {noticiaPrincipal && (
            <div className="lg:col-span-8">
              <article className="group h-full flex flex-col bg-slate-900/50 backdrop-blur-md border border-slate-700/60 p-6 md:p-8 rounded-3xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500">
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold tracking-widest text-slate-500 mb-5">
                  <span className="text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full uppercase border border-blue-500/30 shadow-inner">{noticiaPrincipal.categoria}</span>
                  <span className="flex items-center gap-1 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50"><Icono name="time" className="w-5 h-5" /> {calcularTiempoLectura(noticiaPrincipal.texto_completo)} min</span>
                </div>
                {noticiaPrincipal.imagen && noticiaPrincipal.imagen.trim() !== "" && (
                  <div className="w-full h-64 md:h-80 overflow-hidden rounded-2xl mb-6 border border-slate-800/50 relative">
                    <img src={noticiaPrincipal.imagen} alt={noticiaPrincipal.titulo} onError={(e) => { const parent = (e.target as HTMLImageElement).parentElement; if (parent) parent.style.display = 'none'; }} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  </div>
                )}
                <a href={noticiaPrincipal.url} target="_blank" rel="noopener noreferrer" onClick={() => registrarClic(noticiaPrincipal.titulo)}>
                  <h3 className="font-serif font-black text-slate-100 leading-tight group-hover:text-blue-400 transition-colors mb-4 text-3xl md:text-5xl">{noticiaPrincipal.titulo}</h3>
                </a>
                <p className="text-slate-300 font-light leading-relaxed text-lg line-clamp-4 mb-6">{noticiaPrincipal.texto_completo}</p>

                {resumenesIA[noticiaPrincipal.titulo] && (
                  <div className="mb-6 p-5 bg-gradient-to-br from-indigo-900/40 to-blue-900/10 border border-indigo-500/40 rounded-2xl shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <p className="text-blue-400 font-black mb-2 text-xs uppercase tracking-widest flex items-center gap-2"><Icono name="resume" className="w-5 h-5" /></p>
                    <p className="text-slate-200 text-base font-sans leading-relaxed">{resumenesIA[noticiaPrincipal.titulo]}</p>
                  </div>
                )}
                {renderBotonesInteraccion(noticiaPrincipal)}
              </article>
            </div>
          )}

          {noticiasSidebar.length > 0 && (
            <div className="lg:col-span-4 flex flex-col gap-8 h-full">
              {noticiasSidebar.map((noticia, idx) => (
                <article key={`sidebar-${idx}`} className="flex-1 flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 p-5 rounded-3xl hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-widest text-slate-500 mb-3">
                    <span className="text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full uppercase border border-blue-500/20">{noticia.categoria}</span>
                    <span className="bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50"><Icono name="time" className="w-5 h-5" /> {calcularTiempoLectura(noticia.texto_completo)} m</span>
                  </div>
                  {noticia.imagen && noticia.imagen.trim() !== "" && (
                    <div className="w-full h-32 md:h-40 overflow-hidden rounded-xl mb-4 border border-slate-800/50 relative group-hover:border-blue-500/30 transition-colors">
                      <img src={noticia.imagen} alt={noticia.titulo} onError={(e) => { const parent = (e.target as HTMLImageElement).parentElement; if (parent) parent.style.display = 'none'; }} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    </div>
                  )}
                  <a href={noticia.url} target="_blank" rel="noopener noreferrer" onClick={() => registrarClic(noticia.titulo)}>
                    <h3 className="font-serif font-bold text-slate-100 leading-snug group-hover:text-blue-400 transition-colors mb-2 text-xl">{noticia.titulo}</h3>
                  </a>
                  <p className="text-slate-400 font-light leading-relaxed text-sm line-clamp-3 mb-4">{noticia.texto_completo}</p>

                  {resumenesIA[noticia.titulo] && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-indigo-900/40 to-blue-900/10 border border-indigo-500/40 rounded-2xl shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <p className="text-blue-400 font-black mb-1 text-[10px] uppercase tracking-widest flex items-center gap-2"><Icono name="resume" className="w-5 h-5" /></p>
                      <p className="text-slate-200 text-sm font-sans leading-relaxed">{resumenesIA[noticia.titulo]}</p>
                    </div>
                  )}
                  {renderBotonesInteraccion(noticia)}
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {!cargando && restoNoticias.length > 0 && (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {restoNoticias.map((noticia, idx) => (
            <article key={`masonry-${idx}-${pagina}`} className="break-inside-avoid group flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 p-6 md:p-7 rounded-3xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs font-bold tracking-widest text-slate-500 mb-4">
                <span className="text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full uppercase border border-blue-500/20">{noticia.categoria}</span>
                <span className="bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700/50"><Icono name="time" className="w-5 h-5" /> {calcularTiempoLectura(noticia.texto_completo)} m</span>
              </div>
              {noticia.imagen && noticia.imagen.trim() !== "" && (
                <div className="w-full overflow-hidden rounded-2xl mb-4 border border-slate-800/50 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 pointer-events-none"></div>
                  <img src={noticia.imagen} alt={noticia.titulo} onError={(e) => { const parent = (e.target as HTMLImageElement).parentElement; if (parent) parent.style.display = 'none'; }} className="w-full h-auto max-h-60 object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                </div>
              )}
              <a href={noticia.url} target="_blank" rel="noopener noreferrer" onClick={() => registrarClic(noticia.titulo)}>
                <h3 className="font-serif font-bold text-slate-100 leading-snug group-hover:text-blue-400 mb-3 text-xl md:text-2xl">{noticia.titulo}</h3>
              </a>
              <p className="text-slate-400 font-light leading-relaxed text-sm md:text-base line-clamp-3 mb-4">{noticia.texto_completo}</p>
              {resumenesIA[noticia.titulo] && (
                <div className="mb-4 p-4 bg-gradient-to-br from-indigo-900/40 to-blue-900/10 border border-indigo-500/40 rounded-2xl shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <p className="text-blue-400 font-black mb-1 text-[10px] uppercase tracking-widest flex items-center gap-2"><Icono name="resume" className="w-5 h-5" /></p>
                  <p className="text-slate-200 text-sm font-sans leading-relaxed">{resumenesIA[noticia.titulo]}</p>
                </div>
              )}
              {renderBotonesInteraccion(noticia)}
            </article>
          ))}
        </div>
      )}

      {!cargando && hayMas && noticias.length > 0 && (
        <div className="flex justify-center mt-16 border-t border-slate-800/50 pt-10">
          <button onClick={cargarMasNoticias} disabled={cargandoMas} className="group relative px-8 py-4 bg-slate-900 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white rounded-full font-bold transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-3 disabled:opacity-50">
            {cargandoMas ? <><span className="animate-spin text-xl"><Icono name="loading" className="w-5 h-5" /></span> Cargando...</> : <>Cargar más noticias</>}
          </button>
        </div>
      )}
    </div>
  );
}