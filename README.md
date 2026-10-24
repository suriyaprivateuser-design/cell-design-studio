# Cell Design Studio · Plant Tissue Explorer

เว็บแอปให้นักเรียนมัธยมศึกษาตอนปลายเรียนรู้เนื้อเยื่อพืชผ่านการออกแบบเซลล์ 3 มิติ

**Problem → Design Cell → Observe Changes → Test → Discover Plant Tissue → Explain**


## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npx tsc --noEmit   # typecheck
npm run lint
```

To deploy on Vercel, import this repository as a new project. The default settings work (framework Next.js, root directory `/`).

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, React Three Fiber and Three.js, Zustand (progress saved in localStorage), Framer Motion and Lucide React. There is no login and no backend.

## Status by phase

| Phase | Scope | Status |
|---|---|---|
| 1 · App Foundation | Layout, Home, Mission Selection (9 missions, Student Discovery Mode), Problem Screen for all 9 missions | Done |
| 2 · Functional Studio | Mission 01 (Parenchyma) end to end: Studio → Test → Results → Discovery → Compare → Knowledge → Mini Quiz | Done |
| 3 · Basic Ground Tissue | Collenchyma, Sclerenchyma studios | Planned. The 3D engine already supports corner (angular) thickening, secondary walls and lignin. |
| 4 · Other Plant Tissues | Meristem, epidermis, guard cells, xylem, phloem, periderm | Planned |
| 5 · Knowledge & Assessment | Compare, Knowledge, Quiz, Classification, Library | Built for parenchyma, with the classification chart complete. Other tissues show a summary card until their mission exists. |

Missions 02–09 already have their problem screens. Their "เริ่มออกแบบเซลล์" button is replaced by a note giving the phase in which that studio arrives, so there are no dead buttons.

## Pages

| # | Page | Route |
|---|---|---|
| 01 | Home | `/` |
| 02 | Mission Selection | `/missions` |
| 03 | Problem Screen | `/missions/[id]` |
| 04 | Cell Design Studio | `/missions/[id]/studio` |
| 05 | Test Results | `/missions/[id]/results` |
| 06 | Compare with Real Tissue | `/missions/[id]/compare` |
| 07 | Tissue Knowledge | `/library/[id]` (the 4 tabs) |
| 08 | Mini Quiz | `/missions/[id]/quiz`, hub at `/quiz` |
| 09 | Plant Tissue Classification | `/classification` |
| 10 | Tissue Library | `/library` |

Mission ids in URLs are numbers, so the URL never reveals the tissue name.

## Code layout: content, rules and UI are separate

```
src/content/      LESSON CONTENT (teachers edit here)
  missions.ts       problems, goals, which controls each mission shows, starting design
  tissues.ts        knowledge tabs, reference designs, compare traits, micrograph slots
  quizzes.ts        mini-quiz questions with explanations
  classification.ts classification chart
src/simulation/   SIMULATION RULES
  design.ts         the CellDesign object, control definitions and wording
  dims.ts           design → model dimensions (shared by 3D and 2D)
  rules.ts          rule engine: qualitative levels (high / medium / low) with reasons
  missions/mission01.ts   Mission 01 metrics, factors and goal checks
src/three/        3D MODEL (React Three Fiber)
  shape.ts          cell surface (truncated octahedron / sphere / hexagonal prism)
  cellGeometry.ts   wall layers, protoplast, cut faces, labels
  tissueBlock.ts    "เนื้อเยื่อ 3D" view: a block of many cells extruded from the tissue section
src/tissue/       2D tissue section (SVG, light-microscope style)
src/components/   UI
src/app/          routes
```

### How performance is shown

There are no scores. Each metric in `src/simulation/missions/mission01.ts` is a list of biology statements ("factors"), and each one checks the design. The level shown (สูง / ปานกลาง / ต่ำ) depends on how many factors push it up or down, and every factor that applies is listed as the reason. Any level a student sees can be traced back to sentences they can read. Thresholds are 0–1 slider positions and teaching approximations, not measured values. The studio states this under the panel.

### Everything a slider changes is real geometry

- **Size** scales the cell, and the camera is framed for the largest cell, so the change is visible. The wall thickness stays in absolute units.
- **Primary and secondary wall** values are insets along the surface normal, so a thicker wall is thicker everywhere. Lignin is coloured on the secondary wall.
- **Corner thickening** adds inset where faces meet (for angular collenchyma in Phase 3).
- **Vacuole** scales the vacuole inside the protoplast. The nucleus moves to the wall (parietal) as the vacuole grows.
- **Intercellular space** rounds the cell corners in 3D and opens spaces where cells meet in the tissue preview.
- **Living / dead** removes the whole protoplast, leaving an empty lumen.

## Editing content (for teachers)

- **Problem or goal wording:** `src/content/missions.ts`. A goal's `id` must match a goal in the mission's rules file.
- **Knowledge text:** `src/content/tissues.ts` (`overview`, `structure`, `function`, `location`, `keyFeatures`).
- **Quiz questions:** `src/content/quizzes.ts`. `answer` is the index of the correct choice, starting at 0. `why` explains a wrong choice.
- **Microscope photographs:** add files under `public/micrographs/` and list them in the tissue's `micrographs` array with `credit`, `license` and `sourceUrl`. Use only images whose licence allows classroom use. Never add AI-generated images as micrographs.

## Scientific review notes (please check)

The brief mentions an attached PDF and a reference mockup. Neither was available when this version was built. The content follows the สสวท. scope listed in the brief and standard plant anatomy, and the UI follows the written design direction. Once the PDF is available, check these points against it and against the สสวท. textbook:

1. **Epidermis and periderm: simple or complex?** Textbooks differ. The classification page lists them in a separate "classified differently" group under criterion 1 and asks teachers to follow the textbook in use.
2. **Wall thickness is exaggerated** in every model and preview so it is visible. A real primary wall is about 0.1–1 µm on a cell of 20–150 µm. The app says so wherever a model appears.
3. **The cell size range** (about 20–150 µm) is a broad teaching range. Storage parenchyma in potato tubers can be larger.
4. **Parenchyma with secondary walls:** some parenchyma (for example xylem parenchyma, sclerified parenchyma) can form lignified secondary walls. Mission 01 treats a secondary wall as a poor fit *for storage*, not as impossible for parenchyma, and the compare traits say "โดยทั่วไปไม่มีผนังทุติยภูมิ".
5. **Plastids:** the storage-parenchyma model shows amyloplasts only. Chloroplasts are not added by default, and the knowledge tab explains chlorenchyma separately.
6. **No real micrographs are bundled yet.** The compare page shows the reference *model* and says it is a model. A licensed light-microscope image (or a photo from the class's own iodine-stained potato slide) still needs to be added to meet the "compare with real tissue images" criterion fully.
