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
  ['current', 'work', 'workbench', 'about', 'research', 'contact'].forEach((id) => navObserver.observe(document.getElementById(id)));
  const reveal = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    if (!motionPreference.matches) entry.target.animate([{ opacity: .2, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 550, easing: 'ease-out' });
    reveal.unobserve(entry.target);
  }), { threshold: .08 });
  document.querySelectorAll('.section-heading, .focus-list article, .timeline-item, .publication, .recognition-list article').forEach((element) => reveal.observe(element));
}

// Deterministic camera–LiDAR projection example. The UI displays computed
// errors for this synthetic fixture, never performance claims about real work.
(() => {
  const canvas = document.querySelector('#calibration-canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const yawInput = document.querySelector('#calibration-yaw');
  const xInput = document.querySelector('#calibration-x');
  const reference = [];
  const focal = 460, width = 640, height = 400;
  const project = (p) => [width / 2 + focal * p[0] / p[2], height / 2 - focal * p[1] / p[2]];
  function line(a, b, count = 18) {
    for (let i = 0; i <= count; i++) reference.push(a.map((v, j) => v + (b[j] - v) * i / count));
  }
  // Two box-like objects, with points along their structural edges.
  function cuboid(x, y, z, w, h, d) {
    const c = [[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]];
    [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([a,b]) => line(c[a],c[b]));
  }
  cuboid(-2.4,-1.3,6.5,1.65,2.25,1.6);
  cuboid(.75,-1.3,8,2.2,1.4,1.7);
  // Back wall with a doorway, plus floor lines for depth context.
  [[[-4,-1.3,12],[-4,2.5,12]],[[-4,2.5,12],[4,2.5,12]],[[4,2.5,12],[4,-1.3,12]],
   [[-.5,-1.3,12],[-.5,1.6,12]],[[-.5,1.6,12],[.75,1.6,12]],[[.75,1.6,12],[.75,-1.3,12]]].forEach(([a,b]) => line(a,b,25));
  for (let x = -4; x <= 4; x += 2) line([x,-1.3,5],[x,-1.3,13],18);
  let lastError = 0;
  function render() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio; canvas.height = height * ratio; ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.fillStyle = '#0a121d'; ctx.fillRect(0,0,width,height);
    ctx.strokeStyle = '#2d48642e'; ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke(); }
    for (let y = 0; y < height; y += 40) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke(); }
    const degrees = Number(yawInput.value), yaw = degrees * Math.PI / 180, tx = Number(xInput.value);
    const sign = (value, places) => (value >= 0 ? '+' : '') + value.toFixed(places);
    document.querySelector('#yaw-value').textContent = sign(degrees,1) + '°';
    document.querySelector('#x-value').textContent = sign(tx,2) + ' m';
    let error = 0;
    for (let i = 0; i < reference.length; i++) {
      const [x,y,z] = reference[i];
      const a = project([x,y,z]);
      const b = project([x*Math.cos(yaw)+z*Math.sin(yaw)+tx,y,-x*Math.sin(yaw)+z*Math.cos(yaw)]);
      error += Math.hypot(a[0]-b[0],a[1]-b[1]);
      if (i % 16 === 0 && Math.abs(degrees)+Math.abs(tx)>.1) {
        ctx.strokeStyle = '#ffb36a36';ctx.lineWidth = .6;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
      }
      ctx.fillStyle = '#59d2ff88'; ctx.fillRect(a[0]-1,a[1]-1,2,2);
      ctx.fillStyle = '#ffb36ade';ctx.beginPath();ctx.arc(b[0],b[1],1.25,0,Math.PI*2);ctx.fill();
    }
    lastError = error/reference.length;
    const errorOutput = document.querySelector('#reprojection-error'); errorOutput.textContent = lastError.toFixed(1);
    const aligned = lastError < .05, color = aligned ? '#59d2ff' : '#ffb36a';
    const state = document.querySelector('#alignment-state');state.textContent = aligned ? 'ALIGNED' : 'OFFSET';state.style.color = color;state.style.borderColor = color + '70';errorOutput.style.color = color;
    const fill = document.querySelector('#alignment-fill');fill.style.transform = `scaleX(${Math.min(lastError/160,1)})`;fill.style.background = color;
    canvas.setAttribute('aria-label', `Synthetic camera–LiDAR projection. Yaw offset ${degrees.toFixed(1)} degrees, lateral offset ${tx.toFixed(2)} meters. Mean reprojection error ${lastError.toFixed(1)} pixels.`);
    ctx.strokeStyle = '#93b0c56b';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(312,200);ctx.lineTo(328,200);ctx.moveTo(320,192);ctx.lineTo(320,208);ctx.stroke();
    ctx.font='9px monospace';ctx.fillStyle='#8da7bf';ctx.fillText('u →',width-35,height-14);ctx.fillText('v ↓',12,20);
  }
  yawInput.addEventListener('input',render);xInput.addEventListener('input',render);
  document.querySelector('#calibration-align').addEventListener('click',() => { yawInput.value=0;xInput.value=0;render(); });
  document.querySelector('#calibration-reset').addEventListener('click',() => { yawInput.value=6;xInput.value=.25;render(); });
  render();
})();
