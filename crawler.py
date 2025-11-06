import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import deque
import os

from openai import OpenAI

FILE_NAME = "links.txt"
OUTPUT_FILE = "output.txt"
API_KEY = "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"
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
    Extract all grants mentioned in the following text and return them in JSON with fields:
    name, short_description, deadline, amount, link, and tags (3–5 relevant ones).
    If information is missing, put null.
    Text:
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

        crawl(link, out_file=OUTPUT_FILE)

        # 2) read scraped text
        if not os.path.exists(OUTPUT_FILE):
            print("No output.txt generated, skipping GPT step.")
            continue

        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            scraped_text = f.read()

        try:
            model_output = GPTify(scraped_text)
            print("🔁 Model output:")
            print(model_output)
        except Exception as e:
            print(f"Error calling OpenAI: {e}")

        try:
            os.remove(OUTPUT_FILE)
            print("🗑️ Deleted output.txt")
        except FileNotFoundError:
            pass
        
if __name__ == "__main__":
    main()