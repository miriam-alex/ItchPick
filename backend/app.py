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
#from langdetect import detect

# ROOT_PATH for linking with all your files. 
# Feel free to use a config.py or settings.py with a global export variable
os.environ['ROOT_PATH'] = os.path.abspath(os.path.join("..",os.curdir))

# Get the directory of the current script
current_directory = os.path.dirname(os.path.abspath(__file__))

# Specify the path to the JSON file relative to the current script
json_file_path = os.path.join(current_directory, 'merged_games_data_filtered.json')

def get_valid_text(x):
    if x is not None:
        if type(x) == list:
            return " ".join(x)
        else:
            return x
    #     try:
    #         if detect(x) == "en":
    #             return x
    #     except:
    #         return ""
    return ""
            
        
# all words relating to a game form the "document" corresponding to the game
def get_all_game_text(game):
    tags = get_valid_text(game.get("tags"))
    recent_comments = get_valid_text(game.get("recent_comments"))
    old_comments = get_valid_text(game.get("oldest_comments"))
    logline = get_valid_text(game.get("logline"))
    desc = get_valid_text(game.get("description"))
    
    return (game.get("title") + " " + logline + " " + tags + " " + recent_comments + " " + old_comments + " " + desc).strip()

# Assuming your JSON data is stored in a file named 'games.json'
with open(json_file_path, 'r', encoding="utf-8") as file:
    data = json.load(file)["games"]
    all_words = [get_all_game_text(game) for game in data]
    
    vectorizer = TfidfVectorizer(stop_words = 'english', max_df = .7, min_df = 1)
    td_matrix = vectorizer.fit_transform(all_words)
    
    docs_compressed, s, words_compressed = svds(td_matrix, k=200)
    words_compressed = words_compressed.transpose()
    
    word_to_index = vectorizer.vocabulary_
    index_to_word = {i:t for t,i in word_to_index.items()}

    words_compressed_normed = normalize(words_compressed, axis = 1)
    docs_compressed_normed = normalize(docs_compressed)


app = Flask(__name__)
CORS(app)

def closest_games_to_query(docs_compressed_normed, query_vec_in):
    sims = docs_compressed_normed.dot(query_vec_in)
    asort = np.argsort(-sims)
    return [(i, sims[i]) for i in asort]

# Sample search using json with pandas
def json_search(query):
    query_tfidf = vectorizer.transform([query]).toarray()
    query_vec = normalize(np.dot(query_tfidf, words_compressed)).squeeze()
    
    all_docs = closest_games_to_query(docs_compressed_normed, query_vec)
    
    results = [
        {
            "title": data[i]["title"],
            "description": data[i].get("logline") if data[i].get("logline") != None else "No description available",
            "rating": f'{data[i]["rating"]["aggregate_rating"]} ({data[i]["rating"]["rating_count"]} reviews)',
            "tags": data[i]["tags"],
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