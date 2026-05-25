# Obsidian Gym

Ein Plugin für [Obsidian](https://obsidian.md/), mit dem du deine kompletten Trainingspläne abbildest, Workouts trackst und deinen Progress visualisierst — alles als Markdown-Files in deinem Vault.

## Konzept

```
Trainingsplan  →  Trainingseinheit  →  Übung
   (Plan)            (Session)          (Exercise)
```

Jeder Plan, jede Einheit und jede Übung ist eine `.md`-Datei mit YAML-Frontmatter. Du kannst alles über Modal-Dialoge erstellen, aber auch jederzeit per Hand editieren — es ist dein Vault.

Workout-Logs sind ebenfalls Markdown-Files mit strukturiertem Frontmatter, sodass die Daten dir gehören und mit anderen Plugins/Tools nutzbar bleiben.

## Features

- **Strukturierte Konfiguration** — Pläne, Einheiten und Übungen als Markdown mit konfigurierbaren Rep-Ranges, Set-Zahlen, Pausenzeiten und Muskelgruppen
- **Intelligenter Workout-Start** — schlägt automatisch die nächste Einheit deines aktiven Plans vor, basierend auf deinem letzten Workout. Du kannst aber auch immer manuell auswählen
- **Live-Workout-View** — eigene Obsidian-Ansicht mit Inputs pro Set, "Letztes Mal"-Hinweisen, Live-PR-Detection (🏆) und automatischem Pausen-Timer
- **Progress-Dashboard** mit:
  - Personal-Records-Übersicht pro Übung
  - GitHub-style Trainingsfrequenz-Heatmap (26 Wochen)
  - Gewicht-über-Zeit Linienchart pro Übung

## Installation (manuell, da nicht im Community-Store)

1. Build: `npm install && npm run build`
2. Kopiere `manifest.json`, `main.js` und `styles.css` in `<deinVault>/.obsidian/plugins/obsidian-gym/`
3. Aktiviere "Gym" in den Obsidian Community-Plugin-Einstellungen

## Quick Start

1. **Einstellungen öffnen** und ggf. Ordner-Pfade anpassen (Default: `Gym/Plans`, `Gym/Sessions`, `Gym/Exercises`, `Gym/Workouts`)
2. **Übungen anlegen** — Command Palette → `Gym: Übung erstellen`
3. **Trainingseinheiten anlegen** — `Gym: Trainingseinheit erstellen`, Übungen per Dropdown hinzufügen
4. **Trainingsplan anlegen** — `Gym: Trainingsplan erstellen`, Einheiten in Reihenfolge bringen
5. **Workout starten** — Hantel-Icon in der Sidebar oder `Gym: Workout starten`. Die nächste Einheit wird vorgeschlagen
6. **Progress ansehen** — `Gym: Progress-Dashboard öffnen`

## Datei-Formate

### Übung (`Gym/Exercises/Bench Press.md`)

```yaml
---
type: exercise
muscle_groups: [chest, triceps, shoulders]
rep_range: [6, 10]
default_sets: 4
rest_seconds: 150
---
```

### Einheit (`Gym/Sessions/Push Day.md`)

```yaml
---
type: session
exercises:
  - exercise: Bench Press
    sets: 4
    rep_range: [6, 10]
  - exercise: Overhead Press
    sets: 3
    rep_range: [8, 12]
---
```

### Plan (`Gym/Plans/PPL.md`)

```yaml
---
type: plan
sessions: [Push Day, Pull Day, Leg Day]
active: true
---
```

### Workout-Log (`Gym/Workouts/2026-05-25-Push-Day.md`)

```yaml
---
type: workout
date: 2026-05-25
plan: PPL
session: Push Day
duration_seconds: 3420
sets:
  - exercise: Bench Press
    set: 1
    weight: 82.5
    reps: 8
    completed: true
    pr: true
---
```

## Development

```bash
npm install
npm run dev    # watch-mode build
npm run build  # production bundle
```

Symlinke das Repo-Verzeichnis nach `<vault>/.obsidian/plugins/obsidian-gym/` für lokales Testen.

## Lizenz

MIT
