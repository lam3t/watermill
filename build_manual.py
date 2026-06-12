import os
import re
import base64

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Watermill Express Kiosk Simulator - User Manual</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Space+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --color-bg: #0f172a;
            --color-container: #1e293b;
            --color-primary-blue: #0176b5;
            --color-primary-green: #00a859;
            --color-accent-cyan: #00d2ff;
            --color-text-white: #ffffff;
            --color-text-sub: #94a3b8;
            --font-primary: 'Outfit', sans-serif;
            --font-heading: 'Space Grotesk', sans-serif;
        }

        body {
            background-color: var(--color-bg);
            color: #cbd5e1;
            font-family: var(--font-primary);
            line-height: 1.6;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            justify-content: center;
        }

        .container {
            width: 100%;
            max-width: 900px;
            background: var(--color-container);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        }

        h1, h2, h3 {
            font-family: var(--font-heading);
            color: var(--color-text-white);
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 700;
        }

        h1 {
            font-size: 32px;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 15px;
            margin-top: 0;
            color: var(--color-accent-cyan);
            text-align: center;
        }

        h2 {
            font-size: 22px;
            color: var(--color-primary-green);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            padding-bottom: 8px;
        }

        h3 {
            font-size: 18px;
            color: var(--color-accent-cyan);
        }

        p {
            margin: 15px 0;
            font-size: 15px;
        }

        ul {
            padding-left: 20px;
            margin: 15px 0;
        }

        li {
            margin-bottom: 8px;
            font-size: 14.5px;
        }

        hr {
            border: 0;
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
            margin: 30px 0;
        }

        code {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            padding: 2px 6px;
            font-family: monospace;
            font-size: 13.5px;
            color: #38bdf8;
        }

        .manual-pre {
            background: #0f172a;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 20px;
            overflow-x: auto;
            margin: 20px 0;
            box-shadow: inset 0 2px 8px rgba(0,0,0,0.6);
        }

        .manual-pre code {
            background: transparent;
            border: none;
            padding: 0;
            color: #e2e8f0;
            font-size: 13px;
            line-height: 1.5;
            font-family: monospace;
        }

        .img-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 25px 0;
            gap: 10px;
        }

        .manual-img {
            max-width: 100%;
            height: auto;
            border: 3px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
            transition: transform 0.3s ease;
        }

        .manual-img:hover {
            transform: scale(1.02);
            border-color: var(--color-accent-cyan);
        }

        .img-caption {
            font-size: 12px;
            color: var(--color-text-sub);
            font-style: italic;
        }

        .manual-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            overflow: hidden;
        }

        .manual-table th, .manual-table td {
            padding: 12px 15px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .manual-table th {
            background-color: rgba(255, 255, 255, 0.05);
            color: var(--color-accent-cyan);
            font-weight: 600;
            font-size: 14px;
        }

        .manual-table td {
            font-size: 13.5px;
        }

        /* Highlight classes */
        strong {
            color: var(--color-text-white);
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        {{CONTENT}}
    </div>
</body>
</html>
"""

def get_base64_img(img_path):
    if not os.path.exists(img_path):
        print(f"Warning: Image path not found: {img_path}")
        return ""
    with open(img_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return f"data:image/png;base64,{encoded_string}"

def convert_markdown_to_html(md_path):
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Convert code blocks
    code_blocks = re.findall(r'```(.*?)```', md_text, re.DOTALL)
    for i, block in enumerate(code_blocks):
        md_text = md_text.replace(f"```{block}```", f"___CODE_BLOCK_{i}___")

    # Convert inline code
    md_text = re.sub(r'`([^`]+)`', r'<code>\1</code>', md_text)

    # Convert bold & em
    md_text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', md_text)
    md_text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', md_text)

    # Convert headings
    md_text = re.sub(r'^#\s+(.+)$', r'<h1>\1</h1>', md_text, flags=re.MULTILINE)
    md_text = re.sub(r'^##\s+(.+)$', r'<h2>\1</h2>', md_text, flags=re.MULTILINE)
    md_text = re.sub(r'^###\s+(.+)$', r'<h3>\1</h3>', md_text, flags=re.MULTILINE)

    # Convert horizontal rules
    md_text = re.sub(r'^---$', r'<hr>', md_text, flags=re.MULTILINE)

    # Convert list items
    lines = md_text.split('\n')
    in_list = False
    for idx, line in enumerate(lines):
        if line.strip().startswith('- '):
            item = line.strip()[2:]
            if not in_list:
                lines[idx] = '<ul>\n<li>' + item + '</li>'
                in_list = True
            else:
                lines[idx] = '<li>' + item + '</li>'
        else:
            if in_list:
                lines[idx] = '</ul>\n' + line
                in_list = False
    md_text = '\n'.join(lines)

    # Convert tables
    table_pattern = re.compile(r'(\|.*?\|\n\|[-:| ]+\|\n(?:\|.*?\|\n?)+)')
    def table_replace(match):
        table_content = match.group(1)
        table_lines = [l.strip() for l in table_content.strip().split('\n') if l.strip()]
        html = '<table class="manual-table">\n'
        headers = [h.strip() for h in table_lines[0].split('|')[1:-1]]
        html += '  <thead>\n    <tr>\n'
        for h in headers:
            html += f'      <th>{h}</th>\n'
        html += '    </tr>\n  </thead>\n  <tbody>\n'
        for row_line in table_lines[2:]:
            cells = [c.strip() for c in row_line.split('|')[1:-1]]
            html += '    <tr>\n'
            for c in cells:
                html += f'      <td>{c}</td>\n'
            html += '    </tr>\n'
        html += '  </tbody>\n</table>'
        return html

    md_text = table_pattern.sub(table_replace, md_text)

    # Convert images to base64
    img_pattern = re.compile(r'!\[(.*?)\]\((.*?)\)')
    def img_replace(match):
        alt = match.group(1)
        path = match.group(2)
        base64_data = get_base64_img(path)
        if base64_data:
            return f'<div class="img-container"><img class="manual-img" src="{base64_data}" alt="{alt}" /><span class="img-caption">{alt}</span></div>'
        return f'[Image: {alt} ({path})]'

    md_text = img_pattern.sub(img_replace, md_text)

    # Convert paragraphs
    paragraphs = []
    for block in md_text.split('\n\n'):
        block = block.strip()
        if not block:
            continue
        if block.startswith('<h') or block.startswith('<hr') or block.startswith('<ul') or block.startswith('<table') or block.startswith('<div') or block.startswith('___CODE_BLOCK'):
            paragraphs.append(block)
        else:
            block = block.replace('\n', '<br>')
            paragraphs.append(f'<p>{block}</p>')
    md_text = '\n\n'.join(paragraphs)

    # Re-insert code blocks
    for i, block in enumerate(code_blocks):
        clean_block = block.strip()
        # Escaping html inside code block
        clean_block = clean_block.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        formatted_block = f'<pre class="manual-pre"><code>{clean_block}</code></pre>'
        md_text = md_text.replace(f"___CODE_BLOCK_{i}___", formatted_block)

    return md_text

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(base_dir, "UserManual.md")
    html_path = os.path.join(base_dir, "UserManual.html")

    print(f"Reading user manual from: {md_path}")
    body_content = convert_markdown_to_html(md_path)
    
    final_html = TEMPLATE.replace("{{CONTENT}}", body_content)
    
    print(f"Writing self-contained HTML manual to: {html_path}")
    with open(html_path, "w", encoding="utf-8") as f:
        f.read = f.write(final_html)
        
    print("UserManual.html successfully generated!")

if __name__ == "__main__":
    main()
