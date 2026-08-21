#!/usr/bin/env bash
# Perplexity search helper for emotion-chapter scholarship.
# Requires PERPLEXITY_API_KEY in env.
set -euo pipefail

OUT_DIR="/home/dalton/projects/claudeflow-testing/tmp/Pathe/citations/perplexity-results"
mkdir -p "$OUT_DIR"

source /home/dalton/projects/claudeflow-testing/.env
export PERPLEXITY_API_KEY

ask() {
  local id="$1"; shift
  local q="$1"; shift
  local out="$OUT_DIR/${id}.json"
  if [ -f "$out" ] && [ -s "$out" ]; then
    echo "[skip] $id (already exists)"
    return 0
  fi
  echo "[query] $id"
  curl -s --max-time 90 -X POST https://api.perplexity.ai/chat/completions \
    -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(python3 -c "
import json,sys
q = '''$q'''
body = {
  'model': 'sonar-pro',
  'messages': [
    {'role':'system','content':'You are a scholarly bibliographic assistant. For each query, return EXACTLY 5 highly relevant peer-reviewed scholarly works with: (1) full author/year/title/journal-or-book citation; (2) a direct, openly accessible URL to a PDF or full-text (prefer JSTOR, PhilPapers, Academia.edu, university repositories, or open journals). Reply ONLY in JSON like: {\"results\":[{\"author\":\"\",\"year\":\"\",\"title\":\"\",\"venue\":\"\",\"url\":\"\",\"why_relevant\":\"\"}]}'},
    {'role':'user','content': q}
  ],
  'max_tokens': 1500,
  'return_citations': True
}
print(json.dumps(body))
")" > "$out"
}

# Topic queries
ask q01 "Aristotle pathos emotion as movement of soul kinesis Rhetoric Book II De Anima -- find peer-reviewed scholarly articles examining the ontological structure of pathos as kinesis and its dual realization in basic affective valence and higher-order emotions, with focus on the cognitive-bodily integration."

ask q02 "Aristotle phantasia and emotion -- find peer-reviewed scholarship on how imagination generates and conditions the higher-order emotions (anger, fear, pity, shame) in De Anima III.3 and Rhetoric Book II. Particularly Schofield, Frede, Lorenz, Moss, Modrak."

ask q03 "Aristotle doxa belief and emotion -- find peer-reviewed scholarship arguing that emotion in Aristotle requires a doxastic component (belief or judgment), drawing on De Anima 427b21 and the Rhetoric definitions of fear, anger, pity. Authors include Cooper, Striker, Fortenbaugh, Konstan."

ask q04 "Aristotle De Anima 403a25 enmattered logoi affections of the soul -- find peer-reviewed scholarship interpreting the dialectician/physicist passage on anger as 'desire for retaliation' versus 'boiling of blood around the heart' as exemplifying hylomorphism in psychology."

ask q05 "Aristotle Movement of Animals 701a32 practical syllogism desire to drink -- find peer-reviewed scholarship on the causal chain from perception/imagination/desire to bodily motion, including Nussbaum's De Motu commentary, Corcilius, Charles."

ask q06 "Heidegger Befindlichkeit attunement state-of-mind Stimmung mood Aristotle pathos rhetoric -- find peer-reviewed scholarship on Heidegger's reading of Aristotelian emotions in the 1924 Rhetoric lectures (GA 18) as preparatory for Being and Time §29."

ask q07 "Aristotle hexis disposition emotion habit Nicomachean Ethics II.1 -- find peer-reviewed scholarship on how repeated affective actualizations sediment into stable hexeis (settled dispositions) and the relation between pathos and hexis."

ask q08 "Aristotle De Insomniis 460b emotion phantasia controlling sense judgment-impairment -- find peer-reviewed scholarship on the feedback loop in which active emotion impairs the corrective faculty and lets phantasmata pass into doxa unopposed."

ask q09 "Aristotle Rhetoric II.1 1378a20 emotion changes judgment kriseis hedonic tonality -- find peer-reviewed scholarship on the three-aspect definition of emotion (change, krisis, hedonic accompaniment) and its application across the catalog (anger, fear, pity, shame)."

ask q10 "Aristotle ontological status of emotions enmattered hylomorphic non-reductive naturalism -- find peer-reviewed scholarship arguing emotions are irreducible composites of evaluative cognition, conative orientation, hedonic tonality, and physiological alteration. Authors: Charles, Polansky, Granger, Gill."

ask q11 "Aristotle pleasure pain hedone lupe basic affective valence perception De Anima 413b24 III.7 -- find peer-reviewed scholarship on the pleasure/pain co-given with all perception and the relation to higher-order emotions."

ask q12 "Heidegger fear phobos Aristotle Rhetoric B5 futural temporality being-toward-death -- find peer-reviewed scholarship on Heidegger's reading of Aristotelian fear in BCAP and its connection to the Existential analytic of Being and Time."

ask q13 "Aristotle aisthesis kritikon perception as discernment De Anima III.7 affirmation negation pursue avoid -- find peer-reviewed scholarship on perception's discriminative-evaluative character at the prepropositional level."

ask q14 "rhetoric phantasia visualization 'setting before the eyes' energeia enargeia Aristotle Rhetoric III.10-11 -- find peer-reviewed scholarship on rhetorical vision as the imagistic ground of emotion in audiences."

ask q15 "Aristotle action and emotion practical syllogism orexis appetitive vs deliberative imagination -- find peer-reviewed scholarship on phantasia bouleutike vs. aisthetike and the role of phantasia in delivering the moved-mover desire."

echo "All queries done."
