from trainer import check
import csv
import pprint
from yelp.client import Client
from yelp.oauth1_authenticator import Oauth1Authenticator

auth = Oauth1Authenticator(
    consumer_key='LXzlm4Bdo4UL0CWDJ9sqzw',
    consumer_secret='ZuqOH9TviTuklof62f_rDV1E6zA',
    token='86R1fHmZwGXY1D0zSqlL8jb7wm7PQ7fg',
    token_secret='s1iD6vAWs84NSPazsC5_s24HhWs'
)

client = Client(auth)

def update_progress(progress):
    hashes = u'\u2588' * int(round(progress)/2)
    spaces = '_' * (50 - len(hashes))
    print ('\r[{0}] {1}%'.format(hashes + spaces, int(round(progress))), end='')

results = []
total = 0
with open('corpus/question_corpus.csv', 'r') as f:
    reader = csv.reader(f)
    for row in reader:
        total += 1
        pair = [row[1], check(row[0].lower().split())]
        results.append(pair)

true_count = 0
false_count = 0
count = 0
for result in results:

    count += 1
    update_progress(count/total*100)

    exp_answer = result[0]
    answer = result[1]

    params = {
        'term': answer
    }
    response = client.search('Pittsburgh', **params).businesses
    if len(response) > 0:
        response = response[0]
    else:
        if answer == exp_answer:
            true_count += 1
        else:
            false_count += 1
        continue
    name = response.name.lower()

    params = {
        'term': exp_answer
    }
    exp_response = client.search('Pittsburgh', **params).businesses[0]
    exp_name = exp_response.name.lower()

    category = ''
    if exp_response.categories is not None:
        for cat in exp_response.categories:
            if cat.name.lower() == exp_answer:
                category = cat.name.lower()

    # print (repr(exp_answer)+ ': ' + repr(answer) + '\n')
    # print (repr(exp_name)+ ': ' + repr(name) + '\n')
    # print (repr(exp_answer)+ ': ' + repr(category) + '\n')

    if exp_name == name or category == exp_answer:
        true_count += 1
    else:
        false_count += 1

print('\n_____________________')
print('2.0, questions:')
print('True: ' + str(true_count) + '\nFalse: ' + str(false_count))
print('\n' + '%.2f' % ((true_count / (true_count + false_count)) * 100) + '%')
print('_____________________')