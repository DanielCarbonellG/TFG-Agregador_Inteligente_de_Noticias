from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import resumidor  

print("Cargando modelo Vectorial Qwen en memoria (Solo 1 vez)...")
modelo_embeddings = HuggingFaceEmbeddings(model_name="Qwen/Qwen3-Embedding-0.6B")
base_datos = Chroma(persist_directory="./base_vectorial", embedding_function=modelo_embeddings)
print("Base de datos vectorial lista.")

def construir_perfil_textual(usuario):
    texto_perfil = "El usuario está interesado en las siguientes temáticas: "
    texto_perfil += ", ".join(usuario.get("intereses_explicitos", [])) + ". "
    if usuario.get("historial_lectura"):
        texto_perfil += "Recientemente ha estado leyendo sobre: "
        texto_perfil += " ".join(usuario["historial_lectura"]) + ". "
    if usuario.get("categorias_penalizadas"):
        texto_perfil += "IMPORTANTE: El usuario NO tiene interés y quiere evitar noticias sobre: "
        texto_perfil += ", ".join(usuario["categorias_penalizadas"]) + ". "
    return texto_perfil

def recomendar_noticias(usuario, cantidad=10, saltar=0):
    perfil_texto = construir_perfil_textual(usuario)
    penalizadas_lower = [p.lower().strip() for p in usuario.get("categorias_penalizadas", []) if p.strip()]
    resultados = base_datos.similarity_search_with_score(perfil_texto, k=cantidad + saltar + 20)
    if not resultados:
        return []
    lista_para_web = []
    noticias_validas_encontradas = 0
    for doc, score in resultados: 
        categoria_original = doc.metadata.get('categoria', 'General').lower()
        if any(penalizada in categoria_original for penalizada in penalizadas_lower):
            continue
        noticias_validas_encontradas += 1
        if noticias_validas_encontradas <= saltar:
            continue
        titulo_doc = doc.metadata.get('titulo', 'Sin título')
        texto_doc = doc.page_content
        print(f"Bautizando noticia (Paginada): {titulo_doc[:30]}...")
        categoria_dinamica_raw = resumidor.categorizar_noticia_ia(titulo_doc, texto_doc)
        categoria_dinamica_lower = categoria_dinamica_raw.lower()
        if any(penalizada in categoria_dinamica_lower for penalizada in penalizadas_lower):
            continue
        lista_para_web.append({
            "titulo": titulo_doc,
            "categoria": categoria_dinamica_raw,
            "url": doc.metadata.get('url', '#'),
            "fecha": doc.metadata.get('fecha', 'Fecha no disponible'),
            "imagen": doc.metadata.get('imagen', ''),
            "texto_completo": texto_doc, 
            "distancia_matematica": round(float(score), 4) 
        })
        if len(lista_para_web) == cantidad:
            break
    return lista_para_web

def obtener_ultima_hora_diversificada(cantidad=10, rapida=False, saltar=0):
    todos_los_datos = base_datos.get()
    total_datos = len(todos_los_datos['ids'])
    if total_datos == 0: return []
    lista_ultimas = []
    categorias_vistas = set()
    noticias_validas_encontradas = 0
    for i in range(total_datos - 1, -1, -1):
        categoria_original = todos_los_datos['metadatas'][i].get('categoria', 'General').lower()
        if categoria_original in categorias_vistas:
            continue
        categorias_vistas.add(categoria_original)
        noticias_validas_encontradas += 1
        if noticias_validas_encontradas <= saltar:
            continue
        titulo_doc = todos_los_datos['metadatas'][i].get('titulo', 'Sin título')
        texto_doc = todos_los_datos['documents'][i]
        if rapida:
            categoria_final = categoria_original.upper() 
        else:
            print(f"Bautizando Última Hora (Paginada): {titulo_doc[:30]}...")
            categoria_final = resumidor.categorizar_noticia_ia(titulo_doc, texto_doc)
        lista_ultimas.append({
            "titulo": titulo_doc,
            "categoria": categoria_final,
            "url": todos_los_datos['metadatas'][i].get('url', '#'),
            "fecha": todos_los_datos['metadatas'][i].get('fecha', 'Desconocida'),
            "imagen": todos_los_datos['metadatas'][i].get('imagen', ''),
            "texto_completo": texto_doc,
            "distancia_matematica": 0.0
        })
        if len(lista_ultimas) == cantidad:
            break
    return lista_ultimas