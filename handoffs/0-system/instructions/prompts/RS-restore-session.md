# Session Restoration Guide

Use this prompt when returning to a project after breaks or context resets to efficiently restore project context.

## Workflow-Guided Prompt

```
I need to restore context for this project. Please follow the session restoration workflow.
```

## Standard Prompt Template

```
I need to restore context for this project. Please:

1. Follow the session restoration workflow to:
   - Scan the project directory for handoffs
   - Check if handoffs exist in the root directory
   - Read milestone summaries in sequential order
   - Read handoff documents if they exist
   - Process conversation extracts if available
   - Summarize the current project state
```

## Enhanced Restoration Workflow

```
Before we begin, please:

1. Examine the handoffs/ directory structure
2. Check if handoff documents exist in the root directory

If handoff documents exist in the root directory:
   
   A. First review all milestone directories in numerical order
      - Read ONLY the 0-prefixed documents in each milestone directory
      - Skip any numbered documents within milestone directories
   
   B. Then read ALL handoff documents in the root directory in numerical order
      - Pay special attention to the most recent handoff for current state

If NO handoff documents exist in the root directory:
   
   - Review all milestone directories in numerical order
   - Read ONLY the 0-prefixed documents in each milestone directory
   - Skip any numbered documents within milestone directories

After reading, please verify your understanding by:
1. Listing all milestone directories in numerical order
2. Listing all handoff documents you've read (if any)
3. Summarizing the current project state and next steps
```

## Project-Specific Customization

Add additional project-specific files to read:

```
Additionally, please read these key project files:
- README.md for project overview
- .clinerules for workspace specific guidance
- [specific file paths relevant to your current work]
- [configuration files needed for context]
```

## Advanced Verification

For more comprehensive verification:

```
Please verify your understanding more deeply by:
1. Listing major features completed across all milestones
2. Identifying recurring patterns or lessons from milestone documents
3. Summarizing the most important open issues from handoff documents
4. Explaining the overall project architecture as you understand it
```

## Session Focus

To guide the session toward specific goals:

```
After restoring context, please focus on:
- [specific feature or component to work on]
- [particular problem that needs solving]
- [next steps in the project roadmap]
```

## Conversation Extract Integration

To incorporate conversation extract insights:

```
I need to restore context for this project with conversation history insights. Please:

1. Follow the session restoration workflow
2. After reading handoffs and milestones, also review the extracted_conversation.md file
3. Incorporate insights from the conversation history into your understanding
4. Identify any recent decisions or discoveries from the conversation that might affect current work
```

## Context Loading Optimization

For efficient token usage, the handoff-manager prioritizes information as follows:

| Context Type | Loading Strategy |
|--------------|------------------|
| Older Milestones | Summary documents only |
| Recent Milestones | Full details from summary docs |
| Handoffs in Root | All details (complete read) |
| Latest Handoff | Maximum attention (primary context) |
| Conversation Extract | Process if available (optional) |