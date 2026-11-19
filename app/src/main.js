// Wires the Vice Grid editor: photos, panels, caption, grade and PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCoverArt, panelRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const SIZES = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Editor state: two model-made samples start loaded so the poster is alive at once.
const state = {
  photos: [],
  photoNames: ['Pier sunset', 'Boulevard'],
  panels: [
    { photo: 0, zoom: 1.05, panX: 0, panY: 0.1 },
    { photo: 1, zoom: 1.05, panX: 0, panY: 0.2 },
    { photo: 1, zoom: 1.1, panX: 0, panY: 0.3 },
    { photo: 0, zoom: 1.1, panX: 0, panY: 0.28 },
  ],
  layout: 'grid4',
  title: 'SUNSET HEIST',
  subtitle: 'One last job under the neon sky',
  captionStyle: 'band',
  grade: 'sunset',
  size: '1920x1080',
};
let selectedPanel = 0;
let pickedPhoto = 0;

function redraw() {
  const [w, h] = SIZES[state.size];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCoverArt(canvas, state);
}

/** Rebuilds the photo tray thumbnails from the loaded photos. */
function renderPhotoTray() {
  const tray = document.getElementById('photoTray');
  tray.replaceChildren();
  state.photos.forEach((photo, i) => {
    const thumb = document.createElement('img');
    thumb.src = photo.src;
    thumb.alt = state.photoNames[i] ?? `Photo ${i + 1}`;
    thumb.title = thumb.alt;
    if (i === pickedPhoto) thumb.classList.add('is-picked');
    thumb.addEventListener('click', () => {
      pickedPhoto = i;
      state.panels[selectedPanel].photo = i;
      syncPanelControls();
      renderPhotoTray();
      renderPanelStrip();
      redraw();
    });
    tray.appendChild(thumb);
  });
}

/** Rebuilds the draggable panel strip (drag a chip to reorder the panels). */
function renderPanelStrip() {
  const strip = document.getElementById('panelStrip');
  strip.replaceChildren();
  state.panels.forEach((panel, i) => {
    const li = document.createElement('li');
    li.draggable = true;
    li.textContent = `Panel ${i + 1} · ${(state.photoNames[panel.photo] ?? '—').split(' ')[0]}`;
    if (i === selectedPanel) li.classList.add('is-selected');
    li.addEventListener('click', () => {
      selectedPanel = i;
      syncPanelControls();
      renderPanelStrip();
      redraw();
    });
    li.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', String(i));
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', (e) => e.preventDefault());
    li.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData('text/plain'));
      if (Number.isNaN(from) || from === i) return;
      const [moved] = state.panels.splice(from, 1);
      state.panels.splice(i, 0, moved);
      selectedPanel = i;
      syncPanelControls();
      renderPanelStrip();
      redraw();
    });
    strip.appendChild(li);
  });
}

/** Syncs the per-panel controls (photo, zoom, pan) to the selected panel. */
function syncPanelControls() {
  const panel = state.panels[selectedPanel];
  const select = document.getElementById('panelPhoto');
  select.replaceChildren();
  state.photos.forEach((_, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = state.photoNames[i] ?? `Photo ${i + 1}`;
    select.appendChild(opt);
  });
  select.value = String(panel.photo);
  const zoom = document.getElementById('zoom');
  const panX = document.getElementById('panX');
  const panY = document.getElementById('panY');
  zoom.value = String(panel.zoom);
  panX.value = String(panel.panX);
  panY.value = String(panel.panY);
  document.getElementById('zoomVal').textContent = `${panel.zoom.toFixed(2)}×`;
  document.getElementById('panXVal').textContent = panel.panX.toFixed(2);
  document.getElementById('panYVal').textContent = panel.panY.toFixed(2);
}

/** Which panel (if any) sits under a point on the preview canvas. */
function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const fx = (clientX - box.left) / box.width;
  const fy = (clientY - box.top) / box.height;
  const rects = panelRects(state.layout);
  return rects.findIndex((r) => fx >= r.x && fx < r.x + r.w && fy >= r.y && fy < r.y + r.h);
}

