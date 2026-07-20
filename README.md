# Focus Timer

A simple Pomodoro-style focus timer for the browser. Work in focused sprints, take breaks, and keep a log of what you got done.

## Features

- Focus / Short Break / Long Break modes (25 / 5 / 15 minutes)
- Animated countdown ring with a live time display
- Automatically cycles into a long break every 4th focus session
- Optional task label for each focus session
- Daily session log stored locally in the browser (`localStorage`), with a running total of sessions and minutes focused
- Light and dark themes based on your system preference

## Running it

No build step or dependencies. Just open `index.html` in a browser:

```bash
open index.html
```

Or serve it locally, e.g.:

```bash
python3 -m http.server 8000
```

then visit `http://localhost:8000`.
