#!/bin/bash

# Script to verify rich text editor is ready for deployment

echo "=========================================="
echo "Rich Text Editor - Deployment Readiness Check"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

READY=true

# Check 1: package.json has react-quill
echo "1. Checking package.json..."
if grep -q "react-quill" frontend/package.json; then
    echo -e "${GREEN}✅ react-quill found in package.json${NC}"
else
    echo -e "${RED}❌ react-quill NOT found in package.json${NC}"
    READY=false
fi

# Check 2: RichTextEditor component exists
echo "2. Checking RichTextEditor component..."
if [ -f "frontend/src/components/RichTextEditor.tsx" ]; then
    echo -e "${GREEN}✅ RichTextEditor.tsx exists${NC}"
else
    echo -e "${RED}❌ RichTextEditor.tsx NOT found${NC}"
    READY=false
fi

# Check 3: TourForm imports RichTextEditor
echo "3. Checking TourForm imports..."
if grep -q "import RichTextEditor" frontend/src/components/TourForm.tsx; then
    echo -e "${GREEN}✅ TourForm imports RichTextEditor${NC}"
else
    echo -e "${RED}❌ TourForm does NOT import RichTextEditor${NC}"
    READY=false
fi

# Check 4: CSS styles added
echo "4. Checking CSS styles..."
if grep -q ".rich-text-editor" frontend/src/index.css; then
    echo -e "${GREEN}✅ Rich text editor styles found${NC}"
else
    echo -e "${RED}❌ Rich text editor styles NOT found${NC}"
    READY=false
fi

if grep -q ".tour-description" frontend/src/index.css; then
    echo -e "${GREEN}✅ Tour description styles found${NC}"
else
    echo -e "${RED}❌ Tour description styles NOT found${NC}"
    READY=false
fi

# Check 5: Git status
echo "5. Checking Git status..."
if git diff --quiet frontend/package.json; then
    echo -e "${GREEN}✅ package.json is committed${NC}"
else
    echo -e "${YELLOW}⚠️  package.json has uncommitted changes${NC}"
    READY=false
fi

if git diff --quiet frontend/src/components/TourForm.tsx; then
    echo -e "${GREEN}✅ TourForm.tsx is committed${NC}"
else
    echo -e "${YELLOW}⚠️  TourForm.tsx has uncommitted changes${NC}"
    READY=false
fi

# Check 6: Remote sync
echo "6. Checking if pushed to GitHub..."
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main 2>/dev/null || echo "unknown")

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo -e "${GREEN}✅ Local and remote are in sync${NC}"
else
    echo -e "${YELLOW}⚠️  Local commits not pushed to GitHub${NC}"
    echo -e "${YELLOW}   Run: git push origin main${NC}"
    READY=false
fi

echo ""
echo "=========================================="

if [ "$READY" = true ]; then
    echo -e "${GREEN}✅ READY TO DEPLOY!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. SSH to your production server"
    echo "2. Run: cd /var/www/tourism-platform"
    echo "3. Run: bash production-deploy.sh"
    echo ""
else
    echo -e "${RED}❌ NOT READY TO DEPLOY${NC}"
    echo ""
    echo "Please fix the issues above, then:"
    echo "1. git add ."
    echo "2. git commit -m 'Add rich text editor'"
    echo "3. git push origin main"
    echo "4. Run this script again"
    echo ""
fi

echo "=========================================="
