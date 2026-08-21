% Actualization Chain Diagram — Option B v7 (bug fix: A3-frame layer ordering)
% Bug in v6: A3-frame was on background layer, but so is zonelower (which has
% fill=cognitive). Since zonelower is declared LATER in the background layer's
% declaration order, it was painted ON TOP of A3-frame, completely covering
% its dashed border.
% v7 fix:
%   - Moved A3-frame OFF background layer to MAIN layer.
%   - Set a3frame fill = none (no longer needs background to avoid covering
%     sub-nodes, since with no fill, only the border draws on top).
%   - Sub-nodes (NOESIS, MEMORY, DISC) draw FIRST (main layer, sub-nodes are
%     declared before A3-frame). A3-frame border draws AFTER them, on top.
%     Since A3-frame has fill=none, sub-nodes show through unobscured.
%
% (v6 header retained below for change history.)
%
% Actualization Chain Diagram — Option B v6 (post-v5 bypass + removals + spacing)
% Changes vs v5:
%   - Added pure-appetitive bypass arrow: A2.east → right column → over the
%     top of M3-paths → M34.north (HTML BYPASS_X pattern). Represents
%     Type 1 chain: simple appetitive action without doxa or A3 engagement
%     ("see drink, I drink" — MA 701a32-33).
%   - REMOVED right-column descriptive boxes: `modes` (Orientational structure
%     / Doxa 4 functional modes) and `emotion` (Emotion-Desire Composite) +
%     their connecting arrows. Inline A3 row + DOXA band + EMO-INLINE now
%     carry the visual content; removed redundancy.
%   - REMOVED T23d descriptive box (under T₂→₃ multi-modal duration) +
%     its connector arrow.
%   - Within-episode FB label moved CLOSER to the EMO-INLINE→A2 arrow's
%     UP segment for clearer visual association.
%   - A3-frame visibility BOOSTED: line width 0.8→1.0pt, solid draw color
%     (no opacity reduction), dash pattern 6pt-4pt.
%   - Noetic-orektikon SPACING increased: \nodesep 5.0→6.0, \mxextra 3.5→4.5,
%     \doxay offset -2.5→-3.0. Particularly opens up M23→A3, A3→DOXA gaps.
%
% (v5 header retained below for change history.)
%
% Actualization Chain Diagram — Option B v5 (post-v4 feedback re-source + A3 label)
% Changes vs v4:
%   - Within-episode feedback source: emotion.south (right-col descriptive
%     detail box) → EMO-INLINE.south (inline emotion bubble linked to DOXA).
%     Re-routed through bottom-left corridor (x ≈ -10, between K-boxes at
%     x=-8.4 and hexis-band right edge at x=-11.46) to avoid both the
%     diachronic arrow at x=-17.5 and chain elements.
%   - A3-frame label: "A₃: Branching Cognitive Actualities" →
%     "A₃: Cognitive actualities" (per user wording).
%   - a3frame style: line width 0.5→0.8pt, dash pattern made more prominent
%     for visibility.
%
% (v4 + v3 headers retained below for change history.)
%
% Actualization Chain Diagram — Option B v4 (post-v3 diachronic arrow re-route)
% Changes vs v3: A4→Hexeis diachronic feedback re-routed to far-left margin
% (x = -kinoff - 11 ≈ -17.5) per user drawn annotation, avoiding noetic
% zone crossover that v3's routing exhibited.
%
% (v3 header retained below for change history.)
%
% Actualization Chain Diagram — Option B v3 (post-v2 spacing + content fixes)
% Vertical layout, three-column: kinetic roles | chain | time
% Option B v3 changes vs v2:
%   - Spacing increased (both axes; no A4 page limit per user):
%     \nodesep 3.8→5.0; \motionoff 1.9→2.5; \detailoff 10.8→13.5;
%     \loopoff 10.2→12.8; \kinoff 5.8→6.5; \timeoff 5.6→6.5;
%     \mxextra 3.0→3.5; A3 sub-node x spread (NOESIS −2.6→−3.5,
%     DISC +2.6→+3.5); EMO x 6.8→7.5; DOXA width 7→8.
%   - Discursive frame fix: parent height 1.0→1.6cm; removed redundant
%     "synthetic operation" sub-label that overlapped SPEC sub-node.
%   - Q1 = T₂→₃ multi-modal duration (headline + detail rewritten).
%   - Q4 = hexis-band frame label: "Settled Doxai (Hexeis)" →
%     "Hexeis (Standing Dispositions)" (Cat. 8b27ff: hexis is broader
%     genus; settled doxai are one species among hexeis).
%   - Q2 + Q3: DEFERRED (retain v2 implementation); see
%     _notes/v3-followup-notes.md for investigation plan.
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
\definecolor{perceptual}{RGB}{225,237,252}
\definecolor{cognitive}{RGB}{252,240,225}
\definecolor{loopcolor}{RGB}{100,100,100}
\definecolor{feedbackcolor}{RGB}{140,60,100}
% Option B v1 additions:
\definecolor{deliberativecolor}{RGB}{30,120,120}   % HTML #1e7878
\definecolor{a3framecolor}{RGB}{60,90,140}         % softer actuality for frame
% Option B v6 addition:
\definecolor{bypasscolor}{RGB}{160,96,40}          % HTML #a06028 (pure-appetitive)

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
  % ================================================================
  %  Option B v1 NEW STYLES
  % ================================================================
  a3rownode/.style={                  % v3: taller + slightly wider
    rectangle, rounded corners=3pt,
    draw=actuality, fill=actuality!8,
    line width=1.0pt,
    minimum width=2.2cm, minimum height=1.5cm,
    text width=2.05cm, align=center,
    font=\sffamily\tiny\bfseries,
    text=actuality
  },
  a3parentnode/.style={               % v3: taller (1.6cm) to fit title + sub-nodes without overlap
    rectangle, rounded corners=3pt,
    draw=actuality, fill=actuality!3,
    line width=1.0pt, dash pattern=on 4pt off 3pt,
    minimum width=2.6cm, minimum height=1.6cm,
    text width=2.45cm, align=center,
    font=\sffamily\tiny\bfseries,
    text=actuality
  },
  a3subnode/.style={                  % v3: wider, slightly shorter
    rectangle, rounded corners=2pt,
    draw=actuality!70, fill=white,
    line width=0.5pt,
    minimum width=2.4cm, minimum height=0.35cm,
    text width=2.3cm, align=center,
    font=\sffamily\tiny,
    text=actuality
  },
  a3frame/.style={                    % v7: fill=none so it doesn't cover sub-nodes when on MAIN layer
    rectangle, rounded corners=5pt,
    draw=a3framecolor, fill=none,
    line width=1.0pt, dash pattern=on 6pt off 4pt,
    inner sep=6pt
  },
  doxabandnode/.style={               % v3: wider (8cm) to span wider A3 row
    rectangle, rounded corners=4pt,
    draw=pathoscolor, fill=pathoscolor!10,
    line width=1.0pt, dash pattern=on 5pt off 3pt,
    minimum width=8cm, minimum height=0.85cm,
    text width=7.8cm, align=center,
    font=\sffamily\tiny\bfseries,
    text=pathoscolor!85!black
  },
  emotioninline/.style={              % v3: slightly larger
    rectangle, rounded corners=3pt,
    draw=emotioncolor, fill=emotioncolor!8,
    line width=1.0pt,
    minimum width=3.0cm, minimum height=1.0cm,
    text width=2.8cm, align=center,
    font=\sffamily\tiny\bfseries,
    text=emotioncolor!85!black
  },
  m34deliberative/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.3pt, color=deliberativecolor!85!black
  },
  m34habitual/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.1pt, color=pathoscolor!85!black,
    dash pattern=on 4pt off 2pt
  },
  m34emotion/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.1pt, color=emotioncolor!85!black,
    dash pattern=on 3pt off 3pt
  },
  diachronic/.style={
    -{Stealth[length=5pt,width=4pt]},
    line width=1.0pt, color=pathoscolor!75!black,
    dash pattern=on 6pt off 3pt
  },
  bypassarrow/.style={                % v6 NEW: pure-appetitive A2→M34 bypass
    -{Stealth[length=5pt,width=4pt]},
    line width=1.3pt, color=bypasscolor,
    dash pattern=on 8pt off 3pt on 2pt off 3pt
  },
  doxasupervene/.style={
    -{Stealth[length=3pt,width=2.5pt]},
    line width=0.6pt, color=pathoscolor!60,
    dash pattern=on 3pt off 2pt
  },
  feedsarrow/.style={
    -{Stealth[length=3pt,width=2.5pt]},
    line width=0.6pt, color=motion!50!black,
    dash pattern=on 5pt off 3pt
  },
  emoconnector/.style={
    -{Stealth[length=3pt,width=2.5pt]},
    line width=0.7pt, color=emotioncolor!60,
    dash pattern=on 3pt off 2pt
  },
]

