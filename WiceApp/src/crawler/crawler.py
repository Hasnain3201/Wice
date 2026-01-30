import json
import os
import hashlib
import random
import re
import time
from collections import Counter
from datetime import date, datetime
from urllib.parse import urljoin, urlparse, urldefrag

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, "..", "..", ".env.local")
SOURCES_FILE = os.path.join(BASE_DIR, "sources.json")
LINKS_FILE = os.path.join(BASE_DIR, "links.txt")
OUTPUT_PATH = os.path.join(BASE_DIR, "..", "data", "grants.js")

load_dotenv(ENV_PATH)
API_KEY = os.getenv("OPENAI_API_KEY")
ENABLE_LLM = os.getenv("ENABLE_LLM", "false").lower() in ("1", "true", "yes")
client = OpenAI(api_key=API_KEY) if API_KEY and OpenAI and ENABLE_LLM else None

REQUEST_TIMEOUT = 15
REQUEST_DELAY = 0.5
MAX_REQUEST_RETRIES = 3
RETRY_STATUS_CODES = {403, 429, 500, 502, 503, 504}
VERBOSE_LEVEL = int(os.getenv("VERBOSE_LEVEL", "0"))
AUDIT_ONLY = os.getenv("AUDIT_ONLY", "false").lower() in ("1", "true", "yes")
MAX_TEXT_CHARS = 4000
MAX_LLM_CHARS = 2500
MAX_LLM_CHUNKS = 2
DEFAULT_MAX_ITEMS = 20
DEFAULT_MAX_RECORDS_PER_SOURCE = 15
UNRESTRICTED = os.getenv("UNRESTRICTED", "false").lower() in ("1", "true", "yes")
FILTER_EXPIRED = os.getenv("FILTER_EXPIRED", "true").lower() in ("1", "true", "yes")
LLM_ERROR_LIMIT = 3
LLM_ERROR_COUNT = 0
USE_JSON_MODE = True
DEFAULT_FILE_EXT_BLOCKLIST = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"]
BLOCKED_URL_PATTERNS = [
    re.compile(r"/(login|signin|sign-in|signup|sign-up|register|password|reset|auth|oauth)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(account|accounts)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(subscribe|subscription)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(sso|single-sign-on)(/|\\b|\\?|#|$)", re.I),
]
HARD_LOW_VALUE_URL_PATTERNS = [
    re.compile(r"/(funded-grants?|grants?-awarded|grant-?database|grants?-database)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(search-our-grants|search-grants|search)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(news|stories|press|media|blog|podcast|events?|webinar|conference)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(faq|help|support|knowledgecenter|knowledge-center|help-center|helpcentre|glossary)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(newsletter|subscribe|subscription|signup|sign-up|donate|contact)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(terms|privacy|cookies|legal|accessibility)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(supplier-portal|supplier-registration|supplier-registration-form)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(corporate-procurement|procurement-policy|procurement-policies|administrative-instruction|instructions-to-bidders|tendering-procedures)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(grant-applicant-?faq|applicant-?faq)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(funding-portfolio/funded-grants)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(guidance|prepare-to-apply|how-to-apply|how-to-write)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(eligibility|application-deadlines|scheme-application-deadlines|funding-applicants)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(early-career-research|mid-career-research|established-research)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(what-we-dont-fund|why-we-cant-fund|international-sanctions)(/|\\b|\\?|#|$)", re.I),
]
SOFT_LOW_VALUE_URL_PATTERNS = [
    re.compile(r"/(about|who-we-are|what-we-do|our-work|mission|history|team|staff|board|leadership)(/|\\b|\\?|#|$)", re.I),
    re.compile(r"/(programs?|projects?|initiatives?|portfolio)(/|\\b|\\?|#|$)", re.I),
]
LOW_VALUE_URL_PATTERNS = HARD_LOW_VALUE_URL_PATTERNS + SOFT_LOW_VALUE_URL_PATTERNS
LOGIN_PAGE_HINTS = [
    "sign in",
    "log in",
    "login",
    "password",
    "forgot password",
    "reset password",
    "create account",
    "register",
]
BOT_BLOCK_PATTERNS = [
    ("cloudflare", r"cf-chl|cf-ray|__cf_bm|cloudflare"),
    ("cloudflare_challenge", r"just a moment|attention required|checking your browser"),
    ("captcha", r"captcha|verify you are human"),
    ("access_denied", r"access denied|request blocked|forbidden|not authorized"),
    ("imperva", r"incapsula|imperva"),
    ("perimeterx", r"perimeterx|px-captcha"),
    ("datadome", r"datadome"),
    ("akamai", r"akamai|akamai bot|akamai edge"),
    ("sucuri", r"sucuri"),
    ("distil", r"distil"),
]
DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_4) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}
SESSION = None
OPPORTUNITY_KEYWORDS = [
    "rfp",
    "rfq",
    "itb",
    "request for proposals",
    "request for proposal",
    "tender",
    "solicitation",
    "call for proposals",
    "call for proposal",
    "call for applications",
    "expression of interest",
    "eoi",
    "invitation to bid",
    "ifb",
    "itb",
    "procurement notice",
    "contract notice",
    "funding opportunity",
    "grant opportunity",
    "open call",
    "apply",
    "application",
    "proposal",
    "bid",
]
NOISE_KEYWORDS = [
    "about",
    "news",
    "story",
    "stories",
    "press",
    "media",
    "policy",
    "privacy",
    "terms",
    "careers",
    "jobs",
    "events",
    "subscribe",
    "subscription",
    "donate",
    "contact",
    "staff",
    "team",
    "board",
    "history",
    "mission",
    "grantee",
    "awarded",
    "award",
    "awards",
    "resources",
    "faq",
    "help",
    "blog",
    "podcast",
    "report",
    "annual report",
    "strategy",
    "guidelines",
    "grants awarded",
    "grantee stories",
    "publications",
    "publication",
    "directory",
    "profiles",
    "profile",
    "join",
    "membership",
    "seminar",
    "conference",
    "webinar",
]
STRONG_OPPORTUNITY_KEYWORDS = [
    "rfp",
    "rfq",
    "request for proposals",
    "request for proposal",
    "tender",
    "solicitation",
    "invitation to bid",
    "ifb",
    "bid",
    "expression of interest",
    "eoi",
    "call for proposals",
    "call for proposal",
    "open call",
    "application",
    "apply",
    "submit",
    "submission",
    "deadline",
    "closing date",
    "due date",
    "eligibility",
    "grant amount",
    "award amount",
    "funding amount",
    "grant size",
    "funding type",
    "grant opportunity",
    "funding opportunity",
]
HARD_SIGNAL_KEYWORDS = [
    "rfp",
    "rfq",
    "itb",
    "ifb",
    "request for proposals",
    "request for proposal",
    "invitation to bid",
    "expression of interest",
    "eoi",
    "call for proposals",
    "call for proposal",
    "call for applications",
    "open call",
    "tender",
    "solicitation",
]
LISTING_SIGNAL_PHRASES = [
    "current funding opportunities",
    "funding opportunities",
    "grant opportunities",
    "open funding opportunities",
    "open calls",
    "current calls",
    "rolling basis",
    "open for applications",
    "open for proposals",
    "applications are open",
    "currently accepting applications",
    "currently accepting proposals",
]
NEGATIVE_SIGNAL_PHRASES = [
    "do not accept unsolicited proposals",
    "does not accept unsolicited proposals",
    "not accepting unsolicited proposals",
    "not accepting proposals",
    "not accepting applications",
    "applications are closed",
    "application is closed",
    "applications closed",
    "closed to applications",
    "no open calls",
    "by invitation only",
    "invitation only",
    "not open to proposals",
    "past calls",
    "previous calls",
    "call archive",
    "calls archive",
    "archive of calls",
    "funded grants",
    "grants awarded",
    "grant database",
    "search grants",
]
POSITIVE_OVERRIDE_PHRASES = [
    "applications open",
    "now open",
    "open call",
    "accepting applications",
    "accepting proposals",
    "open for applications",
    "open for proposals",
    "applications are open",
    "currently accepting applications",
    "currently accepting proposals",
    "current funding opportunities",
    "open funding opportunities",
    "open calls",
    "current calls",
    "rolling basis",
]

# Headers to prevent website from flagging bot
HEADERS = DEFAULT_HEADERS

KEYWORDS = [
    "grant",
    "funding",
    "rfp",
    "request for proposals",
    "request for proposal",
    "tender",
    "solicitation",
    "bid",
    "procurement",
    "call for proposals",
    "call for proposal",
    "consultancy",
    "consultant",
    "expression of interest",
    "eoi",
    "invitation to bid",
    "ifb",
    "rfq",
    "opportunity",
    "fellowship",
    "challenge",
]

SECTOR_KEYWORDS = {
    "Climate": ["climate", "environment", "carbon", "emissions", "resilience", "biodiversity"],
    "Health": ["health", "healthcare", "medical", "disease", "public health", "hospital"],
    "Energy": ["energy", "renewable", "solar", "wind", "power", "electric"],
    "Agriculture": ["agricultur", "food", "farming", "nutrition", "crops", "livestock"],
    "Education": ["education", "school", "student", "training", "capacity building", "scholarship"],
    "Technology": ["technology", "digital", "ai", "software", "data"],
    "Housing": ["housing", "homeless", "shelter", "affordable housing"],
    "Water": ["water", "sanitation", "hygiene", "wastewater"],
    "Transportation": ["transport", "mobility", "transit", "rail", "road", "port", "shipping"],
    "Economic Development": ["economic", "workforce", "jobs", "livelihood", "enterprise", "small business"],
    "Arts & Culture": ["arts", "culture", "creative", "heritage"],
    "Governance": ["governance", "policy", "democracy", "civic", "justice", "public administration"],
    "Community": ["community", "community development", "equity", "inclusion", "youth"],
}

DATE_PATTERNS = [
    r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b",
    r"\b\d{4}-\d{2}-\d{2}\b",
    r"\b\d{1,2}/\d{1,2}/\d{2,4}\b",
    r"\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}\b",
    r"\b\d{1,2}[-/](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*[-/]\d{2,4}\b",
]

MONTHS = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "sept": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}


def load_sources(path):
    if not os.path.exists(path):
        print(f"Sources file not found: {path}")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_links(path):
    if not os.path.exists(path):
        return []
    links = []
    seen = set()
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            value = line.strip()
            if not value or value.startswith("#"):
                continue
            normalized = normalize_url(value)
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            links.append(normalized)
    return links


def filter_seed_urls(links):
    if not links:
        return []
    by_domain = {}
    for url in links:
        try:
            domain = urlparse(url).netloc
        except Exception:
            domain = ""
        by_domain.setdefault(domain, []).append(url)

    filtered = []
    for domain, urls in by_domain.items():
        if domain == "ec.europa.eu":
            has_home = any("/portal/screen/home" in u for u in urls)
            for url in urls:
                if has_home and "/portal/screen/opportunities/tender-details/" in url:
                    continue
                filtered.append(url)
            continue
        if domain == "www.packard.org":
            has_base = any(u.rstrip("/") == "https://www.packard.org" for u in urls)
            for url in urls:
                if has_base and "cn-reloaded" in url:
                    continue
                filtered.append(url)
            continue
        filtered.extend(urls)
    return filtered


def log_verbose(level, message):
    if VERBOSE_LEVEL >= level:
        print(message)


def normalize_text(text):
    return " ".join((text or "").split())


def get_session():
    global SESSION
    if SESSION is None:
        SESSION = requests.Session()
        SESSION.headers.update(DEFAULT_HEADERS)
    return SESSION


def get_origin(url):
    if not url:
        return ""
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        return ""
    return f"{parsed.scheme}://{parsed.netloc}"


def looks_like_content(html):
    if not html:
        return False
    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception:
        return False
    text = normalize_text(soup.get_text(" ", strip=True))
    links = soup.find_all("a")
    if len(text) >= 400 and len(links) >= 3:
        return True
    if len(text) >= 800:
        return True
    return False


