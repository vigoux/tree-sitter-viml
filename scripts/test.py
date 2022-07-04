#!/usr/bin/env python3

from os import path, listdir
from subprocess import run

QUERIES_DIR="queries"
TEST_DIR="test"

for query in listdir(QUERIES_DIR):
    qname = path.splitext(path.basename(query))[0]
    qpath = path.join(QUERIES_DIR, query)

    testpath = path.join(TEST_DIR, qname)
    if path.isdir(testpath):
        run(["tree-sitter", "query", "--test", qpath] + [ path.join(testpath, tfile) for tfile in listdir(testpath)])
