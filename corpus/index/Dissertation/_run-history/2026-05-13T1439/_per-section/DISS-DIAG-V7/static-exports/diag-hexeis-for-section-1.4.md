# Static export `diag-hexeis` — for §1.4 (Hexeis / Settled Doxai sub-section)

**Scope:** The hexeis / settled-doxai region with the $M_3 \to A_3$ connector — i.e., settled doxai functioning as "additional unmoved originators" of $M_3 \to A_3$ alongside $A_2$ (the phantasma). Renders the practical-syllogism quotation (MA 701a7–25) and the habitual-rational-action gloss (MA 701a13–14).

**Display convention:** $M_n \to A_{n+1}$. Motion shown: $M_3 \to A_3$ (HTML id `M23`).

> ## Under-development note — required per user note 2026-05-13
>
> The hexeis / settled-doxai region in the source HTML (`<g id="settled-doxai">` at line 732; data declaration at HTML lines 1186–1211) is **currently under-developed**. It consists of a single Settled-Doxai box with one connector to $M_3 \to A_3$. The static export below faithfully mirrors this under-developed state.
>
> The diagram does NOT yet represent:
> 1. **The technē/praxis bivalence** introduced in §1.5 line 1: across the three types of action Aristotle catalogs in *Movement of Animals*, the kinetic-roles spine holds invariant, but *orexis* takes three internal shapes — generic appetition, rationally articulated by settled doxa whose content is *craft-procedural and non-evaluative* (habitual-procedural action), and the emotion-desire composite (evaluatively complex action). The habitual-procedural branch operates through doxa-as-hexis *without* emotional concretion; the bivalence is structurally distinct from the simpler "with-or-without-doxa" framing the current diagram retains.
> 2. **The hexis–pathē correlate structure** (§1.4 prose line 174): "Each *pathos* has its possible *hexis*-correlate: courage as the *hexis* of fear, magnanimity as the *hexis* of anger, friendliness as the *hexis* of kindness." The diagram presents settled-doxai as an undifferentiated reservoir; the §1.4 analysis requires a structured taxonomy.
> 3. **The diachronic-saturation feedback** through which completed actions sediment as hexis (§1.4 prose lines 106, 110, 112): "Each actualization leaves a residual modification of the dispositional ground; over time, repeated actualizations consolidate into *hexeis* that condition subsequent chain-actualizations." The current diagram has no arrow representing this $A_4 \to \mathrm{SETTLED\text{-}DOXAI}$ sedimentation.
> 4. **The bivalent gating** between Path 2 (habitual rational, settled hexis) and Path 3 (emotion-mediated, evaluatively complex) of the M34 input paths — currently the gating is encoded only as choice of line-style, not as explicit diagrammatic structure.
>
> **Phase 5 revision-roadmap item:** Once the HTML source is fleshed out (per the user's note that this region is "currently under-fleshed"), this export should be regenerated. For now, the export below preserves the source state.

```latex
% diag-hexeis — settled doxai / hexeis + M_3 -> A_3 connector
% Compile with: pdflatex (requires tikz, amsmath)
% NOTE: This export mirrors the under-developed state of the source HTML.

\documentclass[border=30pt,tikz]{standalone}
\usepackage[T1]{fontenc}
\usepackage{amsmath}
\usepackage{tikz}
\usetikzlibrary{
  arrows.meta,
  positioning,
  calc,
  decorations.pathreplacing,
  fit,
  backgrounds,
  shapes.geometric
}

\definecolor{actuality}{RGB}{30,60,120}
\definecolor{motion}{RGB}{140,40,40}
\definecolor{hexiscolor}{RGB}{170,100,30}
\definecolor{doxacolor}{RGB}{90,40,120}
\definecolor{cognitive}{RGB}{252,240,225}

\begin{document}
\begin{tikzpicture}[scale=0.78, transform shape,
  actnode/.style={
    rectangle, rounded corners=4pt,
    draw=actuality, fill=actuality!8,
    line width=1.2pt,
    minimum width=6.4cm, minimum height=1.4cm,
    text width=6.0cm, align=center,
    font=\sffamily\small\bfseries,
    text=actuality
  },
  motionnode/.style={
    rectangle, rounded corners=2pt,
    draw=motion, fill=motion!6,
    line width=0.8pt, dashed,
    minimum width=5.8cm, minimum height=1.0cm,
    text width=5.6cm, align=center,
    font=\sffamily\footnotesize,
    text=motion
  },
  hexisnode/.style={
    rectangle, rounded corners=3pt,
    draw=hexiscolor!70, fill=hexiscolor!10,
    line width=1pt,
    minimum width=4.6cm, minimum height=2.6cm,
    text width=4.2cm, align=center,
    font=\sffamily\small\bfseries,
    text=hexiscolor!85!black,
    inner sep=6pt
  },
  detailbox/.style={
    rectangle, rounded corners=3pt,
    draw=hexiscolor!40, fill=white,
    line width=0.5pt,
    text width=6.0cm, align=left,
    font=\sffamily\scriptsize,
    text=black!70, inner sep=5pt
  },
  notebox/.style={
    rectangle, rounded corners=2pt,
    draw=hexiscolor!40, fill=hexiscolor!4,
    line width=0.5pt, text width=6.4cm, align=center,
    font=\sffamily\scriptsize\itshape,
    text=hexiscolor!85!black, inner sep=5pt
  },
  pendinglabel/.style={
    rectangle, rounded corners=3pt,
    draw=black!30, fill=yellow!10, dashed,
    line width=0.6pt, text width=4.8cm, align=center,
    font=\sffamily\tiny, text=black!55,
    inner sep=4pt
  },
  chainlink/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.2pt, color=actuality!55
  },
  hexisarrow/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.2pt, color=hexiscolor!75
  },
]

% ===== A_2 (left, the phantasma — co-unmoved-originator with hexeis) =====
\node[actnode] (A2) at (-5, 2.0) {
  $A_2$: \textit{Phantasma}\\[1pt]
  {\footnotesize\normalfont (unmoved originator A)}
};

% ===== Settled doxai (hexis node, centre-left) =====
\node[hexisnode] (HEXIS) at (-5, -1.5) {
  Settled \textit{Doxai}\\(\textit{Hexeis})\\[2pt]
  {\scriptsize\mdseries (unmoved originator B)\\[1pt]MA 701a7--25}
};

% ===== M_3 -> A_3 (centre) =====
\node[motionnode] (M23) at (1.5, 0.0) {
  $M_3 \!\to\! A_3$: Cognitive Engagement\\[-1pt]
  {\tiny\normalfont 3 orientational modes + 1 committal dimension (\textit{doxa})}
};

% ===== A_3 (right) =====
\node[actnode] (A3) at (8.0, 0.0) {
  $A_3$: Completed\\Cognitive Actuality
};

% ===== Two unmoved-originator arrows into M_3 -> A_3 =====
\draw[chainlink] (A2.east) .. controls +(2.5, 0) and +(-1.5, 0.8) .. (M23.west);
\draw[hexisarrow] (HEXIS.east) .. controls +(2.5, 0) and +(-1.5, -0.8) .. (M23.west);

% ===== M_3 -> A_3 to A_3 =====
\draw[chainlink] (M23.east) -- (A3.west);

% Annotation: "additional unmoved originator"
\node[font=\sffamily\scriptsize\bfseries, text=hexiscolor!85!black,
  anchor=west, align=left]
  at ($(HEXIS.east) + (0.3, 0.8)$) {
  Settled \textit{doxai} function alongside $A_2$\\
  as \textbf{additional unmoved originators}\\
  of $M_3 \!\to\! A_3$
};

% ===== Practical-syllogism quotation (right of A_3) =====
\node[detailbox, anchor=west] (syllogism) at ($(A3.south) + (-2.8, -2.5)$) {
  \textbf{Practical syllogism (MA 701a7--25):}\\[3pt]
  \quad Major: \textit{``all sweet things are to be tasted''}\\
  \quad Minor: \textit{``this is sweet''}\\
  \quad Conclusion: \textit{(action: taste it)}\\[4pt]
  The major premise is a \textit{settled doxa} held as a \textit{hexis} of the rational soul.
};
\draw[-{Stealth[length=3pt]}, hexiscolor!50, thin, densely dotted]
  (HEXIS.south) .. controls +(0, -2) and +(-4, 0) .. (syllogism.west);

% ===== Habitual-rational-action gloss (below) =====
\node[notebox] at (1.5, -4.5) {
  \textbf{Habitual rational action} (MA 701a13--14):\\
  The practical syllogism fires from a \textit{hexis} without emotional mediation\\
  (e.g., ``The settled belief one ought to walk + the perception I am a man $\Rightarrow$ walking'')
};

% ===== UNDER-DEVELOPMENT placeholders =====
\node[pendinglabel, anchor=north west] (gap1) at ($(HEXIS.south west) + (-1.0, -3.4)$) {
  \textbf{\textsc{Pending}}\\
  \textit{techn\=e/praxis bivalence}\\
  (\S1.5 l.~1: habitual-procedural\\vs.\ evaluatively-complex)
};
\node[pendinglabel, anchor=north] (gap2) at ($(gap1.north east) + (5.4, 0)$) {
  \textbf{\textsc{Pending}}\\
  \textit{hexis--path\=e correlate pairs}\\
  (\S1.4 l.~174: courage:fear,\\magnanimity:anger,\\friendliness:kindness)
};
\node[pendinglabel, anchor=north] (gap3) at ($(gap2.north east) + (5.4, 0)$) {
  \textbf{\textsc{Pending}}\\
  \textit{diachronic-saturation feedback}\\
  ($A_4 \to$ \textsc{hexeis}; \S1.4 ll.~106, 110, 112)
};

\draw[densely dotted, black!40, line width=0.5pt]
  (HEXIS.south west) -- (gap1.north);
\draw[densely dotted, black!40, line width=0.5pt]
  (HEXIS.south) -- (gap2.north);
\draw[densely dotted, black!40, line width=0.5pt]
  (HEXIS.south east) -- (gap3.north);

% ===== Title =====
\node[hexiscolor!70!black, font=\sffamily\footnotesize\bfseries]
  at (1.5, 3.6) {SETTLED DOXAI AS \textit{HEXEIS} (additional unmoved originators of $M_3 \!\to\! A_3$)};

% ===== Background zone =====
\begin{scope}[on background layer]
  \node[fill=cognitive, rounded corners=6pt, inner sep=10pt,
    fit=(A2)(HEXIS)(M23)(A3)(syllogism)] {};
\end{scope}

\end{tikzpicture}
\end{document}
```

**Source provenance:**
- `SETTLED_DOXAI` declaration (id=`SETTLED-DOXAI`), HTML lines 1186–1211
- Connector to M23: HTML JS function (around lines 2454–2495), arcs from settled-doxai north face into M23.west
- Practical-syllogism passage: HTML `SETTLED_DOXAI.expanded[0]` (lines 1196–1200); cited to MA 701a7–25
- Habitual rational action gloss: HTML `SETTLED_DOXAI.expanded[2]` (lines 1205–1208); cited to MA 701a13–14
- "Additional unmoved originator" formulation: HTML `M23.kinetic.unmoved` (line 1313, USER-FACING) and HTML `SETTLED_DOXAI.desc` (line 1193, NEW-form-correct)
- Under-development gaps: per user note 2026-05-13 and §1.4 prose lines 106, 110, 112, 174; §1.5 prose line 1