def dump_bot_html(url, source_name, html):
    try:
        debug_dir = os.path.join(BASE_DIR, "debug", "bot")
        os.makedirs(debug_dir, exist_ok=True)
        slug = re.sub(r"[^a-zA-Z0-9]+", "_", source_name or urlparse(url).netloc)[:40] or "source"
        digest = hashlib.md5(f"{url}".encode("utf-8")).hexdigest()[:10]
        path = os.path.join(debug_dir, f"{slug}_{digest}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html or "")
        return path
    except Exception:
        return None


def strip_code_fences(content):
    content = (content or "").strip()
    if content.startswith("```"):
        content = content.strip("`")
        if content.lower().startswith("json"):
            content = content[4:].strip()
    return content


GENERIC_TITLE_PATTERNS = [
    r"^home$",
    r"^skip to main content$",
    r"^learn more$",
    r"^read more$",
    r"^click here$",
    r"^view details$",
    r"^details$",
    r"^apply$",
    r"^apply now$",
    r"^download$",
    r"^register$",
    r"^grant opportunities$",
    r"^funding opportunities$",
    r"^call for proposals$",
    r"^call for proposal$",
    r"^our grants$",
    r"^grantseekers$",
    r"^opportunities$",
    r"^resources$",
    r"^current opportunities$",
    r"^current calls$",
    r"^current call$",
    r"^available opportunities$",
    r"^find a funding opportunity$",
    r"^all downloads$",
    r"^learn about our grants$",
    r"^visit the ungm help center$",
    r"^help center$",
    r"^supplier registration form$",
    r"^below$",
    r"^overview$",
    r"^what we do$",
    r"^showing\s+\d+\s+to\s+\d+\s+results.*$",
    r"^more to explore$",
    r"^home\s*/\s*$",
    r"^funding opportunities\s*/\s*$",
    r"^current funding opportunities$",
    r"^resources and opportunities$",
    r"^more resources and opportunities$",
    r"^how to\\b.*$",
    r"^eligibility\\b.*$",
    r"^roles and responsibilities\\b.*$",
    r"^funding scheme application deadlines\\b.*$",
    r"^application deadlines\\b.*$",
    r"^early-?career researcher\\b.*$",
    r"^mid-?career researcher\\b.*$",
    r"^established researcher\\b.*$",
    r"^international sanctions\\b.*$",
    r"^why we .* fund\\b.*$",
    r"^what we don'?t fund\\b.*$",
]

LOW_VALUE_TITLE_SUBSTRINGS = [
    "help center",
    "help-centre",
    "faq",
    "frequently asked",
    "funded grants",
    "grants awarded",
    "grant database",
    "search results",
    "search all grants",
    "all downloads",
    "grant opportunities",
    "funding opportunities",
    "current funding opportunities",
    "current calls",
    "available opportunities",
    "resources and opportunities",
    "resources & opportunities",
    "more resources and opportunities",
    "our work",
    "supplier registration",
    "supplier portal",
    "corporate procurement",
    "procurement policy",
    "procurement policies",
    "administrative instruction",
    "instructions to bidders",
    "grant applicant faq",
    "grant applicant faqs",
    "how to apply",
    "how to write an application",
    "eligibility information",
    "application deadlines",
    "early-career researcher",
    "mid-career researcher",
    "established researcher",
    "policy researchers funded by the tobacco industry",
    "international sanctions",
    "why we can't fund",
    "what we don't fund",
    "privacy policy",
    "terms of use",
    "what we do",
    "more to explore",
    "big bets",
    "enduring commitments",
    "field support",
    "you might be looking for",
]

HARD_LOW_VALUE_SUMMARY_PATTERNS = [
    r"showing\s+\d+\s+to\s+\d+\s+results",
    r"search results",
    r"grant database",
    r"grants awarded",
    r"funded grants",
    r"all downloads",
    r"help center",
    r"faq",
    r"grant applicant faq",
    r"find a funding opportunity",
    r"sign up to our .*newsletter",
    r"more to explore",
    r"view all current tenders",
    r"supplier portal",
    r"supplier registration",
    r"instructions to bidders",
    r"administrative instruction",
    r"corporate procurement",
    r"does .* accept proposals\? no",
    r"search grants since",
    r"learn more about our grants",
    r"visit the ungm help center",
    r"open in a new tab",
    r"do not accept unsolicited proposals",
    r"not accepting proposals",
    r"not accepting applications",
    r"applications are closed",
    r"no open calls",
    r"past calls",
    r"previous calls",
    r"call archive",
    r"calls archive",
    r"archive of calls",
    r"how to apply",
    r"how to write .*application",
    r"eligibility information",
    r"funding scheme application deadlines",
    r"early-career researcher",
    r"mid-career researcher",
    r"established researcher",
    r"international sanctions",
    r"why we can't fund",
    r"what we don't fund",
]

SOFT_LOW_VALUE_SUMMARY_PATTERNS = [
    r"grant opportunities",
    r"funding opportunities",
]

LOW_VALUE_SUMMARY_PATTERNS = HARD_LOW_VALUE_SUMMARY_PATTERNS + SOFT_LOW_VALUE_SUMMARY_PATTERNS


def is_generic_title(title):
    if not title:
        return False
    lower = normalize_text(title).lower()
    if re.fullmatch(r"\d{1,4}", lower):
        return True
    return any(re.search(pattern, lower) for pattern in GENERIC_TITLE_PATTERNS)


def is_low_value_title(title):
    if not title:
        return True
    lower = normalize_text(title).lower()
    if is_generic_title(title):
        return True
    if any(fragment in lower for fragment in LOW_VALUE_TITLE_SUBSTRINGS):
        return True
    if re.search(r"showing\s+\d+\s+to\s+\d+\s+results", lower):
        return True
    return False


def is_placeholder_title(title, source_name):
    if not title or not source_name:
        return False
    title_norm = normalize_text(title).lower()
    source_norm = normalize_text(source_name).lower()
    placeholders = {
        f"{source_norm} opportunity",
        f"{source_norm} opportunities",
        f"{source_norm} grant opportunities",
        f"{source_norm} funding opportunities",
        f"{source_norm} call for proposals",
        f"{source_norm} call for proposal",
    }
    return title_norm in placeholders


def is_bad_title(title, file_ext_blocklist):
    if not title:
        return True
    title = title.strip()
    if len(title) < 4:
        return True
    lower = title.lower()
    if any(lower.endswith(ext) for ext in file_ext_blocklist):
        return True
    if re.search(r"\.(pdf|docx?|xlsx?|pptx?)$", lower):
        return True
    if is_low_value_title(title):
        return True
    return False


def clean_title_from_url(url):
    try:
        path = urlparse(url).path or ""
    except Exception:
        return url
    parts = [p for p in path.split("/") if p]
    segment = parts[-1] if parts else ""
    if segment:
        segment = re.sub(r"\.(pdf|docx?|xlsx?|pptx?)$", "", segment, flags=re.I)
        segment = re.sub(r"[-_]+", " ", segment)
        segment = normalize_text(segment)
    if segment and not is_generic_title(segment):
        return segment.title()
    # Try previous path segments if the last one is generic.
    for prior in reversed(parts[:-1]):
        prior = re.sub(r"\.(pdf|docx?|xlsx?|pptx?)$", "", prior, flags=re.I)
        prior = re.sub(r"[-_]+", " ", prior)
        prior = normalize_text(prior)
        if prior and not is_generic_title(prior):
            return prior.title()
    if not segment:
        return url
    return segment.title()


def find_fallback_title(anchor, container, file_ext_blocklist):
    for attr in ("aria-label", "title"):
        value = normalize_text(anchor.get(attr))
        if value and not is_bad_title(value, file_ext_blocklist):
            return value
    for heading in container.find_all(["h1", "h2", "h3"], limit=3):
        value = normalize_text(heading.get_text(" ", strip=True))
        if value and not is_bad_title(value, file_ext_blocklist):
            return value
    parent = anchor
    for _ in range(4):
        parent = parent.parent
        if not parent:
            break
        classes = " ".join(parent.get("class", []))
        if re.search(r"(title|heading|card)", classes, re.I):
            value = normalize_text(parent.get_text(" ", strip=True))
            if value and not is_bad_title(value, file_ext_blocklist):
                return value
    return None


def normalize_url(url, keep_fragment=False):
    if not url:
        return ""
    url = url.strip()
    if not keep_fragment:
        url, _ = urldefrag(url)
    if url.endswith("/") and len(url) > len("https://a.b/"):
        url = url.rstrip("/")
    return url


def is_file_url(url, file_ext_blocklist, file_url_patterns=None):
    if not url:
        return False
    try:
        parsed = urlparse(url)
        path = parsed.path or ""
        query = parsed.query or ""
    except Exception:
        path = url
        query = ""
    lower_path = path.lower()
    if any(lower_path.endswith(ext) for ext in file_ext_blocklist):
        return True
    if file_url_patterns:
        for pattern in file_url_patterns:
            if pattern and pattern.lower() in lower_path:
                return True
    if "download=" in query.lower():
        return True
    return False


def is_blocked_url(url):
    if not url:
        return False
    lower = url.lower()
    return any(pattern.search(lower) for pattern in BLOCKED_URL_PATTERNS)


def is_low_value_url(url):
    if not url:
        return False
    lower = url.lower()
    if any(pattern.search(lower) for pattern in HARD_LOW_VALUE_URL_PATTERNS):
        return True
    if any(pattern.search(lower) for pattern in SOFT_LOW_VALUE_URL_PATTERNS):
        if re.search(r"(grant|funding|opportunit|rfp|rfq|tender|call|proposal|apply|fellowship|scholarship|challenge|prize)", lower):
            return False
        return True
    return False


def compile_patterns(patterns):
    compiled = []
    for pattern in patterns or []:
        if not pattern:
            continue
        try:
            compiled.append(re.compile(pattern, re.I))
        except re.error:
            compiled.append(re.compile(re.escape(pattern), re.I))
    return compiled


def matches_any(patterns, text):
    if not patterns or not text:
        return False
    return any(pattern.search(text) for pattern in patterns)


def has_opportunity_signal(title, url, context, opportunity_keywords):
    hay = f"{title} {url} {context}".lower()
    return any(k in hay for k in opportunity_keywords)


def is_noise_candidate(title, url, noise_keywords):
    hay = f"{title} {url}".lower()
    return any(k in hay for k in noise_keywords)


def keyword_match(text, keywords):
    hay = (text or "").lower()
    return any(k in hay for k in keywords)


def fetch_html(url, timeout=None, referer=None, source_name=None):
    session = get_session()
    last_err = None
    for attempt in range(MAX_REQUEST_RETRIES):
        try:
            headers = dict(HEADERS)
            if referer:
                headers["Referer"] = referer
            resp = session.get(url, headers=headers, timeout=timeout or REQUEST_TIMEOUT, allow_redirects=True)
        except requests.exceptions.Timeout:
            last_err = "timeout"
        except requests.exceptions.ConnectionError:
            last_err = "error:ConnectionError"
        except Exception as e:
            return None, f"error:{e.__class__.__name__}", {"status": None, "content_type": ""}
        else:
            meta = {
                "status": resp.status_code,
                "content_type": resp.headers.get("Content-Type", ""),
                "final_url": resp.url,
            }
            if resp.status_code in RETRY_STATUS_CODES and attempt < MAX_REQUEST_RETRIES - 1:
                last_err = f"status:{resp.status_code}"
                time.sleep(random.uniform(0.5, 2.0))
                continue
            if is_blocked_url(meta.get("final_url", "")):
                return None, "blocked", meta
            if resp.status_code >= 400:
                return None, f"status:{resp.status_code}", meta
            if "text/html" not in meta["content_type"]:
                return None, "non-html", meta
            block_reason, block_detail = detect_blocked_reason(resp.text)
            if block_reason:
                if block_reason == "bot":
                    log_bot_debug(url, meta, resp, block_detail, resp.text, source_name=source_name)
                return None, block_reason, meta
            return resp.text, None, meta
        if attempt < MAX_REQUEST_RETRIES - 1:
            time.sleep(random.uniform(0.5, 2.0))
            continue
    return None, last_err or "error:unknown", {"status": None, "content_type": ""}


def detect_blocked_reason(html):
    lower = (html or "").lower()
    if re.search(r'type=["\\\']password', lower) and any(hint in lower for hint in LOGIN_PAGE_HINTS):
        return "login", "login_form"
    matched = None
    matched_label = None
    for label, pattern in BOT_BLOCK_PATTERNS:
        if re.search(pattern, lower):
            matched = pattern
            matched_label = label
            break
    if matched_label:
        if looks_like_content(html) and matched_label not in ("cloudflare_challenge", "captcha", "access_denied", "perimeterx"):
            return None, None
        return "bot", matched_label
    return None, None


def log_bot_debug(url, meta, resp, reason_detail, html, source_name=None):
    if VERBOSE_LEVEL < 1:
        return
    headers = resp.headers if resp else {}
    title = ""
    snippet = ""
    try:
        soup = BeautifulSoup(html or "", "html.parser")
        if soup.title:
            title = normalize_text(soup.title.get_text(" ", strip=True))
        snippet = normalize_text(soup.get_text(" ", strip=True))[:300]
    except Exception:
        snippet = normalize_text((html or "")[:300])
    debug_path = dump_bot_html(url, source_name or urlparse(url).netloc, html or "")
    print(
        "[bot-debug] "
        f"url={url} final={meta.get('final_url')} reason={reason_detail} "
        f"status={meta.get('status')} "
        f"server={headers.get('Server')} set-cookie={headers.get('Set-Cookie')} "
        f"cf-ray={headers.get('CF-RAY')} location={headers.get('Location')}"
    )
    if title or snippet:
        print(f"[bot-debug] title={title} snippet={snippet}")
    if debug_path:
        print(f"[bot-debug] dump={debug_path}")


def strip_noise(soup):
    for tag in soup(["script", "style", "noscript", "header", "footer", "nav", "aside", "form"]):
        tag.decompose()


def has_strong_signal(text):
    lower = (text or "").lower()
    if not lower:
        return False
    low_value_hint = any(re.search(pattern, lower) for pattern in LOW_VALUE_SUMMARY_PATTERNS)
    score = 0
    for term in HARD_SIGNAL_KEYWORDS:
        if len(term) <= 3:
            if re.search(rf"\\b{re.escape(term)}\\b", lower):
                score += 2
        elif term in lower:
            score += 2
    if re.search(r"\\b(deadline|closing date|due date|apply by|applications close)\\b", lower):
        score += 2
    if re.search(r"\\b(apply|application|submit|submission|proposal)\\b", lower):
        score += 1
    if re.search(r"\\b(grant|fellowship|scholarship|challenge|prize)\\b", lower):
        score += 1
    if re.search(r"\\beligib\\w*\\b", lower):
        score += 1
    if re.search(r"[$€£]|\\busd\\b|\\beur\\b|\\bgbp\\b", lower) and any(
        k in lower for k in ["grant", "funding", "award", "prize"]
    ):
        score += 1
    for phrase in LISTING_SIGNAL_PHRASES:
        if phrase in lower:
            score += 2
    if re.search(r"\\b(current|open|rolling|ongoing)\\b.{0,40}\\b(opportunit|call|applications?|proposals?|funding|grant)\\b", lower):
        score += 1
    if low_value_hint:
        return score >= 3
    return score >= 2


def has_explicit_opportunity_signal(text):
    lower = (text or "").lower()
    if not lower:
        return False
    if re.search(r"\b(rfp|rfq|itb|ifb|tender|solicitation|invitation to bid|expression of interest|eoi)\b", lower):
        return True
    if re.search(r"\bcall for (proposals?|applications?)\b", lower):
        return True
    if re.search(r"\bopen calls?\b", lower):
        return True
    if re.search(r"\bpublic calls? to tender\b", lower):
        return True
    if re.search(r"\bcalls? to tender\b", lower):
        return True
    if re.search(r"\b(applications? (are )?open|open for (applications|proposals)|currently accepting (applications|proposals))\b", lower):
        return True
    if re.search(r"\b(current|open|rolling|ongoing)\b.{0,40}\b(opportunit|call|applications?|proposals?|tenders?)\b", lower):
        return True
    if re.search(r"\b(apply|application|submit|submission|proposal|bid)\b", lower) and re.search(
        r"\b(deadline|due date|closing date|apply by|applications close|submission deadline)\b", lower
    ):
        return True
    return False


def has_negative_signal(text):
    lower = (text or "").lower()
    return any(phrase in lower for phrase in NEGATIVE_SIGNAL_PHRASES)


def has_positive_override(text):
    lower = (text or "").lower()
    return any(phrase in lower for phrase in POSITIVE_OVERRIDE_PHRASES)


def extract_relevant_text_from_html(html, source, keywords, opportunity_keywords, noise_keywords):
    soup = BeautifulSoup(html, "html.parser")
    selectors = source.get("detail_selectors") or []
    if selectors:
        selected = []
        for sel in selectors:
            selected.extend(soup.select(sel))
        if selected:
            fragment_html = " ".join(str(node) for node in selected)
            fragment = BeautifulSoup(fragment_html, "html.parser")
            return extract_relevant_text(fragment, keywords, opportunity_keywords, noise_keywords)
    return extract_relevant_text(soup, keywords, opportunity_keywords, noise_keywords)


def parse_undp_notice(html):
    soup = BeautifulSoup(html, "html.parser")
    strip_noise(soup)
    text = normalize_text(soup.get_text(" ", strip=True))
    if not text:
        return {}
    title = None
    title_match = re.search(r"\\bTitle\\s+(.+?)\\s+Ref\\s*No\\b", text, re.I)
    if title_match:
        title = normalize_text(title_match.group(1))
    deadline = None
    deadline_match = re.search(r"\\bDeadline\\s+(.+?)(?:\\s+Posted\\b|\\s+Ref\\s*No\\b)", text, re.I)
    if deadline_match:
        deadline = normalize_text(deadline_match.group(1))
    summary = text
    summary = re.sub(r"\\bTitle\\s+.+?\\bPosted\\b\\s+[^A-Za-z0-9]+", "", summary, flags=re.I)
    summary = re.sub(r"\\bRef\\s*No\\b\\s*\\S+", "", summary, flags=re.I)
    summary = re.sub(r"\\bUNDP\\s+Office/Country\\b\\s*\\S+", "", summary, flags=re.I)
    summary = re.sub(r"\\bProcess\\b\\s+\\S+(?:\\s+\\S+){0,4}", "", summary, flags=re.I)
    summary = re.sub(r"\\bDeadline\\b\\s+\\S+(?:\\s+\\S+){0,5}", "", summary, flags=re.I)
    summary = re.sub(r"\\bPosted\\b\\s+\\S+(?:\\s+\\S+){0,5}", "", summary, flags=re.I)
    summary = normalize_text(summary)
    if title and summary.lower().startswith(title.lower()):
        summary = summary[len(title):].lstrip(" -:|")
    summary = summarize_text(summary)
    data = {"title": title, "deadline": deadline, "summary": summary, "type": "RFP"}
    return {k: v for k, v in data.items() if v}


DETAIL_PARSERS = {
    "procurement-notices.undp.org": parse_undp_notice,
}


def extract_deadline(text):
    for pattern in DATE_PATTERNS:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return None


def parse_deadline_date(value):
    if not value:
        return None
    text = normalize_text(value)
    candidate = extract_deadline(text) or text
    candidate = normalize_text(candidate)
    if not candidate:
        return None
    lower = candidate.lower()
    # yyyy-mm-dd
    m = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", lower)
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            return None
    # dd/ mm / yyyy or mm / dd / yyyy
    m = re.search(r"\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b", lower)
    if m:
        a, b, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        y = y + 2000 if y < 100 else y
        month, day = (a, b) if a <= 12 else (b, a)
        try:
            return date(y, month, day)
        except ValueError:
            return None
    # dd-mon-yy or dd mon yyyy
    m = re.search(r"\b(\d{1,2})[-\\s]([a-z]{3,9})[-\\s,](\d{2,4})\b", lower)
    if m:
        d = int(m.group(1))
        mon = MONTHS.get(m.group(2)[:4], MONTHS.get(m.group(2)[:3]))
        y = int(m.group(3))
        y = y + 2000 if y < 100 else y
        if mon:
            try:
                return date(y, mon, d)
            except ValueError:
                return None
    # mon dd, yyyy
    m = re.search(r"\b([a-z]{3,9})\\s+(\\d{1,2}),?\\s+(\\d{2,4})\\b", lower)
    if m:
        mon = MONTHS.get(m.group(1)[:4], MONTHS.get(m.group(1)[:3]))
        d = int(m.group(2))
        y = int(m.group(3))
        y = y + 2000 if y < 100 else y
        if mon:
            try:
                return date(y, mon, d)
            except ValueError:
                return None
    return None


def extract_candidate_links(soup, list_url, source):
    keywords = [k.lower() for k in source.get("keywords", KEYWORDS)]
    file_ext_blocklist = source.get("file_ext_blocklist", DEFAULT_FILE_EXT_BLOCKLIST)
    file_url_patterns = source.get("file_url_patterns", [])
    allow_file_links = source.get("allow_file_links", False)
    prefer_non_file_links = source.get("prefer_non_file_links", True)
    strict_opportunity = source.get("strict_opportunity_match", False)
    opportunity_keywords = [k.lower() for k in source.get("opportunity_keywords", OPPORTUNITY_KEYWORDS)]
    noise_keywords = [k.lower() for k in source.get("noise_keywords", NOISE_KEYWORDS)]
    allowlist_patterns = compile_patterns(source.get("url_allowlist_patterns", []))
    denylist_patterns = compile_patterns(source.get("url_denylist_patterns", []))
    selectors = source.get("list_selectors") or []
    containers = []
    for sel in selectors:
        containers.extend(soup.select(sel))
    if not containers:
        containers = [soup]

    candidates = []
    skipped_file_links = 0
    max_debug_samples = source.get("max_candidates_debug_sample", 10)
    stats = {
        "anchors_total": 0,
        "anchors_valid": 0,
        "skipped_external": 0,
        "skipped_nonmatch": 0,
        "skipped_file": 0,
        "skipped_blocked": 0,
        "skipped_noise": 0,
        "skipped_strict": 0,
        "skipped_allowlist": 0,
        "skipped_denylist": 0,
        "allowlist_samples": [],
        "file_links": 0,
        "non_file_links": 0,
    }
    base_domain = urlparse(list_url).netloc
    allow_external = source.get("allow_external", False)
    force_all_links = source.get("force_all_links", False)
    disable_allowlist_when_forced = source.get("disable_allowlist_when_forced", False)
    allowlist_strict = source.get("allowlist_strict", False)
    effective_allowlist = [] if (force_all_links and disable_allowlist_when_forced) else allowlist_patterns
    keep_url_fragment = source.get("keep_url_fragment", False)
    list_origin = get_origin(list_url)

    for container in containers:
        anchors = list(container.find_all("a", href=True))
        stats["anchors_total"] += len(anchors)
        anchor_infos = []
        has_non_file_candidate = False

        for anchor in anchors:
            href = (anchor.get("href") or "").strip()
            if not href or href.startswith("javascript:") or href.startswith("mailto:"):
                continue
            if href.startswith("#"):
                if keep_url_fragment:
                    href = f"{list_url}{href}"
                else:
                    continue
            stats["anchors_valid"] += 1
            url = urljoin(list_url, href)
            try:
                if urlparse(url).path in ("", "/") and urlparse(list_url).path not in ("", "/"):
                    url = list_url
            except Exception:
                pass
            if not allow_external and urlparse(url).netloc and urlparse(url).netloc != base_domain:
                stats["skipped_external"] += 1
                continue
            if is_blocked_url(url):
                stats["skipped_blocked"] += 1
                continue
            allowlist_match = matches_any(effective_allowlist, url) if effective_allowlist else False
            if effective_allowlist and not allowlist_match and allowlist_strict:
                stats["skipped_allowlist"] += 1
                if len(stats["allowlist_samples"]) < max_debug_samples:
                    stats["allowlist_samples"].append(url)
                continue
            if denylist_patterns and matches_any(denylist_patterns, url):
                stats["skipped_denylist"] += 1
                continue
            is_file = is_file_url(url, file_ext_blocklist, file_url_patterns)
            if is_file:
                stats["file_links"] += 1
            else:
                stats["non_file_links"] += 1
            title = normalize_text(anchor.get_text(" ", strip=True))
            context = normalize_text(anchor.parent.get_text(" ", strip=True)) if anchor.parent else title
            opportunity_signal = has_opportunity_signal(title, url, context, opportunity_keywords)
            if is_low_value_url(url) and not opportunity_signal and not allowlist_match:
                stats["skipped_noise"] += 1
                continue
            if is_noise_candidate(title, url, noise_keywords) and not opportunity_signal and not allowlist_match:
                stats["skipped_noise"] += 1
                continue
            if strict_opportunity and not opportunity_signal:
                stats["skipped_strict"] += 1
                continue
            hay = f"{title} {context} {url}"
            keyword_hit = keyword_match(hay, keywords)
            score = 0
            if allowlist_match:
                score += 3
            if opportunity_signal:
                score += 2
            if keyword_hit:
                score += 2
            if any(k in (title or "").lower() for k in opportunity_keywords):
                score += 1
            passes = force_all_links or score > 0
            if not passes:
                stats["skipped_nonmatch"] += 1
            if passes and not is_file:
                has_non_file_candidate = True
            anchor_infos.append((anchor, url, is_file, title, context, passes, score))

        for anchor, url, is_file, title, context, passes, score in anchor_infos:
            if not passes:
                continue
            if is_file and not allow_file_links:
                skipped_file_links += 1
                stats["skipped_file"] += 1
                continue
            if is_file and allow_file_links and has_non_file_candidate and prefer_non_file_links:
                skipped_file_links += 1
                stats["skipped_file"] += 1
                continue

            if is_bad_title(title, file_ext_blocklist):
                fallback = find_fallback_title(anchor, container, file_ext_blocklist)
                if fallback:
                    title = fallback

            if is_bad_title(title, file_ext_blocklist):
                title = clean_title_from_url(url)

            candidates.append(
                {
                    "title": title or url,
                    "url": normalize_url(url, keep_fragment=keep_url_fragment),
                    "context": context,
                    "deadline": extract_deadline(context) or None,
                    "is_file": is_file,
                    "referer": list_origin,
                    "score": score,
                }
            )
    return candidates, skipped_file_links, stats


def extract_regex_links(html, list_url, source):
    patterns = source.get("regex_link_extract_patterns") or []
    if not patterns or not html:
        return []
    compiled = []
    for pattern in patterns:
        try:
            compiled.append(re.compile(pattern, re.I))
        except re.error:
            compiled.append(re.compile(re.escape(pattern), re.I))
    file_ext_blocklist = source.get("file_ext_blocklist", DEFAULT_FILE_EXT_BLOCKLIST)
    file_url_patterns = source.get("file_url_patterns", [])
    allow_external = source.get("allow_external", False)
    base_domain = urlparse(list_url).netloc
    keep_url_fragment = source.get("keep_url_fragment", False)
    list_origin = get_origin(list_url)
    found = []
    seen = set()
    for regex in compiled:
        for match in regex.findall(html):
            if isinstance(match, tuple):
                match = match[0]
            if not match:
                continue
            url = normalize_url(urljoin(list_url, match), keep_fragment=keep_url_fragment)
            if not url or url in seen:
                continue
            if not allow_external and urlparse(url).netloc and urlparse(url).netloc != base_domain:
                continue
            if is_blocked_url(url):
                continue
            if is_low_value_url(url):
                continue
            if is_file_url(url, file_ext_blocklist, file_url_patterns):
                continue
            seen.add(url)
            found.append(
                {
                    "title": clean_title_from_url(url),
                    "url": url,
                    "context": "",
                    "deadline": None,
                    "is_file": False,
                    "referer": list_origin,
                }
            )
    return found


def extract_data_attribute_links(soup, list_url, source):
    if not soup:
        return []
    data_attrs = ["data-href", "data-url", "data-link", "data-target", "data-src"]
    file_ext_blocklist = source.get("file_ext_blocklist", DEFAULT_FILE_EXT_BLOCKLIST)
    file_url_patterns = source.get("file_url_patterns", [])
    allow_external = source.get("allow_external", False)
    strict_opportunity = source.get("strict_opportunity_match", False)
    keywords = [k.lower() for k in source.get("keywords", KEYWORDS)]
    opportunity_keywords = [k.lower() for k in source.get("opportunity_keywords", OPPORTUNITY_KEYWORDS)]
    noise_keywords = [k.lower() for k in source.get("noise_keywords", NOISE_KEYWORDS)]
    allowlist_patterns = compile_patterns(source.get("url_allowlist_patterns", []))
    denylist_patterns = compile_patterns(source.get("url_denylist_patterns", []))
    base_domain = urlparse(list_url).netloc
    keep_url_fragment = source.get("keep_url_fragment", False)
    list_origin = get_origin(list_url)
    force_all_links = source.get("force_all_links", False)

    found = []
    seen = set()
    for tag in soup.find_all(True):
        for attr in data_attrs:
            raw = tag.get(attr)
            if not raw or not isinstance(raw, str):
                continue
            href = raw.strip()
            if not href or href.startswith(("mailto:", "tel:", "javascript:")):
                continue
            if href.startswith("#"):
                if keep_url_fragment:
                    href = f"{list_url}{href}"
                else:
                    continue
            url = normalize_url(urljoin(list_url, href), keep_fragment=keep_url_fragment)
            if not url or url in seen:
                continue
            if not allow_external and urlparse(url).netloc and urlparse(url).netloc != base_domain:
                continue
            if is_blocked_url(url):
                continue
            if is_low_value_url(url):
                continue
            if denylist_patterns and matches_any(denylist_patterns, url):
                continue
            if is_file_url(url, file_ext_blocklist, file_url_patterns):
                continue
            allowlist_match = matches_any(allowlist_patterns, url) if allowlist_patterns else False
            title = normalize_text(tag.get_text(" ", strip=True))
            context = normalize_text(tag.get_text(" ", strip=True))
            opportunity_signal = has_opportunity_signal(title, url, context, opportunity_keywords)
            if is_noise_candidate(title, url, noise_keywords) and not opportunity_signal and not allowlist_match:
                continue
            if strict_opportunity and not opportunity_signal:
                continue
            hay = f"{title} {context} {url}"
            keyword_hit = keyword_match(hay, keywords)
            score = 0
            if allowlist_match:
                score += 3
            if opportunity_signal:
                score += 2
            if keyword_hit:
                score += 2
            if any(k in (title or "").lower() for k in opportunity_keywords):
                score += 1
            if not (force_all_links or score > 0):
                continue
            seen.add(url)
            found.append(
                {
                    "title": title or clean_title_from_url(url),
                    "url": url,
                    "context": context,
                    "deadline": extract_deadline(context) or None,
                    "is_file": False,
                    "referer": list_origin,
                    "score": score,
                }
            )
    return found


def discover_list_urls(
    start_url,
    source,
    request_timeout=None,
    max_candidates=5,
    return_scored=False,
    use_origin=False,
):
    base_url = get_origin(start_url) if use_origin else normalize_url(start_url)
    if not base_url:
        return []
    html, err, meta = fetch_html(
        base_url, timeout=request_timeout, referer=base_url, source_name=source.get("name")
    )
    if err or not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    keywords = [
        "grants",
        "grant",
        "funding",
        "opportunities",
        "opportunity",
        "calls",
        "call-for",
        "open call",
        "open-call",
        "procurement",
        "tenders",
        "tender",
        "bids",
        "bid",
        "apply",
        "application",
        "notice",
        "solicitation",
        "rfp",
        "rfq",
    ]
    strong_keywords = [
        "grant",
        "grants",
        "funding",
        "procurement",
        "tender",
        "tenders",
        "rfp",
        "rfq",
        "solicitation",
        "notice",
        "call",
        "bids",
        "bid",
    ]
    nav_blocklist = [
        "privacy",
        "terms",
        "contact",
        "about",
        "careers",
        "jobs",
        "donate",
        "news",
        "blog",
        "press",
        "media",
        "login",
        "sign in",
        "signup",
    ]
    scored = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = (a.get("href") or "").strip()
        if not href or href.startswith(("mailto:", "tel:", "javascript:")):
            continue
        if "#" in href:
            continue
        url = urljoin(base_url, href)
        parsed = urlparse(url)
        if parsed.fragment:
            continue
        if parsed.netloc != urlparse(base_url).netloc:
            continue
        norm = normalize_url(url)
        if not norm or norm in seen:
            continue
        seen.add(norm)
        if norm == base_url or parsed.path in ("", "/"):
            continue
        if is_low_value_url(norm):
            continue
        text = normalize_text(a.get_text(" ", strip=True))
        hay = f"{norm} {text}".lower()
        keyword_hits = sum(1 for k in keywords if k in hay)
        if keyword_hits == 0:
            continue
        nav_hits = sum(1 for k in nav_blocklist if k in hay)
        if nav_hits and not any(k in hay for k in strong_keywords):
            continue
        path = parsed.path.lower()
        path_hits = sum(1 for k in keywords if k in path)
        score = keyword_hits + (2 * path_hits)
        if re.search(r"/(grant|fund|opportun|procure|tender|rfp|rfq|apply|solicit)", path):
            score += 2
        scored.append((score, norm))
    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:max_candidates]
    return top if return_scored else [url for _, url in top]


