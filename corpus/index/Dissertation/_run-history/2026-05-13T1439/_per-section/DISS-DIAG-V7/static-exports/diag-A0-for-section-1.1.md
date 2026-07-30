# Static export `diag-A0` — for §1.1 (A₀ Motion and Time)

**Scope:** $A_0$ standalone, with three-factor kinetic context (unmoved originator / moved mover / moved) and the motion-time substrate as ground.
**Display convention:** $M_n \to A_{n+1}$ (per *Physics* V.1, 224b7-8). The motion shown leading away from $A_0$ is $M_1 \to A_1$ (HTML id `M01`).
**Compile:** `pdflatex diag-A0-for-section-1.1.tex` after extracting the latex block below.

```latex
% diag-A0 — A₀ standalone, motion-time substrate
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
\begin{tikzpicture}[scale=0.85, transform shape,
  actnode/.style={
    rectangle, rounded corners=4pt,
    draw=actuality, fill=actuality!8,
    line width=1.2pt,
    minimum width=7.4cm, minimum height=1.6cm,
    text width=7.0cm, align=center,
    font=\sffamily\small\bfseries,
    text=actuality
  },
  motionnode/.style={
    rectangle, rounded corners=2pt,
    draw=motion, fill=motion!6,
    line width=0.8pt, dashed,
    minimum width=6.0cm, minimum height=1.0cm,
    text width=5.8cm, align=center,
    font=\sffamily\footnotesize,
    text=motion
  },
  timenode/.style={
    rectangle, rounded corners=2pt,
    draw=timecolor!70, fill=timecolor!5,
    line width=0.6pt,
    minimum width=3.2cm, minimum height=0.7cm,
    text width=3.0cm, align=center,
    font=\sffamily\scriptsize\itshape,
    text=timecolor!80!black
  },
  kineticbox/.style={
    rectangle, rounded corners=1pt,
    draw=motion!40, fill=white,
    line width=0.4pt,
    text width=4.0cm, align=left,
    font=\sffamily\footnotesize,
    text=black!70, inner sep=4pt
  },
  notebox/.style={
    rectangle, rounded corners=2pt,
    draw=actuality!25, fill=white,
    line width=0.4pt, text width=3.8cm, align=center,
    font=\sffamily\scriptsize\itshape, text=actuality!55,
    inner sep=4pt
  },
  chainlink/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.2pt, color=actuality!55
  },
]

% ===== A_0 actuality (centre) =====
\node[actnode] (A0) at (0, 0) {
  $A_0$: Sensible Object in Actuality\\[2pt]
  {\footnotesize\normalfont\textit{energeiai aisth\=eton}}\\[1pt]
  {\footnotesize\normalfont DA II.5, 417a--b}
};

% ===== Motion leading out of A_0 (display: M_1 -> A_1) =====
\node[motionnode] (M01) at (0, -3.0) {
  $M_1 \!\to\! A_1$: Perceptual Motion\\[-1pt]
  {\tiny\normalfont \textit{aisth\=esis} --- form received without matter (DA II.12, 424a17--24)}
};

\draw[chainlink] (A0.south) -- (M01.north);

% ===== Time node (right) =====
\node[timenode] (T01) at (5.6, -3.0) {
  $\tau_{0 \to 1}$: medium transmits
};
\draw[-{Stealth[length=3pt]}, timecolor!50, thin]
  (T01.west) -- (M01.east);

% ===== Three-factor kinetic roles (left, anchored at M_1->A_1) =====
\node[kineticbox] (K01) at (-5.6, -3.0) {
  \textbf{Unmoved}: $A_0$ (sensible object)\\
  \textbf{Moved mover}: sense faculty\\
  \quad {\tiny(analogical ext.\ of III.10 schema)}\\
  \textbf{Moved}: sense organ / perceiver
};
\draw[-{Stealth[length=3pt]}, motion!30, thin]
  (K01.east) -- (M01.west);

% ===== Naming principle (top right) =====
\node[notebox] at (5.6, 1.7) {
  Each motion takes its\\name from its \textit{terminus}\\[1pt]
  (\textit{Phys.} V.1, 224b7--8)
};

% ===== Ontological-character pull-out (top left) =====
\node[notebox, text width=4.4cm] at (-5.6, 1.7) {
  \textbf{$A_0$ as unmoved originator}\\[1pt]
  The sensible object exercises its sensible power
  without being altered by the perceptual event:
  the first actuality of the chain.
};

% ===== Motion-time substrate label (top centre, in zone) =====
\node[motion!70!black, font=\sffamily\footnotesize\bfseries]
  at (0, 1.8) {MOTION-TIME SUBSTRATE (\textit{Phys.} III.1; IV.11)};

% ===== Pathos co-constitution annotation (lower left) =====
\node[rectangle, rounded corners=3pt,
  draw=pathoscolor!60, fill=pathoscolor!8, line width=0.6pt,
  text width=4.2cm, align=center,
  font=\sffamily\scriptsize\itshape,
  text=pathoscolor!80!black, inner sep=4pt]
  at (-5.6, -5.4) {
  \textbf{Basic Affective Valence}\\[1pt]
  \textit{pathos}: enters at $A_1$,\\co-constitutive with perception\\(DA II.3, 414b4--6)
};

% ===== Background zone =====
\begin{scope}[on background layer]
  \node[fill=perceptual, rounded corners=6pt, inner sep=10pt,
    fit=(A0)(M01)(K01)(T01),
    label={[font=\sffamily\tiny\bfseries, text=actuality!40,
      anchor=north west, xshift=4pt, yshift=-2pt]north west:
      PERCEPTUAL ZONE (genesis)}] {};
\end{scope}

\end{tikzpicture}
\end{document}
```

**Source provenance:**
- `actualities[0]` (id=`A0`), HTML lines 830–852
- `motions[0]` (id=`M01`), HTML lines 1215–1259
- K01 kinetic-roles content from reference TikZ lines 225–230
- Naming principle: *Physics* V.1, 224b7-8 (new convention) — supersedes the reference TikZ's citation to *Physics* V.5, 229b25 (which makes the same point but on a different lexical register).
