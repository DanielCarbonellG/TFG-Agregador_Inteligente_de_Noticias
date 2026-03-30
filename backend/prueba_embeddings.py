from langchain_huggingface import HuggingFaceEmbeddings

print("Cargando el modelo Qwen3-Embedding-0.6B...")
print("(Paciencia, la primera vez tardará unos minutos en descargarse a tu PC)")

# Cargamos el modelo exacto que elegiste en la tabla
modelo_embeddings = HuggingFaceEmbeddings(
    model_name="Qwen/Qwen3-Embedding-0.6B" 
)

# Un titular de prueba simulando lo que nos daría la API de noticias
texto_noticia = "La inteligencia artificial revoluciona el desarrollo de software."

print("Convirtiendo el texto a vector matemático...")
vector = modelo_embeddings.embed_query(texto_noticia)

# Comprobamos el resultado
print(f"\n¡Conseguido! El texto se ha convertido en una lista de {len(vector)} números.")
print(f"Aquí tienes los primeros 5 números de ese vector para que veas qué pinta tienen:")
print(vector[:5])