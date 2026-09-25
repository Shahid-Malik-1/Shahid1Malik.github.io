'use strict';
// Original illustrative articulated models, not scans or proprietary robot assets.
(() => {
  const canvas = document.querySelector('#spatial-canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    document.querySelector('#scene-fallback').hidden = false;
    document.querySelectorAll('.robot-stage button').forEach(b => b.disabled = true);
    return;
  }
  canvas.tabIndex = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let w=640,h=650,yaw=-.3,model='both',mode='solid',sensors=false;
  let paused=reduced.matches,visible=true,dragging=false,lastX=0,t=0,frame=0,last=0;
  let faces=[], beams=[];
  const add=(a,b)=>a.map((v,i)=>v+b[i]);
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const mul=(a,s)=>a.map(v=>v*s);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>mul(a,1/(Math.hypot(...a)||1));
  const palette={shell:[191,211,228],dark:[28,43,61],joint:[64,86,107],cyan:[72,208,255],orange:[242,157,82]};
  function project(p){
    const x=p[0]*Math.cos(yaw)-p[2]*Math.sin(yaw),z=p[0]*Math.sin(yaw)+p[2]*Math.cos(yaw);
    const pitch=.20,target=model==='quadruped'?.65:1.4, y=(p[1]-target)*Math.cos(pitch)-z*Math.sin(pitch),depth=(p[1]-target)*Math.sin(pitch)+z*Math.cos(pitch);
    const scale=Math.min(w/5.5,(h-260)/3.1)*(model==='quadruped'?1.55:1)*9/(9+depth);
    return {x:w*.51+x*scale,y:h*.5-18-y*scale,z:depth,scale};
  }
  function poly(vertices,color){faces.push({v:vertices,color});}
  function cuboid(center,size,color){
    const [x,y,z]=center,[a,b,c]=size.map(n=>n/2),bevel=Math.min(a,b,c)*.22;
    const ring=(yy,aa,cc)=>[[-aa+bevel,-cc],[aa-bevel,-cc],[aa,-cc+bevel],[aa,cc-bevel],[aa-bevel,cc],[-aa+bevel,cc],[-aa,cc-bevel],[-aa,-cc+bevel]].map(([xx,zz])=>[x+xx,y+yy,z+zz]);
    const rings=[ring(-b,a-bevel,c-bevel),ring(-b+bevel,a,c),ring(b-bevel,a,c),ring(b,a-bevel,c-bevel)];
    for(let j=0;j<3;j++)for(let i=0;i<8;i++)poly([rings[j][i],rings[j][(i+1)%8],rings[j+1][(i+1)%8],rings[j+1][i]],color);
    poly([...rings[0]].reverse(),color);poly(rings[3],color);
  }
  function ellipsoid(center,radii,color){
    const ring=(j)=>Array.from({length:12},(_,i)=>add(center,[Math.sin(j*Math.PI/8)*Math.cos(i*Math.PI/6)*radii[0],Math.cos(j*Math.PI/8)*radii[1],Math.sin(j*Math.PI/8)*Math.sin(i*Math.PI/6)*radii[2]]));
    for(let j=0;j<8;j++){const a=ring(j),b=ring(j+1);for(let i=0;i<12;i++)poly([a[i],a[(i+1)%12],b[(i+1)%12],b[i]],color);}
  }
  function limb(a,b,r,color,r2=r){
    const d=unit(sub(b,a));const u=unit(cross(d,Math.abs(d[1])>.9?[1,0,0]:[0,1,0]));const v=cross(d,u);
    const rings=[a,b].map((c,j)=>Array.from({length:8},(_,i)=>add(c,add(mul(u,Math.cos(i*Math.PI/4)*(j?r2:r)),mul(v,Math.sin(i*Math.PI/4)*(j?r2:r))))));
    for(let i=0;i<8;i++)poly([rings[0][i],rings[0][(i+1)%8],rings[1][(i+1)%8],rings[1][i]],color);
    poly(rings[0],color);poly([...rings[1]].reverse(),color);
  }
  function joint(p,r=.09){ellipsoid(p,[r,r,r],palette.joint);}
  function quadruped(cx,cz){
    const bob=Math.sin(t*2)*.025,base=[cx,.99+bob,cz];
    cuboid(base,[1.30,.34,.54],palette.dark);
    cuboid(add(base,[-.06,.08,0]),[1.08,.23,.58],palette.shell);
    cuboid(add(base,[.55,.07,0]),[.30,.29,.49],palette.shell);
    cuboid(add(base,[.716,.065,0]),[.022,.16,.40],palette.dark);
    [-.12,.12].forEach(z=>cuboid(add(base,[.734,.075,z]),[.025,.058,.062],palette.cyan));
    cuboid(add(base,[-.05,.24,0]),[.22,.10,.20],palette.dark);
    cuboid(add(base,[-.05,.301,0]),[.20,.025,.18],palette.cyan);
    for(const x of [-.48,.48])for(const z of [-.28,.28]){
      const phase=t+(x*z>0?0:Math.PI),swing=Math.sin(phase)*.19,lift=Math.max(0,Math.cos(phase))*.13;
      const hip=[cx+x,1.0+bob,cz+z];
      const knee=[cx+x+(x>0?-.12:.16)+swing*.4,.53,cz+z*1.28];
      const foot=[cx+x+swing,.09+lift,cz+z*1.38];
      joint(hip,.1);limb(hip,knee,.086,palette.shell,.067);joint(knee,.074);limb(knee,foot,.043,palette.dark,.032);
      cuboid(foot,[.16,.10,.11],palette.dark);
      cuboid(add(knee,[0,.018,-.063]),[.035,.045,.018],palette.cyan);
    }
    if(sensors){
      const c=add(base,[.76,.07,0]);const ends=[add(c,[1.9,-.7,-.9]),add(c,[1.9,-.7,.9]),add(c,[1.9,.6,.9]),add(c,[1.9,.6,-.9])];
      ends.forEach(p=>beams.push([c,p]));ends.forEach((p,i)=>beams.push([p,ends[(i+1)%4]]));
    }
  }
  function humanoid(cx,cz){
    const bob=Math.sin(t*2)*.025;
    cuboid([cx,1.77+bob,cz],[.60,.67,.33],palette.shell);
    cuboid([cx,1.53+bob,cz],[.43,.18,.37],palette.dark);
    cuboid([cx,1.88+bob,cz-.18],[.42,.24,.045],palette.dark);
    cuboid([cx,1.90+bob,cz-.209],[.24,.037,.022],palette.cyan);
    cuboid([cx,1.20+bob,cz],[.43,.22,.32],palette.dark);
    limb([cx,1.29+bob,cz],[cx,1.51+bob,cz],.12,palette.joint);
    limb([cx,2.10+bob,cz],[cx,2.26+bob,cz],.09,palette.dark);
    ellipsoid([cx,2.43+bob,cz],[.18,.21,.18],palette.shell);
    cuboid([cx,2.45+bob,cz-.176],[.30,.105,.022],palette.dark);
    [-.075,.075].forEach(x=>cuboid([cx+x,2.46+bob,cz-.194],[.04,.026,.018],palette.cyan));
    for(const side of [-1,1]){
      const phase=t+(side>0?Math.PI:0),swing=Math.sin(phase)*.14;
      const hip=[cx+side*.17,1.18+bob,cz],knee=[cx+side*.19,.67,cz+swing*.8-.06],foot=[cx+side*.20,.13,cz-swing];
      joint(hip,.1);limb(hip,knee,.11,palette.shell,.09);joint(knee,.09);limb(knee,foot,.085,palette.shell,.055);
      cuboid([foot[0],.08,foot[2]-.1],[.22,.12,.40],palette.dark);
      const shoulder=[cx+side*.40,2.00+bob,cz],elbow=[cx+side*.49,1.58+bob,cz-swing],hand=[cx+side*.45,1.21+bob,cz-swing-.13];
      joint(shoulder,.12);limb(shoulder,elbow,.085,palette.shell,.07);joint(elbow,.076);limb(elbow,hand,.065,palette.shell,.044);cuboid(hand,[.13,.20,.12],palette.dark);
    }
    if(sensors){const a=[cx,2.45+bob,cz-.21];const ends=[add(a,[-1,-.75,-2.2]),add(a,[1,-.75,-2.2]),add(a,[1,.55,-2.2]),add(a,[-1,.55,-2.2])];ends.forEach(b=>beams.push([a,b]));ends.forEach((b,i)=>beams.push([b,ends[(i+1)%4]]));}
  }
  function stroke3(a,b,color,width=.7){const pa=project(a),pb=project(b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();}
  function draw(){
    ctx.clearRect(0,0,w,h);faces=[];beams=[];
    ctx.save();ctx.beginPath();ctx.rect(0,103,w,h-242);ctx.clip();
    for(let x=-4;x<=4;x+=.4)stroke3([x,0,-3],[x,0,3],'#5483ac22');
    for(let z=-3;z<=3;z+=.4)stroke3([-4,0,z],[4,0,z],'#5483ac22');
    // Contact shadows and floor reference rings beneath each illustrative model.
    const centers=model==='both'?[[-1.15,.45],[.90,-.3]]:[[0,0]];
    centers.forEach(([x,z])=>{const p=project([x,.005,z]);const grad=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.scale*.8);grad.addColorStop(0,'#02070cc9');grad.addColorStop(1,'#02070c00');ctx.fillStyle=grad;ctx.beginPath();ctx.ellipse(p.x,p.y,p.scale*.9,p.scale*.23,0,0,Math.PI*2);ctx.fill();});
    if(model!=='humanoid')quadruped(model==='both'?-1.12:0,model==='both'?.55:0);
    if(model!=='quadruped')humanoid(model==='both'?.92:0,model==='both'?-.25:0);
    const sorted=faces.map(f=>({...f,p:f.v.map(project)})).sort((a,b)=>b.p.reduce((s,p)=>s+p.z,0)/b.p.length-a.p.reduce((s,p)=>s+p.z,0)/a.p.length);
    for(const f of sorted){
      const n=unit(cross(sub(f.v[1],f.v[0]),sub(f.v[2],f.v[0]))),light=.70+Math.abs(n[1])*.20+Math.max(0,-n[2])*.16;
      const color=f.color.map(c=>Math.min(255,Math.round(c*light))),z=f.p.reduce((s,p)=>s+p.z,0)/f.p.length;
      if(mode==='points'){
        const a=f.v[0],b=f.v[1],c=f.v[f.v.length-1];
        const nx=Math.max(2,Math.ceil(Math.hypot(...sub(b,a))/.035)),ny=Math.max(2,Math.ceil(Math.hypot(...sub(c,a))/.035));
        ctx.fillStyle=f.color===palette.cyan?'#acebff':`rgba(${color[0]},${Math.min(255,color[1]+35)},255,.74)`;
        for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++){const p=project(add(a,add(mul(sub(b,a),i/nx),mul(sub(c,a),j/ny))));ctx.fillRect(p.x,p.y,1.1,1.1);}
      }else{
        ctx.fillStyle=mode==='depth'?`hsl(${35+(z+3)*25},72%,${47+light*12}%)`:`rgb(${color.join(',')})`;
        ctx.strokeStyle=mode==='depth'?'#07142555':'#060e1770';ctx.lineWidth=.65;ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();ctx.stroke();
      }
    }
    if(sensors){ctx.setLineDash([4,4]);beams.forEach(([a,b])=>stroke3(a,b,'#5edaff8c',1));ctx.setLineDash([]);}
    ctx.restore();
    const labels=model==='both'?[['QUADRUPED',-1.1,.55],['HUMANOID',.92,-.25]]:[[model.toUpperCase(),0,0]];
    ctx.font='8px "IBM Plex Mono",monospace';ctx.textAlign='center';labels.forEach(([label,x,z])=>{const p=project([x,-.06,z]);if(p.y<h-139){ctx.fillStyle='#8babc7';ctx.fillText(label,p.x,Math.min(p.y+22,h-139));}});ctx.textAlign='left';
  }
  function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw();}
  function sync(){const b=document.querySelector('#scene-motion');b.setAttribute('aria-pressed',String(paused));b.setAttribute('aria-label',paused?'Play robot animation':'Pause robot animation');b.textContent=paused?'Play ▷':'Pause Ⅱ';canvas.setAttribute('aria-label',`Illustrative ${model==='both'?'quadruped and humanoid':model} robots in ${mode} view. Drag or use arrow keys to orbit.`);}
  function tick(now){frame=0;if(paused||!visible||document.hidden||dragging)return;if(now-last>40){t+=Math.min(now-last,70)*.0028;last=now;draw();}frame=requestAnimationFrame(tick);}
  function start(){if(!frame&&!paused&&visible&&!document.hidden&&!dragging){last=performance.now();frame=requestAnimationFrame(tick);}}
  function stop(){cancelAnimationFrame(frame);frame=0;}
  document.querySelectorAll('[data-robot]').forEach(b=>b.addEventListener('click',()=>{model=b.dataset.robot;document.querySelectorAll('[data-robot]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));sync();draw();}));
  document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.scene;document.querySelectorAll('[data-scene]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));sync();draw();}));
  document.querySelector('#scene-sensors').addEventListener('click',e=>{sensors=!sensors;e.currentTarget.setAttribute('aria-pressed',String(sensors));draw();});
  document.querySelector('#scene-motion').addEventListener('click',()=>{paused=!paused;sync();paused?stop():start();});
  document.querySelector('#scene-reset').addEventListener('click',()=>{yaw=-.3;t=0;draw();});
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');stop();});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.008;lastX=e.clientX;draw();});
  function release(){dragging=false;canvas.classList.remove('dragging');start();}
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();yaw+=e.key==='ArrowLeft'?-.13:.13;draw();}});
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;visible?start():stop();}).observe(canvas);
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  reduced.addEventListener('change',()=>{paused=reduced.matches;sync();paused?stop():start();});
  sync();resize();start();
})();
