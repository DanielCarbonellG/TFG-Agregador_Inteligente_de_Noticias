from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

print("1. Cargando el modelo de embeddings...")
# IMPORTANTE: Tenemos que usar exactamente el mismo modelo con el que guardamos los datos
modelo_embeddings = HuggingFaceEmbeddings(model_name="Qwen/Qwen3-Embedding-0.6B")

print("2. Conectando a la base de datos local (ChromaDB)...")
# Cargamos la carpeta que creaste en el paso anterior
base_datos = Chroma(
    persist_directory="./base_vectorial", 
    embedding_function=modelo_embeddings
)

# Simulamos lo que escribiría un usuario en su perfil o en un buscador
perfil_usuario = "¿Cómo afecta la inteligencia artificial a las empresas y al trabajo?"
print(f"\nBuscando noticias relacionadas con: '{perfil_usuario}'\n")

# Hacemos la búsqueda semántica. Le pedimos que nos devuelva las 2 noticias más relevantes (k=2)
resultados = base_datos.similarity_search(perfil_usuario, k=2)

print("🎯 RESULTADOS DE LA RECOMENDACIÓN:")
print("=" * 50)

for i, documento in enumerate(resultados):
    # Extraemos los datos útiles que guardamos en los metadatos y el texto
    titulo = documento.metadata.get("titulo", "Sin título")
    fecha = documento.metadata.get("fecha", "Sin fecha")
    url = documento.metadata.get("url", "Sin URL")
    
    print(f"RECOMENDACIÓN #{i + 1}")
    print(f"📰 Titular: {titulo}")
    print(f"📅 Fecha: {fecha}")
    print(f"🔗 Enlace: {url}")
    # Mostramos los primeros 250 caracteres del texto para ver el contexto
    print(f"📝 Extracto: {documento.page_content[:250]}...\n")
    print("-" * 50)