% ---- Layout constants (Option B v6) ----
% v6 increased spacing further per user: "increase vertical spacing between
%      each horizontal layer in the noetic-orektikon zone, particularly between
%      M2→A3, A3, and Doxa/Emotion-Desire."
\def\nodesep{6.0}        % vertical gap between actuality nodes (v5: 5.0)
\def\motionoff{2.5}      % offset of motion nodes from actuality above (unchanged)
\def\kinoff{6.5}          % kinetic boxes: distance LEFT of center (unchanged)
\def\timeoff{6.5}         % time boxes: distance RIGHT of center (unchanged)
\def\detailoff{13.5}      % detail boxes column (now unused — boxes removed in v6)
\def\loopoff{12.8}        % recursive loop: far right clearance (unchanged)
% Extra y-shift for M34 + A4 to fit A3 row + DOXA band above M34
\def\mxextra{4.5}        % v6 increased from 3.5 to 4.5

% ---- A3 row coordinates (Option B v3)
%      Note: LaTeX command names must be all-alphabetic (no digits).
%      v3: A3 row spread wider (NOESIS −2.6→−3.5, DISC +2.6→+3.5);
%          sub-node offsets adjusted for taller DISC parent (1.6cm).
% ----
\def\arowy{-3*\nodesep}              % -15.0 (was -11.4 in v0-v2)
\def\anoesisx{-3.5}                  % was -2.6
\def\amemoryx{0}
\def\adiscx{3.5}                     % was 2.6
\def\aspecoff{0.20}                  % SPEC above DISC center (was 0.25)
\def\adeliboff{-0.40}                % DELIB below DISC center (was -0.25)

% ---- DOXA band coordinates (Option B v6)
%      v6: pulled down 0.5 more (-2.5→-3.0) for stronger A3→DOXA separation.
% ----
\def\doxax{0}
\def\doxay{-3*\nodesep - 3.0}        % v6: -21 (with nodesep=6)

% ---- Inline EMO coordinates (Option B v6) ----
\def\emox{7.5}
\def\emoy{-3*\nodesep - 3.0}         % matches doxay

% ============================================================
%  ACTUALITIES (center column)
%  Option B v1: A0, A1, A2 unchanged. A3 is now a ROW of 3
%  top-level + 2 sub-nodes (NOESIS / MEMORY / DISC[SPEC,DELIB]).
%  A4 shifted down by \mxextra to make room for A3 row + DOXA.
% ============================================================

