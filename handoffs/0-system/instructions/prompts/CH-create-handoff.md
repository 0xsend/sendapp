# Creating a Handoff Document

Use this prompt when you need to create a new handoff document to capture your current progress.

## Workflow-Guided Prompt

```
I need to create a handoff document for our current work. Please follow the handoff creation workflow.
```

## Standard Prompt Template

```
I need to create a handoff document for our current work. Please:

1. Read the handoffs/0-instructions/1-handoff-instructions.md
   (The handoff directory may not be at the project root)
2. Examine the handoff directory structure to find existing handoffs
3. Determine the next sequential handoff number using the numbering logic
4. Check if a conversation extract is available to incorporate
5. Create a properly structured handoff file with the correct number
```

## Enhanced Context

For a more targeted handoff, provide specific context:

```
I need to create a handoff document for our current work. Please:

1. Follow the handoff creation workflow
2. Use today's date and focus on [SPECIFIC TOPIC]
3. Include these key points in the handoff:
   - [KEY POINT 1]
   - [KEY POINT 2]
   - [KEY POINT 3]
```

## Conversation Extract Integration

To include conversation extract analysis:

```
I need to create a handoff document incorporating insights from our conversation.

1. Follow the handoff creation workflow
2. Analyze the provided conversation extract (extracted_conversation.md)
3. Incorporate relevant insights into the handoff document
```

## Numbering Logic

The handoff-manager now uses a robust numbering algorithm:

1. List all files in the handoffs/ directory
2. Filter to only include files matching the pattern `[0-9]+-*.md`
3. Extract the numeric prefix from each filename
4. Sort numerically by prefix
5. Select the highest number and increment
6. If no existing handoffs, start with 1

This structured approach significantly improves numbering accuracy.

## Best Practices

- **Be Specific**: Include concrete details and measurable outcomes
- **Focus on Changes**: Emphasize what's different now vs. before
- **Highlight Roadblocks**: Document issues encountered and their solutions
- **Track Progress**: Note completion percentages for in-progress items
- **Reference Related Files**: Link to relevant code or documentation