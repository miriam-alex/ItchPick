import json
import os
from flask import Flask, render_template, request
from flask_cors import CORS
from helpers.MySQLDatabaseHandler import MySQLDatabaseHandler
import pandas as pd
from collections import defaultdict
from collections import Counter
import numpy as np
import math
from nltk.tokenize import TreebankWordTokenizer

# ROOT_PATH for linking with all your files. 
# Feel free to use a config.py or settings.py with a global export variable
os.environ['ROOT_PATH'] = os.path.abspath(os.path.join("..",os.curdir))

# Get the directory of the current script
current_directory = os.path.dirname(os.path.abspath(__file__))

# Specify the path to the JSON file relative to the current script
json_file_path = os.path.join(current_directory, 'games.json')

# Assuming your JSON data is stored in a file named 'games.json'
with open(json_file_path, 'r') as file:
    data = json.load(file)
    titles = pd.DataFrame({"id": range(len(data)), "title": [game["Game Title"] for game in data]})
    descriptions = pd.DataFrame({"id": range(len(data)), "desc": [game["Game Description"] for game in data]})

app = Flask(__name__)
CORS(app)

def build_inverted_index(data):
    tokenizer = TreebankWordTokenizer()
    inverted_index = defaultdict(list)
    
    for row, info in data.iterrows():
        game_id = info["id"]
        game_desc = info["desc"]
        game_title = info["title"]
        words = tokenizer.tokenize(game_desc) #TODO processing for frequent words and typos?
        words += tokenizer.tokenize(game_title)
        words = [word.lower() for word in words]
        
        word_counts = Counter(words)
    
        for word, count in word_counts.items():
            inverted_index[word].append((game_id, count))
          
    return inverted_index
 
def accumulate_dot_scores(query_word_counts, index, idf):
    scores = dict()
    for q in query_word_counts:
        if q in idf:
            weight_query = query_word_counts[q] * idf[q] #tf-idf of term in query
            for doc in index[q]:
                doc_num = doc[0]
                weight_doc = doc[1] * idf[q] #tf-idx of term in doc
                if doc_num not in scores:
                    scores[doc_num] = 0
                scores[doc_num] += weight_query * weight_doc
    return scores

def compute_idf(inv_idx, n_docs, min_df=10, max_df_ratio=0.95):
    idf = dict()
    for term in inv_idx:
        df = len(inv_idx[term])
        if df < min_df or df/n_docs > max_df_ratio: #filter out less/most frequent terms
            continue
        idf[term] = math.log2(n_docs/(1+df))
    return idf

def compute_doc_norms(index, idf, n_docs):
    norms = np.zeros((n_docs,))
    for term in index:
        if term in idf:
            idf_i = idf[term]
            docs = index[term]
            for doc in docs:
                j = doc[0]
                tf_ij = doc[1]
                
                norms[j] += (tf_ij * idf_i) ** 2
    return np.sqrt(norms)

# Sample search using json with pandas
def json_search(query):
    tokenizer = TreebankWordTokenizer()
    matches = []
 
    postings = build_inverted_index(descriptions.merge(titles, on="id"))
    
    query = query.lower()
    q_tokens = tokenizer.tokenize(query) #TODO query processing for frequent words and typos?
    
    query_word_count = dict()
    for q in q_tokens:
        if q not in query_word_count:
            query_word_count[q] = 0
        query_word_count[q] += 1
    
    
    n_docs = len(titles)
    idf = compute_idf(postings, n_docs, 1, 0.99)
    doc_norms = compute_doc_norms(postings, idf, n_docs)
    cos_sim = dict()
    
    #query norm
    q_norm = 0
    for q in query_word_count:
        if q in idf:
            q_norm += (query_word_count[q] * idf[q]) ** 2
    q_norm = np.sqrt(q_norm)
    
    #calculate similarities
    scores = accumulate_dot_scores(query_word_count, postings, idf)
    
    for i in range(n_docs):
        if q_norm == 0 or doc_norms[i] == 0 or i not in scores:
            continue
        cos_sim[i] = scores[i]/(q_norm * doc_norms[i])
       
    #sort and return results 
    all_docs = sorted(cos_sim.keys(), key=cos_sim.get, reverse=True)
    results = pd.DataFrame({
        "cos_sim": [cos_sim[i] for i in all_docs],
        "id": all_docs
    })
    
    results = results.merge(titles, on="id").merge(descriptions, on="id")  
    return results.to_json(orient='records')

@app.route("/")
def home():
    return render_template('base.html',title="sample html")

@app.route("/episodes")
def episodes_search():
    text = request.args.get("title")
    return json_search(text)

if 'DB_NAME' not in os.environ:
    app.run(debug=True,host="0.0.0.0",port=5000)