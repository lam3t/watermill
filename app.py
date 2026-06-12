import os
import re
import streamlit as st
import streamlit.components.v1 as components

# Set up page configurations for the standalone simulation
st.set_page_config(
    page_title="Watermill Express - Kiosk Simulator",
    page_icon="💧",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom injection to maximize the iframe workspace area
st.markdown("""
    <style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {
        padding-top: 1rem !important;
        padding-bottom: 1rem !important;
        padding-left: 2rem !important;
        padding-right: 2rem !important;
    }
    iframe {
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    </style>
""", unsafe_allow_html=True)

# Load resources dynamically from the current folder
current_dir = os.path.dirname(os.path.abspath(__file__))
html_path = os.path.join(current_dir, "index.html")
css_path = os.path.join(current_dir, "styles.css")
js_path = os.path.join(current_dir, "app.js")

if os.path.exists(html_path) and os.path.exists(css_path) and os.path.exists(js_path):
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()
    with open(js_path, "r", encoding="utf-8") as f:
        js_content = f.read()

    # Bundle style rules and script behaviors directly into HTML
    html_content = re.sub(r'<link rel="stylesheet" href="styles\.css">', f'<style>{css_content}</style>', html_content)
    html_content = re.sub(r'<script src="app\.js"></script>', f'<script>{js_content}</script>', html_content)

    # Render standalone simulator component
    components.html(html_content, height=880, scrolling=True)
else:
    st.error("Required simulator source files (index.html, styles.css, app.js) are missing from the app path.")
