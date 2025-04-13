from langdetect import detect
import json

def is_not_spanish(text):
    try:
        return detect(text) != 'es'
    except:
        return True  # If detection fails, keep it just in case

with open("merged_games_cleaned.json", "r", encoding="utf-8") as f:
    data = json.load(f)

filtered_games = []

for game in data.get("games", []):
    description = game.get("description", "")

    if not is_not_spanish(description):
        # Skip this game if description is in Spanish
        continue

    # Filter recent_comments
    recent = game.get("recent_comments")
    if isinstance(recent, list):
        game["recent_comments"] = [comment for comment in recent if is_not_spanish(comment)]
    else:
        game["recent_comments"] = []

    # Filter oldest_comments
    oldest = game.get("oldest_comments")
    if isinstance(oldest, list):
        game["oldest_comments"] = [comment for comment in oldest if is_not_spanish(comment)]
    else:
        game["oldest_comments"] = []

    filtered_games.append(game)

# Save cleaned data
with open("merged_games_data_filtered.json", "w", encoding="utf-8") as f:
    json.dump({"games": filtered_games}, f, indent=2, ensure_ascii=False)

print("Games with Spanish descriptions removed. Spanish comments filtered.")
