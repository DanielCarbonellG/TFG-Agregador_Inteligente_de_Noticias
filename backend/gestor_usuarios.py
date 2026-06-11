from pymongo import MongoClient
from pymongo.server_api import ServerApi
import datetime
import certifi
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

URI_MONGODB = os.getenv("URI_MONGODB")

print("Conectando a MongoDB Atlas en la nube...")

cliente = MongoClient(URI_MONGODB, server_api=ServerApi('1'), tlsCAFile=certifi.where())

db = cliente["tfg_agregador_noticias"]
coleccion_usuarios = db["usuarios"]

def registrar_usuario(nombre, email, intereses):
    si_existe = coleccion_usuarios.find_one({"email": email})
    if si_existe:
        print(f"El usuario con email {email} ya está registrado.")
        return si_existe["_id"]

    nuevo_usuario = {
        "nombre": nombre,
        "email": email,
        "intereses_explicitos": intereses,
        "historial_lectura": [],
        "fecha_registro": datetime.datetime.now().isoformat()
    }
    
    resultado = coleccion_usuarios.insert_one(nuevo_usuario)
    print(f"Usuario '{nombre}' registrado con éxito en la nube.")
    return resultado.inserted_id

def obtener_perfil_usuario(email):
    usuario = coleccion_usuarios.find_one({"email": email})
    if usuario:
        return usuario
    print(f"Usuario {email} no encontrado.")
    return None

def registrar_lectura(email, titulo_noticia):
    usuario = coleccion_usuarios.find_one({"email": email})
    if not usuario:
        print("Error: Usuario no encontrado.")
        return

    if usuario["historial_lectura"] and usuario["historial_lectura"][-1] == titulo_noticia:
        return

    coleccion_usuarios.update_one(
        {"email": email},
        {
            "$push": {
                "historial_lectura": {
                    "$each": [titulo_noticia],
                    "$slice": -10
                }
            }
        }
    )
    print(f"Lectura registrada: '{titulo_noticia[:30]}...'")

def actualizar_intereses(email: str, nuevos_intereses: list):
    coleccion_usuarios.update_one(
        {"email": email},
        {"$set": {"intereses_explicitos": nuevos_intereses}} 
    )

def encriptar_password(password: str):
    return pwd_context.hash(password)

def verificar_password(password_plana: str, password_hash: str):
    return pwd_context.verify(password_plana, password_hash)

def registrar_usuario(nombre, email, password, intereses):
    si_existe = coleccion_usuarios.find_one({"email": email})
    if si_existe:
        print(f"El usuario con email {email} ya está registrado.")
        return False

    nuevo_usuario = {
        "nombre": nombre,
        "email": email,
        "password_hash": encriptar_password(password),
        "intereses_explicitos": intereses,
        "historial_lectura": [],
        "noticias_guardadas": [],
        "fecha_registro": datetime.datetime.now().isoformat()
    }
    
    resultado = coleccion_usuarios.insert_one(nuevo_usuario)
    print(f"Usuario '{nombre}' registrado con éxito.")
    return True

def guardar_noticia_bookmark(email: str, noticia: dict):
    coleccion_usuarios.update_one(
        {"email": email},
        {"$addToSet": {"noticias_guardadas": noticia}}
    )

def penalizar_categoria(email: str, categoria: str):
    coleccion_usuarios.update_one(
        {"email": email},
        {"$addToSet": {"categorias_penalizadas": categoria}}
    )

def añadir_interes(email: str, nuevo_interes: str):
    coleccion_usuarios.update_one(
        {"email": email},
        {"$addToSet": {"intereses_explicitos": nuevo_interes}} 
    )

def actualizar_penalizaciones(email: str, nuevas_penalizaciones: list):
    coleccion_usuarios.update_one(
        {"email": email},
        {"$set": {"categorias_penalizadas": nuevas_penalizaciones}} 
    )
    
def actualizar_perfil_basico(email: str, nombre: str, avatar: str):
    """Actualiza el nombre y la foto de perfil en MongoDB"""
    resultado = coleccion_usuarios.update_one(
        {"email": email},
        {"$set": {
            "nombre": nombre,
            "avatar": avatar
        }}
    )
    
    if resultado.matched_count == 0:
        raise Exception("Usuario no encontrado en la base de datos")
    
    return True


def eliminar_noticia_guardada(email: str, titulo: str):
    """Elimina una noticia del array de guardadas buscando por su título"""
    coleccion_usuarios.update_one(
        {"email": email},
        {"$pull": {"noticias_guardadas": {"titulo": titulo}}}
    )
    return True

def eliminar_interes(email: str, categoria: str):
    """Elimina una categoría del array de intereses explícitos"""
    coleccion_usuarios.update_one(
        {"email": email},
        {"$pull": {"intereses_explicitos": categoria}}
    )
    return True

def eliminar_penalizacion(email: str, categoria: str):
    """Elimina una categoría del array de categorías penalizadas"""
    coleccion_usuarios.update_one(
        {"email": email},
        {"$pull": {"categorias_penalizadas": categoria}}
    )
    return True