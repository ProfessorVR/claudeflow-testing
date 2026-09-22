Echo-cancellation check for a Windows laptop (30 seconds, no game needed)
=======================================================================

1. Unplug headphones/headsets so the laptop uses its built-in speakers and microphone.
2. Set the laptop volume to the level you use in the game (e.g. 50%). Keep the room quiet.
3. Open a Command Prompt in this folder and run:

       probe_win.exe acoustic speech.wav

   The laptop speaks for about a minute (6 short phases). Do not talk during the test.
4. Read the last line (also saved to probe_result.txt):

       RESULT: ... -> ECHO REMOVED            = echo cancellation works on this laptop
       RESULT: ... -> ECHO NOT FULLY REMOVED  = send probe_result.txt
       RESULT: ... -> inconclusive            = the speakers were too quiet; raise the volume and rerun

   Measured on the CHIMERA laptop 2026-09-18 (speakers 100%): echo at the mic -17 dBFS raw,
   -64 dBFS after the fix (below the room's own noise) -> ECHO REMOVED.

   Run it from the laptop itself (or via run_probe_interactive.ps1 when connected remotely):
   audio played from a remote/SSH session does not reach the speakers.

Optional: "probe_win.exe" with no arguments runs the functional checks (device list,
start/stop, audio rate) and should end with "5/5 checks passed" (count varies with devices).

This tool only reads the microphone and plays the included speech file; it changes nothing.
