/* Sales page motion: smooth scrolling (Lenis) and scroll-driven animation (GSAP + ScrollTrigger).
   If either library fails to load, or the visitor asked for less motion, the page simply shows everything. */
(function(){
  'use strict';
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(still || !window.gsap || !window.ScrollTrigger) return;
  var d = document, gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  d.documentElement.classList.add('gs');
  function $$(s, el){ return [].slice.call((el || d).querySelectorAll(s)) }

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if(window.Lenis){
    lenis = new Lenis({ lerp:.09, smoothWheel:true, wheelMultiplier:1 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function(t){ lenis.raf(t * 1000) });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href'); if(id.length < 2) return;
      var t = d.querySelector(id); if(!t) return;
      e.preventDefault();
      if(lenis) lenis.scrollTo(t, { offset:-70, duration:1.4 }); else t.scrollIntoView({ behavior:'smooth' });
    });
  });

  /* ---------- headlines: each word slides up from behind a mask ---------- */
  function split(el, cls, inner){
    var out = [];
    (function walk(node, hl){
      [].slice.call(node.childNodes).forEach(function(c){
        if(c.nodeType === 3){
          var f = d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function(t){
            if(!t) return;
            if(/^\s+$/.test(t)){ f.appendChild(d.createTextNode(' ')); return }
            var w = d.createElement('span'); w.className = cls;
            if(inner){ var i = d.createElement('span'); i.className = inner + (hl ? ' hl' : ''); i.textContent = t; w.appendChild(i); out.push(i) }
            else { w.textContent = t; if(hl) w.classList.add('hl'); out.push(w) }
            f.appendChild(w);
          });
          c.parentNode.replaceChild(f, c);
        } else if(c.nodeType === 1){
          var isHl = c.classList.contains('hl');
          walk(c, hl || isHl);
          if(isHl) c.classList.remove('hl');
        }
      });
    })(el, false);
    return out;
  }
  $$('.split').forEach(function(h){
    var words = split(h, 'sw', 'swi');
    var inHero = !!h.closest('.hero');
    gsap.fromTo(words, { yPercent:115, rotate:5 }, {
      yPercent:0, rotate:0, duration:1.05, ease:'power4.out', stagger:.045, delay:inHero ? .15 : 0,
      scrollTrigger:inHero ? null : { trigger:h, start:'top 88%', once:true }
    });
  });

  /* ---------- paragraphs and cards ---------- */
  gsap.set('[data-fade]', { y:34 });
  ST.batch('[data-fade]', { start:'top 90%', once:true,
    onEnter:function(b){ gsap.to(b, { opacity:1, y:0, duration:1, ease:'power3.out', stagger:.09, overwrite:true }) } });

  gsap.set('[data-pop]', { y:60, scale:.94, transformPerspective:900, rotateX:12 });
  ST.batch('[data-pop]', { start:'top 92%', once:true,
    onEnter:function(b){ gsap.to(b, { opacity:1, y:0, scale:1, rotateX:0, duration:1.1, ease:'expo.out', stagger:.08, overwrite:true, clearProps:'transform' }) } });

  gsap.set('[data-card]', { y:110, rotateX:28, transformPerspective:1100, transformOrigin:'50% 100%' });
  ST.batch('[data-card]', { start:'top 92%', once:true,
    onEnter:function(b){ gsap.to(b, { opacity:1, y:0, rotateX:0, duration:1.3, ease:'expo.out', stagger:.14, overwrite:true, clearProps:'transform' }) } });

  /* ---------- the sales video grows into place as you scroll to it ---------- */
  $$('[data-zoom]').forEach(function(v){
    gsap.fromTo(v, { opacity:.2, scale:.82, rotateX:18, transformPerspective:1200 }, { opacity:1, scale:1, rotateX:0, ease:'none',
      scrollTrigger:{ trigger:v, start:'top 98%', end:'center 60%', scrub:.6 } });
  });

  /* ---------- hero drifts away as you scroll down ---------- */
  gsap.to('.hero-copy', { y:-90, opacity:.15, ease:'none', scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:true } });
  gsap.to('.hero .aurora', { y:160, ease:'none', scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:true } });

  /* ---------- the big idea lights up word by word ---------- */
  $$('.scrub').forEach(function(p){
    var w = split(p, 'sc');
    gsap.to(w, { opacity:1, stagger:.1, ease:'none', scrollTrigger:{ trigger:p, start:'top 82%', end:'bottom 42%', scrub:.5 } });
  });

  /* ---------- giant words slide with the scroll ---------- */
  $$('.bt-row').forEach(function(r){
    var rev = r.classList.contains('rev');
    gsap.fromTo(r, { xPercent:rev ? -32 : 0 }, { xPercent:rev ? 0 : -32, ease:'none',
      scrollTrigger:{ trigger:'.bigtype', start:'top bottom', end:'bottom top', scrub:.4 } });
  });

  /* ---------- app tour: pins and scrolls sideways on big screens ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', function(){
    var sec = d.querySelector('.htour'), track = d.querySelector('.ht-track');
    if(!sec || !track) return;
    function dist(){ return Math.max(0, track.scrollWidth - innerWidth) }
    var tw = gsap.to(track, { x:function(){ return -dist() }, ease:'none',
      scrollTrigger:{ trigger:sec, start:'top top', end:function(){ return '+=' + dist() }, pin:true, scrub:.8, invalidateOnRefresh:true, anticipatePin:1 } });
    $$('.ht-card .shot', track).forEach(function(s){
      gsap.fromTo(s, { scale:.86, rotateY:-14, transformPerspective:1400 }, { scale:1, rotateY:0, ease:'none',
        scrollTrigger:{ trigger:s, containerAnimation:tw, start:'left 100%', end:'left 45%', scrub:true } });
    });
  });

  /* ---------- tool groups: the amber label stamps in ---------- */
  $$('.gnum').forEach(function(g){
    gsap.fromTo(g, { scale:2.2, rotate:-12, opacity:0 }, { scale:1, rotate:0, opacity:1, duration:.7, ease:'back.out(2.5)',
      scrollTrigger:{ trigger:g, start:'top 90%', once:true } });
  });

  /* ---------- plan table rows tick in ---------- */
  var rows = $$('.compare tbody tr');
  if(rows.length) gsap.from(rows, { opacity:0, x:-24, duration:.5, stagger:.035, ease:'power2.out',
    scrollTrigger:{ trigger:'.compare', start:'top 85%', once:true } });

  /* ---------- cursor ring (mouse only) ---------- */
  var ring = d.querySelector('.cursor');
  if(ring && matchMedia('(pointer:fine)').matches){
    var qx = gsap.quickTo(ring, 'x', { duration:.35, ease:'power3' }), qy = gsap.quickTo(ring, 'y', { duration:.35, ease:'power3' });
    addEventListener('pointermove', function(e){ ring.classList.add('on'); qx(e.clientX); qy(e.clientY) }, { passive:true });
    d.addEventListener('pointerover', function(e){ ring.classList.toggle('big', !!e.target.closest('a,button,.video,.tool,summary,[data-tilt]')) });
    d.addEventListener('pointerleave', function(){ ring.classList.remove('on') });
  }

  addEventListener('load', function(){ ST.refresh() });
})();
