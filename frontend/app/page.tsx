"use client";

import { useState } from "react";
import PantallaAuth from "../components/PantallaAuth";
import PortalNoticias from "../components/PortalNoticias";

export default function AppPrincipal() {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState<string>("");
  const [esInvitado, setEsInvitado] = useState(false);
  const mostrarLogin = !usuarioAutenticado && !esInvitado;

  return (
    <main className="relative min-h-screen bg-black overflow-hidden">
      <div className={`transition-all duration-700 ${mostrarLogin ? "blur-xl scale-110 opacity-50 pointer-events-none" : "blur-0 scale-100 opacity-100"}`}>
        <PortalNoticias 
          email={usuarioAutenticado || "invitado@nova.com"} 
          onCerrarSesion={() => {
            setUsuarioAutenticado("");
            setEsInvitado(false);
          }}
          esInvitado={esInvitado}
        />
      </div>
      {mostrarLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20">
          <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
            <PantallaAuth 
              onLoginExitoso={setUsuarioAutenticado} 
              onEntrarComoInvitado={() => setEsInvitado(true)}
            />
          </div>
        </div>
      )}
    </main>
  );
}