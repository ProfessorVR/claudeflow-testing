# Static export `diag-A1-A2` — for §1.2 (A₁–A₂ Aisthēsis)

**Scope:** $A_1 \to M_2 \to A_2$ chain with full three-factor kinetic context for both $M_1 \to A_1$ and $M_2 \to A_2$, plus the resonant-kinēsis dual-trace (`resonant_aisthēma` + `resonant_orexis`) anchored at $A_2$. Includes the basic-affective-valence pathos track that originates here.

**Display convention:** $M_n \to A_{n+1}$. Motions shown: $M_1 \to A_1$ (HTML id `M01`) entering $A_1$ from $A_0$, and $M_2 \to A_2$ (HTML id `M12`) entering $A_2$ from $A_1$.

```latex
% diag-A1-A2 — A_1 -> M_2 -> A_2 with dual-trace + kinetic columns
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
\definecolor{perceptual}{RGB}{225,237,252}

\begin{document}
\begin{tikzpicture}[scale=0.7, transform shape,
  actnode/.style={
    rectangle, rounded corners=4pt,
    draw=actuality, fill=actuality!8,
    line width=1.2pt,
    minimum width=7.0cm, minimum height=1.5cm,
    text width=6.6cm, align=center,
    font=\sffamily\small\bfseries,
    text=actuality
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
  timenode/.style={
    rectangle, rounded corners=2pt,
    draw=timecolor!70, fill=timecolor!5,
    line width=0.6pt,
    minimum width=3.0cm, minimum height=0.65cm,
    text width=2.8cm, align=center,
    font=\sffamily\scriptsize\itshape,
    text=timecolor!80!black
  },
  kineticbox/.style={
    rectangle, rounded corners=1pt,
    draw=motion!40, fill=white,
    line width=0.4pt,
    text width=3.8cm, align=left,
    font=\sffamily\tiny,
    text=black!65, inner sep=3pt
  },
  pathostrack/.style={
    rectangle, rounded corners=3pt,
    draw=pathoscolor!60, fill=pathoscolor!8,
    line width=0.7pt,
    text width=3.6cm, align=center,
    font=\sffamily\scriptsize\itshape,
    text=pathoscolor!80!black, inner sep=5pt
  },
  tracebox/.style={
    rectangle, rounded corners=3pt,
    draw=pathoscolor!70, fill=pathoscolor!10,
    line width=0.7pt,
    text width=4.0cm, align=center,
    font=\sffamily\scriptsize,
    text=pathoscolor!85!black, inner sep=4pt
  },
  notebox/.style={
    rectangle, rounded corners=2pt,
    draw=actuality!25, fill=white,
    line width=0.4pt, text width=3.6cm, align=center,
    font=\sffamily\tiny\itshape, text=actuality!55,
    inner sep=4pt
  },
  chainlink/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.2pt, color=actuality!55
  },
]

\def\nodesep{3.8}
\def\motionoff{1.9}
\def\kinoff{5.8}
\def\timeoff{5.6}

% ===== A_1, M_2, A_2 (centre column) =====
\node[actnode] (A1) at (0, 0) {
  $A_1$: Completed Perception\\[1pt]
  {\footnotesize\normalfont \textit{aisth\=ema} + affective valence (\textit{pathos})}\\
  {\footnotesize\normalfont DA III.7, 431a8--10}
};
\node[motionnode] (M12) at (0, -\motionoff) {
  $M_2 \!\to\! A_2$: Phantastic Motion\\[-1pt]
  {\tiny\normalfont Residual trace settles into determinate \textit{phantasma} (DA III.3, 428b10--16)}
};
\node[actnode] (A2) at (0, -\nodesep) {
  $A_2$: The \textit{Phantasma} Proper\\[1pt]
  {\footnotesize\normalfont Dual-aspect: formal imprint + affective charge}\\
  {\footnotesize\normalfont DA III.3, 428b10--16; DA III.7, 431b2}
};

\draw[chainlink] (A1.south) -- (M12.north);
\draw[chainlink] (M12.south) -- (A2.north);

% ===== M_1 -> A_1 (above A_1; shown so K01 column has anchor) =====
\node[motionnode, opacity=0.6] (M01) at (0, \motionoff) {
  $M_1 \!\to\! A_1$: Perceptual Motion\\[-1pt]
  {\tiny\normalfont \textit{aisth\=esis} (DA II.12, 424a17--24)}
};
\draw[chainlink, opacity=0.6] (M01.south) -- (A1.north);

% ===== Time column (right) =====
\node[timenode] (T01) at (\timeoff, \motionoff)
  {$\tau_{0 \to 1}$: medium transmits};
\node[timenode] (T12) at (\timeoff, -\motionoff)
  {$\tau_{1 \to 2}$: trace persists \& settles};
\draw[-{Stealth[length=3pt]}, timecolor!50, thin] (T01.west) -- (M01.east);
\draw[-{Stealth[length=3pt]}, timecolor!50, thin] (T12.west) -- (M12.east);

% ===== Kinetic-roles column (left) =====
\node[kineticbox] (K01) at (-\kinoff, \motionoff) {
  \textbf{Unmoved}: $A_0$ (sensible object)\\
  \textbf{Moved mover}: sense faculty\\
  \quad {\tiny(analogical ext.\ of III.10 schema)}\\
  \textbf{Moved}: sense organ / perceiver
};
\node[kineticbox] (K12) at (-\kinoff, -\motionoff) {
  \textbf{Unmoved}: $A_1$ (completed perception)\\
  \textbf{Moved mover}: \textit{phantasia}\\
  \quad {\tiny(retentive faculty; 429a1--2)}\\
  \textbf{Moved}: psycho-somatic state
};
\draw[-{Stealth[length=3pt]}, motion!30, thin] (K01.east) -- (M01.west);
\draw[-{Stealth[length=3pt]}, motion!30, thin] (K12.east) -- (M12.west);

% ===== Dual-trace boxes anchored at A_2 (right of A_2) =====
\node[tracebox, anchor=west] (resaisth) at ($(A2.east) + (1.2, 0.6)$) {
  \textbf{\textit{resonant aisth\=ema}}\\[1pt]
  {\tiny formal-epistemic imprint}\\
  {\tiny White, p.~498; \S1.2 ll.~91--107}
};
\node[tracebox, anchor=west] (resorex) at ($(A2.east) + (1.2, -0.6)$) {
  \textbf{\textit{resonant orexis}}\\[1pt]
  {\tiny affective valence (\textit{pathos})}\\
  {\tiny DA II.3, 414b4--6}
};
\draw[-{Stealth[length=3pt]}, pathoscolor!50, thin]
  (A2.east) -- (resaisth.west);
\draw[-{Stealth[length=3pt]}, pathoscolor!50, thin]
  (A2.east) -- (resorex.west);

% ===== Pathos track (far left, marks origination of basic valence) =====
\node[pathostrack] (pathos) at (-\kinoff + 0.2, 2.8) {
  \textbf{Basic Affective Valence}\\[2pt]
  {\tiny \textit{pathos}: pleasure/pain, good/bad}\\
  {\tiny co-constitutive with perception}\\
  {\tiny (DA II.3, 414b4--6; III.7, 431a8--10)}
};
\draw[pathoscolor!45, line width=0.6pt, densely dotted,
  -{Stealth[length=3pt]}]
  (pathos.south) -- ($(A1.west) + (-0.2, 0.5)$);

% ===== Pivot pull-out (left of A_2) =====
\node[notebox, text width=4.0cm] at (-\kinoff, -\nodesep + 0.4) {
  \textbf{$A_2$ as pivotal actuality:}\\
  Everything prior converges upon it;\\
  everything subsequent operates upon it
};
\draw[-{Stealth[length=3pt]}, actuality!25, thin]
  ($(A2.west) + (-1.2, -0.3)$) -- ($(A2.west) + (-0.1, -0.3)$);

% ===== Dual-origin note (below) =====
\node[notebox, text width=8.0cm, anchor=north] at ($(A2.south) + (0, -0.6)$) {
  \textbf{Dual origin:} thinking-initiated cases enter at $A_2$ with stored \textit{phantasmata};\\
  $A_0$--$A_1$ is the \textit{genetic} origin (MA 702a20--21)
};

% ===== Background zone =====
\begin{scope}[on background layer]
  \node[fill=perceptual, rounded corners=6pt, inner sep=12pt,
    fit=(A1)(A2)(M01)(M12)(K01)(K12)(T01)(T12)(resaisth)(resorex),
    label={[font=\sffamily\tiny\bfseries, text=actuality!40,
      anchor=north west, xshift=4pt, yshift=-2pt]north west:
      PERCEPTUAL--PHANTASMATIC ZONE}] {};
\end{scope}

\end{tikzpicture}
\end{document}
```

**Source provenance:**
- `actualities[1]` (id=`A1`), HTML lines 855–886
- `actualities[2]` (id=`A2`), HTML lines 888–911
- `motions[0]` (id=`M01`), HTML lines 1215–1259 (shown at reduced opacity to anchor the K01 column)
- `motions[1]` (id=`M12`), HTML lines 1261–1305
- K01 + K12 kinetic content from reference TikZ lines 225–236
- Pathos track from reference TikZ lines 265–283
- Dual-trace nomenclature (`resonant_aisthēma` + `resonant_orexis`): §1.2 prose lines 91, 111, 142; cited to Kevin White, *The Meaning of Phantasia in Aristotle's De Anima III, 3-8*, p. 498
- "Pivotal actuality" pull-out from reference TikZ lines 396–407
- "Dual origin" note: MA 702a20–21, HTML A2.note (line 892)