\node[actnode] (A0) at (0, 0) {
  $A_0$: Motion and Time as Ontological Horizon\\[1pt]
  {\footnotesize\normalfont\textit{kin\=esis kai chronos}}
};
\node[actnode] (A1) at (0, -\nodesep) {
  $A_1$: Completed Perception\\[1pt]
  {\footnotesize\normalfont Aisth\=ema + Affective Valence (\textit{pathos})}
};
\node[actnode] (A2) at (0, -2*\nodesep) {
  $A_2$: The \textit{Phantasma} Proper\\[1pt]
  {\footnotesize\normalfont Dual-aspect: formal imprint + affective charge}
};

% ---- A3 ROW: 3 top-level (NOESIS / MEMORY / DISC) + 2 sub (SPEC / DELIB) ----
\node[a3rownode] (A3-NOESIS) at (\anoesisx, \arowy) {
  Pure Noesis\\[-1pt]
  {\tiny\normalfont\itshape intellection}\\[-1pt]
  {\tiny\normalfont phantasma $\to$ universal}\\[-1pt]
  {\tiny\normalfont atemporal --- terminates}
};
\node[a3rownode] (A3-MEMORY) at (\amemoryx, \arowy) {
  Memory\\[-1pt]
  {\tiny\normalfont\itshape past qua past}\\[-1pt]
  {\tiny\normalfont retrospective}\\[-1pt]
  {\tiny\normalfont feeds Discursive}
};
\node[a3parentnode] (A3-DISC) at (\adiscx, \arowy) {};
% Discursive parent title at top of the (taller, v3) parent.
% v3: removed redundant "synthetic operation" sub-label that overlapped SPEC.
\node[anchor=north, font=\sffamily\tiny\bfseries, text=actuality, inner sep=3pt]
  at (A3-DISC.north) {Discursive};
% Discursive sub-nodes (Speculative + Deliberative stacked)
\node[a3subnode] (A3-SPEC) at (\adiscx, \arowy + \aspecoff) {
  Speculative {\tiny\itshape ---terminates}
};
\node[a3subnode] (A3-DELIB) at (\adiscx, \arowy + \adeliboff) {
  Deliberative {\tiny\itshape ---feeds $M_3{\to}A_4$}
};
% A3 medium-touch enclosure — v7: on MAIN layer with fill=none.
% Drawing the dashed border AFTER zonelower (which is on background) so the
% border isn't covered. fill=none means sub-nodes aren't occluded (they were
% already drawn before this declaration on main layer).
\node[a3frame, fit=(A3-NOESIS)(A3-MEMORY)(A3-DISC), inner sep=6pt,
      label={[font=\sffamily\tiny\bfseries\itshape,
              text=a3framecolor!75!black, label distance=1pt]
             above:$A_3$: Cognitive actualities}]
      (A3-frame) {};

% A4 shifted down by \mxextra
\node[actnode] (A4) at (0, -4*\nodesep - \mxextra) {
  $A_4$: Completed Action (\textit{praxis})\\[1pt]
  {\footnotesize\normalfont Motor loop closed; recursive}
};

% ============================================================
%  MOTIONS (between actualities)
%  Option B v1: M01, M12, M23 unchanged. M34 shifted by \mxextra.
% ============================================================

\node[motionnode] (M01) at (0, -\motionoff) {
  $M_0 \!\to\! A_1$: Perceptual Motion\\[-1pt]
  {\tiny\normalfont aisth\=esis --- form received without matter (DA II.12, 424a17--24)}
};
\node[motionnode] (M12) at (0, -\nodesep - \motionoff) {
  $M_1 \!\to\! A_2$: Phantastic Motion\\[-1pt]
  {\tiny\normalfont Residual trace settles into determinate \textit{phantasma} (DA III.3, 428b10--16)}
};
\node[motionnode] (M23) at (0, -2*\nodesep - \motionoff) {
  $M_2 \!\to\! A_3$: Cognitive Engagement\\[-1pt]
  {\tiny\normalfont 3 orientational modes + 1 committal dimension (doxa)}
};
\node[motionnode] (M34) at (0, -3*\nodesep - \motionoff - \mxextra) {
  $M_3 \!\to\! A_4$: \textit{Orektikon} Motion\\[-1pt]
  {\tiny\normalfont Desire converging in action; somatic prep.\ internal (MA 702a17--19)}
};

% ============================================================
%  CHAIN ARROWS (Option B v1)
%  Top of chain (A0-A2) unchanged. M23→A3 becomes fan-out
%  to NOESIS/MEMORY/DISC. A3→M34 becomes 3 styled paths
%  (Deliberative/Habitual/Emotion). M34→A4 unchanged.
% ============================================================

\draw[chainlink] (A0.south) -- (M01.north);
\draw[chainlink] (M01.south) -- (A1.north);
\draw[chainlink] (A1.south) -- (M12.north);
\draw[chainlink] (M12.south) -- (A2.north);
\draw[chainlink] (A2.south) -- (M23.north);
\draw[chainlink] (M34.south) -- (A4.north);

% ---- M23 → A3 row fan-out ----
\coordinate (m23junction) at (0, -2*\nodesep - \motionoff - 0.75);
\draw[chainlink] (M23.south) -- (m23junction);
\draw[chainlink] (m23junction) .. controls +(0, -0.4) and +(0, 0.6) ..
   (A3-NOESIS.north);
\draw[chainlink] (m23junction) -- (A3-MEMORY.north);
\draw[chainlink] (m23junction) .. controls +(0, -0.4) and +(0, 0.6) ..
   (A3-DISC.north);

% ---- Memory feeds Discursive (intra-row arrow) ----
\draw[feedsarrow]
  (A3-MEMORY.east) -- (A3-DISC.west)
  node[midway, above, font=\sffamily\tiny\itshape, text=motion!55!black,
       inner sep=1pt]
  {feeds};

