#!/bin/bash
# Docker disk space monitor with automatic cleanup
# Runs via cron — cleans up when disk usage exceeds threshold

THRESHOLD=75        # Trigger cleanup at this % usage
CRITICAL=90         # Aggressive cleanup at this % usage
LOG="/var/log/docker-cleanup.log"
MOUNT="/"           # Partition to monitor

usage=$(df "$MOUNT" | awk 'NR==2 {gsub(/%/,""); print $5}')
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$usage" -ge "$CRITICAL" ]; then
    echo "[$timestamp] CRITICAL: Disk at ${usage}% — running aggressive cleanup" >> "$LOG"
    docker system prune -af --volumes 2>&1 | tail -1 >> "$LOG"
    usage_after=$(df "$MOUNT" | awk 'NR==2 {gsub(/%/,""); print $5}')
    echo "[$timestamp] Disk now at ${usage_after}%" >> "$LOG"

elif [ "$usage" -ge "$THRESHOLD" ]; then
    echo "[$timestamp] WARNING: Disk at ${usage}% — removing unused images and build cache" >> "$LOG"
    docker image prune -af 2>&1 | tail -1 >> "$LOG"
    docker builder prune -af 2>&1 | tail -1 >> "$LOG"
    usage_after=$(df "$MOUNT" | awk 'NR==2 {gsub(/%/,""); print $5}')
    echo "[$timestamp] Disk now at ${usage_after}%" >> "$LOG"

else
    echo "[$timestamp] OK: Disk at ${usage}%" >> "$LOG"
fi
