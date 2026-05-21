# Demo de integración comercial · Origen Contenedores

Mini aplicación con Next.js + Node.js para probar un chatbot comercial que:

- Conversa con clientes desde la web.
- Extrae una ficha comercial estructurada con OpenAI.
- Calcula un precio estimado con reglas locales (`calcularPrecio()`).
- Guarda leads localmente en `data/leads.json`.
- Deja preparado el punto futuro para Odoo (`crearLeadOdoo()`).

## Requisitos

- Node.js 20+
- npm 10+

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Crea variables de entorno:

```bash
cp .env.example .env.local
```

3. Añade tu clave OpenAI en `.env.local`:

```env
OPENAI_API_KEY=sk-...
```

## Ejecutar en local

```bash
npm run dev
```

Abrir: http://localhost:3000

## Endpoints

- `POST /api/chat`
  - Recibe historial de mensajes.
  - Usa OpenAI para extraer datos sin inventar.
  - Ejecuta `extraerFichaLead()` y `calcularPrecio()` en backend.
  - Devuelve mensaje comercial + lead estructurado.

- `POST /api/leads`
  - Valida consentimiento RGPD.
  - Guarda lead local en `data/leads.json`.
  - Llama al placeholder `crearLeadOdoo()`.

## Reglas de precio implementadas

- 20 pies estándar: 1800 €
- 40 pies estándar: 2500 €
- 40 pies High Cube: 2700 €
- Refrigerado: 6000 €
- Transporte península: 450 €
- Transporte Baleares (CP empieza por `07`): 1500 €
- **Total = contenedor + transporte**

## Conversación de prueba

Puedes pegar algo como:

> Hola, quiero un contenedor 40 hc para Madrid, sería para almacenaje, lo necesitaría este mes. Me llamo Álvaro, mi teléfono es 622146452 y mi correo es prueba@test.com. Acepto la política de privacidad.

## Archivos clave

- `src/app/api/chat/route.ts`
- `src/app/api/leads/route.ts`
- `src/lib/leads.ts`
- `src/components/chat/origen-chat.tsx`
- `data/leads.example.json`
