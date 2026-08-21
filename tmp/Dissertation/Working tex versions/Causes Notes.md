\documentclass{article}
\usepackage{graphicx} % Required for inserting images
\usepackage{xcolor} % Must be loaded before soul
\usepackage{soul} % For highlighting text
\usepackage[utf8]{inputenc}
\usepackage{newunicodechar}
\usepackage{tikz}
\usetikzlibrary{positioning}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{fontspec}           % For Greek text support with XeLaTeX/LuaLaTeX
\usepackage{polyglossia}        % Multilingual support
\setmainlanguage{english}
\setotherlanguage{greek}

\usepackage{geometry}
\geometry{margin=1in}

\usepackage{csquotes}           % Block quotes
\usepackage{enumitem}           % Better lists
\usetikzlibrary{arrows.meta, positioning, shapes.geometric}

\usepackage{fancyvrb}           % Verbatim environments for ASCII diagrams
\usepackage{setspace}           % Line spacing



% --- Greek support (XeLaTeX) ---
\usepackage{fontspec}
\newfontfamily\greekfont{Gentium Plus} % good polytonic Greek; try Times New Roman if needed
\newcommand{\gk}[1]{{\greekfont #1}}

\newunicodechar{₁}{$_1$}

\usepackage[backend=biber,style=authoryear]{biblatex}
\addbibresource{references.bib} %Add References page for in text citation
\usepackage[colorlinks=true, linkcolor=blue, urlcolor=blue, citecolor=blue]{hyperref} %enable hyperlinks to be colored and interactable
\usepackage{changepage} %create individual blocks of text that can be altered apart from general document.

\usepackage{comment}

\newcommand{\ra}{\ensuremath{\rightarrow}\ }

\newcommand{\inlinenote}[1]{\par\noindent
  \fcolorbox{orange}{orange!20}{\parbox{0.97\linewidth}{#1}}\par\noindent}

\begin{document}

Aristotle insists that explanation cannot regress indefinitely. Though he never uses the equivalent to the modern metaphysical term ``event,'' he gives his version of what such a concept is and it is multi-layered: horizontally (Four types of cause at that time and place) and vertically (each cause is itself embedded in a chain culminating in more basic causes and finally in first principles). 

Rhetoric's seven causes of why people act (psychological causes of voluntary action)
\begin{itemize}
    \item Nature:
    \item Compulsion:
    \item Habit:
    \item Calculation or Rational Choice: 
    \item Anger or Appetite:
    \item Chance: 
\end{itemize}

Four Causes (general explanatory kind). These are global: any full explanation of a natural process or artifact, including actions, will typically involve some configuration of all four. 
\begin{itemize}
    \item Material Cause: That \textit{out of which} something comes to be (bronze of a state, wood of a table, flesh of an animal).
    \item Formal Cause: The form, structure, or essence that makes it the kind of thing it is (the shape of the statue, the definition of ``man''). 
    \item Efficient Cause: the primary source of change or rest (the sculptor, the father, the builder).
    \item Final Cause: the \textit{telos} (end), goal, or ``that for the sake of which'' (health as the end of medical treatment, sight as the end of the eye/perceptive faculty: we do not see so that we may have sight, we have sight so that we may see).
\end{itemize}

So how the \textit{Rhetorica}'s seven causes for action and more general four causes relate? For an action like ``X walks to the market to buy bread'':
\begin{itemize}
    \item Material: X's body, its limbs and muscles.
    \item Formal: the form of a human being walking; the practical syllogism organizing the action.
    \item Efficient: X's practical intellect and will, muscles, perhaps external pushes.
    \item Final: getting bread, feeding oneself, or whatever X's end is. 
\end{itemize}

Three factor-schema of motion: (hand moves the stick, which moves the stone):
\begin{itemize}
    \item The \textit{hand} is a moved mover: the arm's muscles, nervous system, and ultimately the soul's act move the hand; the hand in turn moves the stick. (In this scenario, the hand is the relative ``unmoved mover'' not the ``absolute unmoved'' but unmoved by what it currently moves. The hand is not being moved by the stick; causality flows from the hand to the stick to the stone.)
    \item The \textit{stick} is another moved mover: it is pushed by the hand and pushes the stone. 
    \item  The \textit{stone} is what is moved, the last link in this sub-chain. 
\end{itemize}
Two levels: the local chain level (hand-stick-stone): Aristotle's principle is that in a chain of movers and things moved, \textit{the first mover in that chain is the genuine efficient cause}; intermediates are instruments. So for a given \textit{ordered chain}, there is generally \textit{one} ``first mover'' in that series---the relative ``unmoved mover'' to the rest of the chain. Second, is the Cosmic level: There cannot be an infinite regress of moved movers so it must logically terminate in the absolutely unmoved mover. So for the hand-stick-stone, the relative unmoved mover is the soul/hand, the rest are derivative. 

Aristotle's ``Event'' would likely be a change/\textit{kinesis}: actuality of a potential \textit{as such}; or, a particular action of a substance: ``Socrates' learning geometry,'' ``this house's being built.'' Every such event decomposes into the four formal causes. Example: This stone's being moved two feet to the right by a stick:
\begin{itemize}
    \item Subject: the stone.
    \item Material: the stone's matter (basalt), air, ground, etc. 
    \item Form: its new spatial configuration (being-here rather than there).
    \item Efficient: my hand-stick chain, ultimately my soul as mover. 
    \item Final: perhaps a \textit{telos} (clearing a path); it it is just play, the ``for the sake of'' might be trivial. 
\end{itemize}
The \textit{event} is not a bare occurrence, but the actualization of a potential in some underlying thing under the guidance of a from and for the sake of an end, produced by an actual mover. 

Explanatory Why's (\textit{Physica} II.3)
\begin{itemize}
    \item Formal Cause: Why is this thing \textit{this} rather than that? 
    \item Material Cause: Why is it \textit{made of this}?
    \item Efficient Cause: Why did it \textit{come into being} or \textit{change}? 
    \item Final Cause: Why \textit{for the sake of what} does it exist or happen?     
\end{itemize}

Lets take an event: a house \textit{comes to be} at t. To answer this you would:
\begin{enumerate}
    \item Identify the subject and the kind of change
    \begin{enumerate}
        \item Is this generation (coming-to-be), alteration, locomotion, growth, etc.?
        \item For a house, it is generation of an artifact: bricks and beams arranged into a house-form.
    \end{enumerate}
    \item Ask the four ``why?'' questions
    \begin{enumerate}
        \item Material: WHy this matter? Because wood and stone are suitable materials for supporting a roof and walls; they are what you can build with in this particular location.
        \item Formal: Why is it a \textit{house} (and not just a pile of materials)? Because it has the form/plan of a house---rooms, supporting structure, roof; the architect's design is the formal cause. 
        \item Efficient: Why did it come to be now? Because a builder, guided by that plan, assembled the materials at this time. 
        \item Final: Why build at all: For shelter, security, comfort; ``\textit{for the sake of} living in it. 
    \end{enumerate}
    \item Trace each cause up its chain
    \begin{enumerate}
        \list Efficient Chain: builder's motion \ra tools \ra workers \ra house; builder ultimately moved by needs, desires, laws, climate, all the way up to the broader cosmic orders. 
        \list Formal Chain: house-plan as instance of a more general art of building; that art as grounded in human rationality and, ultimately, in the intelligible forms that nature provides. 
        \item Final Chain: shelter for this family; more generally, the human good; even more generally, the realization of rational life in a \textit{polis}. 
    \end{enumerate}
    \item Stope when you reach explanatory first principle for that domain. 
\end{enumerate}

For any given motion there will typically be many \textit{efficient contributors} (a hand, tools, environment) and multiple causes or first principles overall (matter, form, ends). Yet, relative to a given ordered chain of movers, Aristotle singles out \textit{one} primary efficient cause as the unmoved mover in that chain---like the soul of the agent in voluntary action, or the heavenly mover in cosmic motion. Beyond that, in the grand scheme, all such finite chains are grounded in one or more absolutely unmoved movers, which are final causes for the whole order of motion and change. 

So an Aristotelian event, if you will consists structurally in a subject's potential being actualized (motion) according to a form and for an end, by a chain of movers rooted in a first mover. An explanation is adequate when it locates the event within those four dimensions and, as far as needed, traces each dimension back alnog its chain to the relevant first principles. 

Aristotle Quotes:

\begin{itemize}
    \item ``Again, that for the sake of which, or the end, belongs to the same department of knowledge as the means. But the nature is the end or that for the sake of which. For if a thing undergoes a continuous change toward some end, that last stage is actually that for the sake of which'' (\textit{Physica} II.2, 194a28--31).

    \item ``For the arts make there material (some simply make it, others make it serviceable, and we use everything as if it was there for our sake. (We also are in a sense an end. `That for the sake of which' may be taken in two ways, as we said in our work \textit{On Philosophy}.) The arts, therefore, which govern the matter and have knowledge are two, namely the art which uses the product and the art which directs the production of it. That is why the using art also is in a sense directive; but it differs in that it knows the form, whereas the art which is directive as being concerned with production knows the matter'' (\textit{Physica} II.2, 194a34--b5).

    \item ``In one way, then, that out of which a thing comes to be and which persists, is called a cause, e.g. the bronze of the statue , the silver of the bowl, and the genera of which the bronze and the silver are species. In another way, the form or the archetype, i.e. the definition of the essence, and its genera, are called causes (e.g. of the octave the relation of 2:1, and generally number), and the parts in the definition. Again, the primary source of the change or rest; e.g. the man who deliberated is a cause, the father is a cause of the child, and generally what makes of what is made and what changes of what is changed. Again, in the sense of end or that for the sake of which a thing is done, e.g. health is the cause of walking about. (`Why is he walking about?' We say: `To be healthy', and, having said that, we think we have assigned the cause.) The same is true also of all the intermediate steps which are brought about through the action of something else as means towards the end, e.g. reduction of flesh, purging, drugs, or surgical instruments are means towards health. All these things are for the sake of the end, though they differ from one another in that some are activities, others instrument'' (\textit{Physica} II.2, 194b24--195a3).

    \item ``As things are called causes in many ways, it follows that there are several causes of the same thing (not merely accidentally), e.g. both the art of the sculptor and the bronze are causes of the statue. These are causes of the statue \textit{qua} statue, not in virtue of anything else that it may be—only not in the same way, the one being the material cause, the other the cause whence the motion comes. Some things cause each other reciprocally, e.g. hard work causes fitness and \textit{vice versa}, but again not in the same way, but the one as end, the other as the principle of motion. Further the same thing is the cause of contrary results. For that which by its presence brings about one result is sometimes blamed for bringing about the contrary by its absence. Thus we ascribe the wreck of a ship to the absence of the pilot whose presence was the cause of its safety'' (\textit{Physica} II.2, 195a4--14).

    \item All causes, both proper and accidental, may be spoken of either as potential or as actual; e.g. the cause of a house being built is either a house-builder or a house-builder building'' (\textit{Physica} II.2, 195b4--6).

    \item ``Evidently we have to acquire knowledge of the original causes (for we say we know each thing only when we think we recognize its first cause), and causes are spoken of in four senses. In one of these we mean the substance, i.e. the essence (for the ‘why’ is referred finally to the formula, and the ultimate ‘why’ is a cause and principle); in another the matter or substratum, in a third the source of the change, and in a fourth the cause opposed to this, that for the sake of which and the good (for this is the end of all generation and change)'' (\textit{Metaphysica} I.3, 983a24--32).

    \item ``Since of the actions which have a limit none is an end but all are relative to the end, e.g. the process of making thin is of this sort, and the things themselves when one is making them thin are in movement in this way (i.e. without being already that at which the movement aims), this is not an action or at least not a complete one (for it is not an end); but that in which the end is present is an action. E.g. at the same time we are seeing and have seen, are understanding and have understood, are thinking and have thought: but it is not true that at the same time we are learning and have learnt, or are being cured and have been cured. At the same time we are living well and have lived well, and are happy and have been happy. If not, the process would have had sometime to cease, as the process of making thin ceases: but, as it is, it does not cease; we are living and have lived. Of these processes, then, we must call the one set movements, and the other actualities. For every movement is incomplete — making thin, learning, walking, building; these are movements, and incomplete movements. For it is not true that at the same time we are walking and have walked, or are building and have built, or are coming to be and have come to be — it is a different thing that is being moved and that has been moved, and that is moving and that has moved; but it is the same thing that at the same time has seen and is seeing, or is thinking and has thought. The latter sort of process, then, I call an actuality, and the former a movement'' (\textit{Metaphysica} IX.6, 1048b18--34). 

    \item ``Now every action of every person either is or is not due to that person himself. Of those not due to himself some are due to \textit{chance}, the others to necessity; of these latter, again, some are due to compulsion, the others to nature. Consequently all actions that are not due to a man himself are due either to \textit{chance} or to nature or to compulsion. All actions that \textit{are} due to a man himself and caused by himself are due either to habit or to desire; and of the latter, some are due to rational desire, the others to irrational. Rational desire is wishing, and wishing is a desire for good—nobody wishes for anything unless he thinks it good. Irrational desire is twofold, viz. anger and appetite. Thus every action must be due to one or other of seven causes: \textit{chance}, nature, compulsion, habit, reasoning, anger, or appetite'' (\textit{Rhetorica} I.10, 1368b33--1369a6). 

    \item ``The things that happen by chance are all those whose cause cannot be determined, that have no purpose, and that happen neither always nor for the most part nor in any fixed way. The definition of chance shows just what they are. Those things happen by nature which have a fixed and internal cause; they take place uniformly, either always or for the most part. There is no need to discuss in exact detail the things that happen contrary to nature, nor to ask whether they happen contrary to nature, nor to ask whether they happen in some sense naturally or from some other cause; it would seem that chance is indeed the cause of such events.  Those things happen through compulsion which take place contrary to the desire or reason of the agents themselves. Acts are done from habit which men do because they have often done them before. Actions are due to reasoning when, in view of any of the goods already mentioned, they appear useful either as ends or as contributing to an end, and are performed for that reason—for intemperate men too perform a certain number of useful actions, but because they are pleasant and not because they are useful. To passion and anger are due all acts of revenge. Revenge and punishment are different things. Punishment is inflicted for the sake of the person punished; revenge for that of the punisher, to satisfy his feelings. (What anger is will be made clear when we come to discuss the emotions.) Appetite is the cause of all actions that appear pleasant. Things familiar and things habitual belong to the class of pleasant things; for there are many actions not naturally pleasant which men perform with pleasure, once they have become used to them. To sum up then, all actions due to ourselves either are or seem to be either good or pleasant. Moreover, as all actions due to ourselves are done voluntarily and actions not due to ourselves are done involuntarily, it follows that all voluntary actions must either be or seem to be either good or pleasant; for I reckon among goods escape from evils or apparent evils and the exchange of a greater evil for a less (since these things are in a sense desirable), and likewise I count among pleasures escape from painful or apparently painful things and the exchange of a greater pain for a less'' (\textit{Rhetorica} I.10, 1369a32--b29). 

    \item ``We may lay it down that pleasure is a movement, a movement by which the soul as a whole is consciously brought into its normal state of being; and that pain is the opposite. If this is what pleasure is, it is clear that the pleasant is what tends to produce this condition, while that which tends to destroy it, or to cause the soul to be brought into the opposite state, is painful. It must therefore be pleasant for the most part to move towards a natural state of being, particularly when a natural process has achieved the complete recovery of that natural state'' (\textit{Rhetorica} I.11, 1369b34--1370a5).
\end{itemize}
    \begin{itemize}
        \item Pleasant things:
        \begin{itemize}
            \item Nature: what is according to nature, things that naturally belong to us and are in their natural conditon
            \item Habit: things out of habit are pleasant because habit is similar to nature
            \item Rest, leisure, sleep and absence of toil
            \item Desire and its objects  across past, present, and future (remember, objects of sense, hope/anticipations). 
            \item Revenge, victory, competetive activities
            \item Intellectual and social goods like honor, reputation, and friendship
            \item affinity, completion, mastery and laughter
        \end{itemize}
        \item Painful things:
        \begin{itemize}
            \item violence
            \item What is preternatural, or against nature
            \item concentration/study (unless it has become habit/custom) and strenuous endeavor.
            \item compulsion
            \item toil
            \item anxiety
            \item dishonor, ignorance (when one wants knowledge)
            \item incompletion
            \item the absence of recreation, or laughter, of congenial company
        \end{itemize}
    \end{itemize}

``Now every action of every person,'' Aristotle states in the \textit{Rhetorica}, ``either is or is not due to that person himself. Of those not due to himself some are due to \textit{chance}, the others to necessity; of these latter, again, some are due to compulsion, the others to nature.'' 
    




\end{document}