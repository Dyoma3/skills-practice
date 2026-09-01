---
name: skills-practice-create-skill
description: Crear y definir habilidades humanas dentro de Skills Practice mediante su MCP. Usar cuando el usuario quiera agregar una habilidad o subhabilidad de práctica, organizarla dentro de su jerarquía y precisar qué problemas concretos servirán para entrenarla. No usar para crear skills de agentes, archivos SKILL.md, preguntas, rúbricas ni capacidades de ChatGPT.
---

# Crear habilidades en Skills Practice

Ayuda al usuario a definir una habilidad humana practicable y, sólo después de su aprobación,
créala mediante el MCP de Skills Practice. No reduzcas la habilidad a un nombre y una descripción
conceptual: comprende primero qué problemas concretos deberían aparecer como preguntas de práctica.

## Límites

- Interpreta `skill` como una habilidad humana almacenada en Skills Practice. Si el significado es
  ambiguo, aclara si el usuario habla de una habilidad humana o de un skill de agente antes de
  continuar.
- Puedes usar operaciones de lectura durante el diseño. No ejecutes `create_skill` si el usuario
  está simulando, explorando, diseñando el flujo o pidiendo solamente una propuesta.
- Muestra siempre la definición final y recibe aprobación explícita antes de crear, incluso si la
  petición inicial decía que se creara una habilidad.
- Crea únicamente la habilidad solicitada. No crees preguntas, rúbricas, intentos ni
  subhabilidades adicionales salvo que el usuario lo pida por separado.
- No pidas identificadores internos. Resuelve los IDs mediante las herramientas del MCP.
- Conversa en el idioma del usuario y evita convertir el proceso en un formulario rígido.

## 1. Revisar lo existente

Usa `search_skills` con el nombre propuesto y términos relacionados de su definición para:

- detectar habilidades equivalentes o solapamientos importantes;
- encontrar posibles habilidades padre;
- aprovechar la jerarquía que ya pertenece al usuario autenticado.

Advierte antes de crear si una habilidad existente parece equivalente. Muestra sólo resultados
relevantes y explica brevemente la diferencia cuando el encaje no sea exacto.

## 2. Definir la jerarquía

Determina primero si será una habilidad raíz o una subhabilidad. Si será subhabilidad:

1. Busca padres plausibles y recomienda uno cuando el encaje sea claro.
2. Permite que el usuario seleccione otro padre o vuelva a la opción raíz.
3. Comprueba con `search_questions` si el padre elegido ya tiene preguntas. Una habilidad con
   preguntas es una hoja y Skills Practice no permite agregarle hijos; en ese caso, explica el
   conflicto y ayuda a elegir otra ubicación sin modificar los registros existentes.
4. Conserva el `id` del padre elegido para la creación posterior, sin exponerlo como una decisión
   que el usuario deba tomar.

Usa controles de selección cuando el host los ofrezca y la decisión sea finita, como raíz frente a
subhabilidad o la elección entre pocos padres. Para comprender el contenido de la habilidad,
prefiere conversación abierta. Si no existen controles, presenta opciones breves y claras.

## 3. Precisar alcance y problemas de práctica

Propón una interpretación inicial cuando pueda inferirse razonablemente y deja que el usuario la
corrija. Pregunta sólo cuando una ambigüedad cambie materialmente los ejercicios. Haz una pregunta
importante a la vez.

Antes de redactar la habilidad, solicita ejemplos o propón entre dos y cuatro problemas
representativos. Deben parecer ejercicios reales, por ejemplo:

- “Diseña una API para una plataforma que administra reservas de cowork.”
- “Revisa este contrato de pagos, encuentra sus problemas y propón un rediseño.”
- “Agrega pagos parciales sin romper los clientes existentes.”
- “Diseña la interacción entre dos sistemas que deben sincronizar facturas y estados.”

No preguntes sólo si el usuario quiere entrenar “compatibilidad”, “modelado de errores” o
“trade-offs”. Convierte esas categorías abstractas en problemas concretos que el usuario pueda
validar o corregir.

Para las familias de problemas que lo necesiten, precisa:

- qué información recibe quien practica y qué debe producir;
- si la dinámica es estática o interactiva;
- qué decisiones debe justificar;
- qué forma parte de la evaluación y qué queda explícitamente fuera;
- cómo podrían variar los ejercicios en dificultad.

No obligues al usuario a inventar todos los ejemplos ni interrogues cada punto cuando ya pueda
inferirse. Agrupa los ejemplos validados por el razonamiento y el tipo de respuesta que entrenan,
no sólo por su tema. Entre las familias posibles están diseñar desde un problema ambiguo, revisar
una solución, adaptar un diseño a un requisito nuevo, comparar alternativas, diagnosticar desde
evidencia o ejecutar una tarea con restricciones.

## 4. Redactar la habilidad

Construye:

- un nombre breve y reconocible;
- la habilidad padre seleccionada o la indicación de que será raíz;
- una definición clara de lo que se practica y sus límites;
- una descripción persistible derivada de los problemas acordados.

La descripción debe indicar qué deberá hacer la persona y mediante qué tipos de problemas, con
suficiente precisión para que otro agente genere preguntas coherentes sin redescubrir la intención.
No la llenes con una enumeración genérica de conceptos relacionados.

## 5. Obtener aprobación

Antes de cualquier escritura, muestra una propuesta final compacta con:

- **Nombre**
- **Habilidad padre**
- **Definición y alcance**
- **Tipos concretos de problemas**
- **Dinámica esperada**
- **Descripción que se guardará**

Pide aprobación o correcciones. Una conversación hipotética, comentarios sobre el flujo o la mera
aceptación de un ejemplo parcial no autorizan la creación. Si hay correcciones, actualiza la
propuesta y solicita aprobación de la versión final.

## 6. Crear mediante el MCP

Sólo después de la aprobación explícita:

1. Repite la búsqueda de duplicados si el nombre o la definición cambiaron sustancialmente desde
   la búsqueda inicial.
2. Resuelve el `parentId` desde el resultado MCP del padre aprobado; usa `null` u omítelo para una
   habilidad raíz.
3. Ejecuta `create_skill` una vez con `name`, `description` y `parentId`.
4. Confirma el resultado devuelto y, si hace falta verificación adicional, consulta la habilidad
   creada con `get_skill`.
5. Informa brevemente el nombre, la ubicación jerárquica y el ID creado. No continúes creando
   preguntas, rúbricas u otros nodos.

`create_skill` no es idempotente. Si la respuesta es ambigua por una interrupción o timeout, busca
primero la habilidad antes de reintentar para evitar duplicados. Si la creación falla por una
restricción del padre o por autorización, explica el problema y vuelve al diseño; no elijas otro
padre ni repitas la escritura sin aprobación.

## Criterio de finalización

La habilidad está lista para proponerse solamente cuando:

- su posición jerárquica está definida;
- su alcance y exclusiones se entienden;
- existen ejemplos representativos de preguntas;
- se conoce qué debe hacer el usuario en esos ejercicios;
- la descripción permite generar nuevas preguntas coherentes.

Está lista para crearse únicamente cuando, además, el usuario aprobó la propuesta final.
