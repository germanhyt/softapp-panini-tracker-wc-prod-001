# Manual de usuario — Panini 2026 Tracker

> Guía detallada para coleccionistas del álbum Panini FIFA World Cup 2026.  
> Idioma: español neutro (Perú).  
> Última actualización: junio 2026.

---

## Tabla de contenidos

1. [¿Qué es Panini Tracker?](#1-qué-es-panini-tracker)
2. [Requisitos y acceso](#2-requisitos-y-acceso)
3. [Primeros pasos: cuenta y perfil](#3-primeros-pasos-cuenta-y-perfil)
4. [Navegación de la aplicación](#4-navegación-de-la-aplicación)
5. [Dashboard: tu progreso general](#5-dashboard-tu-progreso-general)
6. [Álbum: registrar pegadas y repetidas](#6-álbum-registrar-pegadas-y-repetidas)
7. [Matches: encontrar intercambios](#7-matches-encontrar-intercambios)
8. [Chat: coordinar intercambios en tiempo real](#8-chat-coordinar-intercambios-en-tiempo-real)
9. [Mercado público](#9-mercado-público)
10. [Perfil y publicación en el mercado](#10-perfil-y-publicación-en-el-mercado)
11. [Extras: figuritas promocionales](#11-extras-figuritas-promocionales)
12. [Reportes imprimibles](#12-reportes-imprimibles)
13. [Panel de administración](#13-panel-de-administración)
14. [Privacidad y datos personales](#14-privacidad-y-datos-personales)
15. [Preguntas frecuentes](#15-preguntas-frecuentes)
16. [Glosario](#16-glosario)

---

## 1. ¿Qué es Panini Tracker?

**Panini 2026 Tracker** es una aplicación web gratuita para que coleccionistas del álbum Panini del Mundial FIFA 2026 puedan:

- **Registrar** qué figuritas ya pegaron, cuáles les faltan y cuáles tienen repetidas.
- **Medir** su avance con estadísticas y porcentaje de completitud.
- **Encontrar** otros coleccionistas compatibles para intercambiar figuritas.
- **Publicar** ofertas y búsquedas en un mercado comunitario visible sin necesidad de iniciar sesión.
- **Coordinar** trueques por chat interno o correo electrónico.
- **Imprimir** reportes para intercambios presenciales.

El catálogo oficial incluye aproximadamente **1.034 figuritas estándar**: logo, especiales FWC, 48 selecciones nacionales y la sección Coca-Cola.

La aplicación es un proyecto de **Refugio Gastronómico**. Al pie de cada pantalla verás su logo y un enlace a la política de privacidad.

---

## 2. Requisitos y acceso

### 2.1 Dispositivos compatibles

Puedes usar Panini Tracker desde:

- Navegador web en celular, tablet o computadora (Chrome, Firefox, Safari, Edge u otro navegador moderno).
- Conexión a internet activa para guardar tu colección y usar chat o matches.

La interfaz está optimizada para móvil: la barra inferior te permite moverte entre las secciones principales con el pulgar.

### 2.2 Rutas principales

| Ruta | ¿Necesitas cuenta? | Descripción |
|------|---------------------|-------------|
| `/login` | No | Iniciar sesión |
| `/register` | No | Crear cuenta |
| `/mercado` | No | Ver publicaciones de la comunidad |
| `/privacidad` | No | Política de privacidad |
| `/dashboard` | Sí | Panel de progreso |
| `/album` | Sí | Marcar figuritas por página |
| `/matches` | Sí | Buscar intercambios |
| `/chat` | Sí | Mensajes con otros usuarios |
| `/profile` | Sí | Datos personales y mercado |
| `/extras` | Sí | Figuritas promocionales |
| `/visual-report` | Sí | Mapa visual imprimible |
| `/trade-report` | Sí | Checklist para trueque |
| `/admin` | Sí (admin) | Panel administrativo |

Al entrar a la raíz del sitio (`/`), la aplicación te redirige automáticamente según tu estado: login, verificación de correo, completar perfil o dashboard.

---

## 3. Primeros pasos: cuenta y perfil

### 3.1 Crear una cuenta

1. Abre **Registro** (`/register`).
2. Completa el formulario:
   - **Nombre** y **apellido**
   - **País** (por defecto Perú; puedes cambiarlo)
   - **Correo electrónico**
   - **Contraseña** (mínimo 6 caracteres) y confirmación
3. Pulsa **Registrarme**.

También puedes registrarte con **Google** si el administrador del sitio habilitó ese método. En ese caso, después de autenticarte con Google deberás completar tu perfil si aún no lo hiciste.

Al registrarte aceptas la [política de privacidad](/privacidad).

### 3.2 Verificar tu correo

Después del registro debes **verificar tu correo electrónico** antes de usar la aplicación con normalidad.

1. Revisa tu bandeja de entrada (y la carpeta de spam) por un correo con el enlace de verificación.
2. Haz clic en el enlace. Serás redirigido y podrás iniciar sesión.

**Si no recibes el correo:**

- En la pantalla de verificación (`/verify-email`) usa **Reenviar enlace de verificación**.
- Si intentas iniciar sesión sin haber verificado, la aplicación te llevará de nuevo a esa pantalla.

> **Nota para entornos de prueba:** si el sitio no tiene correo configurado, el enlace de verificación puede mostrarse directamente en pantalla o en la consola del servidor. En ese caso, cópialo y ábrelo en el navegador.

### 3.3 Completar tu perfil

Si iniciaste sesión con Google o tu perfil quedó incompleto, verás la pantalla **Completa tu perfil** (`/complete-profile`):

1. Confirma o edita tu **nombre** y **apellido**.
2. Selecciona tu **país**.
3. Pulsa **Continuar al dashboard**.

El país es importante: el buscador de matches solo muestra usuarios del **mismo país** que tú, para facilitar intercambios presenciales o locales.

### 3.4 Iniciar sesión

1. Abre **Ingresar** (`/login`).
2. Escribe tu **correo** y **contraseña**.
3. Pulsa **Ingresar**.

Opciones adicionales:

- **Continuar con Google** — si tu cuenta ya está registrada con ese proveedor.
- **¿Olvidaste tu contraseña?** — te lleva a `/forgot-password` para solicitar un enlace de restablecimiento por correo.
- Tras restablecer la contraseña en `/reset-password`, vuelve a `/login` con tu nueva clave.

Mensajes que puedes ver al ingresar:

| Mensaje | Significado |
|---------|-------------|
| *Correo verificado. Ya puedes iniciar sesión.* | Completaste la verificación correctamente |
| *Contraseña actualizada. Ya puedes iniciar sesión.* | Restableciste tu contraseña |
| *Correo o contraseña incorrectos.* | Revisa tus credenciales |
| *Esta cuenta de Google no está registrada.* | Debes crear cuenta en Registro primero |

### 3.5 Cerrar sesión

En la parte superior derecha de cualquier pantalla autenticada, pulsa **Salir**. Tu colección permanece guardada en la nube y podrás recuperarla al volver a iniciar sesión.

---

## 4. Navegación de la aplicación

### 4.1 Encabezado (header)

Cuando has iniciado sesión, el encabezado muestra:

- **Logo y nombre** del proyecto — al pulsarlo vuelves al Dashboard.
- **Contador de miembros registrados** — cuántos coleccionistas hay en la plataforma.
- **Tu avatar y nombre** — enlace rápido a tu perfil.
- **Salir** — cierra la sesión.

### 4.2 Barra de navegación inferior

En la parte inferior encontrarás accesos directos:

| Icono | Sección | Función |
|-------|---------|---------|
| 📊 | Dashboard | Progreso y accesos rápidos |
| 📖 | Álbum | Marcar figuritas por página |
| 🤝 | Matches | Intercambios compatibles |
| 💬 | Chat | Conversaciones con otros usuarios |
| 👤 | Perfil | Datos y configuración del mercado |
| 📦 | Extras | Figuritas promocionales |

Si eres **administrador**, verás además 🛡️ **Admin** en la barra.

### 4.3 Pie de página

El pie muestra el logo de **Refugio Gastronómico** y un enlace a la **política de privacidad**.

---

## 5. Dashboard: tu progreso general

Ruta: `/dashboard`

El Dashboard es tu pantalla de inicio después de iniciar sesión. Resume el estado de tu colección del catálogo **estándar** (no incluye extras promocionales).

### 5.1 Tarjetas de estadísticas

En la parte superior verás cuatro números:

| Indicador | Significado |
|-----------|-------------|
| **Pegadas** | Figuritas que marcaste como ya pegadas en tu álbum |
| **Faltantes** | Figuritas del catálogo estándar que aún no tienes |
| **Repetidas** | Total de copias extra (suma de duplicados) |
| **Completado** | Porcentaje de pegadas sobre el total del catálogo oficial |

Debajo hay una **barra de progreso** visual con el mismo porcentaje.

### 5.2 Acciones rápidas

Desde el Dashboard puedes ir directamente a:

- **📖 Ver álbum por páginas** — registrar o editar figuritas.
- **🧾 Reporte visual de faltantes** — mapa imprimible.
- **📋 Reporte para trueque** — checklist para intercambio en persona.
- **🏪 Mercado público** — ver qué publican otros coleccionistas.

### 5.3 Avance por selección

Más abajo aparece una cuadrícula con cada sección del álbum (logo, FWC, cada selección nacional, Coca-Cola, etc.). Cada tarjeta muestra:

- Cuántas figuritas llevas pegadas del total de esa sección.
- Porcentaje de avance.
- Cuántas faltantes y repetidas tienes en esa sección.
- Barra de progreso por sección.

**Pulsa cualquier tarjeta** para abrir el álbum directamente en esa sección.

### 5.4 Guardar cambios pendientes

Si modificaste figuritas en otra pantalla y aún no guardaste, verás un botón flotante **💾 Guardar cambios** en la parte inferior. Úsalo antes de cerrar el navegador.

---

## 6. Álbum: registrar pegadas y repetidas

Ruta: `/album`

Aquí marcas figurita por figurita el estado de tu colección oficial.

### 6.1 Navegar por páginas

El álbum está organizado en **páginas**, igual que el álbum físico:

- **← Anterior** / **Siguiente →** — cambia de página.
- El **selector desplegable** te permite saltar a cualquier página por nombre (ej. *Pág. 01 - Argentina*).

Cada página muestra:

- Título y subtítulo de la sección.
- Cuántas figuritas llevas pegadas de las de esa página.
- Cuántas repetidas tienes en esa página.

### 6.2 Buscar figuritas

Usa el campo **Buscar dentro del álbum**:

- Escribe un código (`ARG5`, `FWC1`, `00`), nombre de selección (`Brazil`, `PER`) o parte del título.
- La búsqueda es **dinámica**: no necesitas pulsar un botón.
- Los resultados de varias páginas aparecen agrupados.
- Pulsa **Limpiar** para volver a la vista por páginas.

Ejemplos de búsqueda:

| Escribes | Encuentra |
|----------|-----------|
| `ARG` | Figuritas de Argentina |
| `FWC` | Especiales FWC |
| `01` | Página o códigos que contengan 01 |

### 6.3 Marcar una figurita como pegada

Cada figurita aparece en una cuadrícula con su **código**:

1. Pulsa el **casillero de verificación** (✓) para marcarla como **pegada**.
2. Si ya estaba guardada y quieres quitarla, pulsa de nuevo el casillero: aparecerá una confirmación para **eliminarla** de tu álbum guardado.

Estados visuales:

| Estado | Significado |
|--------|-------------|
| Sin marca | No la tienes pegada |
| ✓ verde | Pegada |
| Etiqueta *Pendiente* | Cambiaste algo pero aún no guardaste |
| Bloqueada | Ya fue guardada en la nube; requiere confirmación para eliminar |

### 6.4 Registrar repetidas

Cuando una figurita está marcada como pegada, aparecen controles **−** y **+** junto a un número:

- El número indica cuántas **copias extra** tienes (repetidas).
- Usa **+** para sumar una repetida y **−** para restar (mínimo 0).

> **Importante:** tener una figurita pegada con **0 repetidas** significa que la tienes una sola vez. Las repetidas son copias adicionales útiles para intercambiar.

### 6.5 Selección masiva

En cada página puedes usar:

- **Seleccionar Todas** — marca todas las figuritas de la página como pegadas (solo las que no estén bloqueadas).
- **Anular Selección** — desmarca todas las que seleccionaste en bloque.

Útil cuando acabas de pegar una página entera del álbum físico.

### 6.6 Guardar tus cambios

**Siempre guarda antes de cambiar de página** si hiciste modificaciones:

| Botón | Cuándo usarlo |
|-------|---------------|
| **💾 Guardar** (en cada página) | Guarda solo los cambios de esa página |
| **💾 Guardar cambios visibles** | En modo búsqueda, guarda lo que ves en pantalla |
| **💾 Guardar todos los cambios pendientes** | Guarda todo lo pendiente del álbum |

Si intentas cambiar de página con cambios sin guardar, la aplicación te preguntará: *¿Guardar ahora y continuar?*

Si cierras la pestaña con cambios pendientes, el navegador también puede advertirte.

Tras guardar correctamente verás **✅ Guardado** unos segundos.

### 6.7 Consejos para el álbum

1. **Marca tus repetidas** — sin repetidas registradas, el buscador de matches no puede proponerte intercambios útiles.
2. **Guarda con frecuencia** — especialmente en sesiones largas.
3. **Usa la búsqueda** — más rápido que navegar página por página cuando buscas un código concreto.
4. **Actualiza después de un trueque** — cuando intercambies figuritas en persona, vuelve al álbum y ajusta pegadas y repetidas.

---

## 7. Matches: encontrar intercambios

Ruta: `/matches`

El buscador de matches cruza tu colección con la de otros usuarios **del mismo país** que tengan perfil completo y correo verificado.

### 7.1 Requisito: país en el perfil

Si no configuraste tu país, verás un aviso:

> *Selecciona tu país para habilitar matches*

Pulsa **Completar país en mi perfil** y elige tu país. Sin esto no se calculan intercambios.

### 7.2 Tu resumen

Antes de la lista verás:

- **Tus repetidas** — total de copias extra registradas.
- **Te faltan** — total de figuritas estándar que aún no tienes.

### 7.3 Cómo funciona el ranking

Para cada otro coleccionista del mismo país, la aplicación calcula un intercambio **bidireccional**:

| Columna | Significado |
|---------|-------------|
| **🎁 Te puede dar** | Figuritas que te faltan a ti y que esa persona tiene repetidas |
| **🎯 Tú le das** | Figuritas que tienes repetidas y que esa persona aún no tiene pegadas |

Los resultados se ordenan por **cantidad de intercambios posibles** (mayor primero). Por defecto se muestran los **10 mejores**; puedes pulsar **Ver todos los matches** si hay más.

Pulsa **🔄 Actualizar** para recalcular con los datos más recientes.

### 7.4 Tarjeta de cada match

Cada resultado incluye:

- Posición en el ranking (#1, #2…).
- Nombre del coleccionista y foto (si la tiene).
- Número de **intercambios posibles**.
- Detalle de figuritas en ambas direcciones.
- Botones de acción (ver sección siguiente).

### 7.5 Contactar a un match

Tienes tres formas de coordinar:

#### 💬 Chat interno

Pulsa **Chat interno** para abrir una conversación privada dentro de la aplicación. Se crea (o reutiliza) un hilo en `/chat/[id]`.

#### 📩 Enviar invitación

Pulsa **Enviar invitación** para abrir tu cliente de correo con un **mensaje pre-armado** que resume qué figuritas podrían intercambiar. Solo funciona si el otro usuario tiene correo disponible en el sistema.

#### Ver mensaje

Pulsa **Ver mensaje** para leer el texto de la invitación antes de enviarla por correo.

### 7.6 Si no hay matches

Verás el mensaje *Aún no hay matches útiles*. Posibles causas:

- Pocos usuarios activos en tu país.
- Tu álbum está muy completo o muy vacío respecto a los demás.
- No registraste repetidas o faltantes.

**Qué hacer:** completa tu álbum con pegadas y repetidas, anima a amigos a registrarse en tu país y vuelve a actualizar más tarde.

### 7.7 Limitaciones del motor de matches

- Solo considera figuritas del **catálogo estándar** (~1.034 códigos).
- Las figuritas de **Extras** no participan.
- Solo usuarios del **mismo país**.
- El otro usuario debe tener **correo verificado** y **perfil completo**.

---

## 8. Chat: coordinar intercambios en tiempo real

Ruta: `/chat` (bandeja) · `/chat/[conversationId]` (conversación)

El chat interno permite hablar en tiempo real con otros coleccionistas para acordar un trueque, lugar y horario.

### 8.1 Bandeja de conversaciones

Al abrir **Chat** verás la lista de conversaciones con:

- Avatar y nombre del otro usuario.
- Vista previa del último mensaje.
- Fecha y hora del último mensaje.
- Badge con mensajes **no leídos** (si los hay).

Pulsa una conversación para abrirla.

Si aún no tienes conversaciones:

> *Sin conversaciones aún — Ve a Matches y pulsa "Enviar mensaje" para coordinar un intercambio en tiempo real.*

También puedes iniciar chat desde una publicación del **mercado** (si ya conversaste con ese usuario, verás una vista previa cerrada).

### 8.2 Dentro de una conversación

La pantalla de chat muestra:

- Nombre del otro coleccionista.
- Estado de conexión: *Conectando…*, *En línea* o *Reconectando…*.
- Historial de mensajes (los tuyos a la derecha, los del otro a la izquierda).
- Indicador *"[Nombre] está escribiendo…"* cuando el otro usuario escribe.

#### Enviar un mensaje

1. Escribe en el campo **Escribe un mensaje…** (máximo 2.000 caracteres).
2. Pulsa **Enviar**.

Los mensajes se entregan en **tiempo real** mediante WebSocket.

### 8.3 Iniciar un chat nuevo

Formas de abrir una conversación:

| Desde | Acción |
|-------|--------|
| Matches | Botón **💬 Chat interno** en la tarjeta del match |
| Mercado | Panel de vista previa del chat (si aplica) |

No necesitas conocer el correo del otro usuario: el chat es privado dentro de la plataforma.

### 8.4 Consejos para el chat

- Confirma **qué figuritas** intercambiarán antes del encuentro.
- Acuerden **lugar seguro y horario** para el trueque presencial.
- Después del intercambio, **actualicen su álbum** en la aplicación.

---

## 9. Mercado público

Ruta: `/mercado`

El mercado es una vitrina **pública**: cualquier persona puede ver qué figuritas publicaron los coleccionistas, **sin necesidad de iniciar sesión**.

### 9.1 ¿Qué se publica?

Los usuarios eligen (desde su perfil) qué mostrar:

| Tipo | Etiqueta | Significado |
|------|----------|-------------|
| **Oferta** | *Ofrece* | El usuario tiene repetidas de esa figurita |
| **Búsqueda** | *Busca* | Al usuario le falta esa figurita |

En cada tarjeta verás:

- Código de la figurita (ej. `PER3`, `ARG5`).
- Tipo de publicación.
- Cantidad (en ofertas) o texto *Necesita esta figurita* (en búsquedas).
- Selección o equipo, si aplica.
- Nombre abreviado del publicador (ej. *Juan P.*) y su país.
- Foto de perfil, si la tiene.
- Fecha relativa (*Hoy*, *Ayer*, *Hace 3 días*).

**Tu correo electrónico nunca aparece** en el mercado público.

### 9.2 Filtrar publicaciones

Usa el panel de **Filtros**:

| Filtro | Opciones |
|--------|----------|
| **Tipo** | Todos · Repetidas · Faltantes |
| **País** | Todos los países o uno específico |
| **Selección** | Todas las selecciones o una en particular |
| **Código** | Busca por código exacto o parcial (ej. `PER1`) |

Pulsa **Buscar** después de escribir un código, o **Limpiar** para resetear todos los filtros.

### 9.3 Paginación

Si hay muchas publicaciones, usa **Anterior** / **Siguiente** al pie de la lista. Se muestran 24 publicaciones por página.

### 9.4 Contactar desde el mercado

- **Sin sesión:** verás *Inicia sesión para chat interno*. Debes registrarte e ingresar para escribir a otro coleccionista.
- **Con sesión:** si ya conversaste con ese publicador, puedes ver una **vista previa cerrada** del chat. Para iniciar una conversación nueva, usa Matches o el flujo de chat desde la publicación cuando esté disponible.

### 9.5 Publicar en el mercado

Para que **tus** figuritas aparezcan aquí, configura y sincroniza desde **Perfil** (ver sección 10). El mercado no lee tu álbum automáticamente hasta que pulses **Publicar / actualizar colección**.

---

## 10. Perfil y publicación en el mercado

Ruta: `/profile`

### 10.1 Información personal

La pantalla de perfil muestra:

- Tu **nombre completo** y **correo**.
- Tu **país** (con bandera 📍).
- Resumen de colección: pegadas, repetidas y faltantes del catálogo estándar.

> Actualmente el país y nombre se configuran en el registro o en *Completar perfil*. Si necesitas cambiarlos, contacta al administrador del sitio.

### 10.2 Configuración del mercado público

En la sección **Mercado público** controlas qué compartes con la comunidad:

| Opción | Descripción |
|--------|-------------|
| **Perfil visible** | Permite que otros usuarios te encuentren en el mercado |
| **Publicar repetidas** | Muestra automáticamente las figuritas que tienes de más |
| **Publicar faltantes** | Muestra las figuritas que aún te faltan |

Activa o desactiva cada opción con un toque. Los cambios se guardan al instante.

### 10.3 Publicar o actualizar tu colección

Después de activar **Publicar repetidas** y/o **Publicar faltantes**:

1. Asegúrate de haber **guardado tu álbum** con el estado actual.
2. Pulsa **Publicar / actualizar colección**.
3. La aplicación sincroniza tus listados y muestra un mensaje como: *Publicación actualizada: 15 repetidas y 42 faltantes.*

Verás también:

- Cuántas **repetidas activas** y **faltantes activas** tienes publicadas.
- **Última actualización** con fecha y hora.

Pulsa **Ver mercado público** para comprobar cómo se ven tus publicaciones.

### 10.4 Privacidad en el mercado

- Solo se muestra tu **nombre abreviado** y **país**.
- Tu **correo no se publica**.
- Puedes ocultarte en cualquier momento desactivando **Perfil visible**.

---

## 11. Extras: figuritas promocionales

Ruta: `/extras`

Algunas figuritas **no forman parte del álbum oficial estándar**: promociones de Panini, ediciones regionales, campañas de Coca-Cola, supermercados u otros códigos especiales.

### 11.1 ¿Para qué sirve?

Llevar un registro personal de esas pegatinas **sin afectar** tu porcentaje oficial de completitud del álbum.

### 11.2 Agregar un extra

1. En el campo de texto escribe el **código** (1–16 caracteres alfanuméricos), por ejemplo `PROMO1` o `PE2026`.
2. Pulsa **+** o Enter.

**Reglas:**

- El código **no puede** existir ya en el catálogo estándar (ej. no puedes agregar `ARG1` aquí).
- No puedes duplicar un extra que ya agregaste.

### 11.3 Marcar y contar repetidas

Funciona igual que en el álbum:

- Pulsa el casillero para marcar como **pegada**.
- Usa **−** / **+** para repetidas (solo si está pegada).
- Pulsa **💾 Guardar extras** cuando tengas cambios pendientes.

### 11.4 Eliminar un extra guardado

Si el extra ya fue guardado en la nube, pulsa el casillero marcado para ver la confirmación **¿Eliminar [código] de tu álbum guardado?**

### 11.5 Qué NO hacen los extras

| Función | ¿Participan los extras? |
|---------|-------------------------|
| Porcentaje del Dashboard | ❌ No |
| Match finder | ❌ No |
| Mercado público (sync automática) | ❌ No |
| Reporte para trueque | ✅ Sí (sección "Extras") |
| Reporte visual | ❌ No (solo catálogo estándar) |

---

## 12. Reportes imprimibles

Dos reportes te ayudan en intercambios presenciales. Accede desde el **Dashboard** o escribe la ruta directamente.

### 12.1 Reporte visual (`/visual-report`)

**Mapa visual** de todo el catálogo estándar:

- Cada fila representa una selección o sección (con bandera o insignia).
- Cada celda es una figurita con color según su estado:

| Color / leyenda | Estado |
|-----------------|--------|
| Faltan | No la tienes |
| Pegadas | La tienes una vez |
| Repetidas (01) | Una repetida |
| Repetidas (02+) | Dos o más repetidas |

**Imprimir:**

1. Pulsa **🖨️ Imprimir / Guardar PDF**.
2. En el diálogo del navegador elige impresora o *Guardar como PDF*.

Útil para ver de un vistazo huecos en tu colección antes de un evento de intercambio.

### 12.2 Reporte para trueque (`/trade-report`)

**Checklist imprimible** pensado para usar **en mano** durante un trueque:

Encabezado con tu nombre, correo, fecha y resumen (pegadas, faltantes, repetidas, % completado).

Dos bloques principales:

#### REPETIDAS
- Lista agrupada por sección.
- Casilleros para marcar cuáles **entregas**.
- Número entre paréntesis = cuántas copias tienes (ej. `(03)` = tres repetidas).

#### ME FALTAN
- Lista agrupada por sección.
- Casilleros vacíos para marcar cuáles **recibes**.
- Línea `x ______` para anotar por cuál repetida la cambiaste.

**Después del trueque:** vuelve al álbum y actualiza pegadas y repetidas según lo intercambiado.

**Imprimir:** igual que el reporte visual — botón **🖨️ Imprimir / Guardar PDF**.

---

## 13. Panel de administración

Ruta: `/admin`  
Acceso: solo usuarios cuyo correo está en la lista de administradores del sitio.

Si eres administrador, verás 🛡️ **Admin** en la barra inferior.

### 13.1 Estadísticas globales

Resumen de la plataforma: total de usuarios, verificados, con perfil completo, pegadas promedio, etc.

### 13.2 Listado de usuarios

Tabla con nombre, correo, proveedor de login, país, estado de verificación, estadísticas de colección y fechas relevantes.

Usa el **buscador** para filtrar por nombre, correo, proveedor o país.

### 13.3 Exportar CSV

Pulsa **Exportar CSV** para descargar un archivo con todos los usuarios y sus datos de colección. Útil para análisis o respaldo administrativo.

---

## 14. Privacidad y datos personales

### 14.1 Qué datos guarda la aplicación

- Datos de cuenta: correo, contraseña cifrada (o cuenta Google).
- Perfil: nombre, apellido, país, foto (si usas Google).
- Colección: estado de cada figurita (pegada, repetidas).
- Conversaciones de chat interno.
- Configuración del mercado y publicaciones derivadas.

### 14.2 Qué ven otros usuarios

| Contexto | Datos visibles |
|----------|----------------|
| Matches | Nombre, apellido, foto, correo (solo para invitación por email) |
| Mercado público | Nombre abreviado, país, foto |
| Chat | Nombre y mensajes de la conversación |

Tu correo **no** se muestra en el mercado público.

### 14.3 Política de privacidad

Consulta el documento completo en `/privacidad`, accesible desde el pie de página y las pantallas de registro/login.

### 14.4 Cerrar sesión en dispositivos compartidos

Si usas un computador o celular compartido, pulsa **Salir** al terminar para proteger tu cuenta y conversaciones.

---

## 15. Preguntas frecuentes

### ¿Necesito pagar para usar la aplicación?

No. Panini Tracker es gratuito para registrar tu colección y buscar intercambios.

### ¿Puedo usar la app sin registrarme?

Solo puedes **ver el mercado público** (`/mercado`) y la política de privacidad. Para guardar tu álbum, matches y chat necesitas una cuenta.

### Guardé cambios pero no veo el porcentaje actualizado

Asegúrate de haber pulsado **Guardar** en el álbum. El Dashboard lee los datos ya persistidos en la nube, no los cambios pendientes locales.

### ¿Por qué no me aparecen matches?

Comprueba que:

1. Tienes **país** configurado en tu perfil.
2. Registraste **repetidas** y **faltantes** en el álbum.
3. Hay otros usuarios activos en tu país.
4. Las figuritas son del catálogo **estándar** (no extras).

### ¿Las figuritas extras cuentan para el 100%?

No. El porcentaje de completitud solo considera el catálogo oficial (~1.034 figuritas).

### ¿Cómo publico mis repetidas en el mercado?

1. Ve a **Perfil**.
2. Activa **Perfil visible**, **Publicar repetidas** y/o **Publicar faltantes**.
3. Guarda tu álbum si hiciste cambios recientes.
4. Pulsa **Publicar / actualizar colección**.

### No recibí el correo de verificación

Revisa spam. Usa **Reenviar enlace** en `/verify-email`. Si el sitio está en prueba, el enlace puede mostrarse en pantalla.

### Olvidé mi contraseña

Ve a `/forgot-password`, ingresa tu correo y sigue el enlace que recibas para establecer una nueva contraseña en `/reset-password`.

### ¿Puedo cambiar mi país después del registro?

El país se define al registrarte o completar perfil. Para cambios posteriores contacta al administrador.

### ¿El chat reemplaza al correo o WhatsApp?

No necesariamente. El chat es una opción integrada; también puedes usar **Enviar invitación** por correo desde Matches o coordinar por otros medios acordados con el otro coleccionista.

### ¿Qué pasa si elimino una figurita guardada?

Se borra de tu colección en la nube. Vuelve a contarse como faltante en estadísticas y matches.

### ¿Funciona sin internet?

Necesitas conexión para guardar, sincronizar el mercado, matches y chat. Puedes consultar reportes ya cargados brevemente si la página sigue en memoria, pero no es un modo offline diseñado.

---

## 16. Glosario

| Término | Definición |
|---------|------------|
| **Pegada** | Figurita que ya colocaste en tu álbum físico (tienes al menos una copia) |
| **Faltante** | Figurita del catálogo estándar que aún no tienes |
| **Repetida** | Copia extra de una figurita que ya pegaste (útil para intercambiar) |
| **Catálogo estándar** | Las ~1.034 figuritas oficiales del álbum Panini Mundial 2026 |
| **Extra** | Figurita promocional o regional fuera del catálogo estándar |
| **Match** | Otro usuario con intercambio potencial bidireccional contigo |
| **Trueque** | Intercambio presencial o acordado de figuritas entre coleccionistas |
| **Oferta** | Publicación en mercado: el usuario tiene repetidas |
| **Búsqueda** | Publicación en mercado: al usuario le falta esa figurita |
| **Sync / sincronizar** | Actualizar publicaciones del mercado según tu álbum guardado |
| **FWC** | Figuritas especiales del álbum (códigos FWC1–FWC19) |
| **Selección** | Equipo nacional representado en el álbum (ej. Perú, Argentina) |

---

## Flujo recomendado para un coleccionista nuevo

```text
1. Registrarse y verificar correo
2. Completar perfil (nombre + país)
3. Ir al Álbum → marcar pegadas y repetidas → Guardar
4. Revisar Dashboard → ver progreso
5. Ir a Matches → contactar por chat o correo
6. (Opcional) Perfil → publicar en mercado
7. (Opcional) Imprimir reporte para trueque antes de un encuentro
8. Después del trueque → actualizar álbum
```

---

*¿Dudas sobre el funcionamiento técnico o despliegue? Consulta [`docs/PROYECTO.md`](../docs/PROYECTO.md) y [`README.md`](../README.md) en el repositorio.*

*Proyecto de Refugio Gastronómico — Panini 2026 Tracker.*
