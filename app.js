(function () {
  var S = window.SBC, LS = window.localStorage;
  var lang = LS.getItem('sbc_lang') || 'en';
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var C = function () { return S[lang]; }, U = function () { return S.ui[lang]; };
  var DIRS = { E: 'dirE', S: 'dirS', W: 'dirW', N: 'dirN' };

  function load() { try { return JSON.parse(LS.getItem('sbc_prog') || '{}'); } catch (e) { return {}; } }
  function save(p) { LS.setItem('sbc_prog', JSON.stringify(p)); }
  var P = load(); P.done = P.done || {}; P.notes = P.notes || {}; P.read = P.read || {}; P.known = P.known || {};
  function doneCount() { return Object.keys(P.done).filter(function (k) { return P.done[k]; }).length; }

  /* ---------- shared pieces ---------- */
  function blocks(list) {
    var out = '', i = 0;
    while (i < list.length) {
      var b = list[i];
      if (b[0] === 'li') { out += '<ul>'; while (i < list.length && list[i][0] === 'li') { out += '<li>' + esc(list[i][1]) + '</li>'; i++; } out += '</ul>'; continue; }
      if (b[0] === 'ol') out += '<ol class="steps">' + b[1].split('|').map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
      else if (b[0] === 'box') out += '<div class="note">' + esc(b[1]) + '</div>';
      else if (b[0] === 'verse') out += '<blockquote class="verse" lang="sa">' + esc(b[1]).replace(/\n/g, '<br>') + '</blockquote>';
      else if (b[0] === 'tbl') { var rs = b[1].split(';;').map(function (r) { return r.split('|'); }); out += '<div class="tw"><table><thead><tr>' + rs[0].map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + rs.slice(1).map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }
      else out += '<' + b[0] + '>' + esc(b[1]) + '</' + b[0] + '>';
      i++;
    }
    return out;
  }
  function chips(a) { return '<div class="chips">' + a.map(function (t) { return '<span class="chip">' + esc(t) + '</span>'; }).join('') + '</div>'; }
  function dayById(n) { return C().days[n - 1]; }
  function dayTitle(n) { return U().day + ' ' + n + ': ' + dayById(n).title; }

  /* ---------- side nav ---------- */
  function renderSide() {
    var c = C(), u = U();
    var h = '<a href="#/">' + u.home + '</a><a href="#/day0">' + u.day0 + '</a><a href="#/syllabus">' + u.syllabus + '</a>';
    c.phases.forEach(function (ph) {
      h += '<h3>' + u.phase + ' ' + ph.id + '</h3>';
      ph.days.forEach(function (n) {
        h += '<a href="#/day/' + n + '" data-route="day/' + n + '"><b>' + n + '</b><span>' + esc(dayById(n).title) + '</span>' + (P.done[n] ? '<span class="tick">&#10003;</span>' : '') + '</a>';
        c.checkpoints.forEach(function (cp) { if (cp.after === n && n !== 14) h += '<div class="cpmark">&#9873; ' + esc(cp.title) + '</div>'; });
      });
    });
    h += '<h3>&nbsp;</h3><a href="#/revise">' + u.revise + '</a><a href="#/faq">' + u.faqNav + '</a><a href="#/glossary">' + u.glossary + '</a><a href="#/instructor">' + u.instructor + '</a><a href="#/progress">' + u.progress + '</a>';
    $('#side').innerHTML = h;
  }
  function markNav(route) {
    document.querySelectorAll('#side a').forEach(function (a) { a.removeAttribute('aria-current'); var r = a.getAttribute('href').slice(2); if (r === route || (route === '' && a.getAttribute('href') === '#/')) a.setAttribute('aria-current', 'page'); });
  }

  /* ---------- pages ---------- */
  function pageHome() {
    var c = C(), u = U(), k = c.course;
    var h = '<section class="hero"><div class="by">' + esc(k.by) + '</div><h1>' + esc(k.name) + '</h1><p class="programme">' + esc(k.sub) + '</p><p class="scope">' + esc(k.intro) + '</p><p class="tag">' + esc(k.tag) + '</p>' +
      '<a class="cta" href="#/day/1">' + u.start + '</a> <a class="cta alt" href="#/syllabus">' + u.viewSyllabus + '</a></section>';
    var cf = S.config, hi = lang === 'hi';
    h += '<section class="team"><div class="k">' + (hi ? 'आपके प्रशिक्षक' : 'Your instructors') + '</div><div class="teamrow">' + [cf.instructor2, cf.instructor].map(function (p) { return '<a class="tm" href="#/instructor"><img src="' + p.photo + '" alt="' + esc(hi ? p.name_hi : p.name) + '"><span><b>' + esc(hi ? p.name_hi : p.name) + '</b><small>' + esc(hi ? p.title_hi : p.title_en) + '</small></span></a>'; }).join('') + '</div></section>';
    h += '<div class="facts">' + k.facts.map(function (f) { return '<div class="fact"><b>' + f[0] + '</b><span>' + esc(f[1]) + '</span></div>'; }).join('') + '</div>';
    var n = doneCount();
    h += '<div class="fact"><b>' + n + ' / 14</b><span>' + u.completed + '</span><div class="bar"><i style="width:' + (n / 14 * 100) + '%"></i></div></div>';
    h += '<h2>' + u.rhythmTitle + '</h2><div class="rhythm">' + k.rhythm.map(function (r) { return '<div class="rstep"><b>' + esc(r[0]) + '</b><strong>' + esc(r[1]) + '</strong><span>' + esc(r[2]) + '</span></div>'; }).join('') + '</div>';
    h += '<h2>' + u.phasesTitle + '</h2>';
    c.phases.forEach(function (ph) {
      h += '<div class="phasecard"><div class="k">' + u.phase + ' ' + ph.id + '</div><h2>' + esc(ph.title) + '</h2><p>' + esc(ph.blurb) + '</p></div>';
      ph.days.forEach(function (n) { h += '<a class="daylink" href="#/day/' + n + '"><b>' + u.day + ' ' + n + '</b><span>' + esc(dayById(n).title) + '</span>' + (P.done[n] ? '<span class="tick">&#10003;</span>' : '') + '</a>'; });
    });
    h += '<div class="note disc"><b>' + u.disclaimerTitle + '.</b> ' + esc(c.disclaimer) + '</div>';
    return h;
  }

  function pageSyllabus() {
    var c = C(), u = U();
    var h = '<h1>' + u.syllabusTitle + '</h1><p>' + u.syllabusIntro + '</p><p class="mute">' + u.prototypeNote + '</p>';
    c.phases.forEach(function (ph) {
      h += '<div class="phasecard"><div class="k">' + u.phase + ' ' + ph.id + ' · ' + ph.days.length * 2 + ' ' + (lang === 'en' ? 'hours' : 'घंटे') + '</div><h2>' + esc(ph.title) + '</h2><p>' + esc(ph.blurb) + '</p></div>';
      ph.days.forEach(function (n) {
        var d = dayById(n);
        h += '<details><summary>' + u.day + ' ' + n + ': ' + esc(d.title) + '<small>' + esc(d.question) + '</small></summary>' +
          '<h4>' + u.objectives + '</h4><ul>' + d.objectives.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
          '<h4>' + u.modules + '</h4><ul>' + d.modules.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
          '<h4>' + u.tool + '</h4><p>' + esc(d.tool) + '</p>' +
          '<h4>' + u.deliverable + '</h4><p>' + esc(d.practical) + '</p>' +
          '<h4>' + u.worksheet + '</h4><p>' + esc(d.worksheet) + '</p>' +
          '<div class="note safe"><b>' + u.safeguard + ':</b> ' + esc(d.safeguard) + '</div>' +
          '<p><b>' + u.competency + ':</b> ' + esc(d.competency) + '</p><a href="#/day/' + n + '">' + u.day + ' ' + n + ' &rarr;</a></details>';
      });
      c.checkpoints.forEach(function (cp) {
        if (ph.days.indexOf(cp.after) >= 0 && cp.after !== 14) h += '<div class="cp"><b>&#9873; ' + esc(cp.title) + '</b><span>' + u.covers + ': ' + esc(cp.covers) + ' · ' + esc(cp.marks) + '</span></div>';
      });
    });
    h += '<h2>' + u.assessmentTitle + '</h2><table><tbody>' + c.assessment.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td class="num">' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>';
    h += '<h3>' + u.levelsTitle + '</h3><table><tbody>' + c.levels.map(function (r) { return '<tr><td class="num">' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>';
    h += '<h3>' + u.worksheetsTitle + '</h3><ol>' + c.worksheets.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ol>';
    h += '<h2>' + u.enhanced + '</h2><div class="enh">' + c.enhancements.map(function (e) { return '<div><b>' + esc(e[0]) + '</b><span>' + esc(e[1]) + '</span></div>'; }).join('') + '</div>';
    h += '<div class="note disc"><b>' + u.disclaimerTitle + '.</b> ' + esc(c.disclaimer) + '</div>';
    return h;
  }

  function pageDay(n) {
    var c = C(), u = U(), d = dayById(n);
    if (!d) return pageHome();
    var ph = c.phases[d.phase - 1];
    var h = '<article class="daycard"><div class="daylabel">' + u.day + ' ' + n + ' · ' + u.phase + ' ' + ph.id + ' · ' + u.hours + ' &nbsp;<span class="pill">' + (d.lesson ? u.sample : u.outline) + '</span></div>' +
      '<h2 class="t">' + esc(d.title) + '</h2>' +
      '<div class="qbox"><small>' + u.question + '</small>' + esc(d.question) + '</div>' +
      '<h3>' + u.objectives + '</h3><ul>' + d.objectives.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    var dp = (c.deep && c.deep[n]) || null;
    if (dp) {
      var toc = [['ov', u.overview], ['sm', u.summary], ['pr', u.primer], ['dm', u.deepModules], ['wk', u.worked], ['ex', u.exercises], ['fc', u.flashcards], ['fq', u.faqT], ['rc', u.recap]];
      h += '<nav class="toc" aria-label="' + u.tocT + '"><b>' + u.tocT + ':</b> ' + toc.map(function (t) { return '<a href="#" data-jump="s' + t[0] + '">' + t[1] + '</a>'; }).join(' · ') + '</nav>';
      h += '<section id="sov"><h3>' + u.overview + '</h3>' + blocks(dp.overview) + '</section>';
    }
    h += '<section id="ssm">' + (d.lesson ? '<h3>' + (dp ? u.summary : u.lessonTitle) + '</h3>' + blocks(d.lesson) : '') + '</section>';
    h += '<div id="toolhost"></div>';
    if (dp) {
      h += '<section id="spr"><h3>' + u.primer + '</h3>' + blocks(dp.primer) + '</section>';
      var nread = dp.modules.filter(function (m) { return P.read[m.id]; }).length;
      h += '<section id="sdm"><h3>' + u.deepModules + ' <small class="mute">(' + nread + '/' + dp.modules.length + ' ' + u.modsRead + ')</small></h3>' + dp.modules.map(function (m) {
        var rd = !!P.read[m.id];
        return '<details class="mod"><summary>' + esc(m.id + '  ' + m.title) + (rd ? ' <span class="tick">&#10003;</span>' : '') + '</summary>' + blocks(m.blocks) + '<button class="doneBtn readBtn" data-mod="' + m.id + '" aria-pressed="' + rd + '">' + (rd ? '&#10003; ' + u.isRead : u.markRead) + '</button></details>';
      }).join('') + '</section>';
      h += '<section id="swk"><h3>' + u.worked + '</h3>' + dp.worked.map(function (w) { return '<details class="mod"><summary>' + esc(w.title) + '</summary>' + blocks(w.blocks) + '</details>'; }).join('') + '</section>';
    } else {
      h += '<h3>' + u.modules + '</h3><ol class="mods">' + d.modules.map(function (m) { return '<li>' + esc(m.replace(/^\d+\.\d+\s*/, '')) + '</li>'; }).join('') + '</ol>';
    }
    h += '<h3>' + u.terms + '</h3>' + chips(d.terms);
    h += '<h3>' + u.practical + '</h3><p>' + esc(d.practical) + '</p>';
    h += '<h3>' + u.worksheet + '</h3><p>' + esc(d.worksheet) + '</p>';
    h += '<div class="note safe"><b>' + u.safeguard + ':</b> ' + esc(d.safeguard) + '</div>';
    h += '<p><b>' + u.competency + ':</b> ' + esc(d.competency) + '</p>';
    if (dp) {
      h += '<section id="sex"><h3>' + u.exercises + '</h3>' + dp.exercises.map(function (qa, i) {
        return '<div class="kc"><div class="q">' + (i + 1) + '. ' + esc(qa.q) + '</div><button class="reveal" type="button" aria-expanded="false" data-show="' + esc(u.showAns) + '" data-hide="' + esc(u.hideAns) + '">' + u.showAns + '</button><div class="a" hidden>' + esc(qa.a) + '</div></div>';
      }).join('') + '</section>';
      h += '<section id="sfc"><h3>' + u.flashcards + '</h3><div class="cards">' + dp.flash.map(function (f, i) { return cardHtml(f, n + '.' + i); }).join('') + '</div></section>';
      h += '<section id="sfq"><h3>' + u.faqT + '</h3>' + dp.faq.map(function (f) { return '<details class="mod"><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>'; }).join('') + '</section>';
      h += '<section id="src"><h3>' + u.recap + '</h3><ul>' + dp.recap.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><h3>' + u.reflect + '</h3><ul>' + dp.reflect.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>';
    }
    if (d.kc && d.kc.length) {
      h += '<h3>' + u.check + '</h3>' + d.kc.map(function (qa, i) {
        return '<div class="kc"><div class="q">' + (i + 1) + '. ' + esc(qa[0]) + '</div><button class="reveal" type="button" aria-expanded="false">' + u.tapAnswer + '</button><div class="a" hidden>' + esc(qa[1]) + '</div></div>';
      }).join('');
    }
    h += '<button id="doneBtn" class="doneBtn" aria-pressed="' + !!P.done[n] + '">' + (P.done[n] ? '&#10003; ' + u.done : u.markDone) + '</button>';
    h += '<h3>' + u.notes + '</h3><textarea id="note" rows="4" aria-label="' + u.notes + '">' + esc(P.notes[n] || '') + '</textarea><small class="mute">' + u.notesHint + '</small>';
    h += '<nav class="pn">' + (n > 1 ? '<a href="#/day/' + (n - 1) + '">&larr; ' + u.day + ' ' + (n - 1) + '</a>' : '<span></span>') + (n < 14 ? '<a href="#/day/' + (n + 1) + '">' + u.day + ' ' + (n + 1) + ' &rarr;</a>' : '') + '</nav></article>';
    return h;
  }

  function pageGlossary() {
    var u = U(), g = C().glossaryX;
    if (g) {
      return '<h1>' + u.glossaryTitle + '</h1><p>' + u.glossaryIntro + '</p><input id="gq" type="search" placeholder="' + u.search2 + '" class="gq"><dl class="gl" id="gll">' + g.slice().sort(function (a, b) { return a[0].localeCompare(b[0]); }).map(function (r) { return '<div class="gi"><dt>' + esc(r[0]) + ' <span lang="' + (lang === 'en' ? 'hi' : 'en') + '">/ ' + esc(r[2]) + '</span></dt><dd>' + esc(r[1]) + ' <a href="#/day/' + esc(r[3]) + '">' + u.dayWord + ' ' + esc(r[3]) + '</a></dd></div>'; }).join('') + '</dl>';
    }    var a = S.en.glossary, b = S.hi.glossary;
    var rows = a.map(function (t, i) { return { en: t[0], hi: b[i][0], d: lang === 'en' ? t[1] : b[i][1] }; });
    rows.sort(function (x, y) { return x.en.localeCompare(y.en); });
    return '<h1>' + u.glossaryTitle + '</h1><p>' + u.glossaryIntro + '</p><dl class="gl">' + rows.map(function (r) { return '<dt>' + esc(r.en) + ' <span lang="hi">/ ' + esc(r.hi) + '</span></dt><dd>' + esc(r.d) + '</dd>'; }).join('') + '</dl>';
  }

  var reviseDay = 'all';
  function cardHtml(f, id) {
    var k = !!P.known[id];
    return '<div class="card' + (k ? ' known' : '') + '" data-id="' + id + '"><button type="button" class="face" aria-label="' + U().flip + '"><b class="front">' + esc(f[0]) + '</b><span class="back" hidden>' + esc(f[1]) + '</span><small>' + U().flip + '</small></button><button type="button" class="knowBtn" aria-pressed="' + k + '">' + (k ? '&#10003; ' : '') + U().gotIt + '</button></div>';
  }
  function wireCards() {
    document.querySelectorAll('.card').forEach(function (cd) {
      var face = cd.querySelector('.face');
      face.onclick = function () { var bk = cd.querySelector('.back'), fr = cd.querySelector('.front'); bk.hidden = !bk.hidden; fr.hidden = false; cd.classList.toggle('flipped', !bk.hidden); };
      cd.querySelector('.knowBtn').onclick = function () { var id = cd.dataset.id; P.known[id] = !P.known[id]; save(P); cd.classList.toggle('known', !!P.known[id]); this.setAttribute('aria-pressed', !!P.known[id]); this.innerHTML = (P.known[id] ? '&#10003; ' : '') + U().gotIt; };
    });
  }
  function pageRevise() {
    var u = U(), c = C(), h = '<h1>' + u.revise + '</h1><p>' + u.reviseIntro + '</p><div class="chips"><button class="iconbtn dfilter" data-d="all">' + u.allDays + '</button>';
    for (var i = 1; i <= 14; i++) h += '<button class="iconbtn dfilter" data-d="' + i + '">' + i + '</button>';
    h += '</div><div class="cards">';
    var tot = 0, kn = 0;
    for (var n = 1; n <= 14; n++) { if (reviseDay !== 'all' && +reviseDay !== n) continue; var dp = c.deep && c.deep[n]; if (!dp) continue; dp.flash.forEach(function (f, i) { tot++; if (P.known[n + '.' + i]) kn++; h += cardHtml(f, n + '.' + i); }); }
    return h + '</div><p class="mute">' + kn + ' / ' + tot + ' ' + u.known + '</p>';
  }
  function pageDay0() {
    var c = C(), d0 = c.day0; if (!d0) return pageHome();
    return '<h1>' + esc(d0.title) + '</h1>' + blocks(d0.blocks) + '<p><a class="cta" href="#/day/1">' + U().start + '</a></p>';
  }
  function pageFaq() {
    var c = C(); return '<h1>' + U().faqNav + '</h1>' + (c.faq || []).map(function (f) { return '<details class="mod"><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>'; }).join('');
  }
  function pageInstructor() {
    var u = U(), hi = lang === 'hi', cf = S.config;
    function card(p) { return '<div class="inst"><img src="' + p.photo + '" alt="' + esc(hi ? p.name_hi : p.name) + '"><div><h2>' + esc(hi ? p.name_hi : p.name) + '</h2><p class="mute">' + esc(hi ? p.title_hi : p.title_en) + '</p>' + (hi ? p.bio_hi : p.bio_en).map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div></div>'; }
    return '<h1>' + u.about + '</h1>' + card(cf.instructor2) + card(cf.instructor) + '<h2>' + u.certificate + '</h2><div class="note">' + u.certPending + '</div>';
  }
  function pageProgress() {
    var u = U(), n = doneCount();
    return '<h1>' + u.progress + '</h1><div class="fact"><b>' + n + ' / 14</b><span>' + u.completed + '</span><div class="bar"><i style="width:' + (n / 14 * 100) + '%"></i></div></div>' +
      C().days.map(function (d) { return '<a class="daylink" href="#/day/' + d.n + '"><b>' + u.day + ' ' + d.n + '</b><span>' + esc(d.title) + '</span>' + (P.done[d.n] ? '<span class="tick">&#10003;</span>' : '') + '</a>'; }).join('') +
      '<p><button id="resetBtn" class="iconbtn">' + u.reset + '</button></p>';
  }

  /* ---------- interactive tools ---------- */
  function toolBuilder(host) {
    var u = U(), st = { h: 9, v: 9 };
    host.innerHTML = '<section class="tool"><h3>' + u.tools.builder + '</h3><div class="tgrid"><div id="bsvg"></div><div>' +
      '<label>' + u.hLines + ': <b id="hv"></b><input id="hs" type="range" min="2" max="12" value="9"></label>' +
      '<label>' + u.vLines + ': <b id="vv"></b><input id="vs" type="range" min="2" max="12" value="9"></label>' +
      '<div id="bres" class="bres"></div><button id="bset" class="iconbtn" type="button">' + u.setRequired + '</button>' +
      '<h4>' + u.vTitle + '</h4><ul class="ver" id="bver"></ul></div></div><p class="mute">' + u.structOnly + '</p></section>';
    function draw() {
      var s = 340, pad = 14, L = s - 2 * pad, svg = '<svg viewBox="0 0 ' + s + ' ' + s + '" role="img" aria-label="' + u.tools.builder + '">';
      var rows = st.h - 1, cols = st.v - 1, ok = st.h === 10 && st.v === 10;
      if (ok) for (var r = 0; r < 9; r++) for (var q = 0; q < 9; q++) svg += '<text x="' + (pad + (q + .5) * L / 9) + '" y="' + (pad + (r + .5) * L / 9 + 3) + '" text-anchor="middle" font-size="8" class="cell">R' + (r + 1) + 'C' + (q + 1) + '</text>';
      for (var i = 0; i < st.h; i++) { var y = pad + i * L / (st.h - 1); svg += '<line x1="' + pad + '" y1="' + y + '" x2="' + (s - pad) + '" y2="' + y + '" class="gl2"/>'; }
      for (var j = 0; j < st.v; j++) { var x = pad + j * L / (st.v - 1); svg += '<line x1="' + x + '" y1="' + pad + '" x2="' + x + '" y2="' + (s - pad) + '" class="gl2"/>'; }
      $('#bsvg').innerHTML = svg + '</svg>';
      $('#hv').textContent = st.h; $('#vv').textContent = st.v;
      $('#bres').className = 'bres ' + (ok ? 'good' : 'bad');
      $('#bres').innerHTML = u.intervals + ': ' + rows + ' x ' + cols + '<br>' + u.cells + ': <b>' + rows + ' x ' + cols + ' = ' + rows * cols + '</b><br>' + (ok ? u.ok : u.notOk);
      var sq = st.h === st.v;
      var items = [[u.v1, st.h === 10], [u.v2, st.v === 10], [u.v3, rows === 9 && cols === 9], [u.v4, rows * cols === 81], [u.v5, sq], [u.v6, null], [u.v7, null]];
      $('#bver').innerHTML = items.map(function (it) { return '<li class="' + (it[1] === null ? 'manual' : it[1] ? 'pass' : 'fail') + '">' + (it[1] === null ? '&#9744;' : it[1] ? '&#10003;' : '&#10007;') + ' ' + esc(it[0]) + '</li>'; }).join('');
    }
    $('#hs').oninput = function () { st.h = +this.value; draw(); };
    $('#vs').oninput = function () { st.v = +this.value; draw(); };
    $('#bset').onclick = function () { st.h = st.v = 10; $('#hs').value = 10; $('#vs').value = 10; draw(); };
    draw();
  }

  function toolExplorer(host) {
    var u = U(), st = { abh: true, q: null, score: 0, tried: 0 };
    host.innerHTML = '<section class="tool"><h3>' + u.tools.explorer + '</h3><label class="chk"><input type="checkbox" id="abh" checked> ' + u.show28 + '</label><div id="ngrid" class="ngrid"></div><p id="ncount" class="mute"></p><p class="mute">' + u.seqNote + ' ' + u.nakNote + '</p>' +
      '<h4>' + u.quiz + '</h4><div id="nq"></div></section>';
    function list() { return S.naks.filter(function (x) { return st.abh || x[0] !== 'Abhijit'; }); }
    function draw() {
      var L = list(), idx = lang === 'hi' ? 1 : 0, g = '';
      ['E', 'S', 'W', 'N'].forEach(function (dk) {
        var items = L.filter(function (x) { return x[2] === dk; });
        g += '<div class="ncol d' + dk + '"><h5>' + u[DIRS[dk]] + ' (' + items.length + ')</h5>' + items.map(function (x) { return '<span class="nk' + (x[0] === 'Abhijit' ? ' abh' : '') + '"><i>' + (L.indexOf(x) + 1) + '</i>' + esc(x[idx]) + '</span>'; }).join('') + '</div>';
      });
      $('#ngrid').innerHTML = g; $('#ncount').textContent = u.total + ': ' + L.length;
    }
    function quiz() {
      var L = list(), idx = lang === 'hi' ? 1 : 0, x = L[Math.floor(Math.random() * L.length)]; st.q = x;
      $('#nq').innerHTML = '<p class="qq"><b>' + esc(x[idx]) + '</b></p><div class="opts">' + ['E', 'S', 'W', 'N'].map(function (dk) { return '<button class="iconbtn opt" data-d="' + dk + '" type="button">' + u[DIRS[dk]] + '</button>'; }).join('') + '</div><p id="nres" class="nres" aria-live="polite">' + (st.tried ? st.score + ' / ' + st.tried : '') + '</p>';
      document.querySelectorAll('.opt').forEach(function (b) {
        b.onclick = function () {
          st.tried++; var ok = b.dataset.d === st.q[2]; if (ok) st.score++;
          $('#nres').innerHTML = (ok ? '<span class="pass">' + u.correct + '</span>' : u.wrong + ' <b>' + u[DIRS[st.q[2]]] + '</b>') + ' · ' + st.score + ' / ' + st.tried + ' <button class="iconbtn" id="nn" type="button">' + u.next + '</button>';
          document.querySelectorAll('.opt').forEach(function (o) { o.disabled = true; });
          $('#nn').onclick = quiz;
        };
      });
    }
    $('#abh').onchange = function () { st.abh = this.checked; draw(); quiz(); };
    draw(); quiz();
  }

  function toolSheet(host, n) {
    var u = U(), d = dayById(n), key = 'sbc_ws_' + n + '_' + 'x';
    var data = {}; try { data = JSON.parse(LS.getItem(key) || '{}'); } catch (e) { }
    host.insertAdjacentHTML('beforeend', '<section class="tool"><h3>' + u.sheet + '</h3><p class="mute">' + u.sheetHint + '</p>' +
      d.fields.map(function (f, i) { return '<label class="fld">' + esc(f) + '<textarea rows="2" data-i="' + i + '">' + esc(data[i] || '') + '</textarea></label>'; }).join('') +
      '<button id="cpy" class="iconbtn" type="button">' + u.copy + '</button> <button id="clr" class="iconbtn" type="button">' + u.clear + '</button></section>');
    host.querySelectorAll('.fld textarea').forEach(function (t) { t.oninput = function () { data[t.dataset.i] = t.value; LS.setItem(key, JSON.stringify(data)); }; });
    $('#cpy').onclick = function () {
      var txt = d.title + '\n\n' + d.fields.map(function (f, i) { return f + ':\n' + (data[i] || ''); }).join('\n\n');
      if (navigator.clipboard) navigator.clipboard.writeText(txt); this.textContent = u.copied;
    };
    $('#clr').onclick = function () { if (confirm(u.confirmClear)) { LS.removeItem(key); route(); } };
  }

  function toolTithi(host) {
    var u = U(), cats = lang === 'hi' ? ['नंदा', 'भद्रा', 'जया', 'रिक्ता', 'पूर्णा'] : ['Nanda', 'Bhadra', 'Jaya', 'Rikta', 'Purna'];
    var h = '<section class="tool"><h3>' + u.tools.tithi + '</h3><div class="tith">';
    for (var i = 1; i <= 15; i++) h += '<div class="tc c' + ((i - 1) % 5) + '"><b>' + i + '</b><span>' + cats[(i - 1) % 5] + '</span></div>';
    host.insertAdjacentHTML('beforeend', h + '</div><p class="mute">' + u.tithiNote + '</p></section>');
  }

  function toolRule(host) {
    var u = U();
    host.insertAdjacentHTML('beforeend', '<section class="tool"><h3>' + u.tools.rule + '</h3><div class="calc"><label>A <input type="number" id="ra" step="any"></label><label>B <input type="number" id="rb" step="any"></label><label>C <input type="number" id="rc" step="any"></label></div><p class="bres" id="rx">X = (B x C) / A</p><p class="mute">' + u.ruleNote + '</p></section>');
    function up() { var a = +$('#ra').value, b = +$('#rb').value, c = +$('#rc').value; $('#rx').textContent = a ? 'X = (' + b + ' x ' + c + ') / ' + a + ' = ' + (b * c / a) : 'X = (B x C) / A'; }
    ['#ra', '#rb', '#rc'].forEach(function (s) { $(s).oninput = up; });
  }

  function toolValidate(host) {
    var u = U();
    host.insertAdjacentHTML('beforeend', '<section class="tool"><h3>' + u.tools.valid + '</h3><div class="calc"><label>' + u.open + ' <input type="number" id="vo" step="any"></label><label>' + u.close + ' <input type="number" id="vc" step="any"></label></div><p class="bres" id="vr">-</p><p class="mute">' + u.validNote + '</p></section>');
    function up() { var o = +$('#vo').value, c = +$('#vc').value; $('#vr').textContent = o ? u.pct + ': ' + ((c - o) / o * 100).toFixed(2) + '%' : '-'; }
    $('#vo').oninput = up; $('#vc').oninput = up;
  }

  /* ---------- router ---------- */
  function route() {
    var r = (location.hash || '#/').slice(2), m = r.match(/^day\/(\d+)$/), html;
    if (m) html = pageDay(+m[1]); else if (r === 'day0') html = pageDay0(); else if (r === 'faq') html = pageFaq(); else if (r === 'revise') html = pageRevise(); else if (r === 'syllabus') html = pageSyllabus(); else if (r === 'glossary') html = pageGlossary(); else if (r === 'instructor') html = pageInstructor(); else if (r === 'progress') html = pageProgress(); else html = pageHome();
    $('#content').innerHTML = html + '<p class="foot">' + U().footer + '</p>';
    renderSide(); markNav(r); window.scrollTo(0, 0);
    if (m) {
      var n = +m[1], host = $('#toolhost');
      if (n === 2) toolBuilder(host); else if (n === 3) toolExplorer(host);
      if (n === 4) toolTithi(host); if (n === 11) toolRule(host); if (n === 14) toolValidate(host);
      if (dayById(n).fields) toolSheet(host, n);
      document.querySelectorAll('.reveal').forEach(function (b) {
        b.onclick = function () { var a = b.nextElementSibling, open = a.hidden; a.hidden = !open; b.setAttribute('aria-expanded', open); b.textContent = open ? (b.dataset.hide || U().hideAnswer) : (b.dataset.show || U().tapAnswer); };
      });
      $('#doneBtn').onclick = function () { P.done[n] = !P.done[n]; save(P); route(); };
      $('#note').oninput = function () { P.notes[n] = this.value; save(P); };
      document.querySelectorAll('.readBtn').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); var id = b.dataset.mod; P.read[id] = !P.read[id]; save(P); b.setAttribute('aria-pressed', !!P.read[id]); b.innerHTML = (P.read[id] ? '&#10003; ' + U().isRead : U().markRead); var sm = b.closest('details').querySelector('summary'); sm.innerHTML = sm.innerHTML.replace(/ <span class="tick">.*<\/span>/, '') + (P.read[id] ? ' <span class="tick">&#10003;</span>' : ''); }; });
      wireCards();
      document.querySelectorAll('[data-jump]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); var el = document.getElementById(a.dataset.jump); if (el) el.scrollIntoView({ behavior: 'smooth' }); }; });
    }
    if (r === 'revise') { wireCards(); document.querySelectorAll('.dfilter').forEach(function (b) { b.onclick = function () { reviseDay = b.dataset.d; route(); }; }); }
    var gq = $('#gq'); if (gq) gq.oninput = function () { var q = gq.value.toLowerCase(); document.querySelectorAll('.gi').forEach(function (e) { e.hidden = e.innerText.toLowerCase().indexOf(q) < 0; }); };
    var rb = $('#resetBtn'); if (rb) rb.onclick = function () { if (confirm(U().confirmReset)) { P = { done: {}, notes: {}, read: {}, known: {} }; save(P); route(); } };
    $('#side').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  }

  /* ---------- chrome ---------- */
  function setLang(l) {
    lang = l; LS.setItem('sbc_lang', l); document.documentElement.lang = l;
    $('#langEn').setAttribute('aria-pressed', l === 'en'); $('#langHi').setAttribute('aria-pressed', l === 'hi');
    $('#q').placeholder = U().search; $('#skip').textContent = U().skip; route();
  }
  document.querySelectorAll('.langsw button').forEach(function (b) { b.onclick = function () { setLang(b.dataset.lang); }; });
  $('#menuBtn').onclick = function () { var o = $('#side').classList.toggle('open'); this.setAttribute('aria-expanded', o); };
  $('#q').oninput = function () {
    var t = this.value.trim().toLowerCase(), box = $('#results');
    if (!t) { box.hidden = true; return; }
    var hits = C().days.filter(function (d) { return (d.title + ' ' + d.terms.join(' ') + ' ' + d.modules.join(' ')).toLowerCase().indexOf(t) >= 0; }).slice(0, 8)
      .map(function (d) { return '<a href="#/day/' + d.n + '">' + U().day + ' ' + d.n + ': ' + esc(d.title) + '<small>' + esc(d.question) + '</small></a>'; });
    box.innerHTML = hits.length ? hits.join('') : '<div class="none">' + U().noResults + '</div>'; box.hidden = false;
  };
  document.addEventListener('click', function (e) { if (!e.target.closest('.search')) $('#results').hidden = true; else if (e.target.closest('#results a')) { $('#results').hidden = true; $('#q').value = ''; } });
  window.addEventListener('hashchange', route);
  setLang(lang);
})();
