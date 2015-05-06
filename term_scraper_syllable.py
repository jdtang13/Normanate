from HTMLParser import HTMLParser
import urllib2 
import re
import string
import sys

pages = [60, 53, 84, 46,38, 42,34,36,37,10,9,31,56,20,22,81,6,46,108,46,24,15,22,1,4,3]

# Record: emphasis sequence (includes number of syllables)

# for every word existing in etymologies.txt:
# 	look up the word, find its syllable sequence on thefreedictionary.com (note: syllable right before apostrophe has the stress)
# 	write the syllable sequence back to etymologies_syllables.txt

# format:
# acrylic,Latin,010
# note: 1 = stress, 0 is unstressed

#  the easier way is to go from left to right and:
#   when you reach a "-", write a 0
#   when you reach a "'", write a 1
#   that's it you're done.

#  high-level 
 
# TODO -- haven't touched MyHTMLParser yet, but the for-loop is there

class MyHTMLParser(HTMLParser):

	title_enabled = False
	description_enabled = False
	title = ""
	description = ""

	def handle_starttag(self, tag, attributes):
		if tag != 'span':
			return
		for name, value in attributes:
			if name == 'class' and value == 'pron':
				print attributes 
				return

	def handle_endtag(self, tag):
		return

	def handle_data(self, data):
		print data
		return

lines = (line.rstrip('\n') for line in open('etymologies.txt'))

for line in lines:
	word = line.split(',')[0]

	string = 'http://www.thefreedictionary.com/' + word

	response = urllib2.urlopen(string)
	html = response.read()

	parser = MyHTMLParser()
	parser.feed(html)

	parser.close()

# response = urllib2.urlopen('http://www.etymonline.com/index.php?l=a&p=0&allowed_in_frame=0')
# html = response.read()
# parser = MyHTMLParser()
# parser.feed(html)
# parser.close()




