#!/usr/bin/env python3
"""
Milestone Creation Script (Python)
Creates a new milestone directory and moves handoff files
"""

import os
import re
import shutil
import sys

def create_milestone(milestone_name=None):
    """Create a milestone directory and move handoff files to it."""
    # Get the next milestone number
    milestone_dirs = [d for d in os.listdir("handoffs") 
                     if os.path.isdir(os.path.join("handoffs", d)) 
                     and re.match(r"\d+-", d)]
    
    if not milestone_dirs:
        next_num = 1  # Start with 1 if no milestone directories exist
    else:
        # Extract numbers from directory names and find the highest
        max_num = max([int(re.match(r"(\d+)-", d).group(1)) for d in milestone_dirs])
        next_num = max_num + 1
    
    # Prompt for milestone name if not provided
    if milestone_name is None:
        milestone_name = input("Enter milestone name: ")
    
    # Create milestone directory
    milestone_dir = f"handoffs/{next_num}-{milestone_name}"
    os.makedirs(milestone_dir, exist_ok=True)
    print(f"Created milestone directory: {milestone_dir}")
    
    # Move handoff files
    handoff_files = [f for f in os.listdir("handoffs") 
                     if re.match(r"[1-9]", f) and f.endswith(".md") 
                     and os.path.isfile(os.path.join("handoffs", f))]
    
    for file in handoff_files:
        src = os.path.join("handoffs", file)
        dst = os.path.join(milestone_dir, file)
        shutil.move(src, dst)
    
    print(f"Moved {len(handoff_files)} handoff files to milestone directory")
    print(f"Milestone {next_num}-{milestone_name} created successfully.")
    print("Don't forget to create 0-milestone-summary.md and 0-lessons-learned.md files in the milestone directory.")

if __name__ == "__main__":
    # Get milestone name from command line argument if provided
    if len(sys.argv) > 1:
        create_milestone(sys.argv[1])
    else:
        create_milestone()