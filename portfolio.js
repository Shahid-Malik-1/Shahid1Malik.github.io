'use strict';

const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', (event) => { if (!event.target.closest('.site-header')) closeMenu(); });

const progress = document.querySelector('.scroll-progress');
let scrollQueued = false;
function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
  scrollQueued = false;
}
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateProgress); }
}, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();
document.querySelector('#year').textContent = new Date().getFullYear();

const projectCards = [...document.querySelectorAll('[data-categories]')];
document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    let count = 0;
    projectCards.forEach((card) => {
      card.hidden = filter !== 'all' && !card.dataset.categories.split(' ').includes(filter);
      if (!card.hidden) count++;
    });
    document.querySelector('#filter-status').textContent = `Showing ${count} projects.`;
    updateProgress();
  });
});

const gallery = [
  ['a.jpg', 'Hardware & sensor integration'],
  ['calib-robot.jpg', 'Exploring multi-sensor and hand–eye calibration'],
  ['p.jpg', 'Presenting research at Saint Louis University'],
  ['j.png', 'Reconstructed point cloud & camera poses'],
  ['f.jpeg', 'Event, polarization & RGB-D sensing'],
  ['thumbnail6.png', 'Multi-sensor calibration results'],
  ['b.jpg', 'Controlled dataset acquisition'],
  ['c.jpg', 'Camera & motor assembly'],
  ['d.jpg', 'Capture across viewpoints and conditions'],
  ['e.jpg', 'Arduino control & synchronization'],
  ['g.png', 'LW-DETR on a custom dataset'],
  ['h.png', 'Satellite image feature correspondences'],
  ['i.png', 'Camera trajectory estimation'],
  ['k.png', 'Satellite 3D reconstruction'],
  ['l.png', 'Polarization-based reconstruction'],
  ['m.jpg', 'Automated multi-sensor recording'],
  ['n.jpg', 'SpaceX Dragon model for event-camera data capture'],
  ['o.png', 'Two-view sensor setup on a robot'],
];
gallery.forEach(([file, caption], index) => {
  const link = document.createElement('a');
  link.className = 'gallery-item'; link.href = file;
  link.dataset.image = file; link.dataset.title = caption;
  const img = document.createElement('img');
  img.src = `assets/portfolio/${file.replace(/\.[^.]+$/, '')}.webp`;
  img.alt = caption; img.loading = 'lazy'; img.width = 600; img.height = 400;
  const text = document.createElement('span'); text.textContent = caption + ' ↗';
  link.append(img, text);
  document.querySelector(index < 6 ? '#gallery-primary' : '#gallery-secondary').append(link);
});

const dialog = document.querySelector('#media-dialog');
const mediaContent = document.querySelector('#media-content');
let mediaTrigger;
function clearMedia() {
  const video = mediaContent.querySelector('video');
  if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
  mediaContent.replaceChildren();
  document.body.classList.remove('modal-open');
  if (mediaTrigger?.isConnected) mediaTrigger.focus({ preventScroll: true });
}
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-video], [data-image]');
  if (!link || typeof dialog.showModal !== 'function' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  mediaTrigger = link;
  document.querySelector('#media-title').textContent = link.dataset.title;
  let media;
  if (link.dataset.video) {
    media = document.createElement('video');
    media.src = link.dataset.video; media.controls = true; media.playsInline = true;
    media.preload = 'metadata'; media.setAttribute('aria-label', link.dataset.title);
    const poster = link.querySelector('img'); if (poster) media.poster = poster.src;
  } else {
    media = document.createElement('img'); media.src = link.dataset.image; media.alt = link.dataset.title;
  }
  mediaContent.replaceChildren(media); dialog.showModal(); document.body.classList.add('modal-open');
  document.querySelector('#close-media').focus();
  if (media.tagName === 'VIDEO') media.play().catch(() => {});
});
document.querySelector('#close-media').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', clearMedia);
dialog.addEventListener('click', (event) => { if (event.target === dialog) {
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
} });

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigation.querySelectorAll('a').forEach((link) => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
  ['current', 'work', 'about', 'research', 'contact'].forEach((id) => navObserver.observe(document.getElementById(id)));
  const reveal = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    if (!motionPreference.matches) entry.target.animate([{ opacity: .2, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 550, easing: 'ease-out' });
    reveal.unobserve(entry.target);
  }), { threshold: .08 });
  document.querySelectorAll('.section-heading, .focus-list article, .timeline-item, .publication, .recognition-list article').forEach((element) => reveal.observe(element));
}