% ============================================================
%  DOXA BAND — orthogonal committal dimension (Option B v1)
%  Sits below A3 row. Supervenes upon any orientational mode.
% ============================================================

\node[doxabandnode] (DOXA) at (\doxax, \doxay) {
  DOXA --- orthogonal committal dimension\\[-1pt]
  {\tiny\normalfont\itshape supervenes upon any orientational mode \,$\cdot$\, taking-as-true-or-false}
};

% Supervenes arrows: from each top-level A3 node south + DELIB south into DOXA top
\foreach \src in {A3-NOESIS, A3-MEMORY, A3-DISC} {
  \draw[doxasupervene] (\src.south) -- (DOXA.north -| \src.south);
}
\draw[doxasupervene] (A3-DELIB.south)
  .. controls +(0, -0.25) and +(0, 0.25) ..
  (DOXA.north -| A3-DELIB.south);

% ============================================================
%  INLINE EMOTION-DESIRE NODE (Option B v1)
%  Connected to DOXA east face: emotion arises from doxastic
%  ratification of evaluatively complex content.
% ============================================================

\node[emotioninline] (EMO-INLINE) at (\emox, \emoy) {
  Emotion-Desire\\[-1pt]
  {\tiny\normalfont\itshape (when doxa is evaluatively complex)}\\[-1pt]
  {\tiny\normalfont cog.\ eval.\ + conative + somatic}
};
\draw[emoconnector] (DOXA.east) -- (EMO-INLINE.west);

% ============================================================
%  M3 → A4 THREE INPUT PATHS (Option B v1)
%  Replaces single A3→M34 chainlink. Renders the Type 1/2/3
%  chain bivalence as three structurally distinct routes:
%  (1) Deliberative — no doxa needed (teal)
%  (2) Habitual rational — settled doxa as hexis (pathos gold)
%  (3) Evaluatively complex — emotion-mediated (emotion magenta)
% ============================================================

% ---- Path 1: Deliberative → M34 (teal, solid) ----
\draw[m34deliberative]
  (A3-DELIB.south)
  .. controls +(0, -0.8) and +(-0.5, 1.2) ..
  ($(M34.north) + (-1.0, 0)$);
\node[font=\sffamily\tiny\itshape\bfseries, text=deliberativecolor!85!black,
      anchor=east, text width=1.9cm, align=right, inner sep=1pt]
      at ($(A3-DELIB.south) + (-0.2, -0.8)$)
      {Deliberative\\{\tiny\normalfont(no doxa needed)}};

% ---- Path 2: DOXA band (south-center-left) → M34 (pathos gold, dashed) ----
\draw[m34habitual]
  ($(DOXA.south) + (-0.6, 0)$)
  -- ($(DOXA.south) + (-0.6, -0.6)$)
  -- ($(M34.north) + (-0.3, 0)$);
\node[font=\sffamily\tiny\itshape\bfseries, text=pathoscolor!85!black,
      anchor=west, text width=2.0cm, align=left, inner sep=1pt,
      fill=white, fill opacity=0.85, text opacity=1]
      at ($(DOXA.south) + (-2.6, -0.65)$)
      {Habitual rational\\{\tiny\normalfont(settled doxa as hexis)}};

% ---- Path 3: EMO-INLINE → M34 (emotion magenta, dashed) ----
\draw[m34emotion]
  (EMO-INLINE.south)
  -- ($(EMO-INLINE.south) + (0, -0.45)$)
  -- ($(M34.north) + (1.0, 0)$);
\node[font=\sffamily\tiny\itshape\bfseries, text=emotioncolor!85!black,
      anchor=west, text width=2.4cm, align=left, inner sep=1pt]
      at ($(EMO-INLINE.south east) + (0.05, -0.35)$)
      {Evaluatively complex\\{\tiny\normalfont(emotion-mediated)}};

% ============================================================
%  TIME (right column — close to center)
%  Option B v1: T34 follows M34 shift; T34d follows T34.
% ============================================================

\node[timenode] (T01) at (\timeoff, -\motionoff)
  {$\tau_{0 \to 1}$: medium transmits};
\node[timenode] (T12) at (\timeoff, -\nodesep - \motionoff)
  {$\tau_{1 \to 2}$: trace persists \& settles};
\node[timenode] (T23) at (\timeoff, -2*\nodesep - \motionoff)
  {$\tau_{2 \to 3}$: multi-modal duration};
\node[timenode] (T34) at (\timeoff, -3*\nodesep - \motionoff - \mxextra)
  {$\tau_{3 \to 4}$: desire $\to$ motor act};

\foreach \t/\m in {T01/M01, T12/M12, T23/M23, T34/M34} {
  \draw[-{Stealth[length=3pt]}, timecolor!50, thin] (\t.west) -- (\m.east);
}

% Time axis label — next to T01
\node[timecolor!80!black, font=\sffamily\scriptsize\bfseries,
  text width=2.4cm, align=center]
  at (\timeoff + 3.2, -\motionoff)
  {TIME:\\number of motion\\(Phys.\ IV.11,\\219b1)};

