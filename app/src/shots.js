// Fixed scenes for screenshots: ?shot=editor shows the page with the sample photos
// loaded; ?shot=cover shows the exported cover alone, drawn by the app itself.
// Query knobs: photo (sample name, pier|boulevard), caption, subtitle, layout,
// grade, style (caption style), size (1080x1080|1080x1350|1920x1080).
// window.__shotReady is set once the scene has painted.
export function runShot(shot, query, state, ui) {
  const caption = query.get('caption');
  const subtitle = query.get('subtitle');
  const layout = query.get('layout');
  const grade = query.get('grade');
  const style = query.get('style');
  const size = query.get('size');
  if (caption !== null) {
    state.title = caption;
    const input = document.getElementById('caption');
    if (input) input.value = caption;
  }
  if (subtitle !== null) {
    state.subtitle = subtitle;
    const input = document.getElementById('subtitle');
    if (input) input.value = subtitle;
  }
  if (layout && ['grid4', 'hero3', 'triptych3'].includes(layout)) {
    state.layout = layout;
    const select = document.getElementById('layout');
    if (select) select.value = layout;
    const want = layout === 'grid4' ? 4 : 3;
    while (state.panels.length < want) {
      state.panels.push({ photo: state.panels.length % 2, zoom: 1.2, panX: 0, panY: 0 });
    }
    state.panels.length = want;
  }
  if (grade && ['sunset', 'neon', 'noir'].includes(grade)) {
    state.grade = grade;
    document.querySelectorAll('.grade-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.grade === grade));
  }
  if (style && ['band', 'outline', 'stamp'].includes(style)) {
    state.captionStyle = style;
    const select = document.getElementById('captionStyle');
    if (select) select.value = style;
  }
  if (size && ['1080x1080', '1080x1350', '1920x1080'].includes(size)) {
    state.size = size;
    document.querySelectorAll('.size-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.size === size));
  }
  if (shot === 'cover') document.body.classList.add('shot-cover');
  ui.syncPanelControls();
  ui.renderPanelStrip();
  ui.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
