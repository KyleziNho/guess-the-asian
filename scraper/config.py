"""Configuration for Wikidata scraper."""

# Wikidata Q-IDs for each country
COUNTRIES = {
    "Indonesia": "Q252",
    "Malaysia": "Q833",
    "Thailand": "Q869",
    "China": "Q148",
    "Vietnam": "Q881",
    "South Korea": "Q884",
    "Japan": "Q17",
}

# Wikidata SPARQL endpoint
SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"

# Target number of people per country
TARGET_PER_COUNTRY = 1500

# SQLite database path
DB_PATH = "../server/data/game.db"

# Request settings
REQUEST_TIMEOUT = 90
REQUEST_DELAY = 2  # seconds between SPARQL queries
BATCH_SIZE = 2000  # LIMIT per SPARQL query