// Click a panel to select it; drag inside it to pan its photo.
let dragPanel = -1;
let dragStart = null;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i === -1) return;
  dragPanel = i;
  selectedPanel = i;
  dragStart = { x: e.clientX, y: e.clientY, panX: state.panels[i].panX, panY: state.panels[i].panY };
  canvas.setPointerCapture(e.pointerId);
  syncPanelControls();
  renderPanelStrip();
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (dragPanel === -1 || !dragStart) return;
  const box = canvas.getBoundingClientRect();
  const panel = state.panels[dragPanel];
  panel.panX = Math.max(-0.5, Math.min(0.5, dragStart.panX + (e.clientX - dragStart.x) / box.width));
  panel.panY = Math.max(-0.5, Math.min(0.5, dragStart.panY + (e.clientY - dragStart.y) / box.height));
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => {
  dragPanel = -1;
  dragStart = null;
});

// Control wiring.
document.getElementById('panelPhoto').addEventListener('change', (e) => {
  state.panels[selectedPanel].photo = Number(e.target.value);
  pickedPhoto = Number(e.target.value);
  renderPhotoTray();
  renderPanelStrip();
  redraw();
});
document.getElementById('zoom').addEventListener('input', (e) => {
  state.panels[selectedPanel].zoom = Number(e.target.value);
  syncPanelControls();
  redraw();
});
document.getElementById('panX').addEventListener('input', (e) => {
  state.panels[selectedPanel].panX = Number(e.target.value);
  syncPanelControls();
  redraw();
});
document.getElementById('panY').addEventListener('input', (e) => {
  state.panels[selectedPanel].panY = Number(e.target.value);
  syncPanelControls();
  redraw();
});
document.getElementById('reframe').addEventListener('click', () => {
  const panel = state.panels[selectedPanel];
  panel.zoom = 1.15;
  panel.panX = 0;
  panel.panY = 0;
  syncPanelControls();
  redraw();
});
document.getElementById('layout').addEventListener('change', (e) => {
  state.layout = e.target.value;
  const want = state.layout === 'grid4' ? 4 : 3;
  while (state.panels.length < want) {
    state.panels.push({ photo: state.panels.length % Math.max(1, state.photos.length), zoom: 1.2, panX: 0, panY: 0 });
  }
  state.panels.length = want;
  selectedPanel = Math.min(selectedPanel, want - 1);
  syncPanelControls();
  renderPanelStrip();
  redraw();
});
document.getElementById('caption').addEventListener('input', (e) => {
  state.title = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});
document.getElementById('captionStyle').addEventListener('change', (e) => {
  state.captionStyle = e.target.value;
  redraw();
});
document.querySelectorAll('.grade-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.grade = btn.dataset.grade;
    document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
    redraw();
  });
});
document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.size = btn.dataset.size;
    document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
    redraw();
  });
});

// Add the user's own photos (read on this machine, never uploaded).
document.getElementById('photoFiles').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    if (state.photos.length >= 6) break;
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push(img);
    state.photoNames.push(file.name.replace(/\.[^.]+$/, ''));
  }
  pickedPhoto = state.photos.length - 1;
  syncPanelControls();
  renderPhotoTray();
  renderPanelStrip();
  redraw();
  statusEl.textContent = `${state.photos.length} photos loaded. Click a photo, then a panel.`;
});

/** Renders the cover at one export size and downloads it as a PNG. */
function exportCover(sizeKey) {
  return new Promise((resolve) => {
    const [w, h] = SIZES[sizeKey];
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCoverArt(off, state);
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-grid-cover-${sizeKey}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      statusEl.textContent = `Saved vice-grid-cover-${sizeKey}.png (${w} × ${h})`;
      resolve();
    }, 'image/png');
  });
}
document.getElementById('export').addEventListener('click', () => exportCover(state.size));
document.getElementById('exportAll').addEventListener('click', async () => {
  for (const key of Object.keys(SIZES)) {
    await exportCover(key);
    await new Promise((r) => setTimeout(r, 350));
  }
});

// Boot: load the two samples, then either run a shot scene or the live editor.
const shot = new URLSearchParams(location.search).get('shot');
async function boot() {
  state.photos = [
    await loadImage('samples/pier.jpg'),
    await loadImage('samples/boulevard.jpg'),
  ];
  renderPhotoTray();
  renderPanelStrip();
  syncPanelControls();
  if (shot) {
    runShot(shot, new URLSearchParams(location.search), state, { redraw, renderPanelStrip, syncPanelControls });
  } else {
    redraw();
  }
}
boot();
