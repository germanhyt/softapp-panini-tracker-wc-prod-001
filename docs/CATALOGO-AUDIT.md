# Auditoría del catálogo — Panini Mundial 2026

> Verificación previa a deploy · Junio 2026  
> Script: `npm run verify:catalog`

## Fuentes consultadas

| Fuente | Qué valida |
|--------|------------|
| [Panini Group — WC26 pack contents](https://www.paninigroup.com/en/wc26pack-contents) | 980 figuritas, 48 selecciones × 20, códigos de 3 letras, prefijo FWC |
| [Cartophilic Info Exchange — checklist completo](https://cartophilic-info-exch.blogspot.com/2026/03/panini-fifa-world-cup-2026-mexusacan-09_030880692.html) | 48 códigos XXX-1…20, FWC-1…19, 00 Panini Logo |
| [paniniwm2026sticker.com](https://paniniwm2026sticker.com/) | Orden de grupos en el álbum físico (A–L) |
| [Scanini — checklist por selección](https://scanini.app/albums/world-cup-2026) | Estructura MEX1–20, foto en #13, escudo en #1 |

---

## Resultado ejecutivo

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **Total set oficial** | ✅ OK | 20 especiales + 48×20 = **980** |
| **48 selecciones** | ✅ OK | Mismos códigos que checklist Cartophilic/Panini |
| **Códigos de 3 letras** | ✅ OK | MEX, CZE, CIV, CUW, KOR, etc. |
| **Especiales FWC** | ✅ OK | `00` + `FWC1`…`FWC19` (intro + museo FIFA) |
| **20 figuritas/selección** | ✅ OK | Escudo #1, foto #13, 18 jugadores |
| **Orden páginas álbum** | ✅ OK | Coincide con álbum físico (grupos A–L, anfitriones primero) |
| **Coca-Cola (CC)** | ⚠️ Atención | Promo regional; **no** cuenta en el 980 oficial |
| **Nombres de jugadores** | — N/A | La app solo trackea códigos (diseño intencional) |

**Conclusión:** el catálogo **read-only** de figuritas y selecciones es **fiable para el álbum oficial de 980 códigos**. La única salvedad relevante es la sección **CC (Coca-Cola)**, que es promocional y altera el porcentaje de completitud si se incluye en el dashboard.

---

## Desglose numérico

```
Especiales:     00 + FWC1…FWC19  =  20
Nacionales:     48 selecciones × 20 = 960
─────────────────────────────────────
Set oficial Panini:                 980

Promo Coca-Cola:  CC1…CC14         =  14  (versión LatAm; no oficial)
Total en la app:                    994
```

---

## Estructura de especiales (oficial)

| Código | Contenido oficial |
|--------|-------------------|
| `00` | Logo Panini |
| `FWC1`–`FWC5` | Emblema oficial (2), mascotas, slogan, balón |
| `FWC6`–`FWC8` | Emblemas anfitriones: Canadá, México, USA |
| `FWC9`–`FWC19` | Museo FIFA — campeones históricos (11 foil + otros impresos en álbum) |

El proyecto modela **19 códigos FWC coleccionables** + `00`, alineado con Panini.

---

## 48 selecciones — códigos verificados

Todos presentes en `src/lib/domain/catalog.ts`:

ALG, ARG, AUS, AUT, BEL, BIH, BRA, CAN, CIV, COL, CPV, CRO, CUW, CZE, ECU, EGY, ENG, ESP, FRA, GER, GHA, HAI, IRN, IRQ, JOR, JPN, KOR, KSA, MAR, MEX, NED, NOR, NZL, PAN, PAR, POR, QAT, RSA, SCO, SEN, SUI, SWE, TUN, TUR, URU, USA, UZB, COD

Notas de nomenclatura (correctas según Panini):
- **CIV** — Costa de Marfil (no `IVC`)
- **CUW** — Curaçao
- **COD** — RD Congo
- **KOR** — Corea del Sur
- **SCO** — Escocia (participante confirmado)

---

## Orden en el álbum vs sorteo FIFA

El **sorteo FIFA** ordena por cabeza de serie dentro de cada grupo (ej. Grupo A: CZE, MEX, RSA, KOR).

El **álbum físico Panini** usa otro criterio: **anfitriones y favoritos primero** dentro de cada grupo (ej. Grupo A: **MEX**, RSA, KOR, CZE).

El catálogo del proyecto sigue el **orden del álbum físico**, no el del sorteo. Esto es correcto para:
- Navegación por páginas (`/album`)
- Reporte visual
- Etiquetas de página (`getAlbumPageRange`)

Grupos confirmados contra paniniwm2026.com:
- A: MEX → RSA → KOR → CZE ✅
- B: CAN → BIH → QAT → SUI ✅
- H: ESP → CPV → KSA → URU ✅

El array completo en `catalog.ts` coincide con el orden A–L del álbum.

---

## Estructura por selección (oficial)

Para cada código `XXX1`…`XXX20`:

| # | Tipo |
|---|------|
| 1 | Escudo oficial (foil) |
| 2–12 | Jugadores |
| 13 | Foto de equipo |
| 14–20 | Jugadores |

La app no almacena nombres de jugadores — solo el código. Suficiente para tracker, matches y mercado.

---

## Coca-Cola (CC) — promo regional

| Versión | Figuritas | Región |
|---------|-----------|--------|
| V1 | CC1–CC12 | Canadá / USA |
| V2 | **CC1–CC14** | **Latinoamérica** (papel/plástico) |
| V3 | CC1–CC12 | Europa (Francia, UK, etc.) |
| V4 | variable | Resto del mundo |

El proyecto define **CC1–CC14**, alineado con la **versión latinoamericana** (relevante para Perú).

⚠️ **Problemas actuales:**
1. CC está en el catálogo **estándar** → el dashboard muestra **994** en lugar de **980** como total.
2. Los jugadores CC **varían por región**; los códigos CC1–CC14 no representan al mismo jugador en todas las ediciones.
3. No entra en match finder ni mercado (solo catálogo estándar) — coherente.

**Recomendación pre-deploy:**
- Excluir `CC` del cálculo de `% completitud` oficial, **o**
- Mover CC a la sección **Extras** / promo opcional.

---

## Qué NO valida este catálogo

- Paralelos de borde (blue, red, purple, etc.)
- Extra Stickers (púrpura/bronce/plata/oro) — ~1 cada 100 sobres
- Figuritas Coca-Cola de otras regiones (12 vs 14)
- Nombres de jugadores individuales
- Variantes United Edition / white border

Esas piezas deben seguir usando **Extras** (`/extras`) o futuras extensiones de promo.

---

## Comando de verificación

```bash
npm run verify:catalog
```

Salida esperada en catálogo correcto:
```
✅ Conteo oficial 980: OK
✅ 48 selecciones y códigos ISO de 3 letras: OK
✅ 20 figuritas por selección nacional: OK
✅ Orden de páginas del álbum físico (grupos A–L): OK
⚠️  CC (Coca-Cola) está en el catálogo estándar...
```

---

## Referencia en código

- Catálogo maestro: `src/lib/domain/catalog.ts`
- Seed BD: `prisma/seed.ts` → `buildCatalogSeedRows()`
- Páginas álbum: `src/lib/domain/album-pages.ts`
- Progreso / stats: `src/lib/domain/progress.ts`
