from HTMLParser import HTMLParser
import urllib2 
import re
import string
import sys
import time

class MyHTMLParser(HTMLParser):

	syllable_enabled = False
	cur_cadence = ""
	cur_word = ""
	cur_stack = 0
	bold_enabled = False
	bold_word = ""

	def handle_data(self, data):
		if self.bold_enabled:
			self.bold_word = data
		if self.syllable_enabled:
			print "data: " + data
			result = data
			tokens = result.split("-")
			for token in tokens:
				if token == self.bold_word:
					self.cur_cadence = self.cur_cadence + "1"
				else:
					self.cur_cadence = self.cur_cadence + "0"

		#print "Encountered some data :", data
	def handle_starttag(self, tag, attrs):
		if tag == 'span':
			attrs_dict = dict(attrs)
			if "class" in attrs_dict and attrs_dict["class"] == "pron spellpron":
				self.syllable_enabled = True
				self.cur_stack = 0
			self.cur_stack += 1
			if self.syllable_enabled and "class" in attrs_dict and attrs_dict["class"] == "dbox-bold":
				self.bold_enabled = True
	def handle_endtag(self, tag):
		if tag == 'span' and self.bold_enabled == True:
			self.bold_enabled = False
		if tag == 'span' and self.syllable_enabled == True:
			self.cur_stack -= 1
			if self.cur_stack == 0:
				self.syllable_enabled = False
				sys.stdout.write(self.cur_word + ":" + self.cur_cadence + "\n")
				self.cur_cadence = ""
				self.bold_enabled = False
				self.bold_word = ""


f = open('etymologies.txt', 'r')
line = f.readline()
while line != None:
	tokens = line.split(',')
	word = tokens[0]
	sys.stdout.write(word + "\n")
	#url = 'http://en.wiktionary.org/wiki/' + word
	#url = 'http://www.thefreedictionary.com/' + word
	url = 'http://dictionary.reference.com/browse/' + word
	try:
		response = urllib2.urlopen(url)
	except:
		print "error"
	html = response.read()
	parser = MyHTMLParser()
	parser.cur_word = word
	parser.feed(html)
	parser.close()
	line = f.readline()
