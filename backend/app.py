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
json_file_path = os.path.join(current_directory, 'DATA_games.json')
ui_json_file_path = os.path.join(current_directory, 'UI_games.json')

def get_valid_text(x):
    if x is not None:
        if isinstance(x, list):
            if all(isinstance(i, (list, tuple)) and len(i) == 2 for i in x):
                return " ".join([str(comment[0]) for comment in x])
            else:
                return " ".join(map(str, x))
        else:
            return str(x)
    #     try:
    #         if detect(x) == "en":
    #             return x
    #     except:
    #         return ""
    return ""
            
        
# all words relating to a game form the "document" corresponding to the game
def get_all_game_text(game):
    weighted_text = f"{game['title']} " * 50
    weighted_text += f"{get_valid_text(game.get('logline'))} " * 50
    weighted_text += f"{get_valid_text(game.get('description'))} " * 30
    weighted_text += f"{get_valid_text(game.get('tags'))} " * 50
    weighted_text += f"{get_valid_text(game.get('recent_comments'))} " 
    weighted_text += f"{get_valid_text(game.get('oldest_comments'))} "
    return weighted_text.strip()

#json file processing
with open(json_file_path, 'r', encoding="utf-8") as file:
    data = json.load(file)["games"]

with open(ui_json_file_path, 'r', encoding="utf-8") as file:
    ui_data = json.load(file)["games"]


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
    
    raw_results = closest_games_to_query(docs_compressed_normed, query_vec)
    boosted_results = []

    for i, sim in raw_results:
        rating_data = data[i].get("rating", {})
        rating = rating_data.get("aggregate_rating", 0)
        count = rating_data.get("rating_count", 0)
        boost = math.log(1 + count) * rating if rating and count else 1
        final_score = sim * boost
        boosted_results.append((i, final_score))

    boosted_results.sort(key=lambda x: -x[1])
    
    results = [
        {
            "title": ui_data[i]["title"],
            "description": ui_data[i].get("logline") if ui_data[i].get("logline") != None else "No description available",
            "rating": data[i]["rating"]["aggregate_rating"],
            "rating_count": data[i]["rating"]["rating_count"],
            "tags": data[i]["tags"],
            "url": data[i]["url"],
            "image_url": data[i]["image"] if "image" in data[i] else None,
            "score": round(score, 4),
            "recent_comments": ui_data[i]["recent_comments"][0] if "recent_comments" in ui_data[i] and len(ui_data[i]["recent_comments"]) > 0 else None,
            "author": data[i]["author"],
            "price": data[i]["price"]
        }
        for i, score in boosted_results
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