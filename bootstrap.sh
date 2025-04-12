#!/bin/bash

# Sendapp Bootstrap Script
# Installs core development tools based on CONTRIBUTING.md

set -e # Exit immediately if a command exits with a non-zero status.

# --- Helper Functions ---
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo_step() {
  echo "----------------------------------------"
  echo "➡️  $1"
  echo "----------------------------------------"
}

echo_info() {
  echo "   ℹ️  $1"
}

echo_warn() {
  echo "   ⚠️  $1"
}

echo_success() {
  echo "   ✅ $1"
}

# --- Prerequisites Check ---

echo_step "Checking prerequisites..."

# 1. Git
if ! command_exists git; then
  echo_warn "Git is not installed. Please install Git first: https://git-scm.com/book/en/v2/Getting-Started-Installing-Git"
  exit 1
else
  echo_success "Git found."
fi

# 2. Node.js (via fnm)
echo_step "Setting up Node.js using fnm..."
if ! command_exists fnm; then
  echo_info "fnm (Fast Node Manager) not found. Attempting to install..."
  if curl -fsSL https://fnm.vercel.app/install | bash; then
     echo_success "fnm installed successfully."
     echo_warn "You might need to restart your shell or update your shell profile (e.g., ~/.bashrc, ~/.zshrc) for fnm to be available."
     echo_warn "Add 'eval \"\$(fnm env --use-on-cd)\"' to your shell profile."
     echo_warn "Please re-run this script after setting up your shell for fnm."
     exit 1 # Exit so user can configure shell
  else
     echo_warn "Failed to install fnm automatically. Please install it manually: https://github.com/Schniz/fnm#installation"
     exit 1
  fi
else
  echo_success "fnm found."
fi

# Source fnm environment variables if possible (might not work in non-interactive script)
# This helps if fnm is installed but not yet sourced in the current non-interactive shell
FNM_DIR="${FNM_DIR:-$HOME/.fnm}"
export PATH="$FNM_DIR:$PATH"
eval "$(fnm env --use-on-cd)" || echo_warn "Could not automatically source fnm environment. Ensure it's configured in your shell profile."


if [ ! -f ".node-version" ]; then
  echo_warn ".node-version file not found. Cannot determine required Node.js version."
  exit 1
fi

NODE_VERSION=$(cat .node-version)
echo_info "Required Node.js version: $NODE_VERSION"

if ! fnm current | grep -q "v$NODE_VERSION"; then
  echo_info "Installing Node.js v$NODE_VERSION..."
  if fnm install "$NODE_VERSION"; then
    fnm use "$NODE_VERSION"
    echo_success "Node.js v$NODE_VERSION installed and activated."
  else
    echo_warn "Failed to install Node.js v$NODE_VERSION using fnm."
    exit 1
  fi
else
  echo_success "Node.js v$NODE_VERSION is already installed and active."
fi

# 3. Yarn (via Corepack)
echo_step "Setting up Yarn..."
if command_exists corepack; then
  corepack enable
  echo_success "Corepack enabled for Yarn."
else
  echo_warn "Corepack command not found. It's usually included with Node.js >= 16.10. Please ensure Node.js is correctly installed."
  exit 1
fi

# 4. Bun
echo_step "Setting up Bun..."
if ! command_exists bun; then
  echo_info "Bun not found. Installing..."
  if curl -fsSL https://bun.sh/install | bash; then
    # Add bun to PATH for the current script execution
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    echo_success "Bun installed. You might need to restart your shell for it to be available globally."
  else
    echo_warn "Failed to install Bun automatically. Please install it manually: https://bun.sh/docs/installation"
    exit 1
  fi
else
  echo_success "Bun found."
fi

# 5. Foundry
echo_step "Setting up Foundry..."
FOUNDRYUP_PATH="$HOME/.foundry/bin/foundryup"
if [ ! -f "$FOUNDRYUP_PATH" ] && ! command_exists foundryup; then
    echo_info "Foundry/foundryup not found. Installing..."
    if curl -L https://foundry.paradigm.xyz | bash; then
        echo_success "Foundry downloaded. Running foundryup..."
        # Add foundry to PATH for the current script execution
        export PATH="$HOME/.foundry/bin:$PATH"
        if foundryup; then
            echo_success "Foundry installed and updated successfully."
        else
            echo_warn "foundryup command failed after installation."
            exit 1
        fi
    else
        echo_warn "Failed to download Foundry installer."
        exit 1
    fi
