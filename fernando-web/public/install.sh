#!/bin/bash
# Fernando Auto-Installer
# Usage: curl -fsSL https://fernando.aibusinesssuite.io/install.sh | bash

set -e

echo "🤖 Installing Fernando CLI..."
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: Fernando CLI requires macOS"
    exit 1
fi

# Determine the base URL for downloads
BASE_URL="${FERNANDO_INSTALL_URL:-https://fernando.aibusinesssuite.io/api}"

echo "📦 Installing prerequisites..."

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "   Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for Apple Silicon
    if [[ $(uname -m) == 'arm64' ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
fi

# Install required packages
echo "   Checking dependencies..."
for pkg in tmux jq node curl; do
    if ! command -v "$pkg" &> /dev/null; then
        echo "   Installing $pkg..."
        brew install "$pkg"
    else
        echo "   ✓ $pkg already installed"
    fi
done

echo "✓ Prerequisites installed"
echo ""

# Create Fernando directory structure
FERNANDO_HOME="$HOME/fernando"
echo "📁 Creating Fernando directories..."
mkdir -p "$FERNANDO_HOME"/{sessions,knowledge,active-sessions,scripts,aws,activation}
echo "✓ Directories created"
echo ""

# Download files
echo "⬇️  Downloading Fernando files..."

# Download main fernando executable
echo "   Downloading fernando CLI..."
if ! curl -fsSL "$BASE_URL/fernando" -o "$FERNANDO_HOME/fernando"; then
    echo "❌ Failed to download fernando executable"
    echo "   URL: $BASE_URL/fernando"
    exit 1
fi
echo "✓ Fernando CLI downloaded"

# Download installation script for future use
echo "   Downloading installation script..."
curl -fsSL "$BASE_URL/install.sh" -o "$FERNANDO_HOME/install.sh" 2>/dev/null || true

# Create a basic brief if it doesn't exist
if [ ! -f "$FERNANDO_HOME/activation/fernando-brief.md" ]; then
    echo "   Creating default configuration..."
    cat > "$FERNANDO_HOME/activation/fernando-brief.md" << 'EOF'
# Fernando - Your Personal AI Assistant

You are Fernando, a personal AI assistant designed to help with:
- Software development and debugging
- Project management and organization
- Knowledge capture and retrieval
- Session tracking and learning consolidation

## Core Capabilities

1. **Session Management**: Track work sessions with context and learnings
2. **Knowledge Management**: Store and retrieve personal knowledge
3. **Cloud Sync**: Sync sessions and knowledge to the cloud
4. **GitHub Integration**: Automatic context fetching from repositories

## Usage

- Start sessions in any project directory
- Capture learnings and decisions automatically
- Sync knowledge across machines
- Access session history and insights

---

Ready to assist!
EOF
fi

echo "✓ Configuration created"
echo ""

# Make executable
echo "🔧 Setting permissions..."
chmod +x "$FERNANDO_HOME/fernando"
echo "✓ Permissions set"
echo ""

# Add to PATH
echo "🔗 Configuring PATH..."
SHELL_CONFIG=""

if [ -n "$ZSH_VERSION" ] || [ -f ~/.zshrc ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ -f ~/.bashrc ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -f ~/.bash_profile ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
else
    SHELL_CONFIG="$HOME/.zshrc"
fi

# Check if Fernando is already in PATH
if ! grep -q 'export PATH="$HOME/fernando:$PATH"' "$SHELL_CONFIG" 2>/dev/null; then
    echo "" >> "$SHELL_CONFIG"
    echo '# Fernando CLI' >> "$SHELL_CONFIG"
    echo 'export PATH="$HOME/fernando:$PATH"' >> "$SHELL_CONFIG"
    echo "✓ Added Fernando to PATH in $SHELL_CONFIG"
else
    echo "✓ Fernando already in PATH"
fi

echo ""
echo "✅ Fernando installed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Restart your terminal or run:"
echo "   source $SHELL_CONFIG"
echo ""
echo "2. Start using Fernando:"
echo "   fernando start"
echo ""
echo "3. View available commands:"
echo "   fernando help"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Visit https://fernando.aibusinesssuite.io for more info"
echo ""
echo "🎉 Installation complete!"