def count_internal_links(soup, base_url):
    if not soup or not base_url:
        return 0
    base_netloc = urlparse(base_url).netloc
    count = 0
    for a in soup.find_all("a", href=True):
        href = (a.get("href") or "").strip()
        if not href or href.startswith(("mailto:", "tel:", "javascript:")):
            continue
        if "#" in href:
            continue
        url = urljoin(base_url, href)
        if urlparse(url).netloc != base_netloc:
            continue
        count += 1
    return count


def score_text_block(text, keywords, opportunity_keywords, noise_keywords):
    lower = (text or "").lower()
    score = 0
    if keyword_match(lower, keywords):
        score += 1
    if opportunity_keywords and any(k in lower for k in opportunity_keywords):
        score += 3
    if re.search(r"\\b(deadline|closing date|due date|submit|submission)\\b", lower):
        score += 2
    if re.search(r"[$€£]|\\busd\\b|\\beur\\b|\\bgbp\\b", lower):
        score += 1
    if noise_keywords and any(k in lower for k in noise_keywords):
        score -= 2
    if len(lower) < 80:
        score -= 1
    return score


def extract_relevant_text(soup, keywords, opportunity_keywords=None, noise_keywords=None):
    strip_noise(soup)
    blocks = []
    for tag in soup.find_all(["h1", "h2", "h3", "p", "li", "td", "th"]):
        text = normalize_text(tag.get_text(" ", strip=True))
        if len(text) < 30:
            continue
        score = score_text_block(text, keywords, opportunity_keywords or [], noise_keywords or [])
        blocks.append((score, text))
    if not blocks:
        return ""

    positive = [b for b in blocks if b[0] > 0]
    selected = positive if positive else blocks[:10]
    selected = sorted(selected, key=lambda x: x[0], reverse=True)
    joined = " ".join([b[1] for b in selected[:8]])
    return joined[:MAX_TEXT_CHARS]