else
    echo_info "Foundryup found. Checking for updates..."
    if foundryup; then
        echo_success "Foundry is up-to-date."
    else
        echo_warn "foundryup command failed. Check your Foundry installation."
        exit 1
    fi
fi

# 6. Install uv (Python Packaging Tool)
echo_step "Setting up uv (Python packaging)..."
# Check if uv is installed in the default location or in PATH
# User mentioned they fixed the path, assuming it's now in standard PATH or ~/.cargo/bin
if ! command_exists uv; then
    echo_info "uv not found. Installing..."
    if curl -LsSf https://astral.sh/uv/install.sh | sh; then
        # Add uv to PATH for the current script execution if installed in default location
        export PATH="$HOME/.cargo/bin:$PATH"
        echo_success "uv installed successfully. You might need to restart your shell for it to be available globally."
    else
        echo_warn "Failed to install uv automatically. Please install it manually: https://github.com/astral-sh/uv#installation"
        exit 1
    fi
else
    echo_success "uv found."
fi

# Ensure uv is available in PATH for the next step
if ! command_exists uv; then
    echo_warn "uv command still not found after attempting installation. Please check your PATH."
    exit 1
fi

# 7. Ensure Python 3 is available (using uv if needed)
echo_step "Checking/Installing Python 3..."
if ! command_exists python3; then
  echo_info "python3 command not found. Attempting to install Python using uv..."
  if uv python install; then
    echo_success "Python installed successfully via uv."
    # It might be good to verify python3 command exists now, but uv might manage it differently.
    # We'll assume uv makes it available or handles the environment for subsequent steps.
  else
    echo_warn "Failed to install Python using 'uv python install'. Check uv documentation or install Python 3 manually."
    # Depending on strictness, you might want to exit 1 here.
    # For now, just warn, as node-gyp might find it via other means if uv sets up the env.
  fi
else
  echo_success "Python 3 found."
fi


# 8. OS-Specific Dependencies (Brewfile, etc.)
echo_step "Checking OS-specific dependencies (Brewfile, etc.)..."
OS="$(uname)"
if [ "$OS" = "Darwin" ]; then
  echo_info "Detected macOS."
  if ! command_exists brew; then
    echo_warn "Homebrew (brew) not found. Please install it: https://brew.sh/"
    echo_warn "After installing Homebrew, run 'brew bundle' in the project root to install required tools."
  else
    echo_success "Homebrew found."
    if [ -f "Brewfile" ]; then
      echo_info "Installing dependencies from Brewfile..."
      if brew bundle; then
        echo_success "Brewfile dependencies installed/updated."
      else
        echo_warn "Failed to install dependencies from Brewfile. Check brew output for errors."
      fi
    else
      echo_warn "Brewfile not found. Skipping Homebrew bundle install."
    fi
  fi
elif [ "$OS" = "Linux" ]; then
  echo_info "Detected Linux."
  echo_warn "The Brewfile contains macOS-specific dependencies (like caddy, jq)."
  echo_warn "Please ensure you have equivalent tools installed using your system's package manager (apt, yum, etc.)."
  # Add checks for specific Linux tools if needed, e.g.:
  # if ! command_exists jq; then echo_warn "jq is not installed. Please install it."; fi
  # if ! command_exists caddy; then echo_warn "caddy is not installed. Please install it."; fi
else
  echo_warn "Unsupported operating system: $OS. Manual dependency installation may be required."
fi

# --- Reminders ---

echo_step "Manual Installation Reminders"
echo_info "Please ensure you have the following installed manually:"
echo_info "1. Docker: https://docs.docker.com/get-docker/"
echo_info "2. Tilt: https://docs.tilt.dev/install.html"

# --- Next Steps ---

echo_step "Bootstrap Complete! Next Steps:"
echo_info "1. Install project dependencies: yarn install"
echo_info "2. Set up local environment: cp .env.local.template .env.local (and review variables)"
echo_info "3. Start the development environment: tilt up"

echo "----------------------------------------"
echo "✅ Setup script finished."
echo "----------------------------------------"

exit 0
