#!/bin/bash

echo "=================================================="
echo "FIXING DOCKER DATABASE"
echo "=================================================="
echo ""
echo "Current directory: $(pwd)"
echo ""

# Run the fix script
echo "Running force_recreate_table.py..."
python force_recreate_table.py

echo ""
echo "=================================================="
echo "DONE!"
echo "=================================================="
echo ""
echo "Now run this command on your HOST machine:"
echo "  docker restart englishwebai-backend-1"
echo ""
echo "Then check logs:"
echo "  docker logs -f englishwebai-backend-1"
echo ""
echo "Wait for: 'Application startup complete.'"
echo "Then test creating a course with thumbnail!"
echo "=================================================="


