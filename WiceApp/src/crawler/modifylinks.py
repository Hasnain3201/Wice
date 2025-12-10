import re
import os

FILE_NAME = "links.txt"

URL_PATTERN = re.compile(
    r'^(https?|ftp):\/\/'
    r'([A-Za-z0-9.-]+)\.[A-Za-z]{2,}'
    r'(\/\S*)?$'
)

def validateLink(link: str):
    return bool(URL_PATTERN.match(link.strip()))

def appendLink(link, filename = FILE_NAME):
    link = link.strip()

    if not validateLink(link):
        return "Invalid Link" #Invalid link error 

    if not os.path.exists(filename):
        open(filename, 'w').close()

    with open(filename, 'r+', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines()]
        
        if link in lines:
            return "Link already Exists" #Link already in file error
        
        f.write(link + "\n")
        
        return "Link Added"

def removeLink(link, filename = FILE_NAME):
    link = link.strip()
    
    if not os.path.exists(filename):

        return "Cannot find Links file" #File does not exist

    with open(filename, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f.readlines()]

    if link not in lines:

        return "Link not in list" #Link doesn't exist

    with open(filename, 'w', encoding='utf-8') as f:
        for l in lines:
            if l != link:
                f.write(l + "\n")

    return "Link removed"

def getAllLinks(filename = FILE_NAME):

    if not os.path.exists(filename):
        return [] #File doesnt exist

    with open(filename, 'r', encoding='utf-8') as f:
        links = [line.strip() for line in f if line.strip()]
    
    return links
