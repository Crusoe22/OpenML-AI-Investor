# OpenML-AI-Investor

# run LocalHost with:
    py -m http.server 5500

# then search 
    http://localhost:5500/frontend


# Activate python virtual environment
    
    py -m venv .venv
    .venv\Scripts\Activate
    py -m pip install -r requirements.txt


# Run pyhton on server
    cd C:\Users\nolan\Documents\OpenMLAIinvestor\OpenML-AI-Investor\Backend
    (.venv) PS C:\Users\nolan\Documents\OpenMLAIinvestor\OpenML-AI-Investor\Backend> uvicorn main:app --reload

    check on: 
    http://localhost:8000/docs