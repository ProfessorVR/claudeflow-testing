# Static export `diag-A3-M3-A4-feedback` — for §1.4 (Emotion is Motion)

**Scope:** $A_3$-doxa-band $\to M_4 \to A_4$ with the **three input paths** to $M_4 \to A_4$:
1. **Deliberation-without-doxa** (deliberative phantasia where evaluative content is non-emotive);
2. **Settled-hexis** (habitual rational action where the practical syllogism fires from a hexis without emotional mediation);
3. **Emotion-mediated** (evaluatively complex action where doxa ratifies an evaluatively loaded aspectual presentation and emotion concretizes the orexis).

Plus the **pure-appetitive bypass** (MA 701a32–33) from $A_2$ direct to $M_4 \to A_4$ (skipping $A_3$), and the **diachronic feedback loop** indicator (EMO/$A_4 \to A_2$) per §1.4 prose lines 100, 106, 110, 112, 174.

**Display convention:** $M_n \to A_{n+1}$. The motion shown is $M_4 \to A_4$ (HTML id `M34`).

```latex
% diag-A3-M3-A4-feedback — A3-doxa-band -> M_4 -> A_4 + three input paths + feedback
% Compile with: pdflatex (requires tikz, amsmath)

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
\definecolor{timecolor}{RGB}{60,120,60}
\definecolor{pathoscolor}{RGB}{160,120,40}
\definecolor{emotioncolor}{RGB}{140,60,100}
\definecolor{doxacolor}{RGB}{90,40,120}
\definecolor{hexiscolor}{RGB}{170,100,30}
\definecolor{cognitive}{RGB}{252,240,225}
\definecolor{feedbackcolor}{RGB}{140,60,100}
\definecolor{loopcolor}{RGB}{100,100,100}

\begin{document}
\begin{tikzpicture}[scale=0.66, transform shape,
  actnode/.style={
    rectangle, rounded corners=4pt,
    draw=actuality, fill=actuality!8,
    line width=1.2pt,
    minimum width=6.6cm, minimum height=1.5cm,
    text width=6.2cm, align=center,
    font=\sffamily\small\bfseries,
    text=actuality
  },
  doxaband/.style={
    rectangle, rounded corners=5pt,
    draw=doxacolor!60, fill=doxacolor!8,
    line width=1pt, dash pattern=on 4pt off 2pt,
    text width=12cm, align=center,
    font=\sffamily\footnotesize\bfseries,
    text=doxacolor!85!black, inner sep=8pt
  },
  motionnode/.style={
    rectangle, rounded corners=2pt,
    draw=motion, fill=motion!6,
    line width=0.8pt, dashed,
    minimum width=5.8cm, minimum height=1cm,
    text width=5.6cm, align=center,
    font=\sffamily\footnotesize,
    text=motion
  },
  hexisnode/.style={
    rectangle, rounded corners=3pt,
    draw=hexiscolor!70, fill=hexiscolor!8,
    line width=0.8pt,
    minimum width=3.4cm, minimum height=1.2cm,
    text width=3.2cm, align=center,
    font=\sffamily\scriptsize\bfseries,
    text=hexiscolor!85!black
  },
  emotionbox/.style={
    rectangle, rounded corners=3pt,
    draw=emotioncolor!70, fill=emotioncolor!6,
    line width=0.8pt,
    text width=4.4cm, align=center,
    font=\sffamily\scriptsize,
    text=emotioncolor!85!black, inner sep=5pt
  },
  notebox/.style={
    rectangle, rounded corners=2pt,
    draw=actuality!25, fill=white,
    line width=0.4pt, text width=4.0cm, align=center,
    font=\sffamily\tiny\itshape, text=actuality!55,
    inner sep=4pt
  },
  chainlink/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.2pt, color=actuality!55
  },
  pathdelib/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.0pt, color=actuality!70
  },
  pathhexis/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.0pt, color=hexiscolor!75, densely dashed
  },
  pathemotion/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.0pt, color=emotioncolor!75
  },
  bypassarrow/.style={
    -{Stealth[length=4pt,width=3pt]},
    line width=0.8pt, color=pathoscolor!75, dotted
  },
  feedbackarrow/.style={
    -{Stealth[length=4pt,width=3pt]},
    line width=0.8pt, color=feedbackcolor!60, densely dashed
  },
]

% ===== A_2 (genetic origin / source of bypass) =====
\node[actnode] (A2) at (-7, 4.5) {
  $A_2$: \textit{Phantasma} Proper
};

% ===== A_3 (centre, top) =====
\node[actnode] (A3) at (0, 4.5) {
  $A_3$: Completed Cognitive Actuality\\[1pt]
  {\footnotesize\normalfont noetic / mnemonic / discursive (with \textit{doxa} layer)}
};

% ===== DOXA BAND below A_3 =====
\node[doxaband] (DOXA) at (0, 2.8) {
  \textit{Doxa}-band --- orthogonal committal layer atop $A_3$
};
\draw[-{Stealth[length=3pt]}, doxacolor!50, line width=0.5pt, densely dotted]
  (A3.south) -- (DOXA.north);

% ===== Settled hexeis (left), feeds the M4->A4 hexis path =====
\node[hexisnode] (HEXIS) at (-7.5, 0.5) {
  Settled\\\textit{doxai} as \textit{hexeis}\\[1pt]
  {\tiny MA 701a7--25}
};

% ===== M_4 -> A_4 =====
\node[motionnode] (M34) at (0, -1.5) {
  $M_4 \!\to\! A_4$: \textit{Orektikon} Motion\\[-1pt]
  {\tiny\normalfont Desire converging in action; somatic prep.\ internal (MA 702a17--19)}
};

% ===== A_4 =====
\node[actnode] (A4) at (0, -4.5) {
  $A_4$: Completed Action (\textit{praxis})\\[1pt]
  {\footnotesize\normalfont Motor loop closed; recursive}
};
\draw[chainlink] (M34.south) -- (A4.north);

% ===== THREE INPUT PATHS into M_4 -> A_4 =====

% Path 1: Deliberation-no-doxa (from A_3 directly, no doxa-band traversal)
\draw[pathdelib, rounded corners=6pt]
  (A3.south west) -- ++(-1.5, 0) -- ++(0, -3.5) -- (M34.north west);
\node[font=\sffamily\tiny\bfseries, text=actuality!75, anchor=east, align=center]
  at ($(M34.north west) + (-0.2, 1.4)$) {
  Path 1\\Deliberation\\(no \textit{doxa})\\{\tiny DA III.10}
};

% Path 2: Settled-hexis (from hexis node, habitual rational)
\draw[pathhexis, rounded corners=6pt]
  (HEXIS.east) .. controls +(2.0, 0) and +(-2.0, 0.0) ..
  ($(M34.west) + (0, 0.2)$);
\node[font=\sffamily\tiny\bfseries, text=hexiscolor!85!black, align=center,
  anchor=south]
  at ($(HEXIS.east) + (2.4, 0.4)$) {
  Path 2\\Settled \textit{hexis}\\(habitual rational)\\{\tiny MA 701a13--14}
};

% Path 3: Emotion-mediated (from DOXA band south, via EMO satellite)
\node[emotionbox, anchor=north] (EMO) at ($(DOXA.south east) + (4.6, -0.2)$) {
  \textbf{Emotion-Desire Composite}\\[2pt]
  {\tiny cognitive eval.\ + conative orient.\ + somatic prep.}\\[2pt]
  {\tiny\bfseries Emotion IS the form desire takes}\\
  {\tiny\bfseries under evaluative conditions}\\[2pt]
  {\tiny DA I.1, 403a25--b19; \textit{Rhet.} II.1, 1378a20--22}
};

\draw[pathemotion, rounded corners=4pt]
  (DOXA.south east) .. controls +(2.0, -0.5) and +(0, 1.2) ..
  (EMO.north);
\draw[pathemotion, rounded corners=4pt]
  (EMO.south) .. controls +(0, -1.0) and +(2.0, 0.5) ..
  ($(M34.east) + (0, 0.2)$);
\node[font=\sffamily\tiny\bfseries, text=emotioncolor!85!black, anchor=west, align=center]
  at ($(EMO.south) + (1.4, -0.6)$) {
  Path 3\\Emotion-mediated\\(evaluatively complex)\\{\tiny DA III.3, 427b21--24}
};

% ===== Pure-appetitive BYPASS (from A_2 directly, skips A_3 / DOXA) =====
\draw[bypassarrow, rounded corners=8pt]
  (A2.east) .. controls +(2.0, 0) and +(-2.0, 4.0) ..
  ($(M34.north) + (0, 0.1)$);
\node[font=\sffamily\tiny\itshape, text=pathoscolor!85!black, anchor=south, align=center]
  at ($(A2.east) + (3.2, -0.5)$) {
  Pure-appetitive bypass\\
  (MA 701a32--33:\\\quad ``I want to drink \ldots\\\quad straightaway I drink'')
};

% ===== A_3 -> DOXA traversal arrow (annotates that doxa is the gateway for paths 2 \& 3) =====
\draw[chainlink, opacity=0.5] (DOXA.south) -- ++(0, -0.7);

% ===== Diachronic FEEDBACK loop indicator (EMO -> A_2) =====
\draw[feedbackarrow, rounded corners=12pt]
  (EMO.east) -- ++(2.5, 0)
  -- ++(0, 7.5)
  -- ++(-13.5, 0)
  -- (A2.north);

\node[font=\sffamily\tiny\bfseries\itshape, text=feedbackcolor!75!black, align=center, anchor=north]
  at ($(A2.north) + (1.0, 1.2)$) {
  Diachronic feedback:\\
  active emotion impairs corrective faculty\\
  $\to$ further \textit{doxa} $\to$ further emotion\\
  + diachronic-saturation $\to$ hexis-formation\\
  {\tiny \textit{De Insomn.}\ 460b3--16; \textit{Rhet.}\ II.1, 1378a20--22; \S1.4 ll.~100, 106, 110, 174}
};

% ===== Variable-emotion note (bottom) =====
\node[notebox, text width=11cm] at (0, -7.0) {
  \textbf{Variable emotion presence:} evaluatively complex actions (fear, anger, pity) pass through Path 3;
  simple appetitive actions take the bypass (MA 701a32--33);
  long-habituated rational actions take Path 2 (settled hexis without emotional concretion).
};

% ===== Background zone =====
\begin{scope}[on background layer]
  \node[fill=cognitive, rounded corners=6pt, inner sep=10pt,
    fit=(A3)(DOXA)(M34)(A4)(HEXIS)(EMO)(A2),
    label={[font=\sffamily\tiny\bfseries, text=motion!40,
      anchor=north west, xshift=4pt, yshift=-2pt]north west:
      NOETIC--OREKTIKON ZONE}] {};
\end{scope}

\end{tikzpicture}
\end{document}
```

**Source provenance:**
- `actualities[2]` (A2) and `actualities[3]` (A3) cited; `actualities[4]` (A4), HTML lines 922–937
- `motions[3]` (id=`M34`), HTML lines 1379–1446
- `EMOTION_COMPOSITE` (id=`EMO`), HTML lines 1452–1488
- Three M34 input paths: HTML JS function (around line 2502), reference TikZ does not use this layered structure but the HTML's three-path scheme is faithful to §1.4 prose
- Pure-appetitive bypass: HTML JS function (around line 2577–2630); MA 701a32–33
- Feedback loop: reference TikZ lines 374–390; HTML `EMOTION_COMPOSITE.feedbackPath` (line 1483–1487); §1.4 prose lines 100, 106, 110, 112, 174
- Settled hexeis: HTML `SETTLED_DOXAI` (line 1186–1211) — shown here at minimal complexity, see `diag-hexeis-for-section-1.4.md` for the under-developed detail
- DA / Rhetoric citations: HTML `EMOTION_COMPOSITE.passages` (line 1456) and `M34.passages` (line 1383)
