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

from urllib.parse import quote
import json
import requests
import sys
import re
from yelp.client import Client
from yelp.oauth1_authenticator import Oauth1Authenticator

auth = Oauth1Authenticator(
    consumer_key='replace_with_key',
    consumer_secret='replace_with_key',
    token='replace_with_key',
    token_secret='replace_with_key'
)

client = Client(auth)

subject = 'papa da vinci'

if len(sys.argv) > 1:
    subject = sys.argv[1]
    sys.argv[2]
    sys.argv[3]

menus = {
    'menus': []
}

def create_menu(name):
    menu = {
        'name': name,
        'sections': []
    }
    return menu

def create_section(name, description):
    section = {
        'name': name,
        'description': description,
        'items': []
    }
    return section

def create_item(name, description, price):
    item = {
        'name': name,
        'description': description,
        'price': price
    }
    return item

params = {
    'term': subject
}

businesses = client.search('Pittsburgh', **params).businesses

menu_object = ''
for business in businesses:
    provider = business.menu_provider
    if provider:
        menus['name'] = business.name
        menus['logo'] = business.image_url
        menus['stars'] = business.rating
        menus['reviews'] = business.review_count

        name = quote(business.name)

        locu_key = 'replace_with_key'
        foursquare_id = 'replace_with_key'
        foursquare_secret = 'replace_with_key'
        foursquare_key = 'client_id='+ foursquare_id + '&client_secret=' + foursquare_secret + '&v=20160405'

        # Locu
        menu_object = ''
        url = 'https://api.locu.com/v1_0/venue/search/?name=' + name + '&locality=pittsburgh&api_key=' + locu_key
        place = requests.get(url).json()

        if len(place['objects']) > 0:
            place_id = place['objects'][0]['id']
            url = 'https://api.locu.com/v1_0/venue/' + place_id + '/?api_key=' + locu_key
            menu_object = requests.get(url).json()

        # Check locu
        if len(menu_object) > 0 and len(menu_object['objects'][0]['menus']) > 0:
            for i, menu in enumerate(menu_object['objects'][0]['menus']):
                name = ''
                if 'menu_name' in menu:
                    name = menu['menu_name']
                menus['menus'].append(create_menu(name))
                for j, section in enumerate(menu['sections']):
                    if 'section_name' in section:
                        name = section['section_name']
                        description = ''
                        menus['menus'][i]['sections'].append(create_section(name, description))
                    for subsection in section['subsections']:
                        if 'subsection_name' in section:
                            name = section['subsection_name']
                            description = ''
                            menus['menus'][i]['sections'].append(create_section(name, description))
                        for item in subsection['contents']:
                            if item['type'] == 'ITEM':
                                name = ''
                                if 'name' in item:
                                    name = item['name']
                                description = ''
                                if 'description' in item:
                                    description = item['description']
                                price = ''
                                if 'price' in item:
                                    price = item['price']
                                menus['menus'][i]['sections'][j]['items'].append(create_item(name, description, price))
                            elif item['type'] == 'SECTION_TEXT':
                                description = ''
                                if 'text' in item:
                                    description = item['text']
                                menus['menus'][i]['sections'][j]['description'] = description

            break

        # Foursquare
        menu_object = ''
        url = 'https://api.foursquare.com/v2/venues/search?ll=40.43767,-79.95599&query=' + name + '&' + foursquare_key
        place = requests.get(url).json()

        if 'venues' in place['response'] and len(place['response']['venues']) > 0:
            place_id = place['response']['venues'][0]['id']
            url = 'https://api.foursquare.com/v2/venues/' + place_id + '/menu?' + foursquare_key
            menu_object = requests.get(url).json()

        # Check foursquare
        if len(menu_object) > 0 and menu_object['meta']['code'] == 200 and 'items' in menu_object['response']['menu']['menus']:
            for i, menu in enumerate(menu_object['response']['menu']['menus']['items']):
                name = ''
                if 'name' in menu:
                    name = menu['name']
                menus['menus'].append(create_menu(name))
                for j, section in enumerate(menu['entries']['items']):
                    name = ''
                    if 'name' in section:
                        name = section['name']
                    description = ''
                    if 'description' in section:
                        description = section['description']
                    menus['menus'][i]['sections'].append(create_section(name, description))
                    for item in section['entries']['items']:
                        name = ''
                        if 'name' in item:
                            name = item['name']
                        description = ''
                        if 'description' in item:
                            description = item['description']
                        price = ''
                        if 'price' in item:
                            price = item['price']
                        menus['menus'][i]['sections'][j]['items'].append(create_item(name, description, price))
            break

print(json.dumps(menus))
