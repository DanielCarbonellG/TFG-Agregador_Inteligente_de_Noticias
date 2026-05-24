import re
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

def generar_resumen_personalizado(noticia_texto, perfil_usuario):
    try:
        llm = OllamaLLM(model="llama3", temperature=0.3) 

        plantilla = """
        ### ROL
        Eres un analista de noticias especializado. Tu tarea es actuar como un filtro inteligente.
        
        ### PERFIL (CONTEXTO CRUCIAL)
        {perfil}
        
        ### NOTICIA A ANALIZAR
        {texto_noticia}
        
        ### TAREA
        Redacta un resumen de 3 o 4 líneas. 
        ¡ATENCIÓN! No hagas un resumen general. Debes seleccionar y redactar la información que sea DIRECTAMENTE RELEVANTE para los intereses arriba descritos.
        
        ### FORMATO DE SALIDA EXACTO (REGLAS ESTRICTAS)
        - Tono profesional pero adaptado al interés indicado.
        - Directo al grano.
        - PROHIBIDO usar asteriscos (**).
        - PROHIBIDO usar comillas.
        - PROHIBIDO empezar con la palabra "Resumen" o frases como "Aquí tienes".
        - Devuelve ÚNICAMENTE el texto puro del resumen, sin títulos ni formato.
        - En idioma español.

        RESUMEN:
        """
        
        prompt = PromptTemplate(input_variables=["perfil", "texto_noticia"], template=plantilla)
        cadena = prompt | llm
        resultado = cadena.invoke({
            "perfil": perfil_usuario,
            "texto_noticia": noticia_texto
        })
        texto_limpio = str(resultado).strip()
        texto_limpio = texto_limpio.replace('*', '').replace('"', '').replace('\"', '')
        texto_limpio = re.sub(r'^(resumen:?\s*|aquí tienes.*?:?\s*)', '', texto_limpio, flags=re.IGNORECASE).strip()
        return texto_limpio
    except Exception as e:
        print(f"Error interno generando resumen: {e}")
        return "No se ha podido procesar el resumen en este momento debido a un error del motor de IA."

def categorizar_noticia_ia(titulo, texto_noticia):
    llm = OllamaLLM(model="llama3", temperature=0.1) 

    plantilla = """
    Eres un clasificador experto. Lee el título y el inicio de esta noticia y asígnale UNA ÚNICA CATEGORÍA muy específica (máximo 2 o 3 palabras).
    Ejemplo: en vez de "Deporte", usa "Fútbol Europeo". En vez de "Medicina", usa "Innovación Quirúrgica".
    
    TÍTULO: {titulo}
    TEXTO: {texto_corto}
    
    Responde SOLO con el nombre de la categoría. Sin comillas ni puntos.
    CATEGORÍA EXACTA:
    """
    prompt = PromptTemplate(input_variables=["titulo", "texto_corto"], template=plantilla)
    cadena = prompt | llm
    
    resultado = cadena.invoke({
        "titulo": titulo,
        "texto_corto": texto_noticia[:1500] 
    })
    
    return str(resultado).replace('"', '').replace('\"', '').strip()