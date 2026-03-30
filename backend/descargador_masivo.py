import time
import torch
import datetime
import os  # Importante para el cerrojo
from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from recopilador import obtener_noticias

CATEGORIAS = [
    "inteligencia artificial", "ciberseguridad", "desarrollo software", "hardware",
    "empresas tecnológicas", "startups", "criptomonedas", "economía mundial",
    "mercado laboral", "teletrabajo", "medicina", "biotecnología",
    "salud mental", "nutrición", "cambio climático", "energías renovables",
    "exploración espacio", "física cuántica", "vehículos eléctricos", "videojuegos",
    "cine y series", "literatura", "fútbol", "deportes olímpicos"
]

ARCHIVO_CERROJO = "ultimo_exito.txt"

def ejecutar_cosecha_total():
    fecha_hoy = datetime.date.today().isoformat()

    # --- EL CERROJO INTELIGENTE ---
    if os.path.exists(ARCHIVO_CERROJO):
        with open(ARCHIVO_CERROJO, "r") as f:
            ultima_fecha = f.read().strip()
            if ultima_fecha == fecha_hoy:
                print(f"✅ ¡Ya hemos cosechado hoy ({fecha_hoy})! No hace falta trabajar más. Cerrando...")
                return # Salimos del programa antes de cargar nada pesado
    # ------------------------------

    print(f"\n=== INICIANDO DESCARGA MASIVA: {datetime.datetime.now()} ===")
    
    # Solo cargamos la IA si el cerrojo nos deja pasar
    modelo_embeddings = HuggingFaceEmbeddings(model_name="Qwen/Qwen3-Embedding-0.6B")
    base_datos = Chroma(persist_directory="./vector_store", embedding_function=modelo_embeddings)

    total_nuevas = 0
    total_repetidas = 0

    for i, cat in enumerate(CATEGORIAS):
        print(f"\n[{i+1}/{len(CATEGORIAS)}] Cosechando: '{cat.upper()}'...")
        noticias_api = obtener_noticias(tematica=cat, cantidad=100)
        
        if not noticias_api:
            print("⚠️ Sin puntos en la API o error. Abortamos para no gastar recursos.")
            break # Si la API nos corta, dejamos de intentarlo por hoy

        for n in noticias_api:
            if not n.get('texto_completo'): continue
            existe = base_datos.get(where={"url": n['url']})
            if len(existe['ids']) > 0:
                total_repetidas += 1
                continue

            doc = Document(
                page_content=n['texto_completo'], 
                metadata={"titulo": n['titulo'], "url": n['url'], "fecha": n['fecha'], "categoria": cat}
            )
            base_datos.add_documents([doc])
            total_nuevas += 1
            if torch.cuda.is_available(): torch.cuda.empty_cache()
        
        time.sleep(2)

    # Si hemos llegado hasta aquí y hemos descargado algo, actualizamos el cerrojo
    if total_nuevas > 0 or total_repetidas > 50: # Si parece que ha funcionado
        with open(ARCHIVO_CERROJO, "w") as f:
            f.write(fecha_hoy)

    print(f"\nFIN: {total_nuevas} nuevas, {total_repetidas} duplicadas.")

if __name__ == "__main__":
    ejecutar_cosecha_total()