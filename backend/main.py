from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import jwt
import datetime

import gestor_usuarios
import recomendador
import resumidor

SECRET_KEY = "mi_clave_secreta_tfg_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

app = FastAPI(
    title="API - Agregador Inteligente de Noticias",
    description="Backend para el TFG de Daniel Carbonell",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegistroUsuario(BaseModel):
    nombre: str
    email: str
    password: str
    intereses: List[str]

class LecturaNoticia(BaseModel):
    email: str
    titulo: str

class PeticionResumen(BaseModel):
    email: str
    texto_noticia: str

class LoginUsuario(BaseModel):
    email: str
    password: str

class PeticionGuardar(BaseModel):
    email: str
    noticia: dict

class PeticionFeedback(BaseModel):
    email: str
    categoria: str
    tipo: str
    
class ActualizarIntereses(BaseModel):
    email: str
    intereses: List[str]

class ActualizarPenalizaciones(BaseModel):
    email: str
    categorias: List[str]

class PeticionQuitarNoticia(BaseModel):
    email: str
    titulo: str

class ActualizarPerfil(BaseModel):
    email: str
    nombre: str
    avatar: str   

@app.get("/")
def estado_servidor():
    return {"mensaje": "Servidor FastAPI funcionando correctamente", "estado": "OK"}

@app.get("/api/usuarios/perfil/{email}")
def obtener_perfil(email: str):
    if email == "invitado@nova.com":
        return {
            "nombre": "Modo Invitado",
            "email": "invitado@nova.com",
            "avatar": "",
            "intereses_explicitos": [],
            "categorias_penalizadas": [],
            "historial_lectura": [],
            "noticias_guardadas": []
        }
    try:
        perfil = gestor_usuarios.obtener_perfil_usuario(email)
        if not perfil:
            raise HTTPException(status_code=404, detail=f"Usuario {email} no encontrado.")
        perfil["_id"] = str(perfil["_id"])
        if "noticias_guardadas" in perfil:
             for noti in perfil["noticias_guardadas"]:
                 if "_id" in noti:
                     noti["_id"] = str(noti["_id"])
        return perfil
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error al obtener perfil: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/usuarios/leer")
def registrar_clic_noticia(lectura: LecturaNoticia):
    try:
        gestor_usuarios.registrar_lectura(lectura.email, lectura.titulo)
        return {"mensaje": "Historial actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/noticias/feed/{email}")
def obtener_feed_personalizado(email: str, skip: int = 0): # <-- NUEVO: skip
    usuario = gestor_usuarios.obtener_perfil_usuario(email)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    try:
        noticias = recomendador.recomendar_noticias(usuario, cantidad=10, saltar=skip)
        return {"noticias": noticias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en recomendador: {str(e)}")
    
@app.post("/api/noticias/resumir")
def resumir_noticia_ia(peticion: PeticionResumen):
    usuario = gestor_usuarios.obtener_perfil_usuario(peticion.email)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    perfil_texto = recomendador.construir_perfil_textual(usuario)
    try:
        resumen_ia = resumidor.generar_resumen_personalizado(peticion.texto_noticia, perfil_texto)
        return {"resumen": resumen_ia}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en Ollama/Llama3: {str(e)}")

@app.put("/api/usuarios/intereses")
def modificar_intereses(datos: ActualizarIntereses):
    try:
        gestor_usuarios.actualizar_intereses(datos.email, datos.intereses)
        return {"mensaje": "Intereses actualizados correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/usuarios/registro")
def registrar_usuario(usuario: RegistroUsuario):
    try:
        exito = gestor_usuarios.registrar_usuario(
            nombre=usuario.nombre,
            email=usuario.email,
            password=usuario.password,
            intereses=usuario.intereses
        )
        if not exito:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        return {"mensaje": "Usuario registrado con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {str(e)}")

@app.post("/api/usuarios/login")
def iniciar_sesion(credenciales: LoginUsuario):
    usuario_db = gestor_usuarios.obtener_perfil_usuario(credenciales.email)
    if not usuario_db:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    password_valida = gestor_usuarios.verificar_password(credenciales.password, usuario_db.get("password_hash", ""))
    if not password_valida:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    datos_token = {
        "sub": credenciales.email,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    }
    token = jwt.encode(datos_token, SECRET_KEY, algorithm=ALGORITHM)
    return {
        "access_token": token,
        "token_type": "bearer",
        "email": credenciales.email
    }

@app.get("/api/noticias/ultimahora")
def obtener_ultima_hora(rapida: bool = False, skip: int = 0): # <-- NUEVO: skip
    try:
        noticias = recomendador.obtener_ultima_hora_diversificada(cantidad=10, rapida=rapida, saltar=skip)
        return {"noticias": noticias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.post("/api/usuarios/guardar_noticia")
def guardar_bookmark(peticion: PeticionGuardar):
    try:
        gestor_usuarios.guardar_noticia_bookmark(peticion.email, peticion.noticia)
        return {"mensaje": "Noticia guardada en favoritos"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/usuarios/feedback")
def registrar_feedback_usuario(peticion: PeticionFeedback):
    try:
        if peticion.tipo == "dislike":
            gestor_usuarios.penalizar_categoria(peticion.email, peticion.categoria)
            return {"mensaje": f"Categoría {peticion.categoria} penalizada."}
        elif peticion.tipo == "like":
            gestor_usuarios.añadir_interes(peticion.email, peticion.categoria)
            return {"mensaje": f"Intereses actualizados con {peticion.categoria}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.put("/api/usuarios/penalizaciones")
def modificar_penalizaciones(datos: ActualizarPenalizaciones):
    try:
        gestor_usuarios.actualizar_penalizaciones(datos.email, datos.categorias)
        return {"mensaje": "Penalizaciones actualizadas"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/usuarios/actualizar_perfil")
def modificar_datos_perfil(datos: ActualizarPerfil):
    try:
        gestor_usuarios.actualizar_perfil_basico(datos.email, datos.nombre, datos.avatar)
        return {"mensaje": "Perfil actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/usuarios/quitar_noticia")
def quitar_noticia_guardada(peticion: PeticionQuitarNoticia):
    try:
        gestor_usuarios.eliminar_noticia_guardada(peticion.email, peticion.titulo)
        return {"mensaje": "Noticia eliminada de guardados correctamente."}
    except Exception as e:
        print(f"Error al quitar noticia: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/usuarios/quitar_feedback")
def quitar_feedback_usuario(peticion: PeticionFeedback):
    try:
        if peticion.tipo == "like":
            gestor_usuarios.eliminar_interes(peticion.email, peticion.categoria)
        elif peticion.tipo == "dislike":
            gestor_usuarios.eliminar_penalizacion(peticion.email, peticion.categoria)
        return {"mensaje": f"Feedback de {peticion.categoria} eliminado correctamente."}
    except Exception as e:
        print(f"Error al quitar feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))
