from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from plagiarism import extract_text_from_pdf, preprocess, search_arxiv, search_core, search_pmc, compute_plagiarism_results

app = FastAPI()

# Allow React frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your frontend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/check-plagiarism/")
async def check_plagiarism(file: UploadFile = File(...)):
    contents = await file.read()
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(contents)

    text = preprocess(extract_text_from_pdf(temp_path))
    query = '+'.join(text.split()[:10])

    papers = []
    papers += search_arxiv(query)
    papers += search_core(query)
    papers += search_pmc(query)

    top_results = compute_plagiarism_results(text, papers)

    # Overall max score
    overall_score = top_results[0]['score'] if top_results else 0

    return {"overall_score": overall_score, "similar_papers": top_results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
