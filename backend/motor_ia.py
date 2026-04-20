from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

def generar_resumen_personalizado(noticia_texto, perfil_usuario):
    # Cargamos el modelo local
    llm = OllamaLLM(model="llama3", temperature=0.3) 

    plantilla = """
    ### ROL
    Eres un analista de noticias especializado. Tu tarea es actuar como un filtro inteligente para el usuario.
    
    ### PERFIL DEL USUARIO (CONTEXTO CRUCIAL)
    {perfil}
    
    ### NOTICIA A ANALIZAR
    {texto_noticia}
    
    ### TAREA
    Redacta un resumen de 3 o 4 líneas. 
    ¡ATENCIÓN! No hagas un resumen general. Debes seleccionar y redactar la información que sea DIRECTAMENTE RELEVANTE para los intereses del usuario arriba descritos.
    
    ### FORMATO DE SALIDA
    - Tono profesional pero adaptado al interés del usuario.
    - Directo al grano, sin introducciones.

    RESUMEN PARA EL USUARIO:
    """
    
    prompt = PromptTemplate(input_variables=["perfil", "texto_noticia"], template=plantilla)
    cadena = prompt | llm
    
    resultado = cadena.invoke({
        "perfil": perfil_usuario,
        "texto_noticia": noticia_texto
    })
    
    return resultado.strip()