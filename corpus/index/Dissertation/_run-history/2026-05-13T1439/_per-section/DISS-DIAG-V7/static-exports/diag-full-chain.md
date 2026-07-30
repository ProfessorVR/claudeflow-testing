# Static export `diag-full-chain` — for §1.0 (Introduction) + final-document front-matter

**Scope:** Full $A_0 \to A_4$ chain at single-page scale. Reproduces the reference TikZ block (`Actualization of Desire Diagram in Latex Format.md`) with **one correction**: motion display labels are migrated from old form $M_n \to M_{n+1}$ to new form $M_n \to A_{n+1}$ (motion named by terminus, per *Physics* V.1, 224b7-8), matching the HTML SVG's runtime convention (via `motionDisplayId()` at HTML line 1522).

**Other than the motion-label correction, the structural content of the diagram is identical to the reference TikZ.** This export is intended for the dissertation's introduction overview and TOC-adjacent reproduction.

```latex
% diag-full-chain — full A_0 -> A_4 actualization chain
% Compile with: pdflatex (requires tikz, amsmath)
% Source: reference TikZ at
%   tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/Actualization of Desire Diagram in Latex Format.md
% Change vs. reference: motion display labels are M_n -> A_{n+1} (new convention)
%   per Physics V.1, 224b7-8 (motion named by terminus).

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
\definecolor{perceptual}{RGB}{225,237,252}
\definecolor{cognitive}{RGB}{252,240,225}
\definecolor{loopcolor}{RGB}{100,100,100}
\definecolor{feedbackcolor}{RGB}{140,60,100}

\begin{document}
\begin{tikzpicture}[scale=0.62, transform shape,
  actnode/.style={
    rectangle, rounded corners=4pt,
    draw=actuality, fill=actuality!8,
    line width=1.2pt,
    minimum width=7cm, minimum height=1.5cm,
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
  emotionbox/.style={
    rectangle, rounded corners=3pt,
    draw=emotioncolor!70, fill=emotioncolor!6,
    line width=0.8pt,
    text width=4.4cm, align=center,
    font=\sffamily\scriptsize,
    text=emotioncolor!85!black, inner sep=5pt
  },
  detailbox/.style={
    rectangle, rounded corners=3pt,
    draw=motion!35, fill=white,
    line width=0.5pt,
    text width=4.8cm, align=left,
    font=\sffamily\tiny,
    text=black!65, inner sep=5pt
  },
  chainlink/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.2pt, color=actuality!55
  },
  looparrow/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1pt, color=loopcolor, densely dashed
  },
  feedbackarrow/.style={
    -{Stealth[length=4pt,width=3pt]},
    line width=0.8pt, color=feedbackcolor!60, densely dashed
  },
]

% ---- Layout constants ----
\def\nodesep{3.8}
\def\motionoff{1.9}
\def\kinoff{5.8}
\def\timeoff{5.6}
\def\detailoff{10.8}
\def\loopoff{10.2}

% ============================================================
%  ACTUALITIES (centre column)
% ============================================================

\node[actnode] (A0) at (0, 0) {
  $A_0$: Sensible Object in Actuality\\[1pt]
  {\footnotesize\normalfont\textit{energeiai aisth\=eton}}
};
\node[actnode] (A1) at (0, -\nodesep) {
  $A_1$: Completed Perception\\[1pt]
  {\footnotesize\normalfont Aisth\=ema + Affective Valence (\textit{pathos})}
};
\node[actnode] (A2) at (0, -2*\nodesep) {
  $A_2$: The \textit{Phantasma} Proper\\[1pt]
  {\footnotesize\normalfont Dual-aspect: formal imprint + affective charge}
};
\node[actnode] (A3) at (0, -3*\nodesep) {
  $A_3$: Completed Cognitive Actuality\\[1pt]
  {\footnotesize\normalfont Noetic / Doxastic / Mnemonic / Anticipatory}
};
\node[actnode] (A4) at (0, -4*\nodesep) {
  $A_4$: Completed Action (\textit{praxis})\\[1pt]
  {\footnotesize\normalfont Motor loop closed; recursive}
};

% ============================================================
%  MOTIONS (between actualities)
%  NEW CONVENTION: M_n -> A_{n+1}
% ============================================================

\node[motionnode] (M01) at (0, -\motionoff) {
  $M_1 \!\to\! A_1$: Perceptual Motion\\[-1pt]
  {\tiny\normalfont \textit{aisth\=esis} --- form received without matter (DA II.12, 424a17--24)}
};
\node[motionnode] (M12) at (0, -\nodesep - \motionoff) {
  $M_2 \!\to\! A_2$: Phantastic Motion\\[-1pt]
  {\tiny\normalfont Residual trace settles into determinate \textit{phantasma} (DA III.3, 428b10--16)}
};
\node[motionnode] (M23) at (0, -2*\nodesep - \motionoff) {
  $M_3 \!\to\! A_3$: Cognitive Engagement\\[-1pt]
  {\tiny\normalfont 3 orientational modes + 1 committal dimension (\textit{doxa})}
};
\node[motionnode] (M34) at (0, -3*\nodesep - \motionoff) {
  $M_4 \!\to\! A_4$: \textit{Orektikon} Motion\\[-1pt]
  {\tiny\normalfont Desire converging in action; somatic prep.\ internal (MA 702a17--19)}
};

% ============================================================
%  CHAIN ARROWS
% ============================================================

\draw[chainlink] (A0.south) -- (M01.north);
\draw[chainlink] (M01.south) -- (A1.north);
\draw[chainlink] (A1.south) -- (M12.north);
\draw[chainlink] (M12.south) -- (A2.north);
\draw[chainlink] (A2.south) -- (M23.north);
\draw[chainlink] (M23.south) -- (A3.north);
\draw[chainlink] (A3.south) -- (M34.north);
\draw[chainlink] (M34.south) -- (A4.north);

% ============================================================
%  TIME (right column)
% ============================================================

\node[timenode] (T01) at (\timeoff, -\motionoff)
  {$\tau_{0 \to 1}$: medium transmits};
\node[timenode] (T12) at (\timeoff, -\nodesep - \motionoff)
  {$\tau_{1 \to 2}$: trace persists \& settles};
\node[timenode] (T23) at (\timeoff, -2*\nodesep - \motionoff)
  {$\tau_{2 \to 3}$: variable by mode};
\node[timenode] (T34) at (\timeoff, -3*\nodesep - \motionoff)
  {$\tau_{3 \to 4}$: desire $\to$ motor act};

\foreach \t/\m in {T01/M01, T12/M12, T23/M23, T34/M34} {
  \draw[-{Stealth[length=3pt]}, timecolor!50, thin] (\t.west) -- (\m.east);
}

% Time axis label
\node[timecolor!80!black, font=\sffamily\scriptsize\bfseries,
  text width=2.4cm, align=center]
  at (\timeoff + 3.2, -\motionoff)
  {TIME:\\number of motion\\(\textit{Phys.}\ IV.11,\\219b1)};

% T23 detail
\node[rectangle, rounded corners=2pt, draw=timecolor!30, fill=white,
  line width=0.3pt, text width=3.4cm, align=left,
  font=\sffamily\tiny\itshape, text=timecolor!65!black, inner sep=3pt]
  (T23d) at (\timeoff, -2*\nodesep - \motionoff - 1.3) {
  intellection: instantaneous\\
  doxa: \textit{euthus} to extended\\
  memory: constitutively temporal\\
  deliberation: prospective,\\
  \quad bounded by sense of time\\
  \quad (DA III.10, 433b7)
};
\draw[-{Stealth[length=2pt]}, timecolor!30, ultra thin] (T23d.north) -- (T23.south);

% T34 detail
\node[rectangle, rounded corners=2pt, draw=timecolor!30, fill=white,
  line width=0.3pt, text width=3.4cm, align=left,
  font=\sffamily\tiny\itshape, text=timecolor!65!black, inner sep=3pt]
  (T34d) at (\timeoff, -3*\nodesep - \motionoff - 1.3) {
  ``virtually simultaneous''\\
  under normal conditions\\
  (MA 702a15--17);\\
  ``natural correspondence\\
  of the active and passive''
};
\draw[-{Stealth[length=2pt]}, timecolor!30, ultra thin] (T34d.north) -- (T34.south);

% ============================================================
%  KINETIC ROLES (left column)
% ============================================================

\node[kineticbox] (K01) at (-\kinoff, -\motionoff) {
  \textbf{Unmoved}: $A_0$ (sensible object)\\
  \textbf{Moved mover}: sense faculty\\
  \quad {\tiny(analogical ext.\ of III.10 schema)}\\
  \textbf{Moved}: sense organ / perceiver
};
\node[kineticbox] (K12) at (-\kinoff, -\nodesep - \motionoff + 1.0) {
  \textbf{Unmoved}: $A_1$ (completed perception)\\
  \textbf{Moved mover}: \textit{phantasia}\\
  \quad {\tiny(retentive faculty; 429a1--2)}\\
  \textbf{Moved}: psycho-somatic state
};
\node[kineticbox] (K23) at (-\kinoff, -2*\nodesep - \motionoff) {
  \textbf{Unmoved}: $A_2$ (\textit{phantasma}) +\\
  \quad settled \textit{doxai} as \textit{hexeis}\\
  \textbf{Moved mover}: rational cognitive\\
  \quad apparatus (unified)\\
  \textbf{Moved}: rational animal
};
\node[kineticbox] (K34) at (-\kinoff, -3*\nodesep - \motionoff) {
  \textbf{Unmoved}: realizable good at $A_3$\\
  \quad (433b10--18)\\
  \textbf{Moved mover}: \textit{orexis}\\
  \quad {\tiny(emotion-structured or basic appetite)}\\
  \textbf{Moved}: animal via joint (433b21--25)
};

\foreach \k/\m in {K01/M01, K12/M12, K23/M23, K34/M34} {
  \draw[-{Stealth[length=3pt]}, motion!30, thin] (\k.east) -- (\m.west);
}

% Schema label
\node[motion!70!black, font=\sffamily\footnotesize\bfseries]
  at (0, 1.8)
  {THREE-FACTOR SCHEMA (DA III.10, 433b10--18)};

% ============================================================
%  BASIC AFFECTIVE VALENCE TRACK (far left)
% ============================================================

\node[pathostrack] (pathos) at (-\kinoff + 0.2, 2.8) {
  \textbf{Basic Affective Valence}\\[2pt]
  {\tiny \textit{pathos}: pleasure/pain, good/bad}\\
  {\tiny co-constitutive with perception}\\
  {\tiny (DA II.3, 414b4--6; III.7, 431a8--10)}
};

\draw[pathoscolor!45, line width=0.6pt, densely dotted,
  -{Stealth[length=3pt]}]
  ($(pathos.south) + (0, -0.15)$) -- ($(K34.south) + (0, -0.5)$)
  node[pos=0.06, right=8pt, font=\sffamily\tiny\bfseries\itshape,
    text=pathoscolor!75!black, text width=2.0cm, align=left]
  {co-constitutive\\with perception\\at $A_0$--$A_1$}
  node[pos=0.47, right=3pt, font=\sffamily\tiny\itshape,
    text=pathoscolor!55!black, text width=2.0cm, align=left]
  {dispositional valence\\persists through\\every node}
  node[pos=0.80, right=3pt, font=\sffamily\tiny\itshape,
    text=pathoscolor!55!black, text width=2.0cm, align=left]
  {non-mobilising:\\bare phantasia $\to$\\\textit{apath\=os} (427b21)};

% ============================================================
%  M_3 -> A_3 DETAIL BOX (far right column)
% ============================================================

\node[detailbox] (modes) at (\detailoff, -2*\nodesep - \motionoff) {
  \textbf{\small Orientational Modes:}\\[3pt]
  \textbf{1.\ Intellection} (atemporal)\\
  \quad \textit{phantasma} $\to$ universal\\[2pt]
  \textbf{2.\ Memory} (retrospective)\\
  \quad \textit{phantasma} as past \textit{qua} past\\[2pt]
  \textbf{3.\ Deliberative \textit{phantasia}} (prospective)\\
  \quad several \textit{phantasmata} $\to$ unity\\
  \quad\quad{\tiny projective-synthetic + calculative-practical}\\[5pt]
  \rule{\linewidth}{0.3pt}\\[4pt]
  \textbf{\small Committal Dimension:}\\[3pt]
  \textbf{4.\ \textit{Doxa}} (orthogonal, not parallel)\\
  \quad supervenes upon any mode\\
  \quad requires \textit{logos}, \textit{pistis}, \textit{pepeisthai}\\
  \quad\quad (DA III.3, 428a19--24)\\
  \quad involuntary: \textit{ouk eph' h\=emin} (427b17--21)\\
  \quad subject to gatekeeping condition\\
  \quad\quad{\tiny(\textit{De Insomn.}\ 460b3--16; interp.\ recon.)}
};

\draw[-{Stealth[length=3pt]}, motion!25, thin]
  (M23.east) -- (modes.west |- M23.east);

% ============================================================
%  EMOTION-DESIRE COMPOSITE (far right, below modes)
% ============================================================

\node[emotionbox] (emotion) at (\detailoff, -3*\nodesep - \motionoff - 1.5) {
  \textbf{Emotion-Desire Composite}\\[3pt]
  {\tiny When doxa at $A_3$ discloses evaluatively complex}\\
  {\tiny content (427b21--24: \textit{euthus paschomen}):}\\[3pt]
  {\scriptsize cognitive eval.\ + conative orient.}\\
  {\scriptsize + somatic preparation}\\[3pt]
  {\tiny DA I.1, 403a25--b19: anger = desire for}\\
  {\tiny retaliation + boiling of blood}\\[4pt]
  {\tiny\bfseries Emotion IS the form desire takes}\\
  {\tiny\bfseries under evaluative conditions}\\[4pt]
  \rule{\linewidth}{0.3pt}\\[3pt]
  {\tiny\itshape Variable: simple appetite bypasses}\\
  {\tiny\itshape emotion (MA 701a32--33)}
};

\draw[-{Stealth[length=3pt]}, emotioncolor!40, thin]
  (M34.east) -- (emotion.west |- M34.east);

% ============================================================
%  CHAIN TERMINATION (left, near A3-M34)
% ============================================================

\node[rectangle, rounded corners=2pt, draw=actuality!25, fill=white,
  line width=0.4pt, text width=3.6cm, align=center,
  font=\sffamily\tiny\itshape, text=actuality!50, inner sep=4pt]
  (terminate) at (-\kinoff, -3*\nodesep + 0.3) {
  \textbf{Chain terminates at $A_3$}\\
  when doxa concerns\\non-practical content:\\
  no \textit{orexis} activated\\(DA III.10, 433a13--15)
};

\draw[-{Stealth[length=3pt]}, actuality!25, thin]
  (terminate.east) -- (A3.west |- terminate.east);

% ============================================================
%  DUAL-ORIGIN (left, near A2)
% ============================================================

\node[rectangle, rounded corners=2pt, draw=actuality!25, fill=white,
  line width=0.4pt, text width=3.6cm, align=center,
  font=\sffamily\tiny\itshape, text=actuality!50, inner sep=4pt]
  (dualorigin) at (-\kinoff, -2*\nodesep + 0.45) {
  \textbf{Dual origin:}\\thinking-initiated cases\\
  enter at $A_2$ with stored\\
  \textit{phantasmata} (MA 702a20--21);\\
  $A_0$--$A_1$ = genetic origin
};

\draw[-{Stealth[length=3pt]}, actuality!25, thin]
  (dualorigin.east) -- (A2.west |- dualorigin.east);

% ============================================================
%  FEEDBACK LOOP
% ============================================================

\draw[feedbackarrow, rounded corners=8pt]
  (emotion.south) -- ++(0, -0.5)
  -- ++({-\detailoff - \kinoff - 1.8}, 0)
  -- ++(0, {\nodesep + \motionoff + 0.5})
  -- (A2.west);

\node[font=\sffamily\tiny\itshape, text=feedbackcolor!60,
  text width=3.2cm, align=center, anchor=east]
  at ({-\kinoff - 1.5}, -3*\nodesep) {
  \textbf{Feedback}:\\emotion impairs\\corrective faculty\\
  $\to$ further doxa\\$\to$ further emotion\\[2pt]
  {\tiny\textit{De Insomn.}\ 460b3--16}\\
  {\tiny\textit{Rhet.}\ 1378a20--22}\\
  {\tiny(interp.\ recon.)}
};

% ============================================================
%  ONTOLOGICAL PRIORITY LINE
% ============================================================

\coordinate (divleft)  at (-\kinoff - 2.6, -2*\nodesep - 1.15);
\coordinate (divright) at (\timeoff + 2.0, -2*\nodesep - 1.15);

\draw[black!35, line width=0.5pt, densely dash dot]
  (divleft) -- (divright);

\node[font=\sffamily\tiny\itshape, text=black!45,
  text width=11cm, align=center, anchor=south,
  fill=white, fill opacity=0.85, text opacity=1, inner sep=1pt]
  at ($(divleft)!0.5!(divright) + (0, 0.08)$)
  {$A_2$ is the pivotal actuality: everything prior converges upon it;
   everything subsequent operates upon it as indispensable material};

% ============================================================
%  BACKGROUND ZONES
% ============================================================

\begin{scope}[on background layer]
  \node[fill=perceptual, rounded corners=6pt, inner sep=10pt,
    fit=(A0)(A2)(K01)(K12)(T01)(T12),
    label={[font=\sffamily\tiny\bfseries, text=actuality!40,
      anchor=north west, xshift=4pt, yshift=-2pt]north west:
      PERCEPTUAL--PHANTASMATIC}] (zoneupper) {};

  \node[fill=cognitive, rounded corners=6pt, inner sep=10pt,
    fit=(A3)(A4)(K23)(K34)(T23)(T34),
    label={[font=\sffamily\tiny\bfseries, text=motion!40,
      anchor=north west, xshift=4pt, yshift=-2pt]north west:
      NOETIC--OREKTIKON}] (zonelower) {};
\end{scope}

% ============================================================
%  RECURSIVE LOOP
% ============================================================

\draw[looparrow, rounded corners=10pt]
  (A4.east) -- ++(\loopoff, 0)
  -- ++(0, 4*\nodesep)
  -- (A0.east)
  node[pos=0.50, right=6pt, font=\sffamily\scriptsize\itshape,
    text=loopcolor, text width=2.6cm, align=center]
  {Recursive loop:\\completed action\\changes the world\\$\to$ new $A_0$};

% ============================================================
%  NAMING PRINCIPLE (top right)
% ============================================================

\node[rectangle, rounded corners=2pt, draw=actuality!20, fill=white,
  font=\sffamily\tiny\itshape, text=actuality!55,
  text width=2.8cm, align=center, inner sep=3pt]
  at (\timeoff, 1.2) {
  Each motion takes its\\name from its terminus\\
  (\textit{Phys.}\ V.1, 224b7--8)
};

% ============================================================
%  VARIABLE EMOTION NOTE (bottom)
% ============================================================

\node[rectangle, rounded corners=3pt, draw=black!25, fill=white,
  line width=0.4pt, text width=8.0cm, align=center,
  font=\sffamily\tiny, text=black!55, inner sep=6pt]
  at (0, -4*\nodesep - 2.2) {
  \textbf{Variable emotion presence}: evaluatively complex actions
  (fear, anger, pity) pass through the emotion-desire composite;
  simple appetitive actions (MA 701a32--33: ``I want to drink \ldots\
  straightaway I drink'') bypass emotion.
  Long-habituated actions may also bypass emotional mediation.
};

% ============================================================
%  LEGEND (bottom)
% ============================================================

\node[rectangle, rounded corners=4pt, draw=black!40, fill=white,
  line width=0.6pt, inner sep=8pt]
  (legend) at (0, -4*\nodesep - 4.8) {
  \begin{tikzpicture}[
    lsample/.style={minimum width=1.4cm, minimum height=0.45cm,
      font=\sffamily\tiny, align=center, inner sep=2pt},
    llabel/.style={font=\sffamily\tiny, text=black!70, anchor=west},
  ]
    \node[font=\sffamily\scriptsize\bfseries, text=black!75] at (3.2, 1.8) {LEGEND};

    \node[lsample, rectangle, rounded corners=3pt,
      draw=actuality, fill=actuality!8, line width=1pt,
      text=actuality, font=\sffamily\tiny\bfseries]
      (leg-act) at (0.8, 1.2) {$A_n$};
    \node[llabel] at (1.8, 1.2) {Completed actuality (determinate node in the chain)};

    \node[lsample, rectangle, rounded corners=2pt,
      draw=motion, fill=motion!6, line width=0.7pt, dashed,
      text=motion, font=\sffamily\tiny]
      (leg-mot) at (0.8, 0.6) {$M_n \to A_n$};
    \node[llabel] at (1.8, 0.6) {Motion segment (named by terminus, \textit{Phys.}\ V.1)};

    \node[lsample, rectangle, rounded corners=2pt,
      draw=timecolor!70, fill=timecolor!5, line width=0.5pt,
      text=timecolor!80!black, font=\sffamily\tiny\itshape]
      (leg-time) at (0.8, 0.0) {$\tau_{n \to n\!+\!1}$};
    \node[llabel] at (1.8, 0.0) {Temporal interval of the motion segment};

    \node[lsample, rectangle, rounded corners=1pt,
      draw=motion!40, fill=white, line width=0.35pt,
      text=black!60, font=\sffamily\tiny]
      (leg-kin) at (0.8, -0.6) {\textbf{U} / \textbf{MM} / \textbf{M}};
    \node[llabel] at (1.8, -0.6)
      {Three-factor kinetic roles (unmoved / moved mover / moved)};

    \draw[pathoscolor!50, line width=0.7pt, densely dotted,
      -{Stealth[length=3pt]}] (0.1, -1.2) -- (1.5, -1.2);
    \node[llabel] at (1.8, -1.2)
      {Basic affective valence (\textit{pathos}): dispositional, non-mobilising};

    \node[lsample, rectangle, rounded corners=3pt,
      draw=emotioncolor!70, fill=emotioncolor!6, line width=0.7pt,
      text=emotioncolor!85!black, font=\sffamily\tiny]
      (leg-emot) at (0.8, -1.8) {Emotion};
    \node[llabel] at (1.8, -1.8)
      {Emotion-desire composite (cognitive eval.\ + conative orient.\ + somatic prep.)};

    \draw[feedbackcolor!60, line width=0.7pt, densely dashed,
      -{Stealth[length=3pt]}] (0.1, -2.4) -- (1.5, -2.4);
    \node[llabel] at (1.8, -2.4)
      {Feedback path (emotion $\to$ impaired corrective faculty $\to$ further doxa)};

    \draw[loopcolor, line width=0.8pt, densely dashed,
      -{Stealth[length=3pt]}] (0.1, -3.0) -- (1.5, -3.0);
    \node[llabel] at (1.8, -3.0)
      {Recursive loop ($A_4$ changes the world $\to$ new $A_0$)};

    \node[lsample, rectangle, rounded corners=3pt,
      fill=perceptual, draw=none, font=\sffamily\tiny, text=actuality!50]
      (leg-perc) at (0.8, -3.6) {zone};
    \node[llabel] at (1.8, -3.6)
      {Perceptual--phantasmatic zone ($A_0$--$A_2$) / Noetic--orektikon zone ($A_3$--$A_4$)};

  \end{tikzpicture}
};

\end{tikzpicture}
\end{document}
```

**Source provenance:**
- Structural template: `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/Actualization of Desire Diagram in Latex Format.md` (reference TikZ; all geometry, styles, color palette, and annotations preserved verbatim except as noted below)
- Motion-label correction: HTML `motionDisplayId()` function at line 1522 (transforms `M01` → `M₁→A₁`, etc.); this export applies the same transform at the LaTeX level so the print version matches the interactive SVG's runtime convention
- Naming principle citation updated to *Physics* V.1, 224b7-8 (the locus that the new convention cites; reference TikZ used V.5, 229b25 — both passages make the same point, but V.1 is the canonical citation under the new convention adopted by the dissertation as of 2026-05-13)
- Legend updated: motion-segment legend entry now shows "$M_n \to A_n$" instead of "$M_n$"
- All other content (actualities A0–A4, motions M01–M34, kinetic roles K01–K34, time nodes T01–T34, pathos track, modes detail box, emotion composite, feedback loop, recursive loop, background zones, ontological-priority line, dual-origin note, chain-termination note, variable-emotion note) is identical to the reference TikZ
