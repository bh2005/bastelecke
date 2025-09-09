import os
import argparse
import urllib.parse
import sys

def generate_tree_data(start_path, prefix=''):
    """
    Generates a list of tuples with tree data: (prefix, item, is_directory, relative_path)
    """
    tree_lines = []
    contents = sorted(os.listdir(start_path))
    
    for i, item in enumerate(contents):
        path = os.path.join(start_path, item)
        is_last = (i == len(contents) - 1)
        is_dir = os.path.isdir(path)
        
        rel_path = os.path.relpath(path, start_path)
        
        if is_last:
            tree_lines.append((f"{prefix}└── ", item, is_dir, rel_path))
            new_prefix = f"{prefix}    "
        else:
            tree_lines.append((f"{prefix}├── ", item, is_dir, rel_path))
            new_prefix = f"{prefix}│   "
            
        if is_dir:
            sub_tree = generate_tree_data(path, new_prefix)
            # Adjust relative paths for sub-tree
            for line in sub_tree:
                tree_lines.append(line)
            
    return tree_lines

def generate_linked_tree_string(tree_data, base_dir_name):
    """
    Generates the final Markdown-formatted tree with links.
    """
    linked_tree = []
    
    # We need to build the full relative path from the root directory
    for line_prefix, item, is_dir, rel_path in tree_data:
        if is_dir:
            linked_tree.append(f"{line_prefix}{item}")
        else:
            # Construct the final relative path correctly
            full_relative_path = os.path.join(base_dir_name, rel_path)
            encoded_path = urllib.parse.quote(full_relative_path.replace("\\", "/"))
            linked_tree.append(f"{line_prefix}[{item}]({encoded_path})")

    return linked_tree

def main():
    """
    Main function to parse command-line arguments and run the script.
    """
    script_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
    
    parser = argparse.ArgumentParser(
        description="Generate a linked Markdown directory tree.",
        epilog="""
Usage Examples:

    # Scan the current directory where the script is located
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
    
    if not os.path.isdir(target_dir):
        print(f"Error: The directory '{target_dir}' does not exist.")
        return
    
    print(f"Generating directory tree for '{target_dir}'...")
    
    tree_data = generate_tree_data(target_dir)
    base_dir_name = os.path.basename(target_dir)
    
    # Generate the linked tree, handling the top-level directory separately
    linked_tree_lines = []
    for line_prefix, item, is_dir, rel_path in tree_data:
        if is_dir:
            linked_tree_lines.append(f"{line_prefix}{item}")
        else:
            full_relative_path = os.path.join(base_dir_name, rel_path)
            encoded_path = urllib.parse.quote(full_relative_path.replace("\\", "/"))
            linked_tree_lines.append(f"{line_prefix}[{item}]({encoded_path})")
    
    md_content = f"# {main_title}\n\n"
    md_content += f"## Directory Tree for {base_dir_name}\n\n"
    md_content += "```\n"
    md_content += f"{base_dir_name}\n"
    md_content += "\n".join(linked_tree_lines)
    md_content += "\n```\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
        
    print(f"Successfully saved the tree to '{output_file}'.")

if __name__ == "__main__":
    main()