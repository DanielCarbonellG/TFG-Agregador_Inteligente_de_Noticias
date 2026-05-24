import { useState } from "react";
import { api } from "../lib/api";
import Logo from "./Logo";

const TEMAS_DISPONIBLES = [
  "Inteligencia Artificial", "Desarrollo Software", "Ciberseguridad", "Cloud Computing",
  "Big Data", "Realidad Virtual", "Robótica", "Hardware", "Economía", "Criptomonedas",
  "Startups", "Mercados Financieros", "Marketing", "Medio Ambiente", "Biotecnología",
  "Exploración Espacial", "Medicina", "Política", "Energías Renovables", "Educación"
];

export default function PantallaAuth({ 
  onLoginExitoso, 
  onEntrarComoInvitado 
}: { 
  onLoginExitoso: (email: string) => void,
  onEntrarComoInvitado: () => void 
}) {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [intereses, setIntereses] = useState<string[]>([]);
  const [interesPersonalizado, setInteresPersonalizado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const toggleInteres = (tema: string) => {
    setIntereses(intereses.includes(tema) ? intereses.filter(i => i !== tema) : [...intereses, tema]);
  };

  const agregarInteresPersonalizado = () => {
    if (!interesPersonalizado.trim()) return;
    const temaFormateado = interesPersonalizado.trim().charAt(0).toUpperCase() + interesPersonalizado.trim().slice(1).toLowerCase();
    if (!intereses.includes(temaFormateado)) setIntereses([...intereses, temaFormateado]);
    setInteresPersonalizado("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setCargando(true);
    try {
      if (modo === "registro") {
        if (intereses.length === 0) throw new Error("Selecciona al menos un tema.");
        await api.post("/usuarios/registro", { nombre, email, password, intereses });
      }
      const res = await api.post("/usuarios/login", { email, password });
      localStorage.setItem("token_tfg", res.data.access_token);
      onLoginExitoso(email);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Error al conectar.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/60 p-8 md:p-10 rounded-[2.5rem] shadow-2xl">
      <div className="flex justify-center mb-10">
        <Logo className="h-12 md:h-14 w-auto" />
      </div>
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl text-sm mb-6 text-center animate-pulse">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        {modo === "registro" && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2">Nombre</label>
            <input required type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all" />
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2">Email</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="tu@email.com" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2">Contraseña</label>
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all tracking-widest" />
        </div>
        {modo === "registro" && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mt-4">¿Qué te interesa?</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 scrollbar-hide">
              {TEMAS_DISPONIBLES.map(tema => (
                <button key={tema} type="button" onClick={() => toggleInteres(tema)} className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${intereses.includes(tema) ? "bg-blue-500 border-blue-400 text-white" : "bg-slate-800/50 border-slate-700 text-slate-400"}`}>
                  {tema}
                </button>
              ))}
            </div>
          </div>
        )}
        <button type="submit" disabled={cargando} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 mt-6 active:scale-[0.98]">
          {cargando ? "CARGANDO..." : (modo === "login" ? "ENTRAR AHORA" : "CREAR MI CUENTA")}
        </button>
      </form>
      <div className="mt-8 space-y-4 text-center">
        <button type="button" onClick={() => setModo(modo === "login" ? "registro" : "login")} className="text-slate-400 hover:text-blue-400 text-sm font-medium transition-colors">
          {modo === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya eres usuario? Identifícate"}
        </button>
        <div className="pt-4 border-t border-slate-800/50">
          <button 
            onClick={onEntrarComoInvitado}
            type="button"
            className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-tighter underline underline-offset-4 decoration-slate-700 hover:decoration-blue-500 transition-all"
          >
            Seguir como invitado (Solo Última Hora)
          </button>
        </div>
      </div>
    </div>
  );
}