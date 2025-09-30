import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from collections import deque

#Headers to prevent website from flagging bot
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

#Scrapes all text and links from a url
def crawl(startURL, outFile = "output.txt"):
    domain = urlparse(startURL).netloc
    visited = set()
    q = deque([startURL])
    
    with open(outFile, "w", encoding="utf-8") as file:
        while q:
            url = q.popleft()
            
            if url in visited:
                continue
            visited.add(url)
            
            try:
                request = requests.get(url, headers=headers, timeout=5)
            except Exception as e:
                print(f"Cannot scrape {url}: {e}")
                continue
            
            if request.status_code != 200 or "text/html" not in request.headers.get("Content-Type", ""):
                continue
            
            soup = BeautifulSoup(request.text, "html.parser")
            text = soup.get_text(separator=" ", strip = True)
            
            file.write(f"\n\n[{url}]\n")
            file.write(text)
            
            for link in soup.find_all("a", href=True):
                newLink = urljoin(url, link["href"])
                if urlparse(newLink).netloc == domain and newLink not in visited:
                    q.append(newLink)


tempURL = "https://lillyendowment.org/for-grantseekers/renewal-programs/"
crawl(tempURL)
