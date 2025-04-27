# Handoff System Scripts

This directory contains scripts to automate common tasks in the Handoff System.

## Conversation Extraction

### 1-extract-conversation.py && 1-extract-conversation.js 

Processes an exported conversation file to create a clean version for handoff creation. This script combines both Python and JavaScript approaches for maximum compatibility. The  python script works slightly better. 

```bash
node extract-conversation.js <conversation_export_file> [handoffs_dir]
```

```bash
python extract-conversation.py <conversation_export_file> [handoffs_dir]
```

The script:
1. Determines the next handoff number
2. Names the output file `<N>-chat_transcript.md` (e.g., `4-chat_transcript.md`)
3. First tries the Python extraction script
4. Falls back to the JavaScript extraction script if Python fails
5. Saves the result in the handoffs directory

This ensures the conversation extract is available for the handoff manager to use when creating handoff documents.

## Milestone Scripts

These scripts automate the creation of milestone directories and the movement of handoff files:

### create-milestone.py (Python - Cross-platform)

```bash
python create-milestone.py [milestone-name]
```

### create-milestone.js (Node.js - Cross-platform)

```bash
node create-milestone.js [milestone-name]
```

Each script performs the following steps:

1. Calculates the next sequential milestone number
2. Creates a new milestone directory with the pattern `N-milestone-name`
3. Moves all handoff documents (numbered .md files) from the handoffs root directory to the milestone directory
4. Provides a reminder to create the required summary documents

## Script Selection Guide

| Environment | Preferred Script |
|-------------|-----------------|
| Linux/macOS | create-milestone-bash.sh |
| Windows PowerShell | create-milestone-powershell.ps1 |
| Python installed | create-milestone.py |
| Node.js installed | create-milestone.js |

For conversation extraction, the combined `extract-conversation.js` script is designed to work in all environments by trying Python first, then falling back to Node.js if needed.

## Usage within Handoff Manager

The Handoff Manager can execute these scripts directly. For example:

```
I need to create a milestone for our completed feature. Please run the appropriate milestone script based on my environment.
```

```
I need to extract the key insights from our conversation history at conversation.md. Please run the extract-conversation.js script.
```

The handoff manager will detect your environment and choose the most appropriate script to execute.