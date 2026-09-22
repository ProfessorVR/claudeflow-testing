#!/bin/bash
# build_and_run.sh - ON THE MAC UNDER TEST (needs Xcode command-line tools). Builds two probes from one source:
#   probe_visible : replacement operators exported (as in the Unreal executable today)
#   probe_hidden  : same code linked with -unexported_symbols_list (operator new/delete not exported)
# then runs both. Run from Terminal so the microphone permission prompt can appear.
set -u; cd "$(dirname "$0")"
F="-std=c++17 -fobjc-arc -framework AudioToolbox -framework CoreAudio -framework Foundation"
clang++ $F -DVARIANT_NAME="\"VISIBLE operators (exported, like Unreal)\"" vpio_alloc_probe.mm -o probe_visible || exit 1
clang++ $F -DVARIANT_HIDDEN -DVARIANT_NAME="\"HIDDEN operators (-unexported_symbols_list)\"" -Wl,-unexported_symbols_list,unexported_operators.txt vpio_alloc_probe.mm -o probe_hidden || exit 1
echo "--- exported operator symbols (visible / hidden):"; echo "visible: $(nm -gU probe_visible | grep -c -E " __Z(n|d)")  hidden: $(nm -gU probe_hidden | grep -c -E " __Z(n|d)")"
for P in probe_visible probe_hidden; do echo "===================== $P"; ./$P; echo "exit=$?"; done