// Small procedural point cloud: visual explanation only, no external 3D library,
// telemetry, employer data, or fabricated reconstruction measurements.
(() => {
  const canvas = document.querySelector('#spatial-canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.querySelector('#scene-fallback').hidden = false;
    document.querySelectorAll('.scene-controls button').forEach((button) => { button.disabled = true; });
    return;
  }
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Illustrative point-cloud room. Drag or use left and right arrow keys to orbit. Use the buttons below to change representation or pause rotation.');
  const points = [];
  let seed = 83;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const point = (x, y, z, kind = 0) => points.push({ x: x + (random() - .5) * .026, y, z: z + (random() - .5) * .026, kind, lum: random() });
  for (let x = -5; x <= 5; x += .25) for (let z = -3.7; z <= 3.7; z += .25) point(x, 0, z, 0);
  for (let x = -5; x <= 5; x += .16) for (let y = 0; y <= 3; y += .17) {
    if (!(x > -1.4 && x < .15 && y < 2.3)) point(x, y, -3.7, 1);
  }
  for (let z = -3.7; z <= 2.5; z += .18) for (let y = 0; y <= 2.65; y += .2) point(-5, y, z, 1);
  function box(x, z, w, d, h) {
    for (let a = 0; a <= w; a += .14) for (let b = 0; b <= d; b += .14) point(x + a, h, z + b, 2);
    for (let a = 0; a <= w; a += .14) for (let y = 0; y <= h; y += .15) { point(x + a, y, z, 2); point(x + a, y, z + d, 2); }
    for (let b = 0; b <= d; b += .14) for (let y = 0; y <= h; y += .15) { point(x, y, z + b, 2); point(x + w, y, z + b, 2); }
  }
  box(1.9, -2.5, 1.4, 1.15, 1.7); box(-3.6, -.9, 1.3, 1.1, 1.05); box(2.5, .5, 1.05, 1.2, .75);
  for (let y = 0; y <= 2.8; y += .1) for (let a = 0; a < Math.PI * 2; a += .4) point(-3.9 + Math.cos(a) * .18, y, -2.8 + Math.sin(a) * .18, 3);
  let width = 500, height = 520, yaw = -.48, pitch = .5, mode = 'points';
  let paused = motionPreference.matches, visible = true, dragging = false, lastX = 0, frame = 0, lastTime = 0;
  const motionButton = document.querySelector('#scene-motion');
  function updateMotionButton() {
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.setAttribute('aria-label', paused ? 'Start scene rotation' : 'Pause scene rotation');
    motionButton.textContent = paused ? 'Rotate ▷' : 'Pause Ⅱ';
  }
  function project(x, y, z) {
    const rx = x * Math.cos(yaw) - z * Math.sin(yaw);
    const rz = x * Math.sin(yaw) + z * Math.cos(yaw);
    const vertical = y * Math.cos(pitch) - rz * Math.sin(pitch);
    const depth = y * Math.sin(pitch) + rz * Math.cos(pitch);
    const scale = Math.min(width / 13, height / 11) * 14 / (14 + depth);
    return { x: width * .51 + rx * scale, y: height * .50 - vertical * scale, depth, scale };
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#9bcca512'; ctx.lineWidth = .6;
    for (let x = -5; x <= 5; x++) { const a = project(x, 0, -3.7), b = project(x, 0, 3.7); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    for (let z = -3; z <= 3; z++) { const a = project(-5, 0, z), b = project(5, 0, z); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    const projected = points.map((p) => ({ ...project(p.x, p.y, p.z), kind: p.kind, lum: p.lum, elevation: p.y })).sort((a, b) => b.depth - a.depth);
    for (const p of projected) {
      if (p.y < 65 || p.y > height - 150) continue;
      const alpha = (p.kind === 0 ? .23 : .58) + p.lum * .28;
      if (mode === 'depth') { const hue = 32 + ((p.depth + 7) / 14) * 170; ctx.fillStyle = `hsla(${hue},70%,68%,${alpha})`; }
      else ctx.fillStyle = p.kind === 0 ? `rgba(153,192,151,${alpha})` : p.kind === 2 ? `rgba(206,231,152,${alpha})` : `rgba(153,214,167,${alpha})`;
      const size = Math.max(.55, Math.min(1.8, p.scale / 31)) * (p.kind === 2 ? 1.12 : .82);
      ctx.beginPath(); ctx.arc(p.x, p.y, size, 0, Math.PI * 2); ctx.fill();
    }
    // A schematic sensor trajectory across the scene floor.
    ctx.beginPath(); ctx.strokeStyle = '#e9c789a6'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
    for (let t = 0; t <= 1; t += .025) { const p = project(-2 + t * 3.9, .04, 2.4 - Math.sin(t * Math.PI) * .9); if (t === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
    ctx.stroke(); ctx.setLineDash([]);
    const sensor = project(.2, .13, 1.45); ctx.fillStyle = '#ebd09d'; ctx.beginPath(); ctx.arc(sensor.x, sensor.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ebd09d55'; ctx.beginPath(); ctx.arc(sensor.x, sensor.y, 10, 0, Math.PI * 2); ctx.stroke();
    const origin = { x: width - 44, y: 91 };
    ctx.font = '8px monospace'; ctx.lineWidth = 1;
    [[20,0,'X','#b6ccad'],[0,-20,'Y','#e6c38b'],[-12,12,'Z','#8aaec1']].forEach(([x,y,label,color]) => { ctx.strokeStyle=color;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(origin.x+x,origin.y+y);ctx.stroke();ctx.fillText(label,origin.x+x+3,origin.y+y+3); });
  }
  function tick(time) {
    frame = 0;
    if (!visible || document.hidden || paused || dragging) return;
    if (time - lastTime >= 32) { yaw += Math.min(time - lastTime, 50) * .000045; lastTime = time; draw(); }
    frame = requestAnimationFrame(tick);
  }
  function start() { if (!frame && visible && !document.hidden && !paused && !dragging) { lastTime = performance.now(); frame = requestAnimationFrame(tick); } }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; }
  function resize() {
    const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
  document.querySelectorAll('[data-scene]').forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.scene; document.querySelectorAll('[data-scene]').forEach((other) => other.setAttribute('aria-pressed', String(other === button))); draw();
  }));
  motionButton.addEventListener('click', () => { paused = !paused; updateMotionButton(); if (paused) stop(); else start(); });
  document.querySelector('#scene-reset').addEventListener('click', () => { yaw = -.48; pitch = .5; draw(); });
  canvas.addEventListener('pointerdown', (event) => { dragging = true; lastX = event.clientX; stop(); canvas.classList.add('dragging'); canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', (event) => { if (!dragging) return; yaw += (event.clientX - lastX) * .008; lastX = event.clientX; draw(); });
  function endDrag() { dragging = false; canvas.classList.remove('dragging'); start(); }
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); yaw += event.key === 'ArrowLeft' ? -.12 : .12; draw(); } });
  if ('IntersectionObserver' in window) new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) start(); else stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  motionPreference.addEventListener('change', () => { paused = motionPreference.matches; updateMotionButton(); if (paused) stop(); else start(); });
  updateMotionButton(); resize(); start();
})();