def infer_type(text, hint=None):
    if hint:
        return hint
    lower = (text or "").lower()
    if any(k in lower for k in ["rfp", "request for proposals", "tender", "solicitation", "bid", "procurement"]):
        return "RFP"
    if "fellowship" in lower:
        return "Fellowship"
    if "challenge" in lower or "prize" in lower:
        return "Challenge"
    if "consultant" in lower or "consultancy" in lower:
        return "RFP"
    return "Grant"


def infer_sectors(text, max_sectors=3):
    normalized = normalize_text(text or "")
    lower = normalized.lower()
    if not lower or is_nav_like(normalized) or len(lower) < 40:
        return ["General"]
    sectors = []
    prefix = lower[:120]
    for sector, keywords in SECTOR_KEYWORDS.items():
        hits = 0
        strong = False
        for keyword in keywords:
            pattern = None
            if keyword.endswith("*"):
                pattern = r"\b" + re.escape(keyword[:-1])
            elif keyword.isalpha():
                if len(keyword) <= 4:
                    pattern = r"\b" + re.escape(keyword) + r"s?\b"
                else:
                    pattern = r"\b" + re.escape(keyword) + r"\w*\b"
            if pattern:
                matches = re.findall(pattern, lower)
                hits += len(matches)
                if not strong and re.search(pattern, prefix):
                    strong = True
            else:
                if keyword in lower:
                    hits += 1
                    if keyword in prefix:
                        strong = True
        if strong or hits >= 2:
            sectors.append(sector)
    if not sectors:
        return ["General"]
    return sectors[:max_sectors]


def extract_title_from_html(html, file_ext_blocklist):
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    for attr in ("property", "name"):
        for key in ("og:title", "twitter:title"):
            meta = soup.find("meta", attrs={attr: key})
            if meta and meta.get("content"):
                value = normalize_text(meta.get("content"))
                if value and not is_bad_title(value, file_ext_blocklist):
                    return value
    for tag in soup.find_all(["h1", "h2"], limit=6):
        value = normalize_text(tag.get_text(" ", strip=True))
        if value and not is_bad_title(value, file_ext_blocklist):
            return value
    for tag in soup.find_all("h3", limit=6):
        value = normalize_text(tag.get_text(" ", strip=True))
        if value and not is_bad_title(value, file_ext_blocklist):
            return value
    if soup.title:
        value = normalize_text(soup.title.get_text(" ", strip=True))
        if value and not is_bad_title(value, file_ext_blocklist):
            return value
    return ""

def normalize_type(value):
    if not value:
        return None
    v = str(value).strip().lower()
    if v in ["rfp", "tender", "solicitation", "bid", "procurement", "consultancy", "consultant"]:
        return "RFP"
    if v in ["fellowship"]:
        return "Fellowship"
    if v in ["challenge", "prize"]:
        return "Challenge"
    if v in ["grant", "funding"]:
        return "Grant"
    return None


def normalize_sectors(value):
    if not value:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    return [str(value).strip()]


def summarize_text(text):
    text = normalize_text(text)
    if not text:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return " ".join(sentences[:2])[:320]


def clean_title(title):
    title = normalize_text(title)
    if not title:
        return ""
    title = re.sub(r"([A-Za-z])&([A-Za-z])", r"\1 & \2", title)
    title = re.sub(r"\bopportunties\b", "opportunities", title, flags=re.I)
    if " / " in title or title.endswith("/"):
        parts = [p.strip() for p in title.split("/") if p.strip()]
        if parts:
            title = parts[-1]
    lower = title.lower()
    if is_generic_title(title):
        return ""
    if lower.startswith("title "):
        title = title[6:].strip()
    stop_tokens = ["Ref No", "UNDP Office/Country", "Process", "Deadline", "Posted"]
    for token in stop_tokens:
        idx = title.find(token)
        if idx > 6:
            title = title[:idx].strip(" -:|")
            break
    for prefix in ["Procurement Notices -", "Procurement Notice -", "Procurement Notices:", "Procurement Notice:"]:
        if title.startswith(prefix):
            title = title[len(prefix):].strip()
    for sep in [" | ", " • ", " - "]:
        if sep in title and len(title) > 140:
            title = title.split(sep)[0].strip()
            break
    if len(title) > 180:
        title = title[:177].rstrip() + "..."
    if is_generic_title(title):
        return ""
    return title


def clean_summary(summary, title=None):
    text = normalize_text(summary)
    if not text:
        return ""
    text = re.sub(r"([A-Za-z])&([A-Za-z])", r"\1 & \2", text)
    if title:
        tl = title.lower()
        if text.lower().startswith(tl):
            text = text[len(title):].lstrip(" -:|")
        text = re.sub(rf"({re.escape(title)})\\s+\\1", r"\1", text, flags=re.I)
    text = re.sub(r"^home\s*/\s*", "", text, flags=re.I)
    text = re.sub(r"\bskip to main content\b", "", text, flags=re.I)
    text = re.sub(r"\bclick here\b", "", text, flags=re.I)
    text = re.sub(r"^Procurement Notices? - [A-Z0-9-]+ - ", "", text, flags=re.I)
    text = re.sub(r"^Procurement Notices? - ", "", text, flags=re.I)
    meta_patterns = [
        r"Ref No\s*\S+",
        r"UNDP Office/Country\s*\S+",
        r"Process\s+\S+(?:\s+\S+){0,3}",
        r"Deadline\s+\S+(?:\s+\S+){0,3}",
        r"Posted\s+\S+(?:\s+\S+){0,3}",
    ]
    for pattern in meta_patterns:
        text = re.sub(pattern, "", text, flags=re.I)
    text = re.sub(r"showing\s+\d+\s+to\s+\d+\s+results.*", "", text, flags=re.I)
    repeats = [
        r"\bgrant opportunities\b",
        r"\bfunding opportunities\b",
        r"\blearn more\b",
        r"\bmore to explore\b",
    ]
    for phrase in repeats:
        text = re.sub(rf"({phrase})(?:\s+\1)+", r"\1", text, flags=re.I)
    parts = re.split(r"(?<=[.!?])\s+", text)
    seen = set()
    deduped = []
    for part in parts:
        part = normalize_text(part)
        if not part:
            continue
        if any(re.search(pattern, part.lower()) for pattern in LOW_VALUE_SUMMARY_PATTERNS):
            continue
        key = part.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(part)
    text = " ".join(deduped)
    if len(text) > 320:
        text = text[:317].rstrip() + "..."
    return text


def improve_title_from_context(candidate, detail_text, file_ext_blocklist):
    title = clean_title(candidate.get("title") or "")
    if title and not is_generic_title(title):
        return title
    detail_title = extract_title_from_html(detail_text, file_ext_blocklist)
    detail_title = clean_title(detail_title)
    if detail_title:
        return detail_title
    if detail_text:
        first_sentence = normalize_text(re.split(r"[.!?]", detail_text)[0])
        if 10 <= len(first_sentence) <= 120 and not is_generic_title(first_sentence):
            return clean_title(first_sentence)
    context = normalize_text(candidate.get("context") or "")
    if context and not is_generic_title(context) and len(context) <= 120:
        return clean_title(context)
    return ""


def fallback_title_for_record(source, url, detail_text, file_ext_blocklist):
    detail_title = extract_title_from_html(detail_text, file_ext_blocklist)
    detail_title = clean_title(detail_title)
    if detail_title:
        return detail_title
    raw_from_url = clean_title_from_url(url or "")
    from_url = clean_title(raw_from_url)
    if from_url:
        if not is_generic_title(from_url):
            return from_url
        lower = from_url.lower()
        source_name = source.get("name") or "Funding"
        if "call for proposals" in lower or "call for proposal" in lower:
            return f"{source_name} Call for Proposals"
        if "grant" in lower or "funding" in lower:
            return f"{source_name} Grant Opportunities"
        if "opportunit" in lower:
            return f"{source_name} Opportunities"
    elif raw_from_url:
        lower = raw_from_url.lower()
        source_name = source.get("name") or "Funding"
        if "call for proposals" in lower or "call for proposal" in lower:
            return f"{source_name} Call for Proposals"
        if "grant" in lower or "funding" in lower:
            return f"{source_name} Grant Opportunities"
        if "opportunit" in lower:
            return f"{source_name} Opportunities"
    source_name = source.get("name") or "Funding"
    return f"{source_name} Opportunity"


