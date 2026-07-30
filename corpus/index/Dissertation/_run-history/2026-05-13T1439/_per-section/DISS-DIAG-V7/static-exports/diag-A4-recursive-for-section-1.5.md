# Static export `diag-A4-recursive` — for §1.5 (A₄ Completed Action)

**Scope:** $A_4$ (completed action / *praxis*) with the recursive loop back to $A_0'$ — showing how completed action reconstitutes the perceptual field as a new $A_0$ substrate. Matches §1.5 prose line 29: *"the chain is recursive, not linear: $A_4$ produces $A_0'$, and the cycle resumes with the world now altered."*

**Display convention:** $M_n \to A_{n+1}$. Motion shown: $M_4 \to A_4$ (HTML id `M34`). The recursive arrow exits $A_4$.east and arcs back to a new-$A_0$ marker.

```latex
% diag-A4-recursive — A_4 + recursive loop to A_0'
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
\definecolor{loopcolor}{RGB}{100,100,100}
\definecolor{perceptual}{RGB}{225,237,252}
\definecolor{cognitive}{RGB}{252,240,225}

\begin{document}
\begin{tikzpicture}[scale=0.78, transform shape,
  actnode/.style={
    rectangle, rounded corners=4pt,
    draw=actuality, fill=actuality!8,
    line width=1.2pt,
    minimum width=7.2cm, minimum height=1.6cm,
    text width=6.8cm, align=center,
    font=\sffamily\small\bfseries,
    text=actuality
  },
  actnodeprime/.style={
    rectangle, rounded corners=4pt,
    draw=actuality, fill=actuality!4,
    line width=1.0pt, densely dashed,
    minimum width=6.4cm, minimum height=1.4cm,
    text width=6.0cm, align=center,
    font=\sffamily\small\bfseries,
    text=actuality!85
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
  notebox/.style={
    rectangle, rounded corners=2pt,
    draw=actuality!25, fill=white,
    line width=0.4pt, text width=4.8cm, align=center,
    font=\sffamily\tiny\itshape, text=actuality!55,
    inner sep=4pt
  },
  recursivenote/.style={
    rectangle, rounded corners=3pt,
    draw=loopcolor!50, fill=loopcolor!5,
    line width=0.6pt,
    text width=5.4cm, align=center,
    font=\sffamily\scriptsize\itshape,
    text=loopcolor!80!black, inner sep=5pt
  },
  chainlink/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.2pt, color=actuality!55
  },
  looparrow/.style={
    -{Stealth[length=6pt,width=5pt]},
    line width=1.2pt, color=loopcolor, densely dashed
  },
]

% ===== A_3 (top, abbreviated — provides anchor for M_4 -> A_4) =====
\node[actnode, opacity=0.65] (A3) at (0, 4.5) {
  $A_3$: Completed Cognitive Actuality\\[1pt]
  {\footnotesize\normalfont (discloses realizable good)}
};

% ===== M_4 -> A_4 =====
\node[motionnode] (M34) at (0, 1.5) {
  $M_4 \!\to\! A_4$: \textit{Orektikon} Motion\\[-1pt]
  {\tiny\normalfont Desire converging in action; somatic prep.\ internal (MA 702a17--19)}
};

% ===== A_4 (centre) =====
\node[actnode] (A4) at (0, -1.5) {
  $A_4$: Completed Action (\textit{praxis})\\[1pt]
  {\footnotesize\normalfont Motor loop closed; recursive}\\
  {\footnotesize\normalfont (DA III.10, 433b21--25; MA 702a17--19)}
};

\draw[chainlink, opacity=0.65] (A3.south) -- (M34.north);
\draw[chainlink] (M34.south) -- (A4.north);

% ===== A_0' (new perceptual substrate, top-left) =====
\node[actnodeprime] (A0prime) at (-8, 4.5) {
  $A_0'$: New Sensible Object\\in Actuality\\[1pt]
  {\footnotesize\normalfont (perceptual field re-constituted)}
};

% ===== Time node for M_4 -> A_4 =====
\node[timenode] (T34) at (5.6, 1.5)
  {$\tau_{3 \to 4}$: desire $\to$ motor act};
\draw[-{Stealth[length=3pt]}, timecolor!50, thin] (T34.west) -- (M34.east);

% ===== RECURSIVE LOOP: A_4.east -> right -> up -> A_0'.east (or .north) =====
\draw[looparrow, rounded corners=10pt]
  (A4.east) -- ++(4.4, 0)
  -- ++(0, 7.0)
  -- ++(-12.4, 0)
  -- (A0prime.east);

\node[recursivenote, anchor=south]
  at (3.5, 2.6) {
  \textbf{Recursive loop:}\\
  completed action changes the world\\
  $\Rightarrow$ new $A_0$ (notated $A_0'$)\\[2pt]
  (\S1.5 l.~29; HTML \texttt{recursive-loop} group)
};

% ===== Full kinetic-affective history pull-out (left of A_4) =====
\node[notebox, text width=5.2cm, anchor=east] at ($(A4.west) + (-1.0, 0)$) {
  \textbf{Full kinetic-affective history closed at $A_4$:}\\[2pt]
  perception ($A_0 \to A_1$)\\
  + retention ($A_1 \to A_2$)\\
  + cognition ($A_2 \to A_3$)\\
  + desire ($A_3 \to A_4$)\\
  + (variable) emotion + hexis-modulation
};

% ===== Three types of action note (right of A_4) =====
\node[notebox, text width=5.2cm, anchor=west] at ($(A4.east) + (1.0, -0.4)$) {
  \textbf{Three types of action} (\S1.5 l.~1):\\[2pt]
  (1) simple appetition\\
  (2) habitual-procedural (settled \textit{hexis})\\
  (3) evaluatively complex (emotion-mediated)\\[2pt]
  Kinetic-roles spine holds invariant\\
  (DA III.10, 433a31--b30)
};

% ===== Variable-emotion / hexis-modulation note (bottom) =====
\node[recursivenote, anchor=north, text width=10cm]
  at ($(A4.south) + (0, -0.8)$) {
  Each pass through the chain re-cultivates the dispositional ground;\\
  the cumulative trajectory of the agent's chain-actualizations \textit{is} their \textit{hexis}-formation.\\
  {\tiny (\S1.5 prose line~29; cf.\ \S1.4 ll.~106, 110, 112 on diachronic saturation)}
};

% ===== Schema label =====
\node[motion!70!black, font=\sffamily\footnotesize\bfseries]
  at (0, 6.5) {RECURSIVE CHAIN STRUCTURE ($A_4 \Rightarrow A_0'$)};

% ===== Background zones =====
\begin{scope}[on background layer]
  \node[fill=perceptual, rounded corners=6pt, inner sep=10pt,
    fit=(A0prime),
    label={[font=\sffamily\tiny\bfseries, text=actuality!40,
      anchor=south west, xshift=4pt, yshift=2pt]south west:
      NEW PERCEPTUAL CYCLE}] {};
  \node[fill=cognitive, rounded corners=6pt, inner sep=10pt,
    fit=(A3)(M34)(A4)(T34),
    label={[font=\sffamily\tiny\bfseries, text=motion!40,
      anchor=north west, xshift=4pt, yshift=-2pt]north west:
      OREKTIKON ZONE}] {};
\end{scope}

\end{tikzpicture}
\end{document}
```

**Source provenance:**
- `actualities[4]` (id=`A4`), HTML lines 922–937; "Recursive, not linear" expanded block (lines 933–935)
- `motions[3]` (id=`M34`), HTML lines 1379–1446
- Recursive-loop SVG group: HTML `<g id="recursive-loop">` (line 746); drawing JS for the loop path; reference TikZ lines 431–438
- Three types of action: §1.5 prose line 1 (subsection title "$M_3 \rightarrow M_4$ and $A_4$: The Three Types of Action")
- Diachronic-saturation references: §1.4 prose lines 106, 110, 112
- $A_0'$ notation: §1.5 prose line 29 ("$A_4$ produces $A_0'$, and the cycle resumes")
