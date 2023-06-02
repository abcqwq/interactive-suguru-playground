@echo off
set CSS_DIR=./solver/static/css/
tailwindcss -i base.css -o %CSS_DIR%style.css --minify