def is_nav_like(text):
    lower = (text or "").lower()
    if lower.count("|") >= 3 or lower.count("•") >= 3:
        return True
    if re.search(r"(english|français|español|deutsch|italiano|português|русский|العربية|中文|日本語)", lower) and len(lower) < 260:
        return True
    return False


def is_relevant_record(
    record,
    opportunity_keywords,
    noise_keywords,
    strong_signal=False,
    negative_signal=False,
    require_strong=True,
    require_explicit=True,
    explicit_signal=False,
    min_summary_chars=60,
    allow_low_value_titles=False,
):
    title = (record.get("title") or "").lower()
    summary = (record.get("summary") or "").lower()
    url = (record.get("url") or "").lower()
    combined = f"{title} {summary} {url}"
    signal_keywords = set(
        opportunity_keywords
        + [k.lower() for k in KEYWORDS]
        + [k.lower() for k in STRONG_OPPORTUNITY_KEYWORDS]
        + ["deadline", "closing date"]
    )
    signal_hits = sum(1 for k in signal_keywords if k in combined)
    noise_hits = sum(1 for k in noise_keywords if k in combined)
    if "login" in combined or "sign in" in combined or "password" in combined:
        return False
    if is_low_value_url(record.get("url")) and not strong_signal and not has_positive_override(combined):
        return False
    if (not allow_low_value_titles) and is_low_value_title(record.get("title", "")) and not strong_signal and not has_positive_override(combined):
        return False
    if any(re.search(pattern, summary) for pattern in HARD_LOW_VALUE_SUMMARY_PATTERNS):
        return False
    if any(re.search(pattern, summary) for pattern in SOFT_LOW_VALUE_SUMMARY_PATTERNS) and signal_hits <= 1:
        return False
    if is_nav_like(summary):
        return False
    if negative_signal and not has_positive_override(combined):
        return False
    if require_explicit and not explicit_signal:
        return False
    if require_strong and not strong_signal and not has_positive_override(combined):
        return False
    if signal_hits == 0:
        return False
    if noise_hits >= 4 and signal_hits <= 1:
        return False
    if len(summary) < min_summary_chars and not any(k in title for k in signal_keywords):
        return False
    return True


def relevance_drop_reason(
    record,
    opportunity_keywords,
    noise_keywords,
    strong_signal=False,
    negative_signal=False,
    require_strong=True,
    require_explicit=True,
    explicit_signal=False,
    min_summary_chars=60,
    allow_low_value_titles=False,
):
    title = (record.get("title") or "").lower()
    summary = (record.get("summary") or "").lower()
    url = (record.get("url") or "").lower()
    combined = f"{title} {summary} {url}"
    signal_keywords = set(
        opportunity_keywords
        + [k.lower() for k in KEYWORDS]
        + [k.lower() for k in STRONG_OPPORTUNITY_KEYWORDS]
        + ["deadline", "closing date"]
    )
    signal_hits = sum(1 for k in signal_keywords if k in combined)
    noise_hits = sum(1 for k in noise_keywords if k in combined)
    if "login" in combined or "sign in" in combined or "password" in combined:
        return "not_relevant:login_page"
    if is_low_value_url(record.get("url")) and not strong_signal and not has_positive_override(combined):
        return "not_relevant:low_value_url"
    if (not allow_low_value_titles) and is_low_value_title(record.get("title", "")) and not strong_signal and not has_positive_override(combined):
        return "not_relevant:low_value_title"
    if any(re.search(pattern, summary) for pattern in HARD_LOW_VALUE_SUMMARY_PATTERNS):
        return "not_relevant:low_value_summary"
    if any(re.search(pattern, summary) for pattern in SOFT_LOW_VALUE_SUMMARY_PATTERNS) and signal_hits <= 1:
        return "not_relevant:low_value_summary"
    if is_nav_like(summary):
        return "not_relevant:navigation"
    if negative_signal and not has_positive_override(combined):
        return "not_relevant:negative_signal"
    if require_explicit and not explicit_signal:
        return "not_relevant:no_explicit_opportunity_signal"
    if require_strong and not strong_signal and not has_positive_override(combined):
        return f"not_relevant:require_strong_signal(hits={signal_hits})"
    if signal_hits == 0:
        return "not_relevant:no_opportunity_keywords"
    if noise_hits >= 4 and signal_hits <= 1:
        return "not_relevant:noise"
    if len(summary) < min_summary_chars and not any(k in title for k in signal_keywords):
        return "not_relevant:summary_too_short"
    return None


def chunk_text(text, size):
    return [text[i:i + size] for i in range(0, len(text), size)]


def parse_json_payload(content):
    content = strip_code_fences(content)
    if not content:
        return None
    try:
        return json.loads(content)
    except Exception:
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(content[start:end + 1])
            except Exception:
                return None
    return None


def llm_extract(text):
    global LLM_ERROR_COUNT, USE_JSON_MODE
    if not client or not ENABLE_LLM:
        return {}
    chunks = chunk_text(text, MAX_LLM_CHARS)[:MAX_LLM_CHUNKS]
    extracted = {}
    for chunk in chunks:
        prompt = (
            "Extract opportunity fields from the text below. Return ONLY JSON with keys: "
            "summary, type, deadline, agency, region, sectors, amount, eligibility, notes. "
            "Use null if missing. summary should be 1-2 sentences. "
            "type must be one of Grant, RFP, Consultancy, Fellowship, Challenge, or null. "
            "sectors must be an array of strings.\n\nTEXT:\n"
            f"{chunk}"
        )
        try:
            kwargs = {
                "model": os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0,
            }
            if USE_JSON_MODE:
                kwargs["response_format"] = {"type": "json_object"}
            resp = client.chat.completions.create(**kwargs)
            content = (resp.choices[0].message.content or "").strip()
            data = parse_json_payload(content)
        except Exception as e:
            if USE_JSON_MODE:
                USE_JSON_MODE = False
            if LLM_ERROR_COUNT < LLM_ERROR_LIMIT:
                log_verbose(1, f"LLM extraction error: {e}")
            LLM_ERROR_COUNT += 1
            continue
        if not data:
            if LLM_ERROR_COUNT < LLM_ERROR_LIMIT:
                log_verbose(1, "LLM extraction error: non-JSON response")
            LLM_ERROR_COUNT += 1
            continue
        if isinstance(data, list):
            data = data[0] if data and isinstance(data[0], dict) else {}
        if isinstance(data, dict):
            for key, value in data.items():
                if value and not extracted.get(key):
                    extracted[key] = value
        if extracted.get("summary"):
            break
        time.sleep(REQUEST_DELAY)
    return extracted


def build_record(source, candidate, detail_text, parsed=None):
    parsed = parsed or {}
    base_text = f"{candidate.get('title', '')} {candidate.get('context', '')} {detail_text} {parsed.get('summary', '')} {parsed.get('title', '')}"
    llm_data = llm_extract(detail_text) if detail_text else {}

    llm_type = normalize_type(llm_data.get("type"))
    llm_sectors = normalize_sectors(llm_data.get("sectors"))
    parsed_type = normalize_type(parsed.get("type"))
    parsed_sectors = normalize_sectors(parsed.get("sectors"))

    summary_value = parsed.get("summary") or llm_data.get("summary") or summarize_text(detail_text or candidate.get("context", ""))
    summary_value = clean_summary(summary_value)
    if len(summary_value) < 80 and candidate.get("context"):
        summary_value = clean_summary(f"{summary_value} {candidate.get('context')}")

    record = {
        "id": None,
        "source": source.get("name"),
        "title": clean_title(parsed.get("title") or candidate.get("title") or ""),
        "agency": parsed.get("agency") or llm_data.get("agency") or source.get("agency") or source.get("name"),
        "region": parsed.get("region") or llm_data.get("region") or source.get("region") or "Global",
        "type": parsed_type or llm_type or infer_type(base_text, source.get("type_hint")),
        "sectors": parsed_sectors or llm_sectors or [],
        "amount": parsed.get("amount") or llm_data.get("amount") or None,
        "deadline": parsed.get("deadline") or llm_data.get("deadline") or candidate.get("deadline") or None,
        "url": candidate.get("url"),
        "summary": summary_value,
        "eligibility": parsed.get("eligibility") or llm_data.get("eligibility") or None,
        "notes": parsed.get("notes") or llm_data.get("notes") or f"Source: {source.get('name')}",
    }
    better_title = improve_title_from_context(candidate, detail_text, source.get("file_ext_blocklist", DEFAULT_FILE_EXT_BLOCKLIST))
    if better_title:
        record["title"] = better_title
    if not record.get("title") or is_low_value_title(record.get("title")):
        record["title"] = fallback_title_for_record(
            source,
            record.get("url"),
            detail_text,
            source.get("file_ext_blocklist", DEFAULT_FILE_EXT_BLOCKLIST),
        )
    record["summary"] = clean_summary(record.get("summary", ""), record.get("title"))
    if candidate.get("is_file"):
        record["summary"] = "Document link"
    if not parsed_sectors and not llm_sectors:
        sector_text = f"{record.get('title', '')} {record.get('summary', '')} {candidate.get('context', '')}"
        sectors = infer_sectors(sector_text)
        if sectors == ["General"] and candidate.get("context"):
            sectors = infer_sectors(candidate.get("context", ""))
        record["sectors"] = sectors
    if is_low_value_title(record.get("title")) or any(
        re.search(pattern, (record.get("summary") or "").lower()) for pattern in LOW_VALUE_SUMMARY_PATTERNS
    ):
        record["sectors"] = ["General"]
    return record


