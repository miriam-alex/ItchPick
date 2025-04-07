import json
import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from helpers.MySQLDatabaseHandler import MySQLDatabaseHandler
import pandas as pd
from collections import defaultdict
from collections import Counter
import numpy as np
import math
from nltk.tokenize import TreebankWordTokenizer
from scipy.sparse.linalg import svds
from sklearn.feature_extraction.text import TfidfVectorizer
import matplotlib
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import normalize

# ROOT_PATH for linking with all your files. 
# Feel free to use a config.py or settings.py with a global export variable
os.environ['ROOT_PATH'] = os.path.abspath(os.path.join("..",os.curdir))

# Get the directory of the current script
current_directory = os.path.dirname(os.path.abspath(__file__))

# Specify the path to the JSON file relative to the current script
json_file_path = os.path.join(current_directory, 'top_rated_games.json')

# Assuming your JSON data is stored in a file named 'games.json'
with open(json_file_path, 'r') as file:
    data = json.load(file)["games"]

def get_all_game_text(game):
    tags = game.get("tags")
    if tags == None:
        tags = []
    tags = " ".join(tags)
    
    recent_comments = game.get("recent_comments")
    if recent_comments == None:
        recent_comments = []
    recent_comments = " ".join(recent_comments)
    
    old_comments = game.get("oldest_comments")
    if old_comments == None:
        old_comments = []
    old_comments = " ".join(old_comments)
    
    logline = game.get("logline", "")
    if logline == None:
        logline = ""
    
    desc = game.get("description", "")
    if desc == None:
        desc = ""
    
    return (game.get("title", "") + " " + logline + " " + tags + " " + recent_comments + " " + old_comments + " " + desc).strip()

app = Flask(__name__)
CORS(app)

def closest_games_to_query(docs_compressed_normed, query_vec_in):
    sims = docs_compressed_normed.dot(query_vec_in)
    asort = np.argsort(-sims)
    return [(i, sims[i]) for i in asort]

# Sample search using json with pandas
def json_search(query):
    all_words = [get_all_game_text(game) for game in data]
    vectorizer = TfidfVectorizer(stop_words = 'english', max_df = .7, min_df = 1)
    td_matrix = vectorizer.fit_transform(all_words)
    
    docs_compressed, s, words_compressed = svds(td_matrix, k=200)
    words_compressed = words_compressed.transpose()
    
    word_to_index = vectorizer.vocabulary_
    index_to_word = {i:t for t,i in word_to_index.items()}

    words_compressed_normed = normalize(words_compressed, axis = 1)
    docs_compressed_normed = normalize(docs_compressed)

    
    query_tfidf = vectorizer.transform([query]).toarray()
    query_vec = normalize(np.dot(query_tfidf, words_compressed)).squeeze()
    
    all_docs = closest_games_to_query(docs_compressed_normed, query_vec)
    
    results = [
        {
            "title": data[i]["title"],
            "description": data[i].get("logline") if data[i].get("logline") != None else "No description available",
            "rating": f'{data[i]["rating"]["aggregate_rating"]} ({data[i]["rating"]["rating_count"]} reviews)',
            "score": round(sim, 4)
        }
        for i, sim in all_docs
    ]
    return jsonify(results)

@app.route('/')
def home():
    return render_template('base.html', title="Top Rated Games")

@app.route('/episodes')
def get_games():
    text = request.args.get("title")
    return json_search(text)


if 'DB_NAME' not in os.environ:
    app.run(debug=True,host="0.0.0.0",port=5001)