import os
import argparse
import urllib.parse
import sys

def generate_tree_lines(start_path, prefix=''):
    """
    Generates a list of tuples with tree data: (prefix, item, is_directory, full_path)
    """
    tree_lines = []
    contents = sorted(os.listdir(start_path))
    
    for i, item in enumerate(contents):
        path = os.path.join(start_path, item)
        is_last = (i == len(contents) - 1)
        is_dir = os.path.isdir(path)
        
        if is_last:
            line_prefix = f"{prefix}└── "
            new_prefix = f"{prefix}    "
        else:
            line_prefix = f"{prefix}├── "
            new_prefix = f"{prefix}│   "
            
        tree_lines.append((line_prefix, item, is_dir, path))
            
        if is_dir:
            sub_tree = generate_tree_lines(path, new_prefix)
            tree_lines.extend(sub_tree)
            
    return tree_lines

def main():
    """
    Main function to parse command-line arguments and run the script.
    """
    script_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    
    parser = argparse.ArgumentParser(
        description="Generate a linked Markdown directory tree.",
        epilog="""
Usage Examples:

    # Scan the directory where the script is located
    python dir_tree_to_md.py

    # Scan a specific directory and save to a custom file
    python dir_tree_to_md.py "C:\path\to\target" --output my_tree.md

    # Scan with a custom title and output file
    python dir_tree_to_md.py . --title "Project Docs" --output README.md
"""
    )
    
    parser.add_argument('directory', nargs='?', default=script_dir,
                        help="The path to the directory to be scanned. Defaults to the script's directory.")
    parser.add_argument('--output', type=str, default='README.md',
                        help="The name of the output Markdown file.")
    parser.add_argument('--title', type=str, default="Überschrift",
                        help="The main title for the Markdown file.")
    
    args = parser.parse_args()
    
    target_dir = os.path.abspath(args.directory)
    output_file = args.output
    main_title = args.title
    
    # Get the directory of the output file for relative path calculation
    output_dir = os.path.dirname(os.path.abspath(output_file))
    
    if not os.path.isdir(target_dir):
        print(f"Error: The directory '{target_dir}' does not exist.")
        return
    
    print(f"Generating directory tree for '{target_dir}'...")
    
    tree_data = generate_tree_lines(target_dir)
    base_dir_name = os.path.basename(target_dir)
    
    linked_tree_lines = []
    
    # Process the top-level directory separately
    linked_tree_lines.append(base_dir_name)
    
    # Process the rest of the tree data to generate lines with correct relative links
    for line_prefix, item, is_dir, full_path in tree_data:
        display_name = item
        
        # Only create links for files, not directories
        if not is_dir:
            # The key fix: Calculate the relative path from the output file's directory
            # to the target file's directory, and then join with the item name.
            rel_path_to_link = os.path.relpath(full_path, output_dir)
            encoded_path = urllib.parse.quote(rel_path_to_link.replace("\\", "/"))
            display_name = f"[{item}]({encoded_path})"
        
        linked_tree_lines.append(f"{line_prefix}{display_name}")
    
    md_content = f"# {main_title}\n\n"
    md_content += f"## Directory Tree for {base_dir_name}\n\n"
    md_content += "```\n"
    md_content += "\n".join(linked_tree_lines)
    md_content += "\n```\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
        
    print(f"Successfully saved the tree to '{output_file}'.")

if __name__ == "__main__":
    main()