def process_source(source):
    if UNRESTRICTED:
        source = {
            **source,
            "force_all_links": True,
            "allow_external": True,
            "allow_file_links": True,
            "prefer_non_file_links": False,
        }
    list_urls = source.get("list_urls") or []
    if not list_urls:
        return []
    keywords = [k.lower() for k in source.get("keywords", KEYWORDS)]
    opportunity_keywords = [k.lower() for k in source.get("opportunity_keywords", OPPORTUNITY_KEYWORDS)]
    noise_keywords = [k.lower() for k in source.get("noise_keywords", NOISE_KEYWORDS)]
    max_items = None if UNRESTRICTED else source.get("max_items", DEFAULT_MAX_ITEMS)
    max_list_pages = len(list_urls) if UNRESTRICTED else source.get("max_list_pages", 1)
    max_records_per_source = None if UNRESTRICTED else source.get("max_records_per_source", DEFAULT_MAX_RECORDS_PER_SOURCE)
    request_timeout = source.get("request_timeout", REQUEST_TIMEOUT)
    request_delay = source.get("request_delay", REQUEST_DELAY)
    follow_detail = source.get("follow_detail", True) and not AUDIT_ONLY
    skip_non_html_details = source.get("skip_non_html_details", True)
    source_name = source.get("name")
    file_ext_blocklist = source.get("file_ext_blocklist", DEFAULT_FILE_EXT_BLOCKLIST)
    file_url_patterns = source.get("file_url_patterns", [])

    log_verbose(
        1,
        f"[source] {source_name} list_urls={len(list_urls)} "
        f"follow_detail={'yes' if follow_detail else 'no'}"
    )

    candidates = []
    fetched_pages = 0
    skipped_file_links = 0
    logged_errors = set()
    list_page_snapshots = []
    bot_blocks = 0
    http_404 = 0
    recovered_by_fallback = 0

    def extract_from_list(html, list_url):
        soup = BeautifulSoup(html, "html.parser")
        page_title = ""
        if soup.title:
            page_title = normalize_text(soup.title.get_text(" ", strip=True))
        if not page_title:
            heading = soup.find(["h1", "h2"])
            if heading:
                page_title = normalize_text(heading.get_text(" ", strip=True))
        page_text = extract_relevant_text(soup, keywords, opportunity_keywords, noise_keywords)
        if not page_text:
            page_text = normalize_text(soup.get_text(" ", strip=True))

        new_candidates, skipped, stats = extract_candidate_links(soup, list_url, source)
        log_verbose(
            1,
            f"[links] {list_url} anchors={stats['anchors_total']} "
            f"valid={stats['anchors_valid']} external_skipped={stats['skipped_external']} "
            f"keyword_skipped={stats['skipped_nonmatch']} file_skipped={stats['skipped_file']} "
            f"blocked_skipped={stats['skipped_blocked']} noise_skipped={stats['skipped_noise']} "
            f"strict_skipped={stats['skipped_strict']} allowlist_skipped={stats['skipped_allowlist']} "
            f"denylist_skipped={stats['skipped_denylist']} candidates={len(new_candidates)}"
        )
        if VERBOSE_LEVEL >= 1 and stats.get("skipped_allowlist", 0) > 100 and len(new_candidates) == 0:
            sample = stats.get("allowlist_samples") or []
            if sample:
                print(f"[allowlist-sample] {list_url} " + " | ".join(sample[:10]))

        allowlist_patterns = source.get("url_allowlist_patterns") or []
        should_retry_allowlist = allowlist_patterns and (
            not new_candidates or (stats.get("skipped_allowlist", 0) > 50 and len(new_candidates) < 3)
        )
        if should_retry_allowlist:
            log_verbose(1, "[allowlist-fallback] allowlist produced 0, retrying without allowlist")
            fallback_source = {**source, "url_allowlist_patterns": []}
            retry_candidates, retry_skipped, retry_stats = extract_candidate_links(soup, list_url, fallback_source)
            if retry_candidates:
                seen_urls = {c.get("url") for c in new_candidates}
                for cand in retry_candidates:
                    if cand.get("url") not in seen_urls:
                        new_candidates.append(cand)
                        seen_urls.add(cand.get("url"))
            skipped += retry_skipped

        if not new_candidates:
            regex_candidates = extract_regex_links(html, list_url, source)
            if regex_candidates:
                seen_urls = {c.get("url") for c in new_candidates}
                for cand in regex_candidates:
                    if cand.get("url") not in seen_urls:
                        new_candidates.append(cand)
                        seen_urls.add(cand.get("url"))
                log_verbose(1, f"[regex-fallback] {list_url} candidates={len(regex_candidates)}")

        if not new_candidates:
            data_candidates = extract_data_attribute_links(soup, list_url, source)
            if data_candidates:
                seen_urls = {c.get("url") for c in new_candidates}
                for cand in data_candidates:
                    if cand.get("url") not in seen_urls:
                        new_candidates.append(cand)
                        seen_urls.add(cand.get("url"))
                log_verbose(1, f"[data-link-fallback] {list_url} candidates={len(data_candidates)}")

        return soup, new_candidates, skipped, stats, page_title, page_text
    for list_url in list_urls[:max_list_pages]:
        list_url = normalize_url(list_url)
        if is_blocked_url(list_url):
            log_verbose(1, f"Source '{source_name}' blocked list URL for {list_url}")
            continue
        if is_file_url(list_url, file_ext_blocklist, file_url_patterns):
            log_verbose(1, f"Source '{source_name}' skipped file list URL for {list_url}")
            continue
        list_origin = get_origin(list_url)
        html, err, meta = fetch_html(list_url, timeout=request_timeout, referer=list_origin, source_name=source_name)
        fetched_pages += 1
        log_verbose(
            1,
            f"[list] {list_url} status={meta.get('status')} "
            f"ctype={meta.get('content_type', '')} err={err or 'ok'}"
        )
        fallback_payload = None
        if err:
            if err not in logged_errors:
                log_verbose(1, f"Source '{source_name}' fetch issue ({err}) for {list_url}")
                logged_errors.add(err)
            if err == "bot":
                bot_blocks += 1
            if (err or "").startswith("status:404"):
                http_404 += 1
                scored_fallback = discover_list_urls(
                    list_url,
                    source,
                    request_timeout=request_timeout,
                    max_candidates=5,
                    return_scored=True,
                    use_origin=True,
                )
                if scored_fallback:
                    log_verbose(1, f"[fallback-404-candidates] top={scored_fallback[:5]}")
                    chosen_payload = None
                    for score, candidate_url in scored_fallback:
                        list_origin = get_origin(candidate_url)
                        html2, err2, meta2 = fetch_html(
                            candidate_url,
                            timeout=request_timeout,
                            referer=list_origin,
                            source_name=source_name,
                        )
                        log_verbose(
                            1,
                            f"[list] {candidate_url} status={meta2.get('status')} "
                            f"ctype={meta2.get('content_type', '')} err={err2 or 'ok'}"
                        )
                        if err2:
                            if err2 == "bot":
                                bot_blocks += 1
                            if (err2 or "").startswith("status:404"):
                                http_404 += 1
                            continue
                        soup2, new_candidates2, skipped2, stats2, page_title2, page_text2 = extract_from_list(
                            html2, candidate_url
                        )
                        internal_links = count_internal_links(soup2, candidate_url)
                        if new_candidates2 or internal_links >= 10:
                            chosen_payload = (
                                candidate_url,
                                html2,
                                soup2,
                                new_candidates2,
                                skipped2,
                                stats2,
                                page_title2,
                                page_text2,
                            )
                            break
                    if chosen_payload:
                        recovered_by_fallback += 1
                        chosen_url = chosen_payload[0]
                        log_verbose(
                            1,
                            f"[fallback-404] chosen_url={chosen_url} reason=404 from={list_url}",
                        )
                        list_url = chosen_url
                        html = chosen_payload[1]
                        err = None
                        fallback_payload = chosen_payload
            if err:
                if err in ("login", "bot", "blocked") or (err or "").startswith("status:4"):
                    return {
                        "records": [],
                        "skipped_file_links": skipped_file_links,
                        "bot_blocks": bot_blocks,
                        "http_404": http_404,
                        "recovered_by_fallback": recovered_by_fallback,
                    }
                continue
        if fallback_payload:
            _, _, soup, new_candidates, skipped, stats, page_title, page_text = fallback_payload
        else:
            soup, new_candidates, skipped, stats, page_title, page_text = extract_from_list(html, list_url)
        seed_upgrade_reason = None
        if stats.get("anchors_valid", 0) < 5:
            seed_upgrade_reason = "low_anchors"
        elif len(new_candidates) == 0:
            seed_upgrade_reason = "zero_candidates"
        if seed_upgrade_reason:
            scored_upgrades = discover_list_urls(
                list_url,
                source,
                request_timeout=request_timeout,
                max_candidates=5,
                return_scored=True,
            )
            if not scored_upgrades:
                scored_upgrades = discover_list_urls(
                    list_url,
                    source,
                    request_timeout=request_timeout,
                    max_candidates=5,
                    return_scored=True,
                    use_origin=True,
                )
            if scored_upgrades:
                log_verbose(
                    1,
                    f"[seed-upgrade-candidates] source={source_name} from={list_url} "
                    f"top={scored_upgrades[:5]}",
                )
                for score, candidate_url in scored_upgrades:
                    if candidate_url == list_url:
                        continue
                    list_origin = get_origin(candidate_url)
                    html2, err2, meta2 = fetch_html(
                        candidate_url,
                        timeout=request_timeout,
                        referer=list_origin,
                        source_name=source_name,
                    )
                    log_verbose(
                        1,
                        f"[list] {candidate_url} status={meta2.get('status')} "
                        f"ctype={meta2.get('content_type', '')} err={err2 or 'ok'}"
                    )
                    if err2:
                        if err2 == "bot":
                            bot_blocks += 1
                        if (err2 or "").startswith("status:404"):
                            http_404 += 1
                        continue
                    soup2, new_candidates2, skipped2, stats2, page_title2, page_text2 = extract_from_list(
                        html2, candidate_url
                    )
                    internal_links = count_internal_links(soup2, candidate_url)
                    if new_candidates2 or stats2.get("anchors_valid", 0) >= 5 or internal_links >= 10:
                        log_verbose(
                            1,
                            f"[seed-upgrade] source={source_name} "
                            f"from={list_url} -> {candidate_url} reason={seed_upgrade_reason}",
                        )
                        list_url = candidate_url
                        list_origin = get_origin(list_url)
                        soup = soup2
                        new_candidates = new_candidates2
                        skipped = skipped2
                        stats = stats2
                        page_title = page_title2
                        page_text = page_text2
                        break

        list_page_snapshots.append(
            {
                "url": list_url,
                "title": page_title,
                "text": page_text,
            }
        )
        if not new_candidates and source.get("include_list_page_as_candidate"):
            file_ext_blocklist = source.get("file_ext_blocklist", DEFAULT_FILE_EXT_BLOCKLIST)
            if is_low_value_url(list_url):
                log_verbose(1, f"[fallback] Skipping low-value list page: {list_url}")
                continue
            title = ""
            if soup.title:
                title = normalize_text(soup.title.get_text(" ", strip=True))
            if is_bad_title(title, file_ext_blocklist):
                title = clean_title_from_url(list_url)
            page_text = extract_relevant_text(soup, keywords, opportunity_keywords, noise_keywords)
            keep_url_fragment = source.get("keep_url_fragment", False)
            candidates.append(
                {
                    "title": title or list_url,
                    "url": normalize_url(list_url, keep_fragment=keep_url_fragment),
                    "context": page_text[:320] if page_text else "",
                    "deadline": extract_deadline(page_text) if page_text else None,
                    "is_file": False,
                    "referer": get_origin(list_url),
                }
            )
            log_verbose(1, f"[fallback] Using list page as candidate: {list_url}")
        candidates.extend(new_candidates)
        skipped_file_links += skipped
        time.sleep(request_delay)

    seen = set()
    deduped = []
    for cand in candidates:
        key = cand.get("url") or cand.get("title")
        if key in seen:
            continue
        seen.add(key)
        deduped.append(cand)
    deduped.sort(key=lambda c: c.get("score", 0), reverse=True)

    hard_max_items = source.get("hard_max_items")
    if max_items:
        deduped = deduped[:max_items]
    if hard_max_items:
        deduped = deduped[:hard_max_items]

    records = []
    drop_reason_counts = Counter()
    candidate_drop_reasons = {}
    detail_attempts = 0
    detail_success = 0

    def record_drop(url, reason):
        if not url or not reason:
            return
        drop_reason_counts[reason] += 1
        if url not in candidate_drop_reasons:
            candidate_drop_reasons[url] = reason

    for cand in deduped:
        detail_text = ""
        parsed = {}
        if follow_detail:
            detail_attempts += 1
            html, err, meta = fetch_html(
                cand["url"],
                timeout=request_timeout,
                referer=cand.get("referer") or get_origin(cand["url"]),
                source_name=source_name,
            )
            log_verbose(
                1,
                f"[detail] {cand['url']} status={meta.get('status')} "
                f"ctype={meta.get('content_type', '')} err={err or 'ok'}"
            )
            if err:
                if err not in logged_errors:
                    log_verbose(1, f"Source '{source_name}' detail issue ({err}) for {cand['url']}")
                    logged_errors.add(err)
                record_drop(cand.get("url"), f"detail_fetch_failed:{err}")
                if skip_non_html_details and err in ("non-html", "blocked", "login", "bot"):
                    continue
            elif html:
                detail_success += 1
                domain = urlparse(cand["url"]).netloc
                parser = DETAIL_PARSERS.get(domain)
                if parser:
                    parsed = parser(html) or {}
                detail_title = extract_title_from_html(html, file_ext_blocklist)
                if detail_title and (is_bad_title(cand.get("title"), file_ext_blocklist) or is_generic_title(cand.get("title"))):
                    parsed = {**parsed, "title": parsed.get("title") or detail_title}
                detail_text = extract_relevant_text_from_html(
                    html, source, keywords, opportunity_keywords, noise_keywords
                )
                time.sleep(request_delay)
        record = build_record(source, cand, detail_text, parsed=parsed)
        signal_text = f"{record.get('title', '')} {record.get('summary', '')} {detail_text} {cand.get('context', '')}"
        strong_signal = has_strong_signal(signal_text)
        explicit_signal = has_explicit_opportunity_signal(signal_text)
        negative_signal = has_negative_signal(signal_text)
        require_strong = source.get("require_strong_signal", False)
        require_explicit = source.get("require_explicit_signal", True)
        min_summary_chars = source.get("min_summary_chars", 60)
        if FILTER_EXPIRED and not source.get("allow_expired", False):
            deadline_value = record.get("deadline") or extract_deadline(detail_text) or extract_deadline(cand.get("context") or "")
            deadline_date = parse_deadline_date(deadline_value)
            if deadline_date and deadline_date < date.today():
                record_drop(cand.get("url"), "expired:deadline_passed")
                continue
        if not is_relevant_record(
            record,
            opportunity_keywords,
            noise_keywords,
            strong_signal=strong_signal,
            negative_signal=negative_signal,
            require_strong=require_strong,
            require_explicit=require_explicit,
            explicit_signal=explicit_signal,
            min_summary_chars=min_summary_chars,
            allow_low_value_titles=source.get("allow_low_value_titles", False),
        ):
            reason = relevance_drop_reason(
                record,
                opportunity_keywords,
                noise_keywords,
                strong_signal=strong_signal,
                negative_signal=negative_signal,
                require_strong=require_strong,
                require_explicit=require_explicit,
                explicit_signal=explicit_signal,
                min_summary_chars=min_summary_chars,
                allow_low_value_titles=source.get("allow_low_value_titles", False),
            )
            record_drop(cand.get("url"), reason or "not_relevant:unknown")
            continue
        records.append(record)
        log_verbose(
            2,
            f"[record] {source_name} title={record.get('title', '')[:80]} "
            f"url={record.get('url')} deadline={record.get('deadline') or 'n/a'}"
        )

    if not records and source.get("record_list_page_if_relevant"):
        for snapshot in list_page_snapshots:
            text = snapshot.get("text") or ""
            if not text:
                continue
            if is_low_value_url(snapshot.get("url")):
                continue
            if any(re.search(pattern, text.lower()) for pattern in HARD_LOW_VALUE_SUMMARY_PATTERNS):
                continue
            if not (has_explicit_opportunity_signal(text) or has_strong_signal(text)):
                continue
            if has_negative_signal(text) and not has_positive_override(text):
                continue
            title = snapshot.get("title") or f"{source_name} Opportunities"
            if is_low_value_title(title):
                continue
            if is_bad_title(title, file_ext_blocklist):
                title = f"{source_name} Opportunities"
            list_candidate = {
                "title": title,
                "url": normalize_url(snapshot.get("url") or "", keep_fragment=source.get("keep_url_fragment", False)),
                "context": text[:320],
                "deadline": extract_deadline(text) if text else None,
                "is_file": False,
            }
            record = build_record(source, list_candidate, text)
            signal_text = f"{record.get('title', '')} {record.get('summary', '')} {text}"
            strong_signal = has_strong_signal(signal_text)
            explicit_signal = has_explicit_opportunity_signal(signal_text)
            negative_signal = has_negative_signal(signal_text)
            if is_relevant_record(
                record,
                opportunity_keywords,
                noise_keywords,
                strong_signal=strong_signal,
                negative_signal=negative_signal,
                require_strong=source.get("require_strong_signal", False),
                require_explicit=source.get("require_explicit_signal", True),
                explicit_signal=explicit_signal,
                min_summary_chars=source.get("min_summary_chars", 60),
                allow_low_value_titles=source.get("allow_low_value_titles", False),
            ):
                records.append(record)
                break

    if max_records_per_source:
        records = records[:max_records_per_source]
    hard_cap = source.get("hard_max_records_per_source")
    if hard_cap:
        records = records[:hard_cap]

    if not records:
        log_verbose(1, f"[zero-record] {source_name} candidates={len(deduped)} records=0")
        if not deduped:
            log_verbose(1, "  no candidates")
        else:
            for cand in deduped[:10]:
                url = cand.get("url")
                reason = candidate_drop_reasons.get(url, "unknown")
                log_verbose(1, f"  {url} -> {reason}")
        if drop_reason_counts:
            top_reasons = ", ".join(
                f"{k}({v})" for k, v in drop_reason_counts.most_common(5)
            )
            log_verbose(1, f"  drop reasons: {top_reasons}")
        summary_reason = "no candidates" if not deduped else "filtered_out"
        if detail_attempts and detail_success == 0 and drop_reason_counts:
            top_reason = drop_reason_counts.most_common(1)[0][0]
            if "detail_fetch_failed:bot" in top_reason or "detail_fetch_failed:blocked" in top_reason:
                summary_reason = "blocked by bot protection"
            else:
                summary_reason = top_reason
        elif any(has_negative_signal(s.get("text") or "") for s in list_page_snapshots):
            summary_reason = "no active opportunities found"
        elif drop_reason_counts:
            summary_reason = drop_reason_counts.most_common(1)[0][0]
        log_verbose(1, f"[zero-record-reason] {source_name}: {summary_reason}")

    log_verbose(
        1,
        f"Source '{source.get('name')}' fetched {fetched_pages} page(s), "
        f"candidates {len(candidates)}, records {len(records)}",
    )
    return {
        "records": records,
        "skipped_file_links": skipped_file_links,
        "bot_blocks": bot_blocks,
        "http_404": http_404,
        "recovered_by_fallback": recovered_by_fallback,
    }


