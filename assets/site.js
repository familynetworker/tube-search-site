/* =====================================================================
   SETUP: the only part you need to edit. Paste your links between the quotes.
   ===================================================================== */
var SETUP = {
  // Your sales video. A YouTube or Vimeo link, or an .mp4 file address.
  salesVideo: '',
  // The 2-minute tour video on the thank-you page.
  tourVideo: '',
  // Stripe Payment Links, one per plan (they start with https://buy.stripe.com/).
  checkout: {
    basic: 'https://buy.stripe.com/cNibJ196O8Gyc8A3NP4ZG01',
    pro: 'https://buy.stripe.com/14A4gz96O8Gy8Wo7014ZG02',
    premiere: 'https://buy.stripe.com/cNi28r2Iq7Cu7Sk5VX4ZG03'
  },
  // Where members manage their plan (update card, switch plans, cancel): their members area.
  portal: 'https://tubesearch-members.tubesearch.workers.dev/login',
  // Your members area sign-in page, where members get their key and download the app.
  membersArea: 'https://tubesearch-members.tubesearch.workers.dev/login',
  // Your email service's form address (MailerLite, Kit, etc).
  // Leave empty to test: the form then goes straight to the thank-you page.
  emailFormAction: ''
};

/* ===================================================================== */
(function(){
  'use strict';
  var d = document, root = d.documentElement;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('js');
  function $(s, el){ return (el || d).querySelector(s) }
  function $$(s, el){ return [].slice.call((el || d).querySelectorAll(s)) }
  function store(k, v){ try{ if(v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v) }catch(e){ return null } }

  // Real numbers from the app's 2026-10-28 scan: new long-form faceless channels, 60 days old or less.
  var FOUND = [
    { n:'Tech explainers', a:38, v:'2.0M', r:'$9.7K' },
    { n:'Police bodycam', a:47, v:'8.7M', r:'$34.5K' },
    { n:'Earth sciences', a:25, v:'3.6M', r:'$20.9K' },
    { n:'Conditions and diseases', a:18, v:'2.5M', r:'$15.7K' },
    { n:'True crime', a:34, v:'2.2M', r:'$13.1K' },
    { n:'History', a:32, v:'2.1M', r:'$11.9K' },
    { n:'Physics', a:26, v:'828K', r:'$9.3K' },
    { n:'Paranormal', a:40, v:'2.8M', r:'$8.9K' },
    { n:'Sci-fi stories', a:45, v:'2.4M', r:'$8.9K' },
    { n:'Longevity', a:46, v:'1.4M', r:'$7.5K' },
    { n:'Architecture', a:48, v:'2.1M', r:'$7.5K' },
    { n:'Travel documentary', a:46, v:'837K', r:'$7.0K' }
  ];

  /* ---------- headline words fly in ---------- */
  $$('[data-words]').forEach(function(h){
    var i = 0;
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(c){
        if(c.nodeType === 3){
          var f = d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function(t){
            if(!t) return;
            if(/^\s+$/.test(t)){ f.appendChild(d.createTextNode(t)); return }
            var s = d.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = t; f.appendChild(s);
          });
          c.parentNode.replaceChild(f, c);
        } else if(c.nodeType === 1 && !c.classList.contains('hl')) walk(c);
        else if(c.nodeType === 1){ c.classList.add('w'); c.style.setProperty('--i', i++) }
      });
    })(h);
    h.classList.add('words');
  });

  /* ---------- reveal on scroll ---------- */
  var rv = $$('[data-rv]');
  if(still || !('IntersectionObserver' in window)) rv.forEach(function(e){ e.classList.add('in') });
  else {
    // once shown, drop the reveal rule so hover lifts and the Pro card's scale work again
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ var t = e.target; t.classList.add('in'); io.unobserve(t);
      setTimeout(function(){ t.style.transition = 'none'; t.removeAttribute('data-rv'); t.offsetWidth; t.style.transition = '' }, 1800) } }) }, { rootMargin:'0px 0px -8% 0px', threshold:.08 });
    rv.forEach(function(e){ io.observe(e) });
  }

  /* ---------- numbers count up ---------- */
  function countUp(el){
    var to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    if(still){ el.textContent = pre + to.toLocaleString('en-US', { minimumFractionDigits:dec, maximumFractionDigits:dec }) + suf; return }
    var t0 = null, dur = +el.dataset.dur || 1800;
    function step(t){ if(!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = pre + (to * e).toLocaleString('en-US', { minimumFractionDigits:dec, maximumFractionDigits:dec }) + suf;
      if(p < 1) requestAnimationFrame(step) }
    requestAnimationFrame(step);
  }
  var cs = $$('[data-count]');
  if('IntersectionObserver' in window){
    var cio = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ countUp(e.target); cio.unobserve(e.target) } }) }, { threshold:.4 });
    cs.forEach(function(e){ cio.observe(e) });
  } else cs.forEach(countUp);

  /* ---------- bars grow when seen ---------- */
  $$('.paychart').forEach(function(c){
    function go(){ $$('.fill', c).forEach(function(f){ f.style.width = f.dataset.w }) }
    if(!('IntersectionObserver' in window)) return go();
    var o = new IntersectionObserver(function(es){ if(es[0].isIntersecting){ go(); o.disconnect() } }, { threshold:.3 }); o.observe(c);
  });

  /* ---------- scroll: progress bar, solid top bar, sticky buy, step path, parallax ---------- */
  var bar = $('.bar'), prog = $('.progress'), sticky = $('.stickybuy'), hero = $('.hero, .optin');
  var path = $('.path'), draw = path && $('.draw', path), steps = path ? $$('.pstep', path) : [], plen = 0;
  var para = $$('[data-para]');
  function sizePath(){
    if(!path) return;
    var h = path.offsetHeight, svg = $('svg', path);
    svg.setAttribute('viewBox', '0 0 60 ' + h);
    var dd = 'M22 0';
    for(var y = 0; y < h; y += 120) dd += ' C ' + (y % 240 ? 4 : 40) + ' ' + (y + 40) + ', ' + (y % 240 ? 40 : 4) + ' ' + (y + 80) + ', 22 ' + Math.min(h, y + 120);
    $$('path', svg).forEach(function(p){ p.setAttribute('d', dd) });
    plen = draw.getTotalLength(); draw.style.strokeDasharray = plen; draw.style.strokeDashoffset = plen;
  }
  function onScroll(){
    var y = scrollY, H = d.documentElement.scrollHeight - innerHeight;
    if(prog) prog.style.setProperty('--p', H > 0 ? y / H : 0);
    if(bar) bar.classList.toggle('solid', y > 20);
    if(sticky && hero) sticky.classList.toggle('show', y > hero.offsetHeight - 100 && y < H - 500);
    if(path && plen){
      var r = path.getBoundingClientRect(), p = Math.max(0, Math.min(1, (innerHeight * .65 - r.top) / r.height));
      draw.style.strokeDashoffset = plen * (1 - p);
      steps.forEach(function(s){ s.classList.toggle('lit', s.getBoundingClientRect().top < innerHeight * .65) });
    }
    if(!still) para.forEach(function(el){
      var r = el.getBoundingClientRect(), c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      el.style.translate = '0 ' + (c * -(+el.dataset.para || 40)).toFixed(1) + 'px';
    });
  }
  var ticking = false;
  addEventListener('scroll', function(){ if(!ticking){ ticking = true; requestAnimationFrame(function(){ ticking = false; onScroll() }) } }, { passive:true });
  addEventListener('resize', function(){ sizePath(); onScroll() });
  addEventListener('load', function(){ sizePath(); onScroll() });
  sizePath(); onScroll();

  /* ---------- pointer: spotlight, 3D tilt, magnetic buttons ---------- */
  var fine = window.matchMedia && matchMedia('(pointer:fine)').matches;
  if(fine && !still){
    var spotEl = $('.spot');
    if(spotEl) addEventListener('pointermove', function(e){ spotEl.style.setProperty('--mx', e.clientX + 'px'); spotEl.style.setProperty('--my', e.clientY + 'px') }, { passive:true });
    $$('[data-tilt]').forEach(function(el){
      var max = +el.dataset.tilt || 8, g = $('.glare', el);
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(1000px) rotateY(' + ((x - .5) * max * 2).toFixed(2) + 'deg) rotateX(' + ((.5 - y) * max * 2).toFixed(2) + 'deg) scale(1.02)';
        if(g){ el.style.setProperty('--gx', x * 100 + '%'); el.style.setProperty('--gy', y * 100 + '%') }
      });
      el.addEventListener('pointerleave', function(){ el.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)'; el.style.transform = ''; setTimeout(function(){ el.style.transition = '' }, 600) });
    });
    $$('.btn').forEach(function(b){
      b.addEventListener('pointermove', function(e){ var r = b.getBoundingClientRect(); b.style.translate = ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px' });
      b.addEventListener('pointerleave', function(){ b.style.translate = '' });
    });
  }

  /* ---------- radar scanner ---------- */
  var cv = $('#radar');
  if(cv){
    var ctx = cv.getContext('2d'), W, R, dpr = Math.min(2, devicePixelRatio || 1), ang = 0, blips = [], list = $('#found'), fi = 0, last = 0;
    function size(){ W = cv.clientWidth; cv.width = cv.height = W * dpr; R = W / 2; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    size(); addEventListener('resize', size);
    for(var k = 0; k < 46; k++) blips.push({ a:Math.random() * Math.PI * 2, r:.18 + Math.random() * .78, s:1 + Math.random() * 2, hit:0, big:k < 6 });
    function addFound(){
      if(!list) return;
      var f = FOUND[fi++ % FOUND.length], row = d.createElement('div');
      row.innerHTML = '<i></i><span><b>' + f.n + '</b> · ' + f.a + ' days old</span><em>' + f.v + '/mo</em>';
      list.insertBefore(row, list.firstChild);
      while(list.children.length > 4) list.removeChild(list.lastChild);
    }
    for(var q = 0; q < 3; q++) addFound();
    function frame(t){
      ctx.clearRect(0, 0, W, W);
      var g = ctx.createRadialGradient(R, R, 0, R, R, R); g.addColorStop(0, '#1d1238'); g.addColorStop(1, '#0a0716');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(R, R, R, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(240,71,154,.22)'; ctx.lineWidth = 1;
      for(var i = 1; i <= 4; i++){ ctx.beginPath(); ctx.arc(R, R, R * i / 4.2, 0, 7); ctx.stroke() }
      ctx.beginPath(); ctx.moveTo(R, 0); ctx.lineTo(R, W); ctx.moveTo(0, R); ctx.lineTo(W, R); ctx.stroke();
      // sweep wedge
      for(var j = 0; j < 40; j++){
        ctx.fillStyle = 'rgba(240,71,154,' + (0.22 * (1 - j / 40)).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(R, R); ctx.arc(R, R, R, ang - (j + 1) * .02, ang - j * .02); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,181,71,.95)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(R, R); ctx.lineTo(R + Math.cos(ang) * R, R + Math.sin(ang) * R); ctx.stroke();
      blips.forEach(function(b){
        var diff = ((ang - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        if(diff < .06){ b.hit = 1; if(b.big && t - last > 900){ last = t; addFound() } }
        b.hit *= .985;
        if(b.hit < .02) return;
        var x = R + Math.cos(b.a) * b.r * R, y = R + Math.sin(b.a) * b.r * R, c = b.big ? '61,220,151' : '240,71,154';
        ctx.fillStyle = 'rgba(' + c + ',' + b.hit.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(x, y, b.s + (b.big ? 2.5 : 0), 0, 7); ctx.fill();
        if(b.big){ ctx.strokeStyle = 'rgba(61,220,151,' + (b.hit * .6).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y, 6 + (1 - b.hit) * 18, 0, 7); ctx.stroke() }
      });
      ang = (ang + .018) % (Math.PI * 2);
      if(!still) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- ticker (duplicated so it loops) ---------- */
  $$('.ticker-track').forEach(function(tr){
    var h = FOUND.map(function(f){ return '<span><b>' + f.n + '</b> ' + f.a + ' days old · ' + f.v + ' views a month · <em>about ' + f.r + '/mo</em></span>' }).join('');
    tr.innerHTML = h + h;
  });

  /* ---------- Launch Kit typing demo ---------- */
  var demo = $('#demo');
  if(demo){
    var typed = $('.typed', demo), out = $('.demo-out', demo), busy = false;
    var IDEAS = [
      { q:'the dark side of the Titanic', t:[['The Titanic Secret They Never Taught You', 94], ['What Really Happened in the Titanic’s Last Hour', 91], ['7 Titanic Facts That Sound Fake but Are True', 88], ['The Titanic Survivor Nobody Talks About', 79]] },
      { q:'how to save money on groceries', t:[['I Cut My Grocery Bill in Half (Here’s How)', 93], ['How to Save Money on Groceries: 9 Tricks That Work', 90], ['The Grocery Store Doesn’t Want You to Know This', 86], ['Stop Buying These 10 Things at the Store', 77]] },
      { q:'ancient rome', t:[['What Daily Life in Ancient Rome Was Really Like', 95], ['The Forgotten History of Rome’s Last Days', 89], ['Why Rome Fell: Explained Simply', 85], ['A Day in Rome That Changed Everything', 74]] }
    ], n = 0;
    function run(){
      if(busy) return; busy = true;
      var it = IDEAS[n++ % IDEAS.length], i = 0; out.innerHTML = ''; typed.textContent = '';
      (function type(){
        if(i <= it.q.length){ typed.textContent = it.q.slice(0, i++); return setTimeout(type, still ? 0 : 55) }
        setTimeout(function(){
          it.t.forEach(function(r, k){ setTimeout(function(){
            var row = d.createElement('div'); if(r[1] < 85) row.className = 'mid';
            row.innerHTML = '<span>' + r[0] + '</span><em>' + r[1] + '</em>'; out.appendChild(row);
            if(k === it.t.length - 1){ busy = false; setTimeout(run, 4200) }
          }, k * 380) });
        }, 450);
      })();
    }
    if('IntersectionObserver' in window){ var dio = new IntersectionObserver(function(es){ if(es[0].isIntersecting){ run(); dio.disconnect() } }); dio.observe(demo) } else run();
  }

  /* ---------- videos: placeholder until a link is pasted in SETUP ---------- */
  function embed(url){
    var m = /(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/.exec(url); if(m) return 'https://www.youtube.com/embed/' + m[1] + '?autoplay=1&rel=0';
    m = /vimeo\.com\/(\d+)/.exec(url); if(m) return 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1';
    return null;
  }
  $$('[data-video]').forEach(function(v){
    var url = SETUP[v.dataset.video];
    v.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); v.click() } });
    v.addEventListener('click', function(){
      if(!url){ toast('Your video goes here. Paste its link into SETUP at the top of assets/site.js.'); return }
      if(v.querySelector('iframe,video')) return;
      var src = embed(url), el;
      if(src){ el = d.createElement('iframe'); el.src = src; el.allow = 'autoplay; fullscreen; picture-in-picture'; el.allowFullscreen = true }
      else { el = d.createElement('video'); el.src = url; el.controls = true; el.autoplay = true; el.playsInline = true }
      v.appendChild(el);
    });
  });

  /* ---------- checkout buttons ---------- */
  $$('[data-buy]').forEach(function(a){
    var url = SETUP.checkout[a.dataset.buy];
    if(url) a.href = url;
    else a.addEventListener('click', function(e){ e.preventDefault(); toast('Checkout link for ' + a.dataset.buy + ' goes here. Paste it into SETUP in assets/site.js.') });
  });
  // member links: billing portal and members area
  $$('[data-link]').forEach(function(a){
    var url = SETUP[a.dataset.link];
    if(url){ a.href = url; a.target = '_blank'; a.rel = 'noopener' }
    else a.addEventListener('click', function(e){ e.preventDefault(); toast('This link goes here once it is pasted into SETUP in assets/site.js.') });
  });

  /* ---------- opt-in form ---------- */
  var form = $('#optin');
  if(form){
    form.addEventListener('submit', function(e){
      var nm = $('#fname').value.trim(), em = $('#email').value.trim(), err = $('.err', form);
      if(!nm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){ e.preventDefault(); err.hidden = false; err.textContent = !nm ? 'Add your first name so we know what to call you.' : 'That email doesn’t look right. Check it and try again.'; return }
      store('tsName', nm); store('tsGift', form.dataset.gift || 'list');
      if(SETUP.emailFormAction){ form.action = SETUP.emailFormAction; form.method = 'post'; return }
      e.preventDefault();
      var b = $('button[type=submit]', form); b.firstChild.textContent = form.dataset.sending || 'Sending your list…';
      setTimeout(function(){ location.href = 'thank-you.html' }, still ? 0 : 700);
    });
  }
  var gift = store('tsGift');
  if(gift && gift !== 'list') $$('[data-gift-text]').forEach(function(el){ el.textContent = el.dataset.giftText.replace('{gift}', gift) });
  var hi = $('#hiName'), nm2 = store('tsName');
  if(hi && nm2) hi.textContent = ', ' + nm2;

  /* ---------- confetti (thank-you page) ---------- */
  var cf = $('#confetti');
  if(cf && !still){
    var c2 = cf.getContext('2d'), P = [], cols = ['#F0479A', '#FFB547', '#3DDC97', '#8B5CF6', '#ffffff'];
    function cfs(){ cf.width = innerWidth; cf.height = innerHeight } cfs(); addEventListener('resize', cfs);
    function burst(x, y, n){ for(var i = 0; i < n; i++){ var a = Math.random() * Math.PI * 2, s = 4 + Math.random() * 9;
      P.push({ x:x, y:y, vx:Math.cos(a) * s, vy:Math.sin(a) * s - 6, r:4 + Math.random() * 5, c:cols[i % 5], rot:Math.random() * 6, vr:(Math.random() - .5) * .4, life:1 }) } }
    burst(innerWidth / 2, innerHeight * .3, 160);
    setTimeout(function(){ burst(innerWidth * .2, innerHeight * .4, 80); burst(innerWidth * .8, innerHeight * .4, 80) }, 450);
    var running = false;
    function loop(){
      c2.clearRect(0, 0, cf.width, cf.height);
      P = P.filter(function(p){ return p.life > 0 && p.y < cf.height + 40 });
      P.forEach(function(p){ p.vy += .25; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .006;
        c2.save(); c2.translate(p.x, p.y); c2.rotate(p.rot); c2.globalAlpha = Math.max(0, p.life); c2.fillStyle = p.c; c2.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); c2.restore() });
      if(P.length) requestAnimationFrame(loop); else running = false;
    }
    function kick(){ if(!running){ running = true; requestAnimationFrame(loop) } }
    kick();
    $$('.btn, .check').forEach(function(b){ b.addEventListener('click', function(e){ burst(e.clientX, e.clientY, 40); kick() }) });
  }

  /* ---------- toast ---------- */
  var tEl;
  function toast(msg){
    if(!tEl){ tEl = d.createElement('div'); tEl.className = 'toast'; tEl.setAttribute('role', 'status'); d.body.appendChild(tEl) }
    tEl.textContent = msg; tEl.classList.add('show'); clearTimeout(tEl._t); tEl._t = setTimeout(function(){ tEl.classList.remove('show') }, 3800);
  }
})();
