import re
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

def generar_resumen_personalizado(noticia_texto, perfil_usuario):
    try:
        llm = OllamaLLM(model="llama3", temperature=0.1) 

        plantilla = """
        ### ROL
        Eres un analista de prensa inteligente. Tu tarea es procesar la noticia proporcionada y redactar un resumen que fusione el contexto real del artículo con el prisma de los intereses del usuario.

        ### PERFIL DEL USUARIO (TUS FILTROS DE ENFOQUE)
        {perfil}
        
        ### NOTICIA A ANALIZAR
        {texto_noticia}
        
        ### TAREA DE REDACCIÓN (FLUJO UNIFICADO OBLIGATORIO)
        Redacta un único párrafo continuo de 3 o 4 líneas. El texto debe fusionar orgánicamente estos dos pasos en su discurso:
        
        1. EL CONTEXTO: Sintetiza de forma clara y directa el hecho principal de la noticia para que se entienda perfectamente de qué trata el artículo (el estreno, el lanzamiento, el suceso deportivo, etc.).
        2. EL ENFOQUE: Concluye el párrafo analizando o vinculando ese hecho bajo el prisma de los intereses del usuario (economía, mercado laboral o teletrabajo). Busca implicaciones indirectas, el impacto en la industria de ese sector, costes o movimientos de empleo. Si la noticia no tiene ninguna relación, menciona el impacto general en su sector productivo pero NUNCA inventes datos falsos ni añadas tecnologías que no aparezcan en el texto.
        
        ### REGLAS DE CONTROL DE SALIDA (ESTRICTO)
        - PROHIBIDO usar metacomentarios, notas explicativas o justificar tus decisiones (ej: "Como la noticia no habla de...", "Aplicando el enfoque...").
        - PROHIBIDO mencionar si la noticia se alinea o no con el perfil.
        - Empieza DIRECTAMENTE con la primera palabra del resumen del acontecimiento.
        - Un solo párrafo continuo, sin saltos de línea, viñetas ni asteriscos (*).
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
        
        patron_limpieza = r'(?i)^(la noticia no contiene|para cumplir con|debido a que|como escenario de escape|según el perfil|este resumen|resumen:?|aquí tienes|este artículo|analizando la noticia).*?:\s*'
        texto_limpio = re.sub(patron_limpieza, '', texto_limpio).strip()
        
        if texto_limpio:
            texto_limpio = texto_limpio[0].upper() + texto_limpio[1:]
            
        return texto_limpio
        
    except Exception as e:
        print(f"Error interno generando resumen: {e}")
        return "No se ha podido procesar el resumen en este momento debido a un error del motor de IA."

def categorizar_noticia_ia(titulo, texto_noticia):
    llm = OllamaLLM(model="llama3", temperature=0.0) 

    plantilla = """
    Eres un clasificador experto de prensa. Lee el título y el inicio de esta noticia y asígnale UNA ÚNICA CATEGORÍA muy específica (máximo 2 o 3 palabras).
    Ejemplo: en vez de "Deporte", usa "Fútbol Europeo". En vez de "Medicina", usa "Innovación Quirúrgica".
    
    TÍTULO: {titulo}
    TEXTO: {texto_corto}
    
    Responde SOLO con el nombre de la categoría, sin puntuación ni comentarios.
    CATEGORÍA EXACTA:
    """
    prompt = PromptTemplate(input_variables=["titulo", "texto_corto"], template=plantilla)
    cadena = prompt | llm
    
    resultado = cadena.invoke({
        "titulo": titulo,
        "texto_corto": texto_noticia[:1500] 
    })
    
    return str(resultado).replace('"', '').replace('\"', '').strip()