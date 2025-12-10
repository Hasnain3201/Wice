import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from urllib.parse import urljoin, urlparse
from collections import deque
import os

from openai import OpenAI

FILE_NAME = "links.txt"
OUTPUT_FILE = "output.txt"

load_dotenv("../../.env.local")

API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=API_KEY)
MAX_PAGES = 50

#Headers to prevent website from flagging bot
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

def loadLinks(filename = FILE_NAME):
    if not os.path.exists(filename):
        return []
    with open(filename, "r", encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]

#Scrapes all text and links from a url
def crawl(startURL, outFile = "output.txt"):
    domain = urlparse(startURL).netloc
    visited = set()
    q = deque([startURL])
    pagesCrawled = 0
    
    with open(outFile, "w", encoding="utf-8") as file:
        while q and pagesCrawled < MAX_PAGES:
            url = q.popleft()

            if url in visited:
                continue
            visited.add(url)

            try:
                resp = requests.get(url, headers=headers, timeout=5)
            except Exception as e:
                print(f"Cannot scrape {url}: {e}")
                continue

            if resp.status_code != 200 or "text/html" not in resp.headers.get("Content-Type", ""):
                continue

            soup = BeautifulSoup(resp.text, "html.parser")
            text = soup.get_text(separator=" ", strip=True)

            file.write(f"\n\n[{url}]\n")
            file.write(text)

            pagesCrawled += 1

            for link in soup.find_all("a", href=True):
                new_link = urljoin(url, link["href"])
                if urlparse(new_link).netloc == domain and new_link not in visited:
                    q.append(new_link)


def GPTify(text):
    prompt = f"""
    Extract all grants mentioned in the following text and return **ONLY** valid JavaScript code.
    
    Format the output exactly as:

    export const grants = [
      {{
        id: <int>,
        title: "<title>",
        agency: "<agency or null>",
        region: "<region or null>",
        type: "<Grant | Challenge | Fellowship | RFP | null>",
        sectors: ["<sector1>", "<sector2>", ...],
        amount: "<amount or null>",
        deadline: "<deadline or null>",
        url: "<url or null>",
        summary: "<1–2 sentence summary>",
        eligibility: "<eligibility or null>",
        notes: "<notes or null>",
      }},
      ...
    ];

    - Ensure valid JS syntax.
    - Do NOT include explanations, markdown, or backticks.
    - If information is missing, use null.
    - Sectors must be an array of strings.
    - IDs should start at 1 and increment.
    
    TEXT:
    {text}
    """

    resp = client.chat.completions.create(
        model="gpt-4.1",
        messages=[{"role": "user", "content": prompt}],
        temperature=0
    )
    return resp.choices[0].message.content



def main():
    
    links = loadLinks(FILE_NAME)
    
    if not links:
        print("No links found in links.txt")
        return

    for i, link in enumerate(links, start=1):
        print(f"\n=== [{i}/{len(links)}] Processing: {link} ===")

        crawl(link, outFile=OUTPUT_FILE)

        # 2 read scraped text
        if not os.path.exists(OUTPUT_FILE):
            print("No output.txt generated, skipping GPT step.")
            continue

        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            scraped_text = f.read()

        try:
            model_output = GPTify(scraped_text)
            output_path = "../data/grants.js"

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(model_output)

            print(f"✅ Saved grants to {output_path}")
        except Exception as e:
            print(f"Error calling OpenAI: {e}")

        try:
            os.remove(OUTPUT_FILE)
            print("🗑️ Deleted output.txt")
        except FileNotFoundError:
            pass
        
if __name__ == "__main__":
    main()