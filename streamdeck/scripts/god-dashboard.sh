#!/bin/bash
source "$(dirname "$0")/_common.sh"
WSL_IP=$(hostname -I | awk '{print $1}')
god_open "http://${WSL_IP}:3847"
