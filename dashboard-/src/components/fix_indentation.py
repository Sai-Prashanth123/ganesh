"""
Script to fix indentation issues in Python files.
This script will attempt to automatically fix common indentation errors.
"""

import re
import sys

def fix_indentation(file_path):
    """Attempt to fix indentation issues in a Python file"""
    print(f"Fixing indentation in {file_path}")
    
    # Read the file content
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split into lines
    lines = content.split('\n')
    fixed_lines = []
    
    # Track indentation levels
    indent_stack = [0]  # Start with 0 indentation
    in_try_block = False
    try_indent = 0
    
    for i, line in enumerate(lines):
        line_num = i + 1
        
        # Skip empty lines
        if not line.strip():
            fixed_lines.append(line)
            continue
        
        # Get current indentation
        current_indent = len(line) - len(line.lstrip())
        
        # Check for obvious indentation issues
        if re.match(r'^\s*def\s+', line) and not line.endswith(':'):
            # Function definition without colon
            line = line.rstrip() + ':'
            print(f"Fixed missing colon at line {line_num}")
        
        # Fix try statement indentation
        if re.match(r'^\s*try\s*:', line):
            in_try_block = True
            try_indent = current_indent
        elif in_try_block and re.match(r'^\s*except\s+', line):
            # Make except match try indentation
            stripped = line.lstrip()
            line = ' ' * try_indent + stripped
            print(f"Fixed except indentation at line {line_num}")
        
        # Fix return statement indentation
        if re.search(r'^\s+return\s+', line) and current_indent > indent_stack[-1]:
            # Return statement indented more than function
            stripped = line.lstrip()
            line = ' ' * indent_stack[-1] + stripped
            print(f"Fixed return indentation at line {line_num}")
        
        # Fix common indentation errors after blocks
        if any(re.match(rf'^\s{{{indent_stack[-1] + 4}}}\S', line) for delim in ['if', 'for', 'else', 'try', 'except'] if f'{delim} ' in lines[i-1] or f'{delim}:' in lines[i-1]):
            # This line should be indented one level more than the previous block
            level = indent_stack[-1] + 4
            if current_indent != level:
                stripped = line.lstrip()
                line = ' ' * level + stripped
                print(f"Fixed block indentation at line {line_num}")
        
        # Update indentation stack
        if line.rstrip().endswith(':'):
            indent_stack.append(current_indent + 4)
        elif current_indent < indent_stack[-1] and not line.strip().startswith(('else:', 'elif ', 'except ', 'finally:')):
            # We've dedented, pop the stack until we find the matching indent
            while indent_stack and current_indent < indent_stack[-1]:
                indent_stack.pop()
            if not indent_stack:
                indent_stack = [0]  # Safety check
        
        fixed_lines.append(line)
    
    # Write the fixed content back to the file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(fixed_lines))
    
    print(f"Finished fixing indentation in {file_path}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python fix_indentation.py <python_file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    fix_indentation(file_path) 