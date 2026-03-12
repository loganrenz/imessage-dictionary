#!/usr/bin/env sh
# Kill dev servers for this monorepo (web + showcase apps on ports 3000, 3010-3016)
set -e
for port in 3000 3010 3011 3012 3013 3014 3015 3016; do
  pid=$(lsof -ti :"$port" 2>/dev/null) || true
  if [ -n "$pid" ]; then
    kill $pid 2>/dev/null && echo "Killed process on port $port (PID $pid)" || true
  fi
done

# Kill orphaned workerd processes (PPID=1 means parent died and they got reparented to launchd)
orphans=$(ps -eo ppid,pid,command | grep workerd | grep -v grep | awk '$1 == 1 { print $2 }')
if [ -n "$orphans" ]; then
  echo "$orphans" | xargs kill 2>/dev/null && echo "Killed orphaned workerd processes" || true
fi

echo "Done."
