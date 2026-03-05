#!/bin/bash
cd /home/kavia/workspace/code-generation/team-collaboration-platform-329153/task_tracker_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

