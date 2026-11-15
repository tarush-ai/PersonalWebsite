/* fittingcorpus project page: charts drawn in plain SVG from window.FC_DATA (static/js/data.js).
   No library, no network. Every chart re-renders on resize and on a light/dark change. */
(function () {
  "use strict";
  var D = window.FC_DATA;
  if (!D) return;
  var NS = "http://www.w3.org/2000/svg";
  var root = document.documentElement;

  // ---------- helpers ----------
  function css(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t === "dark") return true;
    if (t === "light") return false;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function S(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function T(parent, x, y, str, attrs) {
    var a = { x: x, y: y, fill: css("--ink"), "font-size": 12.5 };
    for (var k in attrs) a[k] = attrs[k];
    var t = S("text", a, parent);
    t.textContent = str;
    return t;
  }
  function svgFor(el, w, h) {
    el.textContent = "";
    return S("svg", { width: w, height: h, viewBox: "0 0 " + w + " " + h }, el);
  }
  function fmt(v, d) { return v.toFixed(d === undefined ? 2 : d); }
  function signed(v, d) { return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(d); }
  function hexToRgb(h) { h = h.replace("#", ""); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mix(stops, t) {
    t = Math.max(0, Math.min(1, t));
    var n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i;
    var a = hexToRgb(stops[i]), b = hexToRgb(stops[i + 1]);
    return "rgb(" + a.map(function (v, k) { return Math.round(v + (b[k] - v) * f); }).join(",") + ")";
  }
  function lum(rgb) {
    var c = rgb.match(/\d+/g).map(function (v) { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  // Rounded data-end bar, square at the baseline (left).
  function bar(parent, x, y, w, h, r, fill) {
    r = Math.min(r, w / 2, h / 2);
    if (w <= 0) return null;
    var d = "M" + x + "," + y + "h" + (w - r) + "a" + r + "," + r + " 0 0 1 " + r + "," + r +
            "v" + (h - 2 * r) + "a" + r + "," + r + " 0 0 1 " + (-r) + "," + r + "h" + (r - w) + "z";
    return S("path", { d: d, fill: fill }, parent);
  }
  function diamond(parent, cx, cy, s, fill, ring) {
    return S("path", { d: "M" + cx + "," + (cy - s) + " L" + (cx + s) + "," + cy + " L" + cx + "," + (cy + s) +
      " L" + (cx - s) + "," + cy + " Z", fill: fill, stroke: ring, "stroke-width": 2 }, parent);
  }

  // ---------- one tooltip for the page ----------
  var tip = document.getElementById("tip");
  function showTip(evt, value, lines, anchor) {
    tip.textContent = "";
    var v = document.createElement("span"); v.className = "v"; v.textContent = value; tip.appendChild(v);
    lines.forEach(function (l) { var s = document.createElement("span"); s.className = "l"; s.textContent = l; tip.appendChild(s); });
    var x, y;
    if (evt && evt.clientX !== undefined && evt.type.indexOf("pointer") === 0) { x = evt.clientX; y = evt.clientY; }
    else { var b = anchor.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top; }
    tip.style.opacity = "1";
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var left = x + 14, top = y - th - 12;
    if (left + tw > window.innerWidth - 8) left = x - tw - 14;
    if (left < 8) left = 8;
    if (top < 8) top = y + 18;
    tip.style.left = left + "px"; tip.style.top = top + "px";
  }
  function hideTip() { tip.style.opacity = "0"; }
  function hover(el, value, lines, onEnter, onLeave) {
    el.setAttribute("tabindex", "0");
    el.style.cursor = "default";
    el.style.outline = "none";
    var enter = function (e) { showTip(e, value, lines, el); if (onEnter) onEnter(); };
    var leave = function () { hideTip(); if (onLeave) onLeave(); };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", function (e) { showTip(e, value, lines, el); });
    el.addEventListener("pointerleave", leave);
    el.addEventListener("focus", enter);
    el.addEventListener("blur", leave);
  }

  // ---------- table views (the values without hovering) ----------
  function table(id, head, rows) {
    var host = document.getElementById(id);
    if (!host || host.firstChild) return;
    var t = document.createElement("table"); t.className = "tbl";
    var th = t.createTHead().insertRow();
    head.forEach(function (h) { var c = document.createElement("th"); c.textContent = h; th.appendChild(c); });
    var tb = t.createTBody();
    rows.forEach(function (r) { var tr = tb.insertRow(); r.forEach(function (v) { tr.insertCell().textContent = v; }); });
    host.appendChild(t);
  }

  // ======================================================================================
  // 1. The 8x8 grid
  // ======================================================================================
  var LIGHT_RAMP = ["#f6f4ee", "#dbe8e3", "#b2d3cf", "#7fb4b8", "#4e8f9e", "#2b6982", "#16455f"];
  var DARK_RAMP = ["#1c2224", "#1d3439", "#1f4a52", "#24636e", "#2f7f8c", "#4d9fab", "#86c4cc"];
  var WRAP = { "StackExchange": ["Stack-", "Exchange"], "News 2024": ["News", "2024"], "arXiv 2023": ["arXiv", "2023"],
               "Common Pile": ["Common", "Pile"] };

  function drawGrid() {
    var el = document.getElementById("chart-grid");
    var G = D.grid, n = G.fits.length, npile = n - G.after_pile.length;
    var W = Math.max(600, el.clientWidth);
    var narrow = W < 720;
    var padL = narrow ? 112 : 128, top = 84, gG = 7, gM = 14, cellH = narrow ? 30 : 34;
    var cellW = (W - padL - gG - gM - 2) / (n + 1);
    var gridBottom = top + n * cellH + gG + gM + cellH;
    var H = gridBottom + 64;
    var svg = svgFor(el, W, H);
    var ramp = isDark() ? DARK_RAMP : LIGHT_RAMP;
    var all = [].concat.apply([], G.cells);
    var vmin = Math.min(D.logit_lens_any_layer, Math.min.apply(null, all)), vmax = Math.max.apply(null, all);
    function col(v) { return mix(ramp, (v - vmin) / (vmax - vmin)); }
    function cx(j) { return padL + j * cellW + (j >= npile ? gG : 0); }
    function cy(i) { return top + i * cellH + (i >= npile ? gG : 0); }
    var mx = padL + n * cellW + gG + gM, my = top + n * cellH + gG + gM;
    var fs = narrow ? 11.5 : 12.5;
    var ink = css("--ink"), ink2 = css("--ink-2"), card = css("--card");
    var rowLabels = [];

    function cell(x, y, v, bold, value, lines) {
      var c = col(v);
      var g = S("g", {}, svg);
      var r = S("rect", { x: x + 1, y: y + 1, width: cellW - 2, height: cellH - 2, rx: 3, fill: c }, g);
      T(g, x + cellW / 2, y + cellH / 2 + 4.3, fmt(v, 1), { "text-anchor": "middle", "font-size": fs,
        "font-weight": bold ? 700 : 500, fill: lum(c) > 0.42 ? "#0b0b0b" : "#ffffff", "pointer-events": "none" });
      hover(g, value, lines, function () { r.setAttribute("stroke", ink); r.setAttribute("stroke-width", 2); },
                             function () { r.removeAttribute("stroke"); });
      return g;
    }
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        cell(cx(j), cy(i), G.cells[i][j], false, fmt(G.cells[i][j]),
             ["Fitted on " + G.fits[i], "Read after " + G.reads[j] + " text"]);
      }
      cell(mx, cy(i), G.row_mean[i], true, fmt(G.row_mean[i]), ["Map fitted on " + G.fits[i], "Mean over the eight read contexts"]);
      rowLabels.push(T(svg, padL - 18, cy(i) + cellH / 2 + 4.3, G.fits[i], { "text-anchor": "end", "font-size": fs + 0.5 }));
    }
    for (j = 0; j < n; j++) {
      cell(cx(j), my, G.col_mean[j], true, fmt(G.col_mean[j]), ["Read after " + G.reads[j] + " text", "Mean over the eight maps"]);
      var lines = WRAP[G.reads[j]] || [G.reads[j]];
      lines.forEach(function (s, k) {
        T(svg, cx(j) + cellW / 2, top - 8 - (lines.length - 1 - k) * 14, s, { "text-anchor": "middle", "font-size": fs, fill: ink2 });
      });
    }
    T(svg, mx + cellW / 2, top - 8, "Mean", { "text-anchor": "middle", "font-size": fs, "font-weight": 700 });
    T(svg, padL - 18, my + cellH / 2 + 4.3, "Mean", { "text-anchor": "end", "font-size": fs + 0.5, "font-weight": 700 });

    // group brackets, trimmed so the two colours read as two bars
    var trim = cellW * 0.22, yb = top - 44;
    function hb(a, b, colour, label) {
      S("line", { x1: cx(a) + trim, x2: cx(b) + cellW - trim, y1: yb, y2: yb, stroke: colour, "stroke-width": 3, "stroke-linecap": "round" }, svg);
      T(svg, (cx(a) + cx(b) + cellW) / 2, yb - 8, label, { "text-anchor": "middle", "font-size": fs - 0.5, fill: ink2, "font-style": "italic" });
    }
    hb(0, npile - 1, css("--pile"), "Pile components");
    hb(npile, n - 1, css("--post"), "After the Pile");
    var xb = padL - 8, trimV = cellH * 0.22;
    S("line", { x1: xb, x2: xb, y1: cy(0) + trimV, y2: cy(npile - 1) + cellH - trimV, stroke: css("--pile"), "stroke-width": 3, "stroke-linecap": "round" }, svg);
    S("line", { x1: xb, x2: xb, y1: cy(npile) + trimV, y2: cy(n - 1) + cellH - trimV, stroke: css("--post"), "stroke-width": 3, "stroke-linecap": "round" }, svg);
    T(svg, (cx(0) + cx(n - 1) + cellW) / 2, 16, "Read context", { "text-anchor": "middle", "font-size": 13, "font-weight": 700 });
    T(svg, 0, 16, "Fitting corpus ↓", { "font-size": 13, "font-weight": 700 });

    // colour scale: its floor is the logit lens
    var by = gridBottom + 26, bx0 = padL, bx1 = padL + Math.min(420, W - padL - 40);
    var gid = "fc-grad-" + (isDark() ? "d" : "l");
    var defs = S("defs", {}, svg), lg = S("linearGradient", { id: gid, x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
    for (var s = 0; s <= 16; s++) S("stop", { offset: (s / 16 * 100) + "%", "stop-color": mix(ramp, s / 16) }, lg);
    S("rect", { x: bx0, y: by, width: bx1 - bx0, height: 10, rx: 5, fill: "url(#" + gid + ")" }, svg);
    T(svg, padL - 18, by + 9, "Readout score", { "text-anchor": "end", "font-size": fs, fill: ink2 });
    function sx(v) { return bx0 + (v - vmin) / (vmax - vmin) * (bx1 - bx0); }
    var ticks = [[vmin, "Logit lens " + fmt(D.logit_lens_any_layer, 1)], [22, "22"], [24, "24"], [26, "26"]];
    ticks.forEach(function (tk, k) {
      var x = sx(tk[0]);
      S("line", { x1: x, x2: x, y1: by + 12, y2: by + 17, stroke: css("--ink-3"), "stroke-width": 1 }, svg);
      T(svg, x, by + 31, tk[1], { "text-anchor": k === 0 ? "start" : "middle", "font-size": fs - 1, fill: ink2 });
    });

    table("table-grid", ["Fitting corpus ↓ / read context →"].concat(G.reads, ["Mean"]),
      G.fits.map(function (f, i) { return [f].concat(G.cells[i].map(function (v) { return fmt(v); }), [fmt(G.row_mean[i])]); })
        .concat([["Mean"].concat(G.col_mean.map(function (v) { return fmt(v); }), [""])]));
  }

  // ======================================================================================
  // 2. Variance split, with the recovery-rule switch
  // ======================================================================================
  var varRule = "Any-layer";
  function drawVariance() {
    var el = document.getElementById("chart-variance");
    var V = D.variance[varRule];
    var rows = [["Fitting corpus", V.fit.point, V.fit.lo, V.fit.hi],
                ["Read context", V.read.point, V.read.lo, V.read.hi],
                ["Interaction", V.residual, null, null]];
    var W = el.clientWidth, narrow = W < 520;
    var labW = narrow ? 104 : 130, valW = narrow ? 112 : 150, barH = 22, gap = 16, top = 6;
    var H = top + rows.length * (barH + gap) + 24;
    var svg = svgFor(el, W, H);
    var x0 = labW, x1 = W - valW, dom = 60;
    function sx(v) { return x0 + v / dom * (x1 - x0); }
    [0, 20, 40, 60].forEach(function (t) {
      S("line", { x1: sx(t), x2: sx(t), y1: top - 2, y2: H - 22, stroke: t === 0 ? css("--axis") : css("--hair"), "stroke-width": 1 }, svg);
      T(svg, sx(t), H - 6, t + "%", { "text-anchor": "middle", "font-size": 11.5, fill: css("--ink-3") });
    });
    rows.forEach(function (r, i) {
      var y = top + i * (barH + gap);
      T(svg, x0 - 12, y + barH / 2 + 4.5, r[0], { "text-anchor": "end", "font-size": 13 });
      var g = S("g", {}, svg);
      S("rect", { x: x0, y: y - gap / 2, width: x1 - x0 + valW, height: barH + gap, fill: "transparent" }, g);
      bar(g, x0, y, sx(r[1]) - x0, barH, 4, css("--accent"));
      var endX = sx(r[1]);
      if (r[2] !== null) {
        var c = css("--ink-2");
        S("line", { x1: sx(r[2]), x2: sx(r[3]), y1: y + barH / 2, y2: y + barH / 2, stroke: c, "stroke-width": 1.5 }, g);
        [r[2], r[3]].forEach(function (v) { S("line", { x1: sx(v), x2: sx(v), y1: y + 5, y2: y + barH - 5, stroke: c, "stroke-width": 1.5 }, g); });
        endX = Math.max(endX, sx(r[3]));
      }
      var lab = fmt(r[1], 1) + "%" + (r[2] !== null ? "  [" + fmt(r[2], 1) + ", " + fmt(r[3], 1) + "]" : "");
      T(g, endX + 8, y + barH / 2 + 4.5, lab, { "font-size": narrow ? 11.5 : 12.5, fill: css("--ink-2") });
      hover(g, fmt(r[1], 2) + "%", [r[0] + ", " + varRule.toLowerCase() + " recovery",
        r[2] !== null ? "95% interval " + fmt(r[2], 1) + " to " + fmt(r[3], 1) : "Residual: fit × read interaction"]);
    });
    var fm = V.fit_minus_read;
    document.getElementById("variance-note").textContent =
      "Fitting corpus minus read context: " + signed(fm.point, 2) + " points, 95% interval " + signed(fm.lo, 2) +
      " to " + signed(fm.hi, 2) + (V.excludes_zero ? ", which excludes zero." : ", which includes zero.") +
      " Intervals are 95% bootstrap over both seed factors.";
  }
  Array.prototype.forEach.call(document.querySelectorAll(".seg button"), function (b) {
    b.addEventListener("click", function () {
      varRule = b.getAttribute("data-rule");
      Array.prototype.forEach.call(document.querySelectorAll(".seg button"), function (o) {
        o.setAttribute("aria-pressed", o === b ? "true" : "false");
      });
      drawVariance();
    });
  });

  // ======================================================================================
  // 3. The two pre-registered tests (values quoted from the paper, Sec. 5.1)
  // ======================================================================================
  var TESTS = [
    { title: "Disjoint samples: share of variance between sources", short: "Between-source share of variance",
      dom: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1],
      thr: 0.70, thrLabel: "threshold 0.70", any: 0.989, maj: 0.972, d: 3, unit: "" },
    { title: "Matched lexical diversity: spread between corpora", short: "Spread, matched lexical diversity",
      dom: [0, 30], ticks: [0, 10, 20, 30],
      thr: 20, thrLabel: "threshold 20", any: 22.7, maj: 22.2, d: 1, unit: " pooled seed SDs" }
  ];
  function drawTests() {
    var el = document.getElementById("chart-tests");
    var W = el.clientWidth, narrow = W < 560;
    var rowH = 96, H = TESTS.length * rowH;
    var svg = svgFor(el, W, H);
    var x0 = 10, x1 = W - (narrow ? 14 : 270);
    TESTS.forEach(function (t, i) {
      var y = i * rowH + 26;
      function sx(v) { return x0 + (v - t.dom[0]) / (t.dom[1] - t.dom[0]) * (x1 - x0); }
      T(svg, x0, y - 8, narrow ? t.short : t.title, { "font-size": 13, "font-weight": 650 });
      S("rect", { x: x0, y: y + 14, width: x1 - x0, height: 8, rx: 4, fill: css("--hair") }, svg);
      S("rect", { x: sx(t.thr), y: y + 14, width: x1 - sx(t.thr), height: 8, rx: 4, fill: css("--accent-soft") }, svg);
      S("line", { x1: sx(t.thr), x2: sx(t.thr), y1: y + 6, y2: y + 30, stroke: css("--ink-2"), "stroke-width": 2 }, svg);
      T(svg, sx(t.thr) - 6, y + 12, t.thrLabel, { "text-anchor": "end", "font-size": 11.5, fill: css("--ink-2") });
      t.ticks.forEach(function (v) { T(svg, sx(v), y + 46, String(v), { "text-anchor": "middle", "font-size": 11, fill: css("--ink-3") }); });
      var gA = S("g", {}, svg), gM = S("g", {}, svg);
      S("circle", { cx: sx(t.any), cy: y + 18, r: 14, fill: "transparent" }, gA);
      S("circle", { cx: sx(t.any), cy: y + 18, r: 7, fill: css("--minc"), stroke: css("--card"), "stroke-width": 2 }, gA);
      S("circle", { cx: sx(t.maj), cy: y + 18, r: 14, fill: "transparent" }, gM);
      diamond(gM, sx(t.maj), y + 18, 7.5, css("--perc"), css("--card"));
      hover(gA, fmt(t.any, t.d) + t.unit, ["Any-layer recovery (the paper's primary)", t.thrLabel.replace("threshold", "Pre-registered threshold:")]);
      hover(gM, fmt(t.maj, t.d) + t.unit, ["Majority-layer recovery (the statistic registered)", t.thrLabel.replace("threshold", "Pre-registered threshold:")]);
      var vt = fmt(t.any, t.d) + " any-layer · " + fmt(t.maj, t.d) + " majority-layer";
      if (narrow) T(svg, x0, y + 64, vt, { "font-size": 12, fill: css("--ink-2") });
      else T(svg, x1 + 16, y + 22, vt, { "font-size": 12.5, fill: css("--ink-2") });
    });
  }

  // ======================================================================================
  // 4. Containment against readout
  // ======================================================================================
  function drawContain() {
    var el = document.getElementById("chart-contain");
    var G = D.grid, C = D.contain;
    var pts = G.fits.map(function (f, i) { return { name: f, x: C[f].containment, y: G.row_mean[i], pile: C[f].group === "Pile component" }; });
    var W = el.clientWidth, narrow = W < 560;
    var m = { l: 52, r: narrow ? 12 : 20, t: 14, b: 50 }, H = narrow ? 300 : 330;
    var svg = svgFor(el, W, H);
    var lx0 = Math.log10(5e-5), lx1 = Math.log10(1.6), y0 = 22.0, y1 = 26.6;
    function sx(v) { return m.l + (Math.log10(v) - lx0) / (lx1 - lx0) * (W - m.l - m.r); }
    function sy(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var pile = pts.filter(function (p) { return p.pile; });
    var lo = Math.min.apply(null, pile.map(function (p) { return p.y; })), hi = Math.max.apply(null, pile.map(function (p) { return p.y; }));
    S("rect", { x: m.l, y: sy(hi), width: W - m.l - m.r, height: sy(lo) - sy(hi), fill: css("--pile-soft") }, svg);
    T(svg, m.l + 8, sy(hi) + 15, "Range of the five Pile components", { "font-size": 11.5, fill: css("--ink-2"), "font-style": "italic" });
    [22, 23, 24, 25, 26].forEach(function (v) {
      S("line", { x1: m.l, x2: W - m.r, y1: sy(v), y2: sy(v), stroke: css("--hair"), "stroke-width": 1 }, svg);
      T(svg, m.l - 8, sy(v) + 4, String(v), { "text-anchor": "end", "font-size": 11.5, fill: css("--ink-3") });
    });
    S("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b, stroke: css("--axis"), "stroke-width": 1 }, svg);
    [[1e-4, "0.0001"], [1e-3, "0.001"], [1e-2, "0.01"], [1e-1, "0.1"], [1, "1"]].forEach(function (t) {
      S("line", { x1: sx(t[0]), x2: sx(t[0]), y1: H - m.b, y2: H - m.b + 5, stroke: css("--axis") }, svg);
      T(svg, sx(t[0]), H - m.b + 18, t[1], { "text-anchor": "middle", "font-size": 11.5, fill: css("--ink-3") });
    });
    T(svg, (m.l + W - m.r) / 2, H - 6, narrow ? "32-gram containment (log scale)" : "32-gram containment in Pythia's training data (log scale)",
      { "text-anchor": "middle", "font-size": 12, fill: css("--ink-2") });
    var yl = T(svg, 0, 0, "Readout score", { "text-anchor": "middle", "font-size": 12, fill: css("--ink-2") });
    yl.setAttribute("transform", "translate(13," + ((m.t + H - m.b) / 2) + ") rotate(-90)");

    pts.forEach(function (p) {
      var g = S("g", {}, svg), X = sx(p.x), Y = sy(p.y);
      S("circle", { cx: X, cy: Y, r: 14, fill: "transparent" }, g);
      if (p.pile) S("circle", { cx: X, cy: Y, r: 6.5, fill: css("--pile"), stroke: css("--card"), "stroke-width": 2 }, g);
      else S("rect", { x: X - 6.5, y: Y - 6.5, width: 13, height: 13, rx: 2.5, fill: css("--post"), stroke: css("--card"), "stroke-width": 2 }, g);
      hover(g, fmt(p.y), [p.name + (p.pile ? " (Pile component)" : " (after the Pile)"),
        "Containment " + (p.x < 0.01 ? p.x.toFixed(5) : p.x.toFixed(3))]);
    });
    // direct labels: later corpora to the right of their points; the Pile cluster to its left
    pts.filter(function (p) { return !p.pile; }).forEach(function (p) {
      T(svg, sx(p.x) + 11, sy(p.y) + 4, p.name, { "font-size": 12, fill: css("--ink-2") });
    });
    var byName = {}; pts.forEach(function (p) { byName[p.name] = p; });
    var xl = sx(0.92) - 14;
    var labs = narrow ? [["StackExchange", 26.00], ["GitHub", 22.78]] :
      [["StackExchange", 26.00], ["USPTO · Pile-CC", (byName["USPTO"].y + byName["Pile-CC"].y) / 2], ["Wikipedia", byName["Wikipedia"].y], ["GitHub (most contained)", byName["GitHub"].y]];
    labs.forEach(function (l) { T(svg, xl, sy(l[1]) + 4, l[0], { "text-anchor": "end", "font-size": 12, fill: css("--ink-2") }); });

    table("table-contain", ["Fitting corpus", "Group", "Containment (k = 32)", "Readout score (mean)"],
      pts.map(function (p) { return [p.name, C[p.name].group, p.x.toFixed(5), fmt(p.y)]; }));
  }

  // ======================================================================================
  // 5. The ladder: tau and R per family at 1B and 2.8B
  // ======================================================================================
  function drawDots(id, key, dom, ticks, thr, thrLabel, title, shortTitle, d) {
    var el = document.getElementById(id);
    var L = D.ladder, W = el.clientWidth, narrow = W < 400;
    var labW = narrow ? 128 : 136, rowH = 34, top = 44, H = top + L.length * rowH + 30;
    var svg = svgFor(el, W, H);
    var x0 = labW, x1 = W - 12;
    function sx(v) { return x0 + (v - dom[0]) / (dom[1] - dom[0]) * (x1 - x0); }
    T(svg, 0, 15, narrow ? shortTitle : title, { "font-size": 13, "font-weight": 650 });
    ticks.forEach(function (t) {
      S("line", { x1: sx(t), x2: sx(t), y1: top - 6, y2: top + L.length * rowH, stroke: css("--hair"), "stroke-width": 1 }, svg);
      T(svg, sx(t), top + L.length * rowH + 16, String(t), { "text-anchor": "middle", "font-size": 11, fill: css("--ink-3") });
    });
    S("line", { x1: sx(thr), x2: sx(thr), y1: top - 10, y2: top + L.length * rowH, stroke: css("--ink-2"), "stroke-width": 1.75 }, svg);
    T(svg, sx(thr), top - 14, thrLabel, { "text-anchor": "middle", "font-size": 11.5, fill: css("--ink-2") });
    L.forEach(function (f, i) {
      var y = top + i * rowH + rowH / 2;
      T(svg, x0 - 12, y + 4.5, f.family, { "text-anchor": "end", "font-size": narrow ? 11.5 : 12.5 });
      var v1 = f[key]["1B"], v2 = f[key]["2.8B"];
      var g1 = S("g", {}, svg), g2 = S("g", {}, svg);
      S("circle", { cx: sx(v1), cy: y - 5, r: 12, fill: "transparent" }, g1);
      S("circle", { cx: sx(v1), cy: y - 5, r: 6, fill: css("--size-a"), stroke: css("--card"), "stroke-width": 2 }, g1);
      S("circle", { cx: sx(v2), cy: y + 5, r: 12, fill: "transparent" }, g2);
      diamond(g2, sx(v2), y + 5, 7, css("--size-b"), css("--card"));
      var name = key === "tau" ? "Kendall τ vs 410M" : "R, spread of z / pooled seed SD";
      hover(g1, (key === "tau" ? signed(v1, d) : fmt(v1, d)), [f.family + ", Pythia-1B (200 prompts)", name]);
      hover(g2, (key === "tau" ? signed(v2, d) : fmt(v2, d)), [f.family + ", Pythia-2.8B (25 prompts)", name]);
    });
  }
  function drawLadder() {
    drawDots("chart-tau", "tau", [0, 1], [0, 0.2, 0.4, 0.6, 0.8, 1], 0.6, "criterion ≥ 0.6",
      "Agreement with the 410M corpus ordering, Kendall τ", "Kendall τ with the 410M ordering", 1);
    drawDots("chart-R", "R", [0, 35], [0, 10, 20, 30], 10, "criterion ≥ 10",
      "Between-corpus spread R, in pooled seed SDs", "Spread R, in pooled seed SDs", 1);
    var L = D.ladder;
    function count(key, size, thr) { return L.filter(function (f) { return f[key][size] >= thr - 1e-9; }).length; }
    document.getElementById("tau-note").textContent = "τ ≥ 0.6 in " + count("tau", "1B", 0.6) + " of 5 families at 1B and " +
      count("tau", "2.8B", 0.6) + " of 5 at 2.8B; the criterion asks for 3 of 5.";
    document.getElementById("R-note").textContent = "R ≥ 10 in " + count("R", "1B", 10) + " of 5 families at 1B and " +
      count("R", "2.8B", 10) + " of 5 at 2.8B; the criterion asks for 4 of 5.";
    table("table-ladder", ["Family", "Pairs", "R 410M", "R 1B", "R 2.8B", "τ 1B", "τ 2.8B"],
      L.map(function (f) { return [f.family, String(f.pairs), fmt(f.R["410M"], 1), fmt(f.R["1B"], 1), fmt(f.R["2.8B"], 1), signed(f.tau["1B"], 1), signed(f.tau["2.8B"], 1)]; }));
  }

  // ======================================================================================
  // 6. Fitting-set size (values quoted from the paper, Sec. 5.4)
  // ======================================================================================
  function drawN() {
    var el = document.getElementById("chart-n");
    var W = el.clientWidth, narrow = W < 560;
    var rows = [[narrow ? "Largest change, 25 to 800 prompts" : "Largest change in any corpus's score as the fitting set grows from 25 to 800 prompts", 0.78],
                [narrow ? "Spread between corpora, fixed size" : "Spread between corpora at a fixed fitting-set size", 2.46]];
    var barH = 24, block = 62, H = rows.length * block + 26;
    var svg = svgFor(el, W, H);
    var x0 = 0, x1 = W - 70, dom = 3;
    function sx(v) { return x0 + v / dom * (x1 - x0); }
    [0, 1, 2, 3].forEach(function (t) {
      S("line", { x1: sx(t), x2: sx(t), y1: 20, y2: H - 22, stroke: t === 0 ? css("--axis") : css("--hair") }, svg);
      T(svg, sx(t) + (t === 0 ? 2 : 0), H - 6, t + (t === 1 ? " point" : " points"), { "text-anchor": t === 0 ? "start" : "middle", "font-size": 11, fill: css("--ink-3") });
    });
    rows.forEach(function (r, i) {
      var y = i * block;
      T(svg, 0, y + 14, r[0], { "font-size": narrow ? 12 : 12.5, fill: css("--ink") });
      var g = S("g", {}, svg);
      S("rect", { x: 0, y: y + 20, width: W, height: barH + 8, fill: "transparent" }, g);
      bar(g, x0, y + 22, sx(r[1]) - x0, barH, 4, css("--accent"));
      T(g, sx(r[1]) + 8, y + 22 + barH / 2 + 4.5, fmt(r[1], 2), { "font-size": 13, "font-weight": 700 });
      hover(g, fmt(r[1], 2) + " points", [r[0]]);
    });
  }

  // ---------- render, and re-render on resize or theme change ----------
  function renderAll() {
    hideTip();
    try { drawGrid(); } catch (e) { console.error(e); }
    try { drawVariance(); } catch (e) { console.error(e); }
    try { drawTests(); } catch (e) { console.error(e); }
    try { drawContain(); } catch (e) { console.error(e); }
    try { drawLadder(); } catch (e) { console.error(e); }
    try { drawN(); } catch (e) { console.error(e); }
  }
  var pending = false, lastW = 0;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; renderAll(); });
  }
  renderAll();
  lastW = window.innerWidth;
  window.addEventListener("resize", function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; schedule(); } });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", schedule); else if (mq.addListener) mq.addListener(schedule);
  }
  new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("scroll", hideTip, { passive: true });

  // ---------- copy BibTeX ----------
  var cb = document.getElementById("copy-bib");
  if (cb) cb.addEventListener("click", function () {
    var txt = document.getElementById("bibtex").textContent;
    var done = function () { cb.textContent = "Copied"; setTimeout(function () { cb.textContent = "Copy"; }, 1500); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, function () {});
    else {
      var ta = document.createElement("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  });
})();
