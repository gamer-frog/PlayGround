# 🌱 HIDROPLAN — Simulador de invernadero NFT

Planificá, presupuestá y compará un invernadero hidropónico **NFT** desde el teléfono.
Armá el plano con caños de **12 m** y **6 m**, agregá reservorio y equipos, y mirá en el
momento cuánto cuesta, cuánto produce y cuánto margen deja.

Web móvil / PWA, en español, con vista isométrica 3D y control total por tacto.

**Cómo abrirla:** serví la raíz del repositorio como sitio estático y entrá desde el navegador.
No hay build ni dependencias que instalar.

```bash
python3 -m http.server 8000
# o
npx serve .
```

En Android podés usar **Agregar a pantalla de inicio** para instalarla como PWA.

## 🧱 Qué podés hacer

- **Construir** — colocar caños NFT de 12 m (60 plantas) y de 6 m (30 plantas), kits de
  reservorio, mesa de almácigo, mesa de trabajo, barra LED, extractor y ambientación.
- **Presupuestar** — cada módulo trae su lista de materiales con cantidades, precios
  orientativos en USD y mano de obra de montaje.
- **Materiales** — lista consolidada por categoría, invernadero base 24 × 16 m incluido
  (opcional), factor de precios por zona y exportación a **CSV**.
- **Producción** — supuestos editables por cultivo (precio, rendimiento por planta y ciclo),
  descarte, kilos e ingresos por mes, y rendimiento marginal de sumar **+1 caño de 12 m** o
  **+1 de 6 m**.
- **Economía** — CAPEX, OPEX mensual, margen, repago, costo por planta e inversión por m².
- **Sistemas** — cada sistema es un proyecto independiente. Se puede abrir, duplicar, crear
  o eliminar. La comparación muestra inversión, plantas, kg/mes, ingresos, margen y repago;
  la proyección “ampliar” agrega N caños al mismo invernadero y calcula inversión extra,
  margen adicional y cuántos caños hacen falta para cubrir los costos.
- **Tu proyecto** — guardado automático en `localStorage`, exportación **JSON** para respaldar
  o mover a otro dispositivo, y reinicio total desde el menú.

## 👆 Controles

| Acción | Gesto |
| --- | --- |
| Mover la cámara | Arrastrar con un dedo |
| Zoom | Pellizcar o usar los botones + / − |
| Construir | CONSTRUIR → elegir módulo → tocar una celda → confirmar |
| Cambiar un módulo | Tocarlo en el plano |
| Cambiar de pantalla | Barra inferior: Construir · Materiales · Producción · Sistemas · Economía |

## 📐 Escala y supuestos

- 1 celda del plano = **1 m**. Invernadero base de **24 × 16 m (384 m²)**.
- Caño NFT de 12 m: **60 plantas** a 20 cm (ajustable entre 20 y 72).
- Caño NFT de 6 m: **30 plantas** a 20 cm.
- Precios, rendimientos y costos son **estimaciones orientativas** en USD, editables desde la app.

## ⚠️ Aviso

Los cálculos sirven para planificar y comparar alternativas. No reemplazan un presupuesto real
de proveedores ni un cálculo de ingeniería. Verificá caudal de bomba, pendientes, calidad del
agua y precios de tu zona antes de invertir.

## 🛠️ Estructura

```
index.html          shell de la app, navegación y ayuda
css/style.css       estilos móviles, hojas y modo apaisado
js/main.js          cámara táctil, colocación, escenarios, guardado y exportaciones
js/data.js          catálogo de módulos, BOM, invernadero, supuestos y cálculos
js/world.js         mundo isométrico a escala 1 celda = 1 m
js/sheets.js        pantallas: construir, materiales, producción, sistemas, economía
js/systems.js       escenarios, comparación, ampliación y break-even
js/format.js        formato de moneda y números (es-AR, USD)
js/audio.js         efectos sintéticos con WebAudio
icons/              icono fuente y PNG para la PWA
manifest.json       manifiesto PWA
```

---

# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/gamer-frog/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/gamer-frog/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/gamer-frog/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/gamer-frog/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/gamer-frog/PlayGround).
- 🛠️ [Check build runs](https://github.com/gamer-frog/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/gamer-frog/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/gamer-frog).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->
