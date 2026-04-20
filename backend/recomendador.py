from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

def construir_perfil_textual(usuario):
    """
    Esta función coge los datos del usuario (explícitos e implícitos) 
    y los transforma en un párrafo de texto que la IA pueda entender y vectorizar.
    """
    texto_perfil = "El usuario está interesado en las siguientes temáticas: "
    texto_perfil += ", ".join(usuario["intereses_explicitos"]) + ". "
    
    if usuario["historial_lectura"]:
        texto_perfil += "Recientemente ha estado leyendo sobre: "
        texto_perfil += " ".join(usuario["historial_lectura"])
        
    return texto_perfil

def recomendar_noticias(usuario, cantidad=5):
    perfil_texto = construir_perfil_textual(usuario)
    print(f"\n👤 Perfil generado para la IA:\n   '{perfil_texto}'")
    
    modelo_embeddings = HuggingFaceEmbeddings(model_name="Qwen/Qwen3-Embedding-0.6B")
    base_datos = Chroma(persist_directory="./base_vectorial", embedding_function=modelo_embeddings)
    
    print("\n🔍 Calculando similitud vectorial en la base de datos...")
    resultados = base_datos.similarity_search_with_score(perfil_texto, k=cantidad)
    
    if not resultados:
        print("⚠️ No hay noticias suficientes.")
        return []
        
    print("\n✨ NOTICIAS RECOMENDADAS PARA TI ✨")
    print("-" * 60)
    
    lista_para_web = []
    for doc, score in resultados: 
        noticia_dict = {
            "titulo": doc.metadata.get('titulo', 'Sin título'),
            "categoria": doc.metadata.get('categoria', 'General'),
            "url": doc.metadata.get('url', '#'),
            "fecha": doc.metadata.get('fecha', 'Fecha no disponible'),
            "texto_completo": doc.page_content, 
            "distancia_matematica": round(float(score), 4) 
        }
        lista_para_web.append(noticia_dict)
        
    return lista_para_web

if __name__ == "__main__":
    usuario_demo = {
        "nombre": "Daniel",
        "intereses_explicitos": ["inteligencia artificial", "desarrollo software"],
        "historial_lectura": [
            "NVIDIA anuncia su nueva generación de tarjetas gráficas para IA.",
            "Cómo optimizar código en Python usando nuevos frameworks.",
            "El impacto de los modelos de lenguaje en el mercado laboral."
        ]
    }
    
    recomendar_noticias(usuario_demo)