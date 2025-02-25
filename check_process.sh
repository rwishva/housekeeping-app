#!/bin/bash

kill_processes() {
    local process_pattern="$1"
    pkill -f "$process_pattern"
}

PROCESS_NAME_UC="server.js"
PROCESS_PATTERN_CHROME="chrome"

if pgrep -f "$PROCESS_NAME_UC" >/dev/null
then
    echo "Process  $PROCESS_NAME_UC is running."
else
    echo "Process is not running. Starting it..."
    kill_processes "$PROCESS_PATTERN_CHROME"
    # Command to start your process
    cd /root/hk
    nohup node /root/hk/server.js &
fi

