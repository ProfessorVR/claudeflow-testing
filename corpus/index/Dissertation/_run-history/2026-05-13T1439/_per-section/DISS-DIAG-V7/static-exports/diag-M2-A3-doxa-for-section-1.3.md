# Static export `diag-M2-A3-doxa` — for §1.3 (A₃ Orientational Modes)

**Scope:** $M_3 \to A_3$ (canonical M23) plus the three orientational modes (NOESIS / MEMORY / DISCURSIVE, with SPECULATIVE and DELIBERATIVE as sub-domains) and the doxa-band as an orthogonal supervenient layer beneath all four. Memory feeds forward to the discursive parent (HTML `feedsForward: 'A3-DISCURSIVE'`).

**Display convention:** $M_n \to A_{n+1}$. The motion shown is $M_3 \to A_3$ (HTML id `M23`).

**Note on §1.3 prose-vs-diagram numbering offset:** §1.3 prose uses $A_2$ for *resonant kinēsis* (= diagram's $A_2$/phantasma equivalent) and $A_3$ for *phantasma proper* (= diagram's $A_3$/cognitive actuality equivalent). The static export below uses the **diagram's** canonical numbering: $A_2$ = phantasma proper, $A_3$ = the row of branching cognitive actualities. Phase 3B (numbering audit) must reconcile the prose convention against the diagram convention.

