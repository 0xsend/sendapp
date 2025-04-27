# Conversation History Directory

## ⚠️ IMPORTANT: DO NOT DIRECTLY READ FILES FROM THIS DIRECTORY

This directory is a restricted area designed for raw conversation exports that are too large for direct LLM processing.

## How To Use (For Users)

1. **Export your conversation** from Roo-Code or other LLM tools
2. **Place the exported file** in this directory only
3. **Ask the Handoff Manager** to process it with one of these prompts:
   ```
   I saved a conversation export in the chat-history directory. Please process it.
   ```
   or
   ```
   I need to create a handoff that incorporates my conversation history.
   ```

## What Happens (Automated Process)

1. The LLM will **check this directory using shell commands** (without reading files)
2. If files are found, the LLM will **automatically run extraction scripts**
3. The scripts will **process and clean** the conversation, removing technical details
4. A **clean extract** will be created in the main handoffs directory
5. The **original file will be deleted** after successful processing
6. The LLM will then **analyze the cleaned file** and use it to create a handoff

## Important Technical Notes

- **Files in this directory CANNOT be read directly by the LLM** (by design)
- **DO NOT modify files** in this directory directly
- The LLM should **ONLY use shell commands** to detect files here
- Only the **extraction script should manipulate** these files
- The LLM has **no access to read these files** due to safety restrictions

## Safety Features

- **Access Restriction**: The LLM is prevented from reading files here via regex patterns
- **Shell Commands Only**: Only file existence checks are allowed, not content checks
- **Automated Cleanup**: Original files are deleted after successful extraction
- **Size Warning**: Large files are marked with warning indicators during processing

This safety system prevents context overflow while still enabling conversation insights to be incorporated into handoff documents.