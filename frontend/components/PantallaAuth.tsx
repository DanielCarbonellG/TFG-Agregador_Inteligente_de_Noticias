import { useState } from "react";
import { api } from "../lib/api";

const TEMAS_DISPONIBLES = [
  "Inteligencia Artificial", "Desarrollo Software", "Ciberseguridad", "Cloud Computing",
  "Big Data", "Realidad Virtual", "Robótica", "Hardware", "Economía", "Criptomonedas",
  "Startups", "Mercados Financieros", "Marketing", "Medio Ambiente", "Biotecnología",
  "Exploración Espacial", "Medicina", "Política", "Energías Renovables", "Educación"
];

export default function PantallaAuth({ onLoginExitoso }: { onLoginExitoso: (email: string) => void }) {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [intereses, setIntereses] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const toggleInteres = (tema: string) => {
    setIntereses(intereses.includes(tema) ? intereses.filter(i => i !== tema) : [...intereses, tema]);
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">News<span className="text-blue-500">AI</span></h1>
          <p className="text-slate-400 text-sm font-medium border border-slate-800 bg-slate-950/50 py-1 px-3 rounded-full inline-block mt-2">
            🔒 Acceso Seguro JWT
          </p>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          {modo === "registro" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
              <input required type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 tracking-widest" />
          </div>
          {modo === "registro" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3 mt-2">Tus intereses</label>
              <div className="flex flex-wrap gap-2">
                {TEMAS_DISPONIBLES.map(tema => (
                  <button key={tema} type="button" onClick={() => toggleInteres(tema)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${intereses.includes(tema) ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-slate-800 border-slate-700 text-slate-400"}`}>
                    {tema}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button type="submit" disabled={cargando} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 mt-4">
            {cargando ? "Procesando..." : (modo === "login" ? "Entrar al Feed" : "Crear Cuenta Segura")}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-500">
          <button type="button" onClick={() => setModo(modo === "login" ? "registro" : "login")} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
            {modo === "login" ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}