"use client";

import { useState } from "react";
import PantallaAuth from "../components/PantallaAuth";
import PortalNoticias from "../components/PortalNoticias";

export default function AppPrincipal() {
  const [usuarioAutenticado, setUsuarioAutenticado] = useState<string>("");

  if (!usuarioAutenticado) {
    return <PantallaAuth onLoginExitoso={setUsuarioAutenticado} />;
  }
  
  return <PortalNoticias email={usuarioAutenticado} onCerrarSesion={() => setUsuarioAutenticado("")} />;
}