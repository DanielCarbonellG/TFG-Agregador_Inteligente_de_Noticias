from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import jwt
import datetime

import gestor_usuarios
import recomendador
import motor_ia

SECRET_KEY = "mi_clave_super_secreta_tfg_2026"
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

@app.get("/")
def estado_servidor():
    """Ruta de prueba para ver si el servidor está vivo."""
    return {"mensaje": "🚀 Servidor FastAPI funcionando correctamente", "estado": "OK"}

@app.get("/api/usuarios/perfil/{email}")
def obtener_perfil(email: str):
    """Devuelve los datos del usuario para mostrarlos en la web."""
    perfil = gestor_usuarios.obtener_perfil_usuario(email)
    if not perfil:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    perfil["_id"] = str(perfil["_id"])
    return perfil

@app.post("/api/usuarios/leer")
def registrar_clic_noticia(lectura: LecturaNoticia):
    """Añade una noticia al historial rotativo del usuario cuando hace clic en ella."""
    try:
        gestor_usuarios.registrar_lectura(lectura.email, lectura.titulo)
        return {"mensaje": "Historial actualizado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/noticias/feed/{email}")
def obtener_feed_personalizado(email: str):
    """Obtiene el perfil del usuario de MongoDB y le busca las 5 mejores noticias en ChromaDB."""
    usuario = gestor_usuarios.obtener_perfil_usuario(email)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    try:
        noticias = recomendador.recomendar_noticias(usuario, cantidad=5)
        if not noticias:
            return {"mensaje": "No hay noticias suficientes", "noticias": []}
        return {"noticias": noticias}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el recomendador: {str(e)}")

@app.post("/api/noticias/resumir")
def resumir_noticia_ia(peticion: PeticionResumen):
    """Coge el texto de una noticia, lee el perfil del usuario y genera un resumen con Llama 3."""
    usuario = gestor_usuarios.obtener_perfil_usuario(peticion.email)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    perfil_texto = recomendador.construir_perfil_textual(usuario)
    
    try:
        resumen_ia = motor_ia.generar_resumen_personalizado(peticion.texto_noticia, perfil_texto)
        return {"resumen": resumen_ia}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en Ollama/Llama3: {str(e)}")
    
class ActualizarIntereses(BaseModel):
    email: str
    intereses: List[str]

@app.put("/api/usuarios/intereses")
def modificar_intereses(datos: ActualizarIntereses):
    try:
        gestor_usuarios.actualizar_intereses(datos.email, datos.intereses)
        return {"mensaje": "Intereses actualizados correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/usuarios/registro")
def registrar_usuario(usuario: RegistroUsuario):
    """Guarda al usuario con su contraseña encriptada."""
    print(f"🕵️ Contraseña recibida: '{usuario.password}' (Longitud: {len(usuario.password)})")
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
    """Comprueba la contraseña y devuelve un Token JWT."""
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
def obtener_ultima_hora():
    """Devuelve las 10 últimas noticias de la base de datos sin aplicar IA (Global)."""
    try:
        base_datos = recomendador.Chroma(
            persist_directory="./base_vectorial", 
            embedding_function=recomendador.HuggingFaceEmbeddings(model_name="Qwen/Qwen3-Embedding-0.6B")
        )
        todos_los_datos = base_datos.get()
        
        lista_ultimas = []
        for i in range(min(10, len(todos_los_datos['ids']))):
            lista_ultimas.append({
                "titulo": todos_los_datos['metadatas'][i].get('titulo', 'Sin título'),
                "categoria": todos_los_datos['metadatas'][i].get('categoria', 'General'),
                "url": todos_los_datos['metadatas'][i].get('url', '#'),
                "fecha": todos_los_datos['metadatas'][i].get('fecha', 'Desconocida'),
                "texto_completo": todos_los_datos['documents'][i],
                "distancia_matematica": 0.0
            })
            
        return {"noticias": lista_ultimas[::-1]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/usuarios/guardar_noticia")
def guardar_bookmark(peticion: PeticionGuardar):
    """Guarda una noticia para leer más tarde."""
    try:
        gestor_usuarios.guardar_noticia_bookmark(peticion.email, peticion.noticia)
        return {"mensaje": "Noticia guardada en favoritos"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/usuarios/feedback")
def registrar_feedback_usuario(peticion: PeticionFeedback):
    """Procesa si a un usuario le gusta o no una categoría."""
    try:
        if peticion.tipo == "dislike":
            gestor_usuarios.penalizar_categoria(peticion.email, peticion.categoria)
            return {"mensaje": f"Categoría {peticion.categoria} penalizada."}
        elif peticion.tipo == "like":
            gestor_usuarios.actualizar_intereses(peticion.email, [peticion.categoria])
            return {"mensaje": f"Intereses actualizados con {peticion.categoria}."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))