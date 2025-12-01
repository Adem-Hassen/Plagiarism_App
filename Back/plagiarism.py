import fitz  # PDF extraction
import requests
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer, util
import nltk
from nltk.corpus import stopwords

nltk.download('stopwords')
stop_words = set(stopwords.words('english'))

# --- Text Extraction ---
def extract_text_from_pdf(file_path):
    text = ""
    doc = fitz.open(file_path)
    for page in doc:
        text += page.get_text()
    return text

# --- Text Preprocessing ---
def preprocess(text):
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^a-z0-9 ]', '', text)
    tokens = [w for w in text.split() if w not in stop_words]
    return ' '.join(tokens)

# --- arXiv API ---
def search_arxiv(query, max_results=5):
    url = f'http://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results={max_results}'
    response = requests.get(url)
    if response.status_code != 200:
        return []
    entries = re.findall(r'<entry>(.*?)</entry>', response.text, re.DOTALL)
    results = []
    for e in entries:
        title_match = re.search(r'<title>(.*?)</title>', e, re.DOTALL)
        link_match = re.search(r'<id>(.*?)</id>', e, re.DOTALL)
        abstract_match = re.search(r'<summary>(.*?)</summary>', e, re.DOTALL)
        if title_match and link_match and abstract_match:
            results.append({
                "title": title_match.group(1).strip(),
                "link": link_match.group(1).strip(),
                "abstract": preprocess(abstract_match.group(1))
            })
    return results

# CORE
def search_core(query, max_results=5, api_key="YOUR_CORE_API_KEY"):
    url = f'https://core.ac.uk:443/api-v2/articles/search/{query}?page=1&pageSize={max_results}&apiKey={api_key}'
    response = requests.get(url)
    if response.status_code != 200:
        return []
    data = response.json()
    results = []
    for article in data.get('data', []):
        results.append({
            "title": article.get('title', ''),
            "link": article.get('id', ''),  # CORE link may need formatting
            "abstract": preprocess(article.get('description', '') or article.get('title', ''))
        })
    return results

# PMC OA
def search_pmc(query, max_results=5):
    url = f'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term={query}&retmax={max_results}&retmode=json'
    response = requests.get(url)
    if response.status_code != 200:
        return []
    ids = response.json().get('esearchresult', {}).get('idlist', [])
    results = []
    for pmc_id in ids:
        fetch_url = f'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id={pmc_id}&retmode=text&rettype=abstract'
        r = requests.get(fetch_url)
        if r.status_code == 200:
            results.append({
                "title": f"PMC Paper {pmc_id}",
                "link": f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmc_id}/",
                "abstract": preprocess(r.text)
            })
    return results



def tfidf_similarity(text1, text2):
    vectorizer = TfidfVectorizer()
    tfidf = vectorizer.fit_transform([text1, text2])
    return cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]

# --- Sentence Embedding Similarity ---
model = SentenceTransformer('all-MiniLM-L6-v2')

def embedding_similarity(text1, text2):
    emb1 = model.encode(text1, convert_to_tensor=True)
    emb2 = model.encode(text2, convert_to_tensor=True)
    return util.cos_sim(emb1, emb2).item()

def compute_plagiarism_results(input_text, papers):
    results = []
    for paper in papers:
        combined_score = 0.4*tfidf_similarity(input_text, paper['abstract']) + \
                         0.6*embedding_similarity(input_text, paper['abstract'])
        results.append({
            "title": paper['title'],
            "link": paper['link'],
            "score": round(combined_score*100, 2)
        })
    # sort by highest score
    results = sorted(results, key=lambda x: x['score'], reverse=True)
    return results[:5]  # top 5
