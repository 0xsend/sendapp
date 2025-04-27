#!/usr/bin/env python3
"""
extract_conversation_simple.py

Extracts the core conversation (user prompts and LLM responses) from Cline task files,
removing file contents, tool results, and other non-essential elements.

Optimized for Roo-Code's export format:
- Handles "**User:**" and "**Assistant:**" headers with messages separated by "---"
- Removes [Tool Use], [Tool], [Tool (Error)], and [Image] references
- Preserves thinking sections and essential conversation flow
- Removes file contents that might cause bias in future LLM interactions

Usage:
    python extract_conversation_simple.py input_file [output_file]

If output_file is not specified, a file with "_clean" suffix will be created.
"""

import re
import sys
import os
from pathlib import Path
from typing import List, Tuple

# Regular expression patterns for content identification
PATTERNS = {
    # Environment details and structural content
    "environment_details": re.compile(r'<environment_details>.*?</environment_details>', re.DOTALL),
    "task_tag": re.compile(r'<task>(.*?)</task>', re.DOTALL),
    "feedback_tag": re.compile(r'<feedback>(.*?)</feedback>', re.DOTALL),
    "user_message_tag": re.compile(r'<user_message>(.*?)</user_message>', re.DOTALL),
    "answer_tag": re.compile(r'<answer>(.*?)</answer>', re.DOTALL),
    
    # File content and results to remove
    "file_content_tag": re.compile(r'<file_content path=".*?">.*?</file_content>', re.DOTALL),
    "tool_result": re.compile(r'\[[^\]]+\] Result:.*?(?=\n\n|\Z)', re.DOTALL),
    
    # Roo-Code specific export patterns
    "roo_tool_use": re.compile(r'\[Tool Use: .*?\].*?(?=\n\n|\Z)', re.DOTALL),
    "roo_tool_result": re.compile(r'\[Tool(?:\s\(Error\))?\]\n.*?(?=\n\n|\Z)', re.DOTALL),
    "roo_image_reference": re.compile(r'\[Image\]', re.DOTALL),
    
    # More aggressively remove code blocks and file outputs
    "file_output_blocks": re.compile(r'```(?:\w+)?\n.*?```', re.DOTALL),  # Any code block
    "file_listing": re.compile(r'(?:Directory\s+)?(?:File|Listing)[^\n]*?\n(?:-+\n)?(?:(?:\s*[-\w./\\]+\s*\n)+)', re.DOTALL),  # File listings
    "file_path_references": re.compile(r'(?:in|from|at|path:|file:)\s+["\'`][\/\\]?[\w\-\/\\\.]+["\'`]', re.DOTALL),
    
    # Assistant thinking and tool use
    "thinking": re.compile(r'<thinking>(.*?)</thinking>', re.DOTALL),
    "attempt_completion": re.compile(r'<attempt_completion>.*?<result>(.*?)</result>.*?</attempt_completion>', re.DOTALL),
    
    # Remove tool uses but keep some info
    "tool_use_patterns": {
        # Tool uses to completely remove
        "write_to_file": re.compile(r'<write_to_file>.*?</write_to_file>', re.DOTALL),
        "apply_diff": re.compile(r'<apply_diff>.*?</apply_diff>', re.DOTALL),
        "execute_command": re.compile(r'<execute_command>.*?</execute_command>', re.DOTALL),
        "browser_action": re.compile(r'<browser_action>.*?</browser_action>', re.DOTALL),
        "switch_mode": re.compile(r'<switch_mode>.*?</switch_mode>', re.DOTALL),
        "use_mcp_tool": re.compile(r'<use_mcp_tool>.*?</use_mcp_tool>', re.DOTALL),
        "access_mcp_resource": re.compile(r'<access_mcp_resource>.*?</access_mcp_resource>', re.DOTALL),
        "insert_content": re.compile(r'<insert_content>.*?</insert_content>\s*', re.DOTALL),
        "search_and_replace": re.compile(r'<search_and_replace>.*?</search_and_replace>\s*', re.DOTALL),
        
        # Tool uses to keep the question
        "ask_followup_question": re.compile(r'<ask_followup_question>\s*<question>(.*?)</question>.*?</ask_followup_question>', re.DOTALL),
        
        # Tool uses to remove completely
        "read_file": re.compile(r'<read_file>.*?</read_file>\s*', re.DOTALL),
        "list_files": re.compile(r'<list_files>.*?</list_files>\s*', re.DOTALL),
        "search_files": re.compile(r'<search_files>.*?</search_files>\s*', re.DOTALL),
        "list_code_definition_names": re.compile(r'<list_code_definition_names>.*?</list_code_definition_names>\s*', re.DOTALL),
    },
    
    # Code formatting
    "line_numbers": re.compile(r'^\s*\d+ \|', re.MULTILINE),
    
    # Duplicated responses
    "system_error_messages": re.compile(r'\[ERROR\].*?ensure proper parsing and execution.*?Next Steps', re.DOTALL),
}