```latex
% diag-M2-A3-doxa — M_3 -> A_3 with three orientational modes + doxa band
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
\definecolor{doxacolor}{RGB}{90,40,120}
\definecolor{perceptual}{RGB}{225,237,252}
\definecolor{cognitive}{RGB}{252,240,225}

\begin{document}
\begin{tikzpicture}[scale=0.62, transform shape,
  actnode/.style={
    rectangle, rounded corners=4pt,
    draw=actuality, fill=actuality!8,
    line width=1.2pt,
    minimum width=6cm, minimum height=1.3cm,
    text width=5.6cm, align=center,
    font=\sffamily\small\bfseries,
    text=actuality
  },
  modenode/.style={
    rectangle, rounded corners=3pt,
    draw=actuality!70, fill=actuality!4,
    line width=0.8pt,
    minimum width=3.4cm, minimum height=1.4cm,
    text width=3.2cm, align=center,
    font=\sffamily\footnotesize\bfseries,
    text=actuality!85!black
  },
  submodenode/.style={
    rectangle, rounded corners=2pt,
    draw=actuality!55, fill=actuality!3,
    line width=0.5pt,
    minimum width=3.0cm, minimum height=1.0cm,
    text width=2.8cm, align=center,
    font=\sffamily\scriptsize,
    text=actuality!75!black
  },
  doxaband/.style={
    rectangle, rounded corners=5pt,
    draw=doxacolor!60, fill=doxacolor!8,
    line width=1pt, dash pattern=on 4pt off 2pt,
    text width=15cm, align=center,
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
  detailbox/.style={
    rectangle, rounded corners=3pt,
    draw=motion!35, fill=white,
    line width=0.5pt,
    text width=4.8cm, align=left,
    font=\sffamily\tiny,
    text=black!65, inner sep=5pt
  },
  notebox/.style={
    rectangle, rounded corners=2pt,
    draw=actuality!25, fill=white,
    line width=0.4pt, text width=4.2cm, align=center,
    font=\sffamily\tiny\itshape, text=actuality!55,
    inner sep=4pt
  },
  chainlink/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.2pt, color=actuality!55
  },
  feedlink/.style={
    -{Stealth[length=4pt,width=3pt]},
    line width=0.7pt, color=actuality!45, densely dashed
  },
]

% ===== A_2 (top, source of M_3 -> A_3) =====
\node[actnode] (A2) at (0, 4.0) {
  $A_2$: The \textit{Phantasma} Proper\\[1pt]
  {\footnotesize\normalfont DA III.3, 428b10--16}
};

% ===== M_3 -> A_3 (centre) =====
\node[motionnode] (M23) at (0, 1.5) {
  $M_3 \!\to\! A_3$: Cognitive Engagement\\[-1pt]
  {\tiny\normalfont 3 orientational modes + 1 committal dimension (doxa)}
};
\draw[chainlink] (A2.south) -- (M23.north);

% ===== A_3 row: four mode nodes =====
\node[modenode] (NOESIS)   at (-7, -1.5)
  {Pure \textit{Noesis}\\[2pt]{\scriptsize\mdseries intellection}\\[1pt]{\tiny atemporal}};
\node[modenode] (MEMORY)   at (-3, -1.5)
  {Memory\\[2pt]{\scriptsize\mdseries \textit{phantasma} as past \textit{qua} past}\\[1pt]{\tiny retrospective}};
\node[modenode,
  minimum width=7cm, text width=6.6cm,
  align=center] (DISC) at (4.6, -0.6)
  {Discursive (parent)\\[2pt]{\scriptsize\mdseries synthetic operation upon \textit{phantasmata}}};

% Discursive sub-domains
\node[submodenode] (SPEC) at (3.0, -2.4)
  {Speculative /\\Theoretical\\[1pt]{\tiny atemporal-contemplative}};
\node[submodenode] (DELIB) at (6.2, -2.4)
  {Deliberative\\[1pt]{\tiny prospective}};

% Branching arrows from M23 south
\draw[chainlink] (M23.south) -- (NOESIS.north);
\draw[chainlink] (M23.south) -- (MEMORY.north);
\draw[chainlink] (M23.south) -- (DISC.north);

% Memory feeds-forward to Discursive (HTML: feedsForward: 'A3-DISCURSIVE')
\draw[feedlink, rounded corners=4pt]
  (MEMORY.east) .. controls +(1.2, 0.3) and +(-1.2, 0.0) ..
  (DISC.west)
  node[pos=0.5, above, font=\sffamily\tiny\itshape, text=actuality!55]
  {feeds};

% Sub-domain connections (parent to children)
\draw[feedlink] (DISC.south) -- (SPEC.north);
\draw[feedlink] (DISC.south) -- (DELIB.north);

% ===== DOXA BAND (orthogonal, beneath the four modes) =====
\node[doxaband] (DOXA) at (0.5, -4.4) {
  \textit{Doxa} --- the orthogonal committal dimension\\[2pt]
  {\scriptsize\mdseries supervenes upon \textit{any} orientational mode;
  involuntary (\textit{ouk eph' h\=emin}, 427b17--21);
  requires \textit{logos}, \textit{pistis}, \textit{pepeisthai} (DA III.3, 428a19--24)}
};

% Supervenience arrows from each mode down into the doxa band
\foreach \src in {NOESIS, MEMORY, SPEC, DELIB} {
  \draw[doxacolor!50, line width=0.5pt, densely dotted,
    -{Stealth[length=3pt]}]
    (\src.south) -- (\src.south |- DOXA.north);
}

% ===== Modes detail box (right) =====
\node[detailbox, anchor=west] (modes) at ($(M23.east) + (3.2, 0)$) {
  \textbf{\small Orientational Modes:}\\[3pt]
  \textbf{1.\ Intellection} (atemporal)\\
  \quad \textit{phantasma} $\to$ universal\\[2pt]
  \textbf{2.\ Memory} (retrospective)\\
  \quad \textit{phantasma} as past \textit{qua} past\\[2pt]
  \textbf{3.\ Discursive} (synthetic)\\
  \quad several \textit{phantasmata} $\to$ unity\\
  \quad\quad{\tiny (a) speculative: unchangeable truths}\\
  \quad\quad{\tiny (b) deliberative: realizable goods}\\[5pt]
  \rule{\linewidth}{0.3pt}\\[4pt]
  \textbf{\small Committal Dimension (Doxa):}\\[3pt]
  \textbf{4.\ \textit{Doxa}} (orthogonal, not parallel)\\
  \quad supervenes upon any mode\\
  \quad gatekept by corrective faculty\\
  \quad\quad{\tiny(\textit{De Insomn.}\ 460b3--16)}
};
\draw[-{Stealth[length=3pt]}, motion!25, thin]
  (M23.east) -- (modes.west |- M23.east);

% ===== Chain-termination note (far left) =====
\node[notebox] (terminate) at (-7, -3.3) {
  \textbf{Chain terminates at $A_3$}\\
  for non-practical content:\\
  no \textit{orexis} activated\\(DA III.10, 433a13--15)
};
\draw[-{Stealth[length=3pt]}, actuality!25, thin]
  (terminate.north) -- (NOESIS.south);

% ===== Schema label =====
\node[motion!70!black, font=\sffamily\footnotesize\bfseries]
  at (0, 5.6)
  {THREE-FACTOR SCHEMA + ORIENTATIONAL MODES (DA III.10, 433b10--18; DA III.11, 434a5--10)};

% ===== Background zones =====
\begin{scope}[on background layer]
  \node[fill=perceptual, rounded corners=6pt, inner sep=8pt,
    fit=(A2)] {};
  \node[fill=cognitive, rounded corners=6pt, inner sep=10pt,
    fit=(M23)(NOESIS)(MEMORY)(DISC)(SPEC)(DELIB)(DOXA)(modes),
    label={[font=\sffamily\tiny\bfseries, text=motion!40,
      anchor=north west, xshift=4pt, yshift=-2pt]north west:
      NOETIC ZONE}] {};
\end{scope}

\end{tikzpicture}
\end{document}
```

**Source provenance:**
- `actualities[3]` (id=`A3`, `isBranching: true`), HTML lines 914–920
- `a3Nodes`: A3-NOESIS (line 946), A3-MEMORY (985), A3-DISCURSIVE (1026), A3-SPECULATIVE (1057), A3-DELIBERATIVE (1094)
- `DOXA_BAND` (id=`DOXA`), HTML lines 1138–1183
- `motions[2]` (id=`M23`), HTML lines 1307–1377
- Modes detail box: reference TikZ lines 289–307; HTML M23.modes (line 1340–1349)
- Chain-termination note: HTML A3-NOESIS.expanded "Chain termination" block (lines 977–981); cited DA III.10, 433a13–15
- Memory feeds-forward to Discursive: HTML A3-MEMORY `feedsForward: 'A3-DISCURSIVE'` (line 993); confirmed in A3-DISCURSIVE expanded "Fed by memory" block (line 1047)
