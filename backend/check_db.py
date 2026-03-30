from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

modelo = HuggingFaceEmbeddings(model_name="Qwen/Qwen3-Embedding-0.6B")
db = Chroma(persist_directory="./base_vectorial", embedding_function=modelo)

print(f"\n📊 NOTICIAS TOTALES EN TU BASE DE DATOS: {len(db.get()['ids'])}")