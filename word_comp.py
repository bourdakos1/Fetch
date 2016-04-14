# Copyright 2016 Nick Bourdakos. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import sys
import json
import re
from difflib import SequenceMatcher

# This is probably overkill, but it shouldnt be too bad

sentence = sys.argv[1].lower()
keywords = json.loads(sys.argv[2])

s = SequenceMatcher(None)

limit = 0.80

matches = {}
for keyword1 in keywords:

    length = len(re.sub("[^\w]", " ",  keyword1).split())

    new_sentence = re.sub("[^\w]", " ",  sentence).split()
    interests = []
    for i, word in enumerate(new_sentence):
        if (i < len(new_sentence) - (length-1)):
            inter = word
            for x in range(i + 1, i + length):
                inter += ' ' + new_sentence[x]
            interests.append(inter)

    for interest in interests:
        s.set_seq2(interest.lower())
        for keyword in keywords:
            s.set_seq1(keyword.lower())
            b = s.ratio()>=limit
            if b:
                if keyword not in matches or matches[keyword] < s.ratio():
                    matches[keyword] = s.ratio()

if len(matches) == 0:
    print('')
else:
    print (max(iter(matches.keys()), key=(lambda key: matches[key])))
