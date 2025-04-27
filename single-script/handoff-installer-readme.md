# Handoff Manager Installer

This directory contains a standalone installer script for the Handoff Manager system.

## Overview

The `handoff-manager-installer.js` is a self-contained script that installs the complete Handoff Manager system into any project directory. It includes all necessary files and configurations without requiring any external dependencies.

## What Gets Installed

When you run the installer, it will create:

- Custom mode configuration in `.roomodes`
- Handoff system rules in `.clinerules`
- System prompt for the Handoff Manager
- Directory structure for handoffs:
  - `handoffs/0-instructions/` - Documentation for the handoff system
  - `handoffs/scripts/` - Utility scripts for handoff management

## Handoff Manager Custom Mode

The installer adds a dedicated "Handoff Manager" custom mode to your Roo environment, which:

- Provides specialized capabilities for managing project handoffs and milestones
- Has permission to create and edit files in the handoffs directory
- Follows structured workflows for creating handoffs, milestones, and restoring sessions
- Can access conversation history to enhance handoff content
- Uses a comprehensive system prompt with diagrams and structured processes

## Usage

Run the installer from the command line in your project's root directory:

```bash
node handoff-manager-installer.js
```

This will install the Handoff Manager system into your current directory.

> **IMPORTANT**: The installer MUST be run from your project's root directory where your .roomodes and .clinerules files are located. The Handoff Manager is designed to work alongside your existing Roo configuration.
>
> **Project Root Requirement**: This is critical because the installer needs to find and modify your project's configuration files. Running it in any other directory will result in an incomplete installation.

### Advanced Usage

If you need to install to a specific project directory:

```bash
node handoff-manager-installer.js <project-root-directory>
```

#### Examples

Install to a specific project root:
```bash
node handoff-manager-installer.js ../my-project
```

Install to a parent project:
```bash
node handoff-manager-installer.js ..
```

> **Note**: Wherever you install, that location must be a project root with access to .roomodes and .clinerules files.

## Features

- **Existing Installation Detection**: Automatically detects and backs up any existing handoff system files
- **Configuration Merging**: Preserves your existing custom modes when adding handoff-manager mode
- **Complete System**: Contains all necessary files to get started immediately
- **Self-contained**: No external dependencies required

## After Installation

Once installed, you can:

1. Switch to handoff-manager mode in Roo-Code
2. Create your first handoff with:
   ```
   I need to create a handoff document for our current work. Please follow the handoff creation workflow.
   ```
  3. Delete the handoff-manager-installer.js. It's generally too big to be read by LLM's. If they read it on accident it will overflow the context. 

## Requirements

- **Node.js**: This installer requires Node.js to be installed on your system (any recent version)
- A project directory where you want to add handoff management capabilities

## Troubleshooting

- **File Permission Issues**: If you encounter permission errors, ensure you have write access to the target directory
- **Existing Files**: The installer will safely back up existing files, but check the backup directory if you need to recover previous versions

For more information about using the Handoff Manager itself, refer to the documentation in `handoffs/0-instructions/` after installation.