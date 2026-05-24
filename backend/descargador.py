import time
import torch
import datetime
import os
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

    if os.path.exists(ARCHIVO_CERROJO):
        with open(ARCHIVO_CERROJO, "r") as f:
            ultima_fecha = f.read().strip()
            if ultima_fecha == fecha_hoy:
                print(f"¡Ya hemos cosechado hoy ({fecha_hoy})! No hace falta trabajar más. Cerrando...")
                return

    print(f"\n=== INICIANDO DESCARGA: {datetime.datetime.now()} ===")
    
    modelo_embeddings = HuggingFaceEmbeddings(model_name="Qwen/Qwen3-Embedding-0.6B")
    base_datos = Chroma(persist_directory="./base_vectorial", embedding_function=modelo_embeddings)

    total_nuevas = 0
    total_repetidas = 0
    total_sindicadas = 0

    for i, cat in enumerate(CATEGORIAS):
        print(f"\n[{i+1}/{len(CATEGORIAS)}] Cosechando: '{cat.upper()}'...")
        noticias_api = obtener_noticias(tematica=cat, cantidad=100)
        
        if not noticias_api:
            print("Sin puntos en la API o error.")
            break

        for n in noticias_api:
            if not n.get('texto_completo'): continue
            titulo_limpio = n['titulo'].strip()
            url_limpia = n['url'].strip()
            existe_url = base_datos.get(where={"url": url_limpia})
            if len(existe_url['ids']) > 0:
                total_repetidas += 1
                continue

            existe_titulo = base_datos.get(where={"titulo": titulo_limpio})
            if len(existe_titulo['ids']) > 0:
                total_sindicadas += 1
                continue

            doc = Document(
                page_content=n['texto_completo'], 
                metadata={
                    "titulo": titulo_limpio, 
                    "url": url_limpia, 
                    "fecha": n['fecha'], 
                    "categoria": cat,
                    "imagen": n.get('imagen', '')
                }
            )
            base_datos.add_documents([doc])
            total_nuevas += 1
            
            if torch.cuda.is_available(): torch.cuda.empty_cache()
        
        time.sleep(2)

    if total_nuevas > 0 or (total_repetidas + total_sindicadas) > 50:
        with open(ARCHIVO_CERROJO, "w") as f:
            f.write(fecha_hoy)

    print("\n" + "="*50)
    print(f"FIN DE LA OPERACIÓN")
    print(f"Noticias nuevas: {total_nuevas}")
    print(f"Repetidas (misma URL): {total_repetidas}")
    print(f"Bloqueadas (mismo título): {total_sindicadas}")
    print("="*50)

if __name__ == "__main__":
    ejecutar_cosecha_total()