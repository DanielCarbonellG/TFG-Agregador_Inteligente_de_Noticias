import torch # Importamos torch para poder limpiar la memoria de la gráfica
from langchain_core.documents import Document
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from recopilador import obtener_noticias

print("1. Inicializando el modelo de IA (Qwen)...")
# Al cargar el modelo ahora, lo hará directamente en tu RTX 4060
modelo_embeddings = HuggingFaceEmbeddings(model_name="Qwen/Qwen3-Embedding-0.6B")

print("2. Descargando noticias reales desde World News API...")
mis_noticias = obtener_noticias(tematica="tecnología empresas", cantidad=30)

print("3. Conectando con la base de datos ChromaDB...")
base_datos = Chroma(
    persist_directory="./base_vectorial",
    embedding_function=modelo_embeddings
)

print(f"4. Procesando y guardando {len(mis_noticias)} noticias (Modo secuencial para ahorrar VRAM)...")

# Procesamos UNA A UNA
for i, n in enumerate(mis_noticias):
    print(f"   Generando embedding {i+1}/30: {n['titulo'][:50]}...")
    
    doc = Document(
        page_content=n['texto_completo'], 
        metadata={"titulo": n['titulo'], "url": n['url'], "fecha": n['fecha']}
    )
    
    # Añadimos solo ESTE documento a la base de datos
    base_datos.add_documents([doc])
    
    # TRUCO PRO: Forzamos a la gráfica a vaciar la "basura" después de cada noticia
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

print("\n¡Éxito total! Datos guardados usando el poder de tu RTX 4060 de forma eficiente.")