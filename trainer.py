import csv
import re
import itertools
import sys

def collapse_word(word):
    return ''.join(ch for ch, _ in itertools.groupby(word.rstrip().rstrip('?').rstrip('!').rstrip('.').lower()))

weight_n0        = 1.0
weight_n1        = 0.01
weight_n2        = 0.0
weight_big_list  = 0.0
weight_not_found = 0.0
boost_weight     = 0.4
threshold        = 0.4

def create_stats():
    statistics = {}
    with open('corpus/question_corpus.csv', 'r') as f:
        reader = csv.reader(f)
        # read in row for row
        for row in reader:
            # loop through each word in the question
            sentence = row[0].split()
            subject = row[1]
            for i, word in enumerate(sentence):
                # check words around the word to build stats
                word = collapse_word(word)

                if word not in statistics:
                    value = [0, 0, 0, 0, 0, 0]
                    statistics[word] = value

                # update count of the word
                statistics[word][5] = statistics[word][5] + 1

                if i >= 2 and re.findall(r'\b'+re.escape(sentence[i-2])+r'\b', subject):
                    statistics[word][0] += 1
                if i >= 1 and re.findall(r'\b'+re.escape(sentence[i-1])+r'\b', subject):
                    statistics[word][1] += 1
                if re.findall(r'\b'+re.escape(sentence[i])+r'\b', subject):
                    statistics[word][2] += 1
                if i < len(sentence) - 1 and re.findall(r'\b'+re.escape(sentence[i+1])+r'\b', subject):
                    statistics[word][3] += 1
                if i < len(sentence) - 2 and re.findall(r'\b'+re.escape(sentence[i+2])+r'\b', subject):
                    statistics[word][4] += 1
    return statistics

def check(sentence):
    statistics = create_stats()
    sentence_stats = {}

    for i, word in enumerate(sentence):
        sentence_stats[i] = []

    for i, word in enumerate(sentence):
        word = collapse_word(word)
        if word in statistics and  statistics[word][5] != 0:
            sentence_stats[i].append((statistics[word][2] / statistics[word][5]) * weight_n0)
            if i >= 2:
                sentence_stats[i-2].append((statistics[word][0] / statistics[word][5]) * weight_n2)
            if i >= 1:
                sentence_stats[i-1].append((statistics[word][1] / statistics[word][5]) * weight_n1)
            if i < len(sentence) - 1:
                sentence_stats[i+1].append((statistics[word][3] / statistics[word][5]) * weight_n1)
            if i < len(sentence) - 2:
                sentence_stats[i+2].append((statistics[word][4] / statistics[word][5]) * weight_n2)
        else:
            sentence_stats[i].append(weight_not_found * weight_n0)

    sentence_stats2 = {}
    for stat_key in sentence_stats.keys():
        value = 0
        for val in sentence_stats[stat_key]:
            value += val
        if len(sentence_stats[stat_key]) > 0:
            sentence_stats2[stat_key] = value / len(sentence_stats[stat_key])

    total = 0
    for stat in sentence_stats2.values():
        total += stat

    for key, value in sentence_stats2.items():
        if total != 0:
            sentence_stats2[key] = value / total

    for key, value in sentence_stats2.items():
        if total != 0:
            sentence_stats2[key] = value / max(sentence_stats2.values())

    boost = 0
    answer = ''
    for key in sentence_stats2.keys():
        # This should be okay
        sentence_stats2[key] = sentence_stats2[key] + boost
        if sentence_stats2[key] > threshold:
            boost = sentence_stats2[key] * boost_weight
            answer += sentence[key] + ' '
        else:
            boost = 0


    answer = answer.rstrip().rstrip('?').rstrip('!').rstrip('.').lower()
    if len(answer.split()) == 0:
        answer = ' '.join(sentence).rstrip().rstrip('?').rstrip('!').rstrip('.').lower()

    return answer

if len(sys.argv) > 1:
    question = sys.argv[1].lower()
    answer = check(question.split())

    # Write results to file
    fd = open('public/user_populated.csv','a')
    fd.write('\n' + question + ',' + answer)
    fd.close()

    print (answer)
