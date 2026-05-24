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
                "fecha": articulo.get("publish_date"),
                "imagen": articulo.get("image", "")
            }
            noticias_limpias.append(noticia)
        return noticias_limpias
    except requests.exceptions.RequestException as error:
        print(f"Error al conectar con la API: {error}")
        return []