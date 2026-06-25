# Document RAG — Frontend (Angular)

Interfaz para el sistema RAG: subir documentos, verlos en una estantería, y
preguntar en una conversación donde **cada respuesta muestra sus fuentes**.

## Diseño

Dirección "sala de lectura": papel cálido, tinta, acento ámbar. El elemento
distintivo son las **tarjetas de evidencia** — cada respuesta puede expandir
los fragmentos exactos que la fundamentaron, con su score de relevancia. Eso
hace visible que es un RAG real, no un chatbot que inventa.

## Estructura

```
src/app/
├── core/
│   ├── models/rag.models.ts          # tipos (espejo del backend)
│   └── services/
│       ├── rag-api.service.ts        # cliente HTTP
│       └── knowledge-base.store.ts   # estado con signals
└── features/knowledge-base/
    ├── knowledge-base.component.ts/.html/.css
```

## Cómo correr

```bash
npm install
ng serve
# abre http://localhost:4200
```

**Importante:** el backend FastAPI debe estar corriendo en
`http://localhost:8000` (ver el README del backend). El CORS del backend ya
permite `http://localhost:4200`.

## Flujo de uso

1. Subís un documento (PDF/TXT/MD) desde la estantería de la izquierda.
2. Escribís una pregunta abajo a la derecha.
3. La respuesta aparece citando las fuentes — clic en "Show sources" para ver
   los fragmentos exactos y su % de coincidencia.

## Validado

Sintaxis TypeScript verificada en todos los archivos, contrato de tipos
alineado con el backend, y todas las referencias del template resueltas
contra el componente y el store.
