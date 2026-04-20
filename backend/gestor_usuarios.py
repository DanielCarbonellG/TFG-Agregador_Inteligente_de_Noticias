from pymongo import MongoClient
from pymongo.server_api import ServerApi
import datetime
import certifi
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

URI_MONGODB = "mongodb+srv://daniel_tfg:BasemilitarDB00@agregadornoticias.hasqxog.mongodb.net/?appName=AgregadorNoticias"

print("⏳ Conectando a MongoDB Atlas en la nube...")

cliente = MongoClient(URI_MONGODB, server_api=ServerApi('1'), tlsCAFile=certifi.where())

db = cliente["tfg_agregador_noticias"]
coleccion_usuarios = db["usuarios"]

def registrar_usuario(nombre, email, intereses):
    si_existe = coleccion_usuarios.find_one({"email": email})
    if si_existe:
        print(f"⚠️ El usuario con email {email} ya está registrado.")
        return si_existe["_id"]

    nuevo_usuario = {
        "nombre": nombre,
        "email": email,
        "intereses_explicitos": intereses,
        "historial_lectura": [],
        "fecha_registro": datetime.datetime.now().isoformat()
    }
    
    resultado = coleccion_usuarios.insert_one(nuevo_usuario)
    print(f"✅ Usuario '{nombre}' registrado con éxito en la nube.")
    return resultado.inserted_id

def obtener_perfil_usuario(email):
    usuario = coleccion_usuarios.find_one({"email": email})
    if usuario:
        return usuario
    print(f"❌ Usuario {email} no encontrado.")
    return None

def registrar_lectura(email, titulo_noticia):
    usuario = coleccion_usuarios.find_one({"email": email})
    if not usuario:
        print("❌ Error: Usuario no encontrado.")
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
    print(f"📖 Lectura registrada: '{titulo_noticia[:30]}...'")

def actualizar_intereses(email: str, nuevos_intereses: list):
    """Sobrescribe la lista de intereses de un usuario."""
    coleccion_usuarios.update_one(
        {"email": email},
        {"$set": {"intereses_explicitos": nuevos_intereses}} 
    )

def encriptar_password(password: str):
    """Devuelve el hash seguro de la contraseña."""
    return pwd_context.hash(password)

def verificar_password(password_plana: str, password_hash: str):
    """Comprueba si la contraseña introducida coincide con el hash."""
    return pwd_context.verify(password_plana, password_hash)

def registrar_usuario(nombre, email, password, intereses):
    si_existe = coleccion_usuarios.find_one({"email": email})
    if si_existe:
        print(f"⚠️ El usuario con email {email} ya está registrado.")
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
    print(f"✅ Usuario '{nombre}' registrado con éxito con contraseña segura.")
    return True

def guardar_noticia_bookmark(email: str, noticia: dict):
    """Guarda una noticia entera en el array de guardadas del usuario."""
    coleccion_usuarios.update_one(
        {"email": email},
        {"$addToSet": {"noticias_guardadas": noticia}}
    )

def penalizar_categoria(email: str, categoria: str):
    """Añade una categoría a la lista negra del usuario para que el algoritmo la ignore."""
    coleccion_usuarios.update_one(
        {"email": email},
        {"$addToSet": {"categorias_penalizadas": categoria}}
    )