% v6: T23 detail box REMOVED per user request (the headline "multi-modal
% duration" on T23 itself carries the meaning; detail box was redundant).

% T34 detail — below T34 (follows \mxextra shift)
\node[rectangle, rounded corners=2pt, draw=timecolor!30, fill=white,
  line width=0.3pt, text width=3.4cm, align=left,
  font=\sffamily\tiny\itshape, text=timecolor!65!black, inner sep=3pt]
  (T34d) at (\timeoff, -3*\nodesep - \motionoff - 1.3 - \mxextra) {
  ``virtually simultaneous''\\
  under normal conditions\\
  (MA 702a15--17);\\
  ``natural correspondence\\
  of the active and passive''
};
\draw[-{Stealth[length=2pt]}, timecolor!30, ultra thin] (T34d.north) -- (T34.south);

% ============================================================
%  KINETIC ROLES (left column)
%  Option B v1: K34 follows M34 shift.
% ============================================================

\node[kineticbox] (K01) at (-\kinoff, -\motionoff) {
  \textbf{Unmoved}: $A_0$ (motion-time horizon) + sensible object's active potency\\
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
\node[kineticbox] (K34) at (-\kinoff, -3*\nodesep - \motionoff - \mxextra) {
  \textbf{Unmoved}: realizable good at $A_3$\\
  \quad (433b10--18)\\
  \textbf{Moved mover}: \textit{orexis}\\
  \quad {\tiny(emotion-structured or basic appetite)}\\
  \textbf{Moved}: animal via joint (433b21--25)
};

\foreach \k/\m in {K01/M01, K12/M12, K23/M23, K34/M34} {
  \draw[-{Stealth[length=3pt]}, motion!30, thin] (\k.east) -- (\m.west);
}

% ============================================================
%  SETTLED DOXAI (HEXEIS) — Step 7 bisected band (Option A KEPT)
%  Renders the technē/praxis bivalence as additional unmoved
%  originators of M_2→A_3 (alongside A_2). PRAXIS-hexis
%  additionally reaches upstream to A_1: Type 3 two-level
%  modulation (input-to-doxa AND doxa-gate).
%  Anchored: Met. Δ 20, 1022b 4; GA 18 §17; NE II.1.
% ============================================================

\node[rectangle, rounded corners=2pt,
      draw=pathoscolor!60, fill=pathoscolor!12,
      line width=0.5pt,
      minimum width=2.0cm, minimum height=1.1cm,
      text width=1.8cm, align=center,
      font=\sffamily\tiny, text=pathoscolor!80!black]
      (techne-hexis) at (-\kinoff - 8.5, -2*\nodesep - \motionoff)
      {\textit{techn\=e-hexis}\\[-1pt]
       {\tiny\normalfont(Type 2:\\routine)}};

\node[rectangle, rounded corners=2pt,
      draw=pathoscolor!60, fill=pathoscolor!12,
      line width=0.5pt,
      minimum width=2.0cm, minimum height=1.1cm,
      text width=1.8cm, align=center,
      font=\sffamily\tiny, text=pathoscolor!80!black]
      (praxis-hexis) at (-\kinoff - 6.1, -2*\nodesep - \motionoff)
      {\textit{praxis-hexis}\\[-1pt]
       {\tiny\normalfont(Type 3:\\open resolution)}};

% Hexis-band fit-frame on BACKGROUND layer so its fill does not
% occlude the technē-hexis/praxis-hexis sub-nodes drawn above.
% v3 (Q4 Fix A): renamed from "Settled Doxai (Hexeis)" to
% "Hexeis (Standing Dispositions)" — hexis is the broader genus
% (Cat. 8b27ff: virtues, crafts, knowledge, bodily states are all
% hexeis); settled doxai are one species of hexis (the doxastic-
% cognitive species, per MA 701a7-25), but technē-hexis + praxis-hexis
% are character/craft dispositions not reducible to settled beliefs.
\begin{scope}[on background layer]
\node[rectangle, rounded corners=4pt,
      draw=pathoscolor!75, fill=pathoscolor!4,
      line width=0.6pt, dash pattern=on 3pt off 2pt,
      fit=(techne-hexis)(praxis-hexis),
      inner sep=4pt,
      label={[font=\sffamily\tiny\bfseries,
              text=pathoscolor!90!black, label distance=1pt]
             above:Hexeis (Standing Dispositions)},
      label={[font=\sffamily\tiny\itshape,
              text=pathoscolor!65!black, label distance=1pt]
             below:Cat.\ 8b27ff \,$\cdot$\, Met.\ $\Delta$ 20, 1022b\,4 \,$\cdot$\, GA 18 \S 17}]
      (hexis-band) {};
\end{scope}

% Arrow 1: technē-hexis → M_2→A_3 (additional unmoved originator)
\draw[-{Stealth[length=3pt]}, pathoscolor!55, line width=0.5pt,
      dash pattern=on 2pt off 1.5pt]
  (techne-hexis.east)
  .. controls +(1.5, 0.3) and +(-4.0, -1.5) ..
  (M23.south west);

% Arrow 2: praxis-hexis → M_2→A_3 (same role; Type 3 chain)
\draw[-{Stealth[length=3pt]}, pathoscolor!55, line width=0.5pt,
      dash pattern=on 2pt off 1.5pt]
  (praxis-hexis.east)
  .. controls +(1.2, 0.3) and +(-3.0, -1.2) ..
  (M23.south);

% Arrow 3: praxis-hexis → A_1 (Type 3 two-level reach;
% modulates basic-valence input ahead of doxa-gating)
\draw[-{Stealth[length=3pt]}, pathoscolor!50, line width=0.5pt,
      densely dotted]
  (praxis-hexis.north)
  .. controls +(0, 2.5) and +(-4.0, 0) ..
  (A1.west);

% Type 3 two-level annotation
\node[font=\sffamily\tiny\itshape, text=pathoscolor!65!black,
      text width=2.4cm, align=center,
      fill=white, fill opacity=0.88, text opacity=1, inner sep=2pt]
      at (-\kinoff - 6.1, -\nodesep - \motionoff - 0.3)
      {Type 3 only:\\two-level reach\\($A_1$ input bias\\$+\,M_2{\to}A_3$ doxa-gate)};

% Schema label — top of diagram, centered
\node[motion!70!black, font=\sffamily\footnotesize\bfseries]
  at (0, 1.8)
  {THREE-FACTOR SCHEMA (DA III.10, 433b10--18)};

% ============================================================
%  BASIC AFFECTIVE VALENCE TRACK (far left)
%  Option B v1: extended down to clear K34's new lower position.
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
%  v6: REMOVED right-column detail boxes (`modes` + `emotion`)
%  and their connecting arrows. Inline A3 row + DOXA band +
%  EMO-INLINE now carry the structural content.
% ============================================================

% ============================================================
%  PURE-APPETITIVE BYPASS (Option B v6 NEW) — A2 → M3→A4
%  HTML's BYPASS_X pattern: A2.east → right column → DOWN to
%  above-M34-and-above-m34-paths → LEFT across top of M34 →
%  DOWN into M34's north face (east of center).
%  Represents Type 1 chain: simple appetitive action — no doxa
%  engaged, no A3 cognitive intermediary ("I want to drink, says
%  appetite; this is drink, says sense or imagination: straightaway
%  I drink" — MA 701a32-33).
% ============================================================

% Route: A2.east → RIGHT to right-column corridor → DOWN to M34.y level →
% LEFT into M34.east face. Entering from east avoids crossing the M3-paths.
\draw[bypassarrow, rounded corners=10pt]
  (A2.east)
  -- ({\detailoff - 3.5}, -2*\nodesep)                            % RIGHT to right-column corridor
  -- ({\detailoff - 3.5}, -3*\nodesep - \motionoff - \mxextra)    % DOWN to M34.y level
  -- (M34.east);                                                   % LEFT into M34.east face
% Bypass label — positioned along the DOWN segment in the right-column corridor
\node[font=\sffamily\tiny\itshape\bfseries, text=bypasscolor,
      anchor=west, text width=3.0cm, align=left, inner sep=2pt,
      fill=white, fill opacity=0.88, text opacity=1]
      at ({\detailoff - 3.5 + 0.3}, -3*\nodesep) {
        Pure appetitive\\
        {\tiny\normalfont(no doxa, no $A_3$ engagement)}\\
        {\tiny\normalfont MA 701a32--33}
      };

% ============================================================
%  DIACHRONIC FEEDBACK (Option B v4) — A4 → Hexeis
%  Cross-episode hexis sedimentation: completed praxis settles
%  into the standing-doxa repertoire (NE II.1).
%
%  v4 ROUTING (per user drawn annotation 2026-05-20T1359):
%  the arrow must route OUTSIDE the noetic-orektikon zone — go
%  LEFT from A4 all the way to far-left margin (x = -kinoff - 11
%  ≈ -17.5, well left of K-boxes which span x = -8.4 to -4.6),
%  then UP along the far-left margin from A4.y to hexis-band.y,
%  then a short RIGHT into hexis-band.west.
%  This avoids v3 routing where the UP segment at x=-5 passed
%  through the K-boxes column visually.
% ============================================================

\draw[diachronic, rounded corners=10pt]
  (A4.west)
  -- ({-\kinoff - 11}, -4*\nodesep - \mxextra)
  -- ({-\kinoff - 11}, -2*\nodesep - \motionoff)
  -- (hexis-band.west);
\node[font=\sffamily\tiny\itshape, text=pathoscolor!75!black,
      text width=2.4cm, align=center,
      anchor=east, fill=white, fill opacity=0.85, text opacity=1,
      inner sep=2pt]
      at ({-\kinoff - 11 - 0.2}, -3*\nodesep)
      {Hexis sedimentation:\\praxis settles into\\standing dispositions\\(NE II.1)};

% ============================================================
%  CHAIN TERMINATION ANNOTATION (Option B v1)
%  Updated: now points to the 3 terminating A3 modes
%  (NOESIS, MEMORY, SPEC) rather than the v0 single A3 node.
% ============================================================

\node[rectangle, rounded corners=2pt, draw=actuality!25, fill=white,
  line width=0.4pt, text width=3.6cm, align=center,
  font=\sffamily\tiny\itshape, text=actuality!55, inner sep=4pt]
  (terminate) at (-\kinoff, -3*\nodesep + 0.5) {
  \textbf{Chain terminates at $A_3$}\\
  for NOESIS, MEMORY,\\
  and SPECULATIVE\\
  when content is non-practical:\\
  no \textit{orexis} activated\\
  (DA III.10, 433a13--15)
};

\draw[-{Stealth[length=3pt]}, actuality!25, thin]
  (terminate.east) -- (A3-NOESIS.west);

% ============================================================
%  DUAL-ORIGIN (left, near A2) — unchanged from v0
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
%  WITHIN-EPISODE FEEDBACK LOOP (Option B v5)
%  Source: EMO-INLINE.south (inline emotion bubble linked to DOXA).
%  Route: EMO-INLINE.south → DOWN past A4 → LEFT to corridor between
%  K-boxes (west edge x=-8.4) and hexis-band (right edge x=-11.46) →
%  UP at x=-10 to A2.y → RIGHT to A2.west.
%  v5: re-sourced from the descriptive detail box to the chain-inline
%  emotion bubble per user request. The descriptive emotion detail box
%  (right column) is now annotation only — no longer the feedback origin.
% ============================================================

\draw[feedbackarrow, rounded corners=8pt]
  (EMO-INLINE.south)
  -- (\emox, -4*\nodesep - \mxextra - 1.5)               % DOWN to below A4
  -- ({-\kinoff - 3.5}, -4*\nodesep - \mxextra - 1.5)    % LEFT to x=-10
  -- ({-\kinoff - 3.5}, -2*\nodesep)                      % UP to A2.y
  -- (A2.west);                                            % RIGHT to A2.west

% Feedback label — v6: moved CLOSER to the UP segment (at x=-10)
% per user request. Positioned just east of the UP segment in the
% empty space between the FB arrow and the chain center.
\node[font=\sffamily\tiny\itshape, text=feedbackcolor,
  text width=2.8cm, align=left, anchor=west, inner sep=2pt,
  fill=white, fill opacity=0.88, text opacity=1]
  at ({-\kinoff - 3.0}, -3.5*\nodesep) {
  \textbf{Within-episode feedback}:\\
  emotion impairs corrective\\
  faculty $\to$ further doxa\\
  $\to$ further emotion\\[2pt]
  {\tiny\textit{De Insomn.}\ 460b3--16}\\
  {\tiny\textit{Rhet.}\ 1378a20--22}
};

% ============================================================
%  ONTOLOGICAL PRIORITY LINE — unchanged from v0
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
%  BACKGROUND ZONES (Option B v1)
%  zoneupper unchanged. zonelower fit extended to include
%  A3-frame, DOXA, EMO-INLINE, M34 (lower), A4 (lower).
% ============================================================

\begin{scope}[on background layer]
  \node[fill=perceptual, rounded corners=6pt, inner sep=10pt,
    fit=(A0)(A2)(K01)(K12)(T01)(T12),
    label={[font=\sffamily\tiny\bfseries, text=actuality!40,
      anchor=north west, xshift=4pt, yshift=-2pt]north west:
      PERCEPTUAL--PHANTASMATIC}] (zoneupper) {};

  \node[fill=cognitive, rounded corners=6pt, inner sep=10pt,
    fit=(A3-frame)(DOXA)(EMO-INLINE)(A4)(K23)(K34)(T23)(T34),
    label={[font=\sffamily\tiny\bfseries, text=motion!40,
      anchor=north west, xshift=4pt, yshift=-2pt]north west:
      NOETIC--OREKTIKON}] (zonelower) {};
\end{scope}

% ============================================================
%  RECURSIVE LOOP (Option B v1)
%  Vertical span extended by \mxextra to reach from new A4 to A0.
% ============================================================

\draw[looparrow, rounded corners=10pt]
  (A4.east) -- ++(\loopoff, 0)
  -- ++(0, {4*\nodesep + \mxextra})
  -- (A0.east)
  node[pos=0.50, right=6pt, font=\sffamily\scriptsize\itshape,
    text=loopcolor, text width=2.6cm, align=center]
  {Recursive loop:\\completed action\\changes the world\\$\to$ fresh $M_0 \rightarrow A_1$ cycle};

% ============================================================
%  NAMING PRINCIPLE (top right) — unchanged from v0
% ============================================================

\node[rectangle, rounded corners=2pt, draw=actuality!20, fill=white,
  font=\sffamily\tiny\itshape, text=actuality!55,
  text width=2.8cm, align=center, inner sep=3pt]
  at (\timeoff, 1.2) {
  Each motion takes its\\name from its terminus\\
  (Phys.\ V.5, 229b25)
};

% ============================================================
%  VARIABLE EMOTION NOTE (Option B v1)
%  Position shifted down by \mxextra.
% ============================================================

\node[rectangle, rounded corners=3pt, draw=black!25, fill=white,
  line width=0.4pt, text width=8.0cm, align=center,
  font=\sffamily\tiny, text=black!55, inner sep=6pt]
  at (0, -4*\nodesep - 2.2 - \mxextra) {
  \textbf{Variable emotion presence}: evaluatively complex actions
  (fear, anger, pity) pass through the emotion-desire composite;
  simple appetitive actions (MA 701a32--33: ``I want to drink \ldots\
  straightaway I drink'') bypass emotion.
  Long-habituated actions may also bypass emotional mediation.
};

% ============================================================
%  LEGEND (Option B v1)
%  Extended with 7 new rows for Option B visual categories.
%  Position shifted down by \mxextra.
% ============================================================

\node[rectangle, rounded corners=4pt, draw=black!40, fill=white,
  line width=0.6pt, inner sep=8pt]
  (legend) at (0, -4*\nodesep - 5.5 - \mxextra) {
  \begin{tikzpicture}[
    lsample/.style={minimum width=1.4cm, minimum height=0.45cm,
      font=\sffamily\tiny, align=center, inner sep=2pt},
    llabel/.style={font=\sffamily\tiny, text=black!70, anchor=west},
    lline/.style={font=\sffamily\tiny, text=black!70, anchor=west},
  ]
    % Title
    \node[font=\sffamily\scriptsize\bfseries, text=black!75] at (3.2, 2.8) {LEGEND};

    % Row 1: Actuality node
    \node[lsample, rectangle, rounded corners=3pt,
      draw=actuality, fill=actuality!8, line width=1pt,
      text=actuality, font=\sffamily\tiny\bfseries]
      (leg-act) at (0.8, 2.2) {$A_n$};
    \node[llabel] at (1.8, 2.2) {Completed actuality (determinate node in the chain)};

    % Row 2: A3 sub-node (NEW)
    \node[lsample, rectangle, rounded corners=2pt,
      draw=actuality!70, fill=white, line width=0.5pt,
      text=actuality, font=\sffamily\tiny]
      (leg-a3sub) at (0.8, 1.7) {A$_3$ mode};
    \node[llabel] at (1.8, 1.7) {A$_3$ orientational sub-mode (NOESIS / MEMORY / SPECULATIVE / DELIBERATIVE)};

    % Row 3: Motion node
    \node[lsample, rectangle, rounded corners=2pt,
      draw=motion, fill=motion!6, line width=0.7pt, dashed,
      text=motion, font=\sffamily\tiny]
      (leg-mot) at (0.8, 1.2) {$M_n$};
    \node[llabel] at (1.8, 1.2) {Motion segment (transition between actualities)};

    % Row 4: DOXA band (NEW)
    \node[lsample, rectangle, rounded corners=3pt,
      draw=pathoscolor, fill=pathoscolor!10,
      line width=0.7pt, dash pattern=on 3pt off 2pt,
      text=pathoscolor!85!black, font=\sffamily\tiny\bfseries]
      (leg-doxa) at (0.8, 0.7) {DOXA};
    \node[llabel] at (1.8, 0.7) {Orthogonal committal dimension (supervenes upon any orientational mode)};

    % Row 5: Inline EMO (NEW)
    \node[lsample, rectangle, rounded corners=3pt,
      draw=emotioncolor, fill=emotioncolor!8,
      line width=0.7pt,
      text=emotioncolor!85!black, font=\sffamily\tiny\bfseries]
      (leg-emo-in) at (0.8, 0.2) {Emo};
    \node[llabel] at (1.8, 0.2) {Inline emotion-desire (when doxa is evaluatively complex)};

    % Row 6: Time node
    \node[lsample, rectangle, rounded corners=2pt,
      draw=timecolor!70, fill=timecolor!5, line width=0.5pt,
      text=timecolor!80!black, font=\sffamily\tiny\itshape]
      (leg-time) at (0.8, -0.3) {$\tau_{n \to n\!+\!1}$};
    \node[llabel] at (1.8, -0.3) {Temporal interval of the motion segment};

    % Row 7: Kinetic role box
    \node[lsample, rectangle, rounded corners=1pt,
      draw=motion!40, fill=white, line width=0.35pt,
      text=black!60, font=\sffamily\tiny]
      (leg-kin) at (0.8, -0.8) {\textbf{U} / \textbf{MM} / \textbf{M}};
    \node[llabel] at (1.8, -0.8)
      {Three-factor kinetic roles (unmoved / moved mover / moved)};

    % Row 8: Pathos track (gold dotted line)
    \draw[pathoscolor!50, line width=0.7pt, densely dotted,
      -{Stealth[length=3pt]}] (0.1, -1.3) -- (1.5, -1.3);
    \node[llabel] at (1.8, -1.3)
      {Basic affective valence (\textit{pathos}): dispositional, non-mobilising};

    % Row 9: Deliberative path (NEW)
    \draw[deliberativecolor!85!black, line width=1.2pt,
      -{Stealth[length=3pt]}] (0.1, -1.8) -- (1.5, -1.8);
    \node[llabel] at (1.8, -1.8)
      {$M_3{\to}A_4$ Path 1: Deliberative (no doxa needed) --- DA III.10, 433a13--15};

    % Row 10: Habitual rational path (NEW)
    \draw[pathoscolor!85!black, line width=1.0pt,
      dash pattern=on 4pt off 2pt,
      -{Stealth[length=3pt]}] (0.1, -2.3) -- (1.5, -2.3);
    \node[llabel] at (1.8, -2.3)
      {$M_3{\to}A_4$ Path 2: Habitual rational (settled doxa as hexis) --- MA 701a13--14};

    % Row 11: Emotion-mediated path (NEW)
    \draw[emotioncolor!85!black, line width=1.0pt,
      dash pattern=on 3pt off 3pt,
      -{Stealth[length=3pt]}] (0.1, -2.8) -- (1.5, -2.8);
    \node[llabel] at (1.8, -2.8)
      {$M_3{\to}A_4$ Path 3: Evaluatively complex (emotion-mediated) --- DA III.3, 427b21--24};

    % Row 12: Pure-appetitive bypass (v6 NEW)
    \draw[bypasscolor, line width=1.2pt,
      dash pattern=on 8pt off 3pt on 2pt off 3pt,
      -{Stealth[length=3pt]}] (0.1, -3.3) -- (1.5, -3.3);
    \node[llabel] at (1.8, -3.3)
      {Pure-appetitive bypass: $A_2 \to M_3{\to}A_4$ (no $A_3$, no doxa) --- MA 701a32--33};

    % Row 13: Within-episode feedback
    \draw[feedbackcolor, line width=0.8pt, densely dashed,
      -{Stealth[length=3pt]}] (0.1, -3.8) -- (1.5, -3.8);
    \node[llabel] at (1.8, -3.8)
      {Within-episode feedback: emotion impairs corrective faculty $\to$ further doxa};

    % Row 14: Diachronic feedback
    \draw[pathoscolor!75!black, line width=0.9pt,
      dash pattern=on 6pt off 3pt,
      -{Stealth[length=3pt]}] (0.1, -4.3) -- (1.5, -4.3);
    \node[llabel] at (1.8, -4.3)
      {Cross-episode feedback: $A_4 \to$ Hexeis (hexis sedimentation, NE II.1)};

    % Row 15: Recursive loop
    \draw[loopcolor, line width=0.8pt, densely dashed,
      -{Stealth[length=3pt]}] (0.1, -4.8) -- (1.5, -4.8);
    \node[llabel] at (1.8, -4.8)
      {Recursive loop ($A_4$ changes the world $\to$ fresh $M_0 \rightarrow A_1$ cycle)};

    % Row 16: Background zones
    \node[lsample, rectangle, rounded corners=3pt,
      fill=perceptual, draw=none, font=\sffamily\tiny, text=actuality!50]
      (leg-perc) at (0.8, -5.3) {zone};
    \node[llabel] at (1.8, -5.3)
      {Perceptual--phantasmatic zone ($A_0$--$A_2$) / Noetic--orektikon zone ($A_3$--$A_4$)};

  \end{tikzpicture}
};

\end{tikzpicture}
\end{document}
