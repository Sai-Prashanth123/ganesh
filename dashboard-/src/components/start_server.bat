@echo off
echo Starting FastAPI server...
python -m uvicorn resume:app --reload --host 0.0.0.0 --port 8000
pause 