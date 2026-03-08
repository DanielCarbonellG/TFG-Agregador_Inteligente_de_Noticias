import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("WORLD_NEWS_API_KEY")

def obtener_noticias(tematica="tecnología", cantidad=3):
    url = "https://api.worldnewsapi.com/search-news"
    
    parametros = {
        "text": tematica,
        "language": "es",
        "source-countries": "es",
        "number": cantidad,
        "api-key": API_KEY
    }

    try:
        respuesta = requests.get(url, params=parametros)
        respuesta.raise_for_status() 
        
        datos = respuesta.json()
        articulos_obtenidos = datos.get("news", [])
        
        noticias_limpias = []
        
        for articulo in articulos_obtenidos:
            noticia = {
                "titulo": articulo.get("title"),
                "texto_completo": articulo.get("text"),
                "url": articulo.get("url"),
                "fecha": articulo.get("publish_date")
            }
            noticias_limpias.append(noticia)
            
        return noticias_limpias

    except requests.exceptions.RequestException as error:
        print(f"Error al conectar con la API: {error}")
        return []

if __name__ == "__main__":
    print("Conectando con World News API...")
    mis_noticias = obtener_noticias(tematica="inteligencia artificial", cantidad=2)
    
    for n in mis_noticias:
        print(f"\n📰 Titular: {n['titulo']}")
        print(f"📅 Fecha: {n['fecha']}")
        print(f"🔗 URL: {n['url']}")
        print(f"📝 Texto: {n['texto_completo'][:200]}...\n")
        print("-" * 50)