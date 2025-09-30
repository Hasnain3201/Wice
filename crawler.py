import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse


#Headers to prevent website from flagging bot
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

#Scrapes all text from a url
def scrape(url):
    domain = urlparse(url).netloc
    urls = set()
    
    request = requests.get(url, headers=headers)
    
    soup = BeautifulSoup(request.text, "html.parser")
    
    text = soup.get_text(separator=" ", strip = True)
    
    for link in soup.find_all("a", href=True):
        newLink = urljoin(url, link["href"])
        if urlparse(newLink).netloc == domain:
            urls.add(newLink)
    
    return text, urls



tempURL = "https://lillyendowment.org/for-grantseekers/renewal-programs/"
text, urls = scrape(tempURL)

print("TEXT")
print(text[:500], "...")  

print("LINKS")
for u in urls:
    print(u)
