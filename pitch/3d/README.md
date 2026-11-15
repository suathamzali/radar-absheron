# 3D pitch illustrations

`scene.html` draws two pictures with three.js from the app's real images:

- `?scene=hero`: NISAR (simplified model) above the MODIS true-colour view of 12 Jul 2026 (clouds), with the NISAR radar view of the same morning seen through a hole in the cloud layer.
- `?scene=stack`: the 10 provisional NISAR SME2 soil-moisture maps (18 Jun to 16 Oct 2026, one fixed colour scale) stacked in time; 4 Oct is the pass after the 3 Oct rain.

Render (local server on port 8765, from the repo root):

```
chrome --headless=new --enable-unsafe-swiftshader --use-angle=swiftshader --hide-scrollbars --default-background-color=00000000 --window-size=1400,1100 --virtual-time-budget=15000 --screenshot=pitch/img/3d-hero.png "http://localhost:8765/pitch/3d/scene.html?scene=hero&w=1400&h=1000"
```

Data credits: NISAR L3 SME2 (NASA/JPL, doi:10.5067/NIL3SME2-P1); MODIS Terra true colour via NASA GIBS.