def extract_conversation(file_path: str) -> List[Tuple[str, str]]:
    """Extract the conversation from a Cline task file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern optimized for Roo-Code's export format
    # Format: "**User:**" or "**Assistant:**" followed by content and separated by "---"
    pattern = r'\*\*(User|Assistant):\*\*\n\n(.*?)(?=\n---\n\n\*\*(?:User|Assistant):\*\*|\Z)'
    
    conversation = []
    for match in re.finditer(pattern, content, re.DOTALL):
        speaker = match.group(1)
        message = match.group(2)
        
        # Clean the message based on speaker type
        if speaker == 'User':
            clean_message = clean_user_message(message)
        else:
            clean_message = clean_assistant_message(message)
        
        # Verify we have content after cleaning
        if clean_message.strip():
            conversation.append((speaker, clean_message))
    
    return conversation


def clean_user_message(message: str) -> str:
    """Clean a user message by removing file content and keeping essential parts."""
    # Remove environment details
    message = PATTERNS["environment_details"].sub('', message)
    
    # Remove tool result sections
    message = PATTERNS["tool_result"].sub('', message)
    
    # Remove file content blocks
    message = PATTERNS["file_content_tag"].sub('', message)
    
    # Remove Roo-Code specific patterns
    message = PATTERNS["roo_tool_use"].sub('', message)
    message = PATTERNS["roo_tool_result"].sub('', message)
    message = PATTERNS["roo_image_reference"].sub('', message)
    
    # Preserve content but remove tags
    message = PATTERNS["task_tag"].sub(r'\1', message)
    message = PATTERNS["feedback_tag"].sub(r'\1', message)
    message = PATTERNS["user_message_tag"].sub(r'\1', message)
    message = PATTERNS["answer_tag"].sub(r'\1', message)
    
    # Remove line numbers in code blocks
    message = PATTERNS["line_numbers"].sub('', message)
    
    # Remove system error messages
    message = PATTERNS["system_error_messages"].sub('', message)
    
    # Remove file output blocks
    message = PATTERNS["file_output_blocks"].sub('', message)
    
    # Remove file path references
    message = PATTERNS["file_path_references"].sub('', message)
    
    # Clean up whitespace
    message = re.sub(r'\n{3,}', '\n\n', message)
    message = re.sub(r'[ \t]+\n', '\n', message)
    message = re.sub(r'\n+[ \t]+\n+', '\n\n', message)
    
    return message.strip()


def clean_assistant_message(message: str) -> str:
    """Clean an assistant message by removing tool usage and keeping thought process."""
    # Process thinking sections without removing them
    def clean_thinking_section(match_obj):
        section = match_obj.group(1)  # Extract content inside thinking tags
        # Clean the thinking section content
        cleaned_thinking = re.sub(PATTERNS["file_content_tag"], '', section)
        cleaned_thinking = re.sub(PATTERNS["file_output_blocks"], '', cleaned_thinking)
        cleaned_thinking = re.sub(PATTERNS["file_path_references"], '', cleaned_thinking)
        return f"<thinking>{cleaned_thinking}</thinking>"
    
    # Apply the cleaning function to all thinking sections
    message = PATTERNS["thinking"].sub(clean_thinking_section, message)
    
    # Extract result content from attempt_completion
    message = PATTERNS["attempt_completion"].sub(r'\1', message)
    
    # Remove tool uses
    for tool_name, pattern in PATTERNS["tool_use_patterns"].items():
        if tool_name == "ask_followup_question":
            # Keep just the question for this tool
            message = pattern.sub(r'\1', message)
        else:
            # Remove other tool uses completely
            message = pattern.sub('', message)
    
    # Remove Roo-Code specific patterns
    message = PATTERNS["roo_tool_use"].sub('', message)
    message = PATTERNS["roo_tool_result"].sub('', message)
    message = PATTERNS["roo_image_reference"].sub('', message)
    
    # Remove file content blocks
    message = PATTERNS["file_content_tag"].sub('', message)
    
    # Remove line numbers in code blocks
    message = PATTERNS["line_numbers"].sub('', message)
    
    # Remove system error messages
    message = PATTERNS["system_error_messages"].sub('', message)
    
    # Remove file output blocks
    message = PATTERNS["file_output_blocks"].sub('', message)
    
    # Remove file path references
    message = PATTERNS["file_path_references"].sub('', message)
    
    # Clean up whitespace
    message = re.sub(r'\n{3,}', '\n\n', message)
    message = re.sub(r'[ \t]+\n', '\n', message)
    message = re.sub(r'\n+[ \t]+\n+', '\n\n', message)
    
    return message.strip()


def remove_duplicates(content: str) -> str:
    """Remove duplicate paragraphs and sections in content."""
    # Split by paragraph
    paragraphs = re.split(r'\n\n+', content)
    
    # Use a set to track seen paragraphs
    seen = set()
    unique_paragraphs = []
    
    for paragraph in paragraphs:
        # Skip very short paragraphs or empty ones
        if len(paragraph.strip()) < 10:
            unique_paragraphs.append(paragraph)
            continue
            
        # Create a simplified version for comparison (lowercase, no spaces)
        simplified = re.sub(r'\s+', '', paragraph.lower())
        
        # Check if we've seen something very similar
        if simplified not in seen:
            seen.add(simplified)
            unique_paragraphs.append(paragraph)
    
    return '\n\n'.join(unique_paragraphs)


def save_clean_conversation(conversation: List[Tuple[str, str]], output_file: str, input_file: str):
    """Save the cleaned conversation to a file."""
    with open(output_file, 'w', encoding='utf-8') as f:
        for i, (speaker, message) in enumerate(conversation):
            if i > 0:
                f.write("\n---\n\n")
            f.write(f"**{speaker}:**\n\n{message}")
    
    # Count tokens in original and cleaned files
    original_size = os.path.getsize(input_file)
    cleaned_size = os.path.getsize(output_file)
    reduction = ((original_size - cleaned_size) / original_size) * 100
    
    return {
        "original_size_bytes": original_size,
        "cleaned_size_bytes": cleaned_size,
        "reduction_percentage": round(reduction, 2)
    }


def main():
    """Main function to parse arguments and run the script."""
    if len(sys.argv) < 2:
        print("Usage: python extract_conversation_simple.py input_file [output_file]")
        return
    
    input_file = sys.argv[1]
    
    # Generate default output filename if not specified
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]
    else:
        input_path = Path(input_file)
        output_file = str(input_path.with_name(f"{input_path.stem}_clean{input_path.suffix}"))
    
    # Extract and clean conversation
    conversation = extract_conversation(input_file)
    
    # Apply duplicate removal to each message
    cleaned_conversation = []
    for speaker, message in conversation:
        cleaned_message = remove_duplicates(message)
        cleaned_conversation.append((speaker, cleaned_message))
    
    # Save cleaned conversation
    metrics = save_clean_conversation(cleaned_conversation, output_file, input_file)
    
    print(f"Cleaned conversation with {len(cleaned_conversation)} messages saved to {output_file}")
    print(f"Size reduction: {metrics['original_size_bytes']:,} bytes → {metrics['cleaned_size_bytes']:,} bytes ({metrics['reduction_percentage']}%)")


if __name__ == "__main__":
    main()