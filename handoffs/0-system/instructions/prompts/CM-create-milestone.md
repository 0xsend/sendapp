# Creating a Milestone

Use this prompt when you need to create a new milestone to consolidate accumulated handoffs.

## Workflow-Guided Prompt

```
I need to create a milestone for our completed [FEATURE/COMPONENT]. Please follow the milestone creation workflow.
```

## Standard Prompt Template

```
I need to create a milestone for our completed [FEATURE/COMPONENT]. Please:

1. Follow the milestone creation workflow to:
   - Check if handoffs exist in the root directory
   - Verify enough handoffs have accumulated (3-5)
   - Ensure a recent final handoff exists
   - Calculate the next milestone number
   - Create the milestone directory structure
   - Move handoff files to the milestone directory
   - Generate summary documents
```

## Enhanced Context

For more targeted milestone creation:

```
I need to create a milestone for our completed [FEATURE/COMPONENT]. Please:

1. Follow the milestone creation workflow
2. Focus these aspects in the milestone summary:
   - [KEY ACHIEVEMENT 1]
   - [KEY ACHIEVEMENT 2]
   - [KEY DECISION POINT 1]
3. Organize the handoffs with particular attention to:
   - [SPECIFIC PATTERN OR THEME]
```

## Script Assistance

For help with file organization:

```
I need to create a milestone and move files. Please:

1. Follow the milestone creation workflow
2. Suggest the appropriate script from 3-milestone-scripts.md
3. Adapt the script for our [BASH/POWERSHELL/PYTHON/NODE] environment
```

## Milestone Numbering Logic

The handoff-manager uses a reliable numbering algorithm:

1. List all directories in the handoffs/ directory
2. Filter to include only directories matching `[0-9]+-*`
3. Extract the numeric prefix from each directory name
4. Sort numerically by prefix
5. Select the highest number and increment
6. If no existing milestone directories, start with 1

## Critical Process Steps

1. **Pre-milestone Check**:
   - Verify handoffs exist in root directory
   - Check if 3-5 handoffs have accumulated
   - Ensure recent work is captured in final handoff

2. **Directory Creation**:
   - Use correct sequential number
   - Name directory based on milestone achievement
   - Format: `N-descriptive-name` (e.g., `2-user-authentication`)

3. **File Organization**:
   - Move all handoff files from root to milestone directory
   - Use scripts from 3-milestone-scripts.md
   - Verify successful file movement

4. **Summary Document Creation**:
   - Create `0-milestone-summary.md` with key accomplishments
   - Create `0-lessons-learned.md` with reusable patterns
   - Distill essential information from all handoffs
   
The workflow ensures a logical progression:
1. Work on feature/component → Create handoffs during development
2. Complete feature/component → Create final handoff with completion status 
3. Consolidate work → Create milestone that includes this final handoff
