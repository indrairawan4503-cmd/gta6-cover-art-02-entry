// Draws the Vice Grid cover: a multi-panel poster with a sunset/neon grade and a
// bold condensed caption band. `state` is { photos, panels, layout, title, subtitle,
// captionStyle, grade }. Photos are HTMLImageElements (or null); each panel is
// { photo, zoom, panX, panY } where photo indexes into photos.

export const LAYOUTS = {
  grid4: 'Poster grid · 2 × 2',
  hero3: 'Hero + strip · 3 panels',
  triptych3: 'Triptych · 3 columns',
};

/** Panel rectangles for a layout, as fractions of the cover (gutters included). */
export function panelRects(layout, gutter = 0.014) {
  const g = gutter;
  if (layout === 'hero3') {
    return [
      { x: 0, y: 0, w: 1, h: 0.62 - g / 2 },
      { x: 0, y: 0.62 + g / 2, w: 0.5 - g / 2, h: 0.38 - g / 2 },
      { x: 0.5 + g / 2, y: 0.62 + g / 2, w: 0.5 - g / 2, h: 0.38 - g / 2 },
    ];
  }
  if (layout === 'triptych3') {
    const w = (1 - 2 * g) / 3;
    return [
      { x: 0, y: 0, w, h: 1 },
      { x: w + g, y: 0, w, h: 1 },
      { x: 2 * (w + g), y: 0, w, h: 1 },
    ];
  }
  // grid4 (default): 2 × 2 poster grid.
  const half = (1 - g) / 2;
  return [
    { x: 0, y: 0, w: half, h: half },
    { x: half + g, y: 0, w: half, h: half },
    { x: 0, y: half + g, w: half, h: half },
    { x: half + g, y: half + g, w: half, h: half },
  ];
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
export function drawPanelPhoto(ctx, photo, rect, panel) {
  if (!photo) return;
  const pw = photo.naturalWidth;
  const ph = photo.naturalHeight;
  if (!pw || !ph) return;
  const zoom = panel?.zoom ?? 1;
  const scale = Math.max(rect.w / pw, rect.h / ph) * zoom;
  const dw = pw * scale;
  const dh = ph * scale;
  // Pan, clamped so the photo always covers the panel (no gaps at the edges).
  const rawX = rect.x + (rect.w - dw) / 2 + (panel?.panX ?? 0) * rect.w;
  const rawY = rect.y + (rect.h - dh) / 2 + (panel?.panY ?? 0) * rect.h;
  const dx = Math.max(rect.x + rect.w - dw, Math.min(rect.x, rawX));
  const dy = Math.max(rect.y + rect.h - dh, Math.min(rect.y, rawY));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

/** Sunset / neon / noir colour grade laid over the whole cover. */
export function drawGrade(ctx, w, h, grade) {
  if (grade === 'noir') {
    ctx.save();
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    const shade = ctx.createLinearGradient(0, 0, w, h);
    shade.addColorStop(0, 'rgba(255,255,255,0.10)');
    shade.addColorStop(1, 'rgba(0,0,20,0.35)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    const glow = ctx.createLinearGradient(0, 0, w, h);
    glow.addColorStop(0, 'rgba(0, 229, 255, 0.30)');
    glow.addColorStop(0.55, 'rgba(255, 46, 136, 0.24)');
    glow.addColorStop(1, 'rgba(123, 92, 255, 0.36)');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, 'rgba(0, 229, 255, 0.10)');
    wash.addColorStop(1, 'rgba(255, 46, 136, 0.12)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  } else {
    // sunset (default): warm orange rising from the bottom into magenta.
    const warm = ctx.createLinearGradient(0, h * 0.25, 0, h);
    warm.addColorStop(0, 'rgba(255, 154, 61, 0)');
    warm.addColorStop(0.6, 'rgba(255, 110, 80, 0.30)');
    warm.addColorStop(1, 'rgba(200, 40, 120, 0.55)');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    const wash = ctx.createLinearGradient(0, h * 0.55, 0, h);
    wash.addColorStop(0, 'rgba(255, 120, 60, 0)');
    wash.addColorStop(0.6, 'rgba(255, 90, 40, 0.14)');
    wash.addColorStop(1, 'rgba(160, 20, 110, 0.26)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
  }
  // Vignette: pull the eye to the middle of the poster.
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,0,20,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/** Bold condensed caption band across the foot of the cover. */
export function drawCaptionBand(ctx, w, h, title, subtitle, style) {
  const text = (title || '').trim().toUpperCase();
  const sub = (subtitle || '').trim();
  const bandH = h * 0.2;
  const bandY = h - bandH;
  if (style === 'stamp') {
    ctx.fillStyle = 'rgba(12, 4, 24, 0.88)';
    ctx.fillRect(0, bandY + bandH * 0.12, w, bandH * 0.76);
    ctx.fillStyle = '#ff2e88';
    ctx.fillRect(0, bandY + bandH * 0.12, w, h * 0.012);
  } else {
    const band = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
    band.addColorStop(0, 'rgba(16, 4, 32, 0)');
    band.addColorStop(1, style === 'neon' ? 'rgba(10, 2, 30, 0.92)' : 'rgba(24, 4, 40, 0.92)');
    ctx.fillStyle = band;
    ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);
  }
  if (sub) {
    const subSize = Math.max(14, h * 0.026);
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = style === 'neon' ? '#7df9ff' : '#ffb35c';
    ctx.fillText(sub.toUpperCase(), w / 2, bandY + bandH * 0.3);
  }
  if (!text) return;
  let size = h * 0.115;
  const font = (s) => `900 ${s}px Impact, 'Arial Narrow', 'Helvetica Neue', sans-serif`;
  ctx.font = font(size);
  while (ctx.measureText(text).width > w * 0.92 && size > 16) {
    size -= 2;
    ctx.font = font(size);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const ty = h - h * 0.055;
  if (style === 'outline') {
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.strokeStyle = '#ff2e88';
    ctx.strokeText(text, w / 2, ty);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, ty);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.03;
    ctx.fillText(text, w / 2, ty);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  // Accent rule under the title.
  ctx.fillStyle = style === 'neon' ? '#00e5ff' : '#ff9a3d';
  const ruleW = Math.min(w * 0.24, ctx.measureText(text).width * 0.5);
  ctx.fillRect((w - ruleW) / 2, h - h * 0.028, ruleW, Math.max(3, h * 0.006));
}

/** Draws the whole cover onto `canvas` at its own pixel size. */
export function drawCoverArt(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const rects = panelRects(state.layout);
  // Poster paper: near-black violet gutters between panels.
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, 0, w, h);
  rects.forEach((frac, i) => {
    const rect = { x: frac.x * w, y: frac.y * h, w: frac.w * w, h: frac.h * h };
    const panel = state.panels[i];
    const photo = panel ? state.photos[panel.photo] ?? null : null;
    if (!photo) {
      const shade = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
      shade.addColorStop(0, '#3d2158');
      shade.addColorStop(1, '#1b1029');
      ctx.fillStyle = shade;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    } else {
      drawPanelPhoto(ctx, photo, rect, panel);
    }
  });
  drawGrade(ctx, w, h, state.grade);
  drawCaptionBand(ctx, w, h, state.title, state.subtitle, state.captionStyle);
}
