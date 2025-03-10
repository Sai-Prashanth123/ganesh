"""
Script to fix specific indentation issues in resume.py
"""

def fix_specific_issues():
    # Read the file
    with open('resume.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Fix issues
    fixed = False
    
    # Fix line 708 issue - except without a corresponding try
    if len(lines) >= 708:
        # Add a try statement at the beginning of the process_resume method
        for i in range(600, 650):
            if "def process_resume" in lines[i]:
                # Find the first line of code in the method
                start_line = i + 1
                while start_line < len(lines) and not lines[start_line].strip():
                    start_line += 1
                
                # Add try at the beginning of the method body
                if start_line < len(lines):
                    indent = lines[start_line][:len(lines[start_line]) - len(lines[start_line].lstrip())]
                    # Remove the try statement if it exists
                    if "try:" in lines[start_line]:
                        lines[start_line] = lines[start_line].replace("try:", "")
                    else:
                        # Add try and indent the next line
                        next_line = start_line + 1
                        if next_line < len(lines):
                            lines[next_line] = indent + "    " + lines[next_line].lstrip()
                    fixed = True
                    print(f"Fixed indentation at line {start_line}")
                break
    
    # Fix line 850 issue - except without a try
    if len(lines) >= 850:
        # Find the create_header_section method
        for i in range(800, 850):
            if "def create_header_section" in lines[i]:
                # Find the first line of code in the method
                start_line = i + 1
                while start_line < len(lines) and not lines[start_line].strip():
                    start_line += 1
                
                # Add try at the beginning of the method body
                if start_line < len(lines):
                    indent = lines[start_line][:len(lines[start_line]) - len(lines[start_line].lstrip())]
                    # Remove the try statement if it exists
                    if "try:" in lines[start_line]:
                        lines[start_line] = lines[start_line].replace("try:", "")
                    else:
                        # Add try and indent the next line
                        next_line = start_line + 1
                        if next_line < len(lines):
                            lines[next_line] = indent + "    " + lines[next_line].lstrip()
                    fixed = True
                    print(f"Fixed indentation at line {start_line}")
                break
    
    # Fix other try-except issues
    problematic_lines = [
        979,  # resume_to_json
        1067, # generate_tailored_resume
        1148, # process_resume_with_openai
        1394, # upload_resume
    ]
    
    for line_num in problematic_lines:
        if line_num < len(lines) and "try:" in lines[line_num]:
            # Find the next except line
            for i in range(line_num + 1, min(line_num + 50, len(lines))):
                if "except" in lines[i]:
                    # Check indentation
                    try_indent = len(lines[line_num]) - len(lines[line_num].lstrip())
                    except_indent = len(lines[i]) - len(lines[i].lstrip())
                    
                    if except_indent != try_indent:
                        # Fix the except indentation
                        lines[i] = " " * try_indent + lines[i].lstrip()
                        fixed = True
                        print(f"Fixed except indentation at line {i}")
                    break
    
    # Write back the file
    if fixed:
        with open('resume.py', 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print("Successfully fixed specific issues in resume.py")
    else:
        print("No specific issues were fixed")

if __name__ == "__main__":
    fix_specific_issues() 