def write_grants_js(records, path):
    for i, record in enumerate(records, start=1):
        record["id"] = i
    content = "export const grants = " + json.dumps(records, indent=2, ensure_ascii=True) + ";\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Saved grants to {path}")


def load_grants_js(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        start = text.find("[")
        end = text.rfind("]")
        if start == -1 or end == -1 or end <= start:
            return []
        return json.loads(text[start:end + 1])
    except Exception:
        return []


def reprocess_existing_grants(path, sources_by_name):
    records = load_grants_js(path)
    if not records:
        return []
    cleaned = []
    for record in records:
        source_name = record.get("source") or record.get("agency") or "Unknown"
        source = sources_by_name.get(
            source_name,
            {"name": source_name, "agency": source_name, "region": record.get("region") or "Global"},
        )
        title = clean_title(record.get("title", ""))
        summary = clean_summary(record.get("summary", ""), title)
        if not title or is_low_value_title(title) or is_placeholder_title(title, source_name):
            title = fallback_title_for_record(
                source,
                record.get("url"),
                summary or record.get("summary") or "",
                source.get("file_ext_blocklist", DEFAULT_FILE_EXT_BLOCKLIST),
            )
        summary = clean_summary(summary, title)
        if not summary:
            continue

        record_type = normalize_type(record.get("type")) or infer_type(
            f"{title} {summary}", source.get("type_hint")
        )
        sectors = infer_sectors(f"{title} {summary}")
        if not sectors:
            sectors = normalize_sectors(record.get("sectors"))
        if not sectors:
            sectors = ["General"]
        if is_low_value_title(title) or any(
            re.search(pattern, (summary or "").lower()) for pattern in LOW_VALUE_SUMMARY_PATTERNS
        ):
            sectors = ["General"]

        summary_lower = (summary or "").lower()
        signal_text = f"{title} {summary} {record.get('url') or ''}"
        strong_signal = has_strong_signal(signal_text)
        explicit_signal = has_explicit_opportunity_signal(signal_text)
        if is_low_value_url(record.get("url")) and not strong_signal:
            continue
        if (is_low_value_title(title) or is_placeholder_title(title, source_name)) and not strong_signal:
            continue
        if (is_low_value_title(title) or is_placeholder_title(title, source_name)) and len(summary or "") < 80:
            continue
        if any(re.search(pattern, summary_lower) for pattern in HARD_LOW_VALUE_SUMMARY_PATTERNS):
            continue
        if any(re.search(pattern, summary_lower) for pattern in SOFT_LOW_VALUE_SUMMARY_PATTERNS) and len(summary or "") < 80:
            continue
        if not explicit_signal:
            continue

        updated = {
            **record,
            "title": title,
            "summary": summary,
            "type": record_type,
            "sectors": sectors,
            "agency": record.get("agency") or source.get("agency") or source_name,
            "region": record.get("region") or source.get("region") or "Global",
        }

        if FILTER_EXPIRED and updated.get("deadline"):
            parsed_deadline = parse_deadline_date(updated.get("deadline"))
            if parsed_deadline and parsed_deadline < date.today():
                continue

        cleaned.append(updated)

    deduped = []
    seen = set()
    for record in cleaned:
        key = normalize_url(record.get("url"), keep_fragment=True) or record.get("title")
        if key in seen:
            continue
        seen.add(key)
        deduped.append(record)

    deduped_titles = []
    seen_titles = set()
    for record in deduped:
        title_key = normalize_text(record.get("title", "")).lower()
        source_key = (record.get("source") or record.get("agency") or "").lower()
        if title_key:
            title_sig = (source_key, title_key)
            if title_sig in seen_titles:
                continue
            seen_titles.add(title_sig)
        deduped_titles.append(record)

    for idx, record in enumerate(deduped_titles, start=1):
        record["id"] = idx

    return deduped_titles


def print_nontechnical_summary(total_records, records_by_source, output_path):
    sources_with_records = [name for name, count in records_by_source.items() if count > 0]
    sources_no_records = [name for name, count in records_by_source.items() if count == 0]
    print("\nSummary")
    print(f"Total opportunities found: {total_records}")
    print(f"Sources with opportunities: {len(sources_with_records)}")
    if sources_with_records:
        sample = ", ".join(sources_with_records[:6])
        more = " and others" if len(sources_with_records) > 6 else ""
        print(f"Examples: {sample}{more}")
    if sources_no_records:
        print(f"Sources with no current opportunities or unavailable: {len(sources_no_records)}")
    print(f"Output file: {output_path}")


def main():
    sources = []
    links = filter_seed_urls(load_links(LINKS_FILE))
    overrides_by_domain = {
        "sam.gov": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/opp/", r"/opportunity/"],
            "url_denylist_patterns": [r"/search", r"/help"],
            "strict_opportunity_match": True,
        },
        "www.bidnetdirect.com": {
            "requires_login": True,
            "url_allowlist_patterns": [r"/solicitations/", r"/public/solicitations/"],
            "url_denylist_patterns": [r"/authentication", r"/password", r"/buyers", r"/vendor-solutions"],
            "strict_opportunity_match": True,
        },
        "www.governmentcontracts.us": {
            "name": "GovernmentContracts.us",
            "url_allowlist_patterns": [r"/opportunity-details/"],
            "url_denylist_patterns": [r"/guide/", r"/free_trial"],
            "strict_opportunity_match": True,
        },
        "caleprocure.ca.gov": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"event", r"/events"],
            "strict_opportunity_match": True,
        },
        "emma.maryland.gov": {
            "requires_login": True,
            "url_denylist_patterns": [r"/usr/login"],
            "strict_opportunity_match": True,
        },
        "mvendor.cgieva.com": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"Opportunity", r"AllOpportunities"],
            "strict_opportunity_match": True,
        },
        "contracts.ocp.dc.gov": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/solicitations/"],
            "strict_opportunity_match": True,
        },
        "www.planning.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/consultants/rfp", r"/rfp/"],
            "strict_opportunity_match": True,
        },
        "www.gatesfoundation.org": {
            "name": "Gates Foundation",
            "url_allowlist_patterns": [r"/grant-opportunities", r"/grant"],
            "follow_detail": False,
            "record_list_page_if_relevant": False,
            "keep_url_fragment": True,
            "strict_opportunity_match": False,
            "require_strong_signal": True,
        },
        "www.bezosearthfund.org": {
            "name": "Bezos Earth Fund",
            "list_urls": [
                "https://www.bezosearthfund.org/grants",
                "https://www.bezosearthfund.org/funding",
                "https://www.bezosearthfund.org",
            ],
            "url_allowlist_patterns": [r"/grant", r"/opportun", r"/fund", r"/apply"],
            "follow_detail": False,
            "record_list_page_if_relevant": True,
            "strict_opportunity_match": False,
        },
        "www.bloomberg.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/grant", r"/opportun", r"/fund"],
            "strict_opportunity_match": False,
        },
        "www.rockefellerfoundation.org": {
            "name": "Rockefeller Foundation",
            "url_allowlist_patterns": [r"/our-grants", r"/grants", r"/fellowships", r"/bellagio-center",
                                       r"/residency", r"/convenings", r"/big-bets"],
            "url_denylist_patterns": [r"/news", r"/stories", r"/impact", r"/search", r"/press", r"/events"],
            "strict_opportunity_match": False,
        },
        "www.fordfoundation.org": {
            "name": "Ford Foundation",
            "url_allowlist_patterns": [r"/grant-opportunities", r"/our-grants", r"/fellowship"],
            "url_denylist_patterns": [r"/news", r"/stories", r"/press", r"/jobs"],
            "strict_opportunity_match": False,
        },
        "www.opensocietyfoundations.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/grants", r"/fellowship", r"/fellowships"],
            "url_denylist_patterns": [r"/news", r"/stories", r"/press", r"/about"],
            "strict_opportunity_match": False,
        },
        "www.macfound.org": {
            "name": "MacArthur Foundation",
            "url_allowlist_patterns": [r"/grants", r"/bigbets", r"/100andchange", r"/fellowship"],
            "url_denylist_patterns": [r"/whatsnew", r"/news", r"/stories", r"/press", r"/jobs"],
            "strict_opportunity_match": False,
        },
        "kresge.org": {
            "name": "Kresge Foundation",
            "url_allowlist_patterns": [r"/grants-social-investments", r"/funding"],
            "url_denylist_patterns": [r"/how-to-apply"],
            "strict_opportunity_match": False,
        },
        "lillyendowment.org": {
            "name": "Lilly Endowment Inc.",
            "url_allowlist_patterns": [r"/for-grantseekers", r"/grant", r"/fund"],
            "strict_opportunity_match": False,
        },
        "www.packard.org": {
            "name": "Packard Foundation",
            "list_urls": [
                "https://www.packard.org/grantees/funding-opportunities",
                "https://www.packard.org/what-we-fund",
                "https://www.packard.org",
            ],
            "url_allowlist_patterns": [r"/grantees/funding-opportunities", r"/fellowships", r"/fellowship",
                                       r"/grants", r"/apply"],
            "url_denylist_patterns": [r"/insights", r"/news", r"/stories"],
            "strict_opportunity_match": False,
        },
        "www.gih.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/rfp", r"/tender", r"/call", r"/fund", r"/grant"],
            "url_denylist_patterns": [r"/news", r"/publication", r"/articles", r"/profile", r"/directory",
                                      r"/join", r"/person/"],
            "strict_opportunity_match": False,
        },
        "www.openphilanthropy.org": {
            "name": "Open Philanthropy",
            "url_allowlist_patterns": [r"/how-to-apply", r"/funding", r"/grants", r"/open"],
            "url_denylist_patterns": [r"/research", r"/news", r"/search"],
            "strict_opportunity_match": False,
        },
        "www.deza.eda.admin.ch": {
            "name": "Swiss Development (DEZA)",
            "list_urls": [
                "https://www.deza.eda.admin.ch/en/procurement",
                "https://www.deza.eda.admin.ch/en/contracting-and-procurement",
                "https://www.deza.eda.admin.ch/en",
            ],
            "url_allowlist_patterns": [r"/procurement", r"/tender", r"/call", r"/fund"],
            "follow_detail": False,
            "record_list_page_if_relevant": False,
            "strict_opportunity_match": False,
            "require_strong_signal": True,
        },
        "english.rvo.nl": {
            "name": "RVO Subsidy Guide",
            "url_allowlist_patterns": [r"/subsidy-guide", r"/subsidy/", r"/programme/", r"/program"],
            "follow_detail": False,
            "record_list_page_if_relevant": False,
            "require_strong_signal": True,
            "keep_url_fragment": True,
            "strict_opportunity_match": False,
        },
        "www.giz.de": {
            "name": "GIZ (Germany)",
            "url_allowlist_patterns": [r"/workingwithgiz", r"/funding", r"/procurement"],
            "strict_opportunity_match": False,
        },
        "www.entwicklung.at": {
            "name": "Austrian Development Agency (ADA)",
            "url_allowlist_patterns": [r"/ada/funding", r"/funding", r"/cfp", r"/call", r"/tender"],
            "url_denylist_patterns": [r"/about", r"/news", r"/projects", r"/career", r"/staff"],
            "strict_opportunity_match": False,
        },
        "www.sida.se": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/research-calls-and-grants", r"/challenge-funds",
                                       r"/procurements-at-sida", r"/tender", r"/call"],
            "url_denylist_patterns": [r"/news", r"/about", r"/press", r"/publication"],
            "strict_opportunity_match": False,
        },
        "tdr.who.int": {
            "name": "WHO TDR",
            "list_urls": [
                "https://tdr.who.int/grants",
                "https://tdr.who.int/about-us",
            ],
            "url_allowlist_patterns": [r"/grants", r"/fellowship", r"/call", r"/funding"],
            "url_denylist_patterns": [r"/news", r"/publication", r"/about-us/people", r"/governance"],
            "strict_opportunity_match": False,
        },
        "ahpsr.who.int": {
            "name": "WHO AHPSR",
            "url_allowlist_patterns": [r"/call-for-proposals", r"/current-calls", r"/funding-opportunities"],
            "strict_opportunity_match": False,
        },
        "www.wkkf.org": {
            "name": "W.K. Kellogg Foundation",
            "url_allowlist_patterns": [r"/grantseekers", r"/apply", r"/grants"],
            "url_denylist_patterns": [r"/news", r"/stories", r"/awarded-grants"],
            "strict_opportunity_match": False,
        },
        "fire.biofin.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/single/"],
            "strict_opportunity_match": False,
        },
        "www.spc.int": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/procurement/tenders", r"/procurement\\?"],
            "url_denylist_patterns": [r"/cdn-cgi/", r"/fr/achats", r"/digitallibrary/",
                                      r"order=", r"sort=", r"field_"],
            "strict_opportunity_match": True,
            "hard_max_items": 200,
            "hard_max_records_per_source": 40,
        },
        "www.ireland.ie": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/tenders", r"/procurement", r"/funding", r"/call"],
            "url_denylist_patterns": [r"/news-and-publications/latest-news/news-archive/"],
            "strict_opportunity_match": False,
        },
        "www.tenders.gov.au": {
            "requires_login": True,
        },
        "procurement-notices.undp.org": {
            "name": "UNDP Procurement Notices",
            "url_allowlist_patterns": [],
            "url_denylist_patterns": [r"/search\\.cfm", r"/index\\.cfm", r"/view_awards\\.cfm"],
            "force_all_links": True,
            "disable_allowlist_when_forced": True,
            "strict_opportunity_match": False,
            "type_hint": "RFP",
            "detail_selectors": ["#printNotice", "#content", "main", ".content", "table"],
            "regex_link_extract_patterns": [
                r"(view_notice\\.cfm\\?[^\"'\\s<>]+)",
                r"(view_negotiation\\.cfm\\?[^\"'\\s<>]+)",
            ],
            "max_items": 25,
            "max_records_per_source": 20,
            "hard_max_records_per_source": 60,
            "min_summary_chars": 40,
        },
        "www.unops.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/business-opportunities", r"/procurement",
                                       r"/grant-support-call-for-proposal"],
            "url_denylist_patterns": [r"/news-and-stories", r"/jobs", r"/about", r"/impact"],
            "strict_opportunity_match": False,
        },
        "www.ungm.org": {
            "name": "UN Global Marketplace",
            "url_allowlist_patterns": [],
            "url_denylist_patterns": [r"/KnowledgeCenter", r"/Procurement_Categories", r"/BusSeminar",
                                      r"/IPS", r"/TenderAlertService"],
            "strict_opportunity_match": False,
            "require_strong_signal": True,
            "follow_detail": False,
            "max_items": 10,
            "max_records_per_source": 10,
            "min_summary_chars": 30,
            "opportunity_keywords": [
                "rfp",
                "rfq",
                "tender",
                "procurement",
                "notice",
                "invitation to bid",
                "expression of interest",
                "eoi",
            ],
        },
        "www.afdb.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/procurement", r"/tenders", r"/consultants"],
            "strict_opportunity_match": False,
        },
        "www.adb.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/business-opportunities", r"/projects/sector", r"/opportunit"],
            "strict_opportunity_match": False,
        },
        "www.iadb.org": {
            "name": "Inter-American Development Bank",
            "list_urls": [
                "https://www.iadb.org/en/how-we-can-work-together/procurement/procurement-projects",
                "https://www.iadb.org/en/how-we-can-work-together/procurement/corporate-procurement",
                "https://www.iadb.org/en/who-we-are/about-idb",
            ],
            "url_allowlist_patterns": [r"/procurement", r"/opportunit"],
            "strict_opportunity_match": False,
        },
        "www.worldbank.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/procurement", r"/business-opportunities", r"/vendors"],
            "strict_opportunity_match": False,
        },
        "wellcome.org": {
            "name": "Wellcome Trust",
            "list_urls": [
                "https://wellcome.org/grant-funding/schemes",
                "https://wellcome.org/research-funding/schemes",
            ],
            "url_allowlist_patterns": [r"/grant-funding/schemes", r"/research-funding/schemes", r"/funding"],
            "url_denylist_patterns": [r"/guidance/", r"/prepare-to-apply", r"/how-to-apply", r"/eligibility"],
            "strict_opportunity_match": False,
        },
        "www.greenclimate.fund": {
            "name": "Green Climate Fund",
            "url_allowlist_patterns": [r"procurement", r"tender", r"notice", r"supplier", r"opportunit", r"portal"],
            "url_denylist_patterns": [r"/supplier", r"/portal", r"/administrative-instruction", r"/instructions-to-bidders"],
            "allow_external": True,
            "follow_detail": True,
            "require_strong_signal": True,
            "strict_opportunity_match": False,
        },
        "www.judithneilsonfoundation.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/portfolio-innovation", r"/grant", r"/opportunit"],
            "strict_opportunity_match": False,
        },
        "mastercardfdn.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/fund", r"/grant", r"/opportunit"],
            "strict_opportunity_match": False,
        },
        "ec.europa.eu": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/tender-details", r"/opportunities/portal"],
            "strict_opportunity_match": False,
            "hard_max_items": 1000,
            "hard_max_records_per_source": 1000,
        },
        "www.dgmarket.com": {
            "requires_login": True,
            "url_allowlist_patterns": [r"/tenders", r"/tender"],
            "strict_opportunity_match": True,
        },
        "iucn.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/procurement", r"/tenders"],
            "strict_opportunity_match": True,
        },
        "www.devex.com": {
            "requires_login": True,
            "url_allowlist_patterns": [r"/jobs/", r"/funding"],
            "strict_opportunity_match": True,
        },
        "www.developmentaid.org": {
            "requires_login": True,
            "url_allowlist_patterns": [r"/tenders/", r"/grants/"],
            "strict_opportunity_match": True,
        },
        "reliefweb.int": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/jobs"],
            "strict_opportunity_match": True,
        },
        "impactfunding.substack.com": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/p/"],
            "strict_opportunity_match": False,
        },
        "skoll.org": {
            "name": "Skoll Foundation",
            "list_urls": [
                "https://skoll.org/skoll-awards",
                "https://skoll.org/awards",
                "https://skoll.org/apply",
                "https://skoll.org",
            ],
            "url_allowlist_patterns": [r"/session/"],
            "strict_opportunity_match": False,
        },
        "www.globalinnovation.fund": {
            "name": "Global Innovation Fund",
            "list_urls": [
                "https://www.globalinnovation.fund/apply",
                "https://www.globalinnovation.fund/how-to-apply",
                "https://www.globalinnovation.fund",
            ],
            "url_allowlist_patterns": [r"/apply", r"/fund", r"/grant", r"/opportunit"],
            "follow_detail": False,
            "record_list_page_if_relevant": True,
            "strict_opportunity_match": False,
        },
        "www.cleat.ai": {
            "requires_login": True,
            "url_denylist_patterns": [r"/authentication/signin"],
            "strict_opportunity_match": True,
        },
        "www.elmaphilanthropies.org": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/investment-framework", r"/grant", r"/opportunit"],
            "strict_opportunity_match": False,
        },
        "www.dfc.gov": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/work-with-us", r"/eligibility", r"/apply"],
            "strict_opportunity_match": False,
        },
        "www.ffa.int": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/work-with-us/tenders", r"/tenders/"],
            "url_denylist_patterns": [r"/awsm_job_openings"],
            "strict_opportunity_match": True,
        },
        "au.int": {
            "js_heavy": True,
            "url_allowlist_patterns": [r"/bids"],
            "strict_opportunity_match": True,
        },
        "jobs.undp.org": {
            "js_heavy": True,
            "hard_max_records_per_source": 40,
        },
        "ausconnect.dfat.gov.au": {
            "js_heavy": True,
        },
        "www.unido.org": {
            "js_heavy": True,
            "hard_max_records_per_source": 25,
        },
        "thelawrencefoundation.org": {
            "js_heavy": True,
        },
        "www.rwjf.org": {
            "js_heavy": True,
        },
    }
    grantmaker_relaxed_domains = {
        "www.gatesfoundation.org",
        "www.bezosearthfund.org",
        "www.bloomberg.org",
        "www.rockefellerfoundation.org",
        "www.fordfoundation.org",
        "www.opensocietyfoundations.org",
        "www.macfound.org",
        "kresge.org",
        "lillyendowment.org",
        "www.packard.org",
        "www.gih.org",
        "www.openphilanthropy.org",
        "www.entwicklung.at",
        "www.wkkf.org",
        "wellcome.org",
        "www.judithneilsonfoundation.org",
        "mastercardfdn.org",
        "impactfunding.substack.com",
        "skoll.org",
        "www.globalinnovation.fund",
        "www.elmaphilanthropies.org",
        "www.dfc.gov",
        "thelawrencefoundation.org",
        "www.rwjf.org",
    }
    for domain in grantmaker_relaxed_domains:
        overrides_by_domain.setdefault(domain, {})
        overrides_by_domain[domain].setdefault("require_explicit_signal", False)
    if links:
        link_sources = []
        for link in links:
            normalized = normalize_url(link)
            if not normalized:
                continue
            file_url_patterns = []
            if "spc.int/procurement" in normalized:
                file_url_patterns = ["/digitallibrary/"]
            try:
                domain = urlparse(normalized).netloc
            except Exception:
                domain = ""
            overrides = overrides_by_domain.get(domain, {})
            if "packard.org/approach" in normalized:
                overrides = {**overrides, "js_heavy": True}
            name = overrides.get("name", f"Manual Link: {normalized}")
            link_sources.append(
                {
                    "name": name,
                    "list_urls": [normalized],
                    "region": "Global",
                    "phase": 1,
                    "requires_login": False,
                    "js_heavy": False,
                    "allow_external": False,
                    "include_list_page_as_candidate": False,
                    "strict_opportunity_match": False,
                    "skip_non_html_details": True,
                    "file_url_patterns": file_url_patterns,
                    **overrides,
                }
            )
        sources = link_sources

    if not sources:
        print("No sources configured.")
        return

    phase1_sources = sources if UNRESTRICTED else [
        s for s in sources
        if s.get("phase", 1) == 1 and not s.get("requires_login") and not s.get("js_heavy")
    ]
    if not phase1_sources:
        print("No Phase 1 sources found (public, non-JS heavy).")
        return

    test_mode = os.getenv("TEST_MODE", "").lower() in ("1", "true", "yes")
    if test_mode:
        phase1_sources = phase1_sources[:2]

    all_records = []
    records_by_source = {}
    skipped_file_links_total = 0
    bot_blocks_total = 0
    http_404_total = 0
    recovered_by_fallback_total = 0
    for source in phase1_sources:
        if test_mode:
            source = {
                **source,
                "max_items": min(3, source.get("max_items", 3)),
                "max_records_per_source": min(3, source.get("max_records_per_source", 3)),
            }
        result = process_source(source)
        records = result.get("records", [])
        records_by_source[source.get("name")] = len(records)
        skipped_file_links_total += result.get("skipped_file_links", 0)
        bot_blocks_total += result.get("bot_blocks", 0)
        http_404_total += result.get("http_404", 0)
        recovered_by_fallback_total += result.get("recovered_by_fallback", 0)
        all_records.extend(records)

    if not all_records:
        sources_by_name = {s.get("name"): s for s in sources if s.get("name")}
        reprocessed = reprocess_existing_grants(OUTPUT_PATH, sources_by_name)
        if reprocessed:
            write_grants_js(reprocessed, OUTPUT_PATH)
            print("No new records found. Reprocessed existing grants output.")
        else:
            print("No records found. Keeping existing grants output.")
        return

    deduped_url = []
    seen = set()
    for record in all_records:
        key = normalize_url(record.get("url"), keep_fragment=True) or record.get("title")
        if key in seen:
            continue
        seen.add(key)
        deduped_url.append(record)

    deduped = []
    seen_titles = set()
    for record in deduped_url:
        title_key = normalize_text(record.get("title", "")).lower()
        source_key = (record.get("source") or record.get("agency") or "").lower()
        if title_key:
            title_sig = (source_key, title_key)
            if title_sig in seen_titles:
                continue
            seen_titles.add(title_sig)
        deduped.append(record)

    # Final guard: ensure no duplicates by URL or (source,title).
    final_deduped = []
    seen_urls = set()
    seen_title_sigs = set()
    dupes_removed = 0
    for record in deduped:
        url_key = normalize_url(record.get("url"), keep_fragment=True)
        title_key = normalize_text(record.get("title", "")).lower()
        source_key = (record.get("source") or record.get("agency") or "").lower()
        title_sig = (source_key, title_key) if title_key else None
        if url_key and url_key in seen_urls:
            dupes_removed += 1
            continue
        if title_sig and title_sig in seen_title_sigs:
            dupes_removed += 1
            continue
        if url_key:
            seen_urls.add(url_key)
        if title_sig:
            seen_title_sigs.add(title_sig)
        final_deduped.append(record)
    if dupes_removed:
        log_verbose(1, f"[dedupe] removed {dupes_removed} duplicate records in final check")
    deduped = final_deduped

    write_grants_js(deduped, OUTPUT_PATH)

    blocked_title_count = sum(
        1 for record in deduped
        if record.get("title", "").lower().endswith(tuple(DEFAULT_FILE_EXT_BLOCKLIST))
    )
    empty_summary_count = sum(1 for record in deduped if not record.get("summary"))

    if VERBOSE_LEVEL >= 1:
        print("\n=== Phase 1 Quality Report ===")
        print(f"Total records: {len(deduped)}")
        for name, count in records_by_source.items():
            print(f"- {name}: {count}")
        print(f"Titles ending with blocked extensions: {blocked_title_count}")
        print(f"Empty summaries: {empty_summary_count}")
        print(f"Skipped file links: {skipped_file_links_total}")
        print(f"bot_blocks: {bot_blocks_total}")
        print(f"http_404: {http_404_total}")
        print(f"recovered_by_fallback: {recovered_by_fallback_total}")
    else:
        print_nontechnical_summary(len(deduped), records_by_source, OUTPUT_PATH)


if __name__ == "__main__":
    main()
