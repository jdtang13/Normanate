from HTMLParser import HTMLParser
import urllib2 
import re
import string
import sys

pages = [60, 53, 84, 46,38, 42,34,36,37,10,9,31,56,20,22,81,6,46,108,46,24,15,22,1,4,3]

# Record: emphasis sequence (includes number of syllables)

# acrylic = (ə-krĭl′ĭk) = a   KRIL    ik

# for every word existing in etymologies.txt:
# 	look up the word, find its syllable sequence on thefreedictionary.com (note: syllable right before apostrophe has the stress)
# 	write the syllable sequence back to etymologies_syllables.txt

# format:
# acrylic,Latin,010
# note: 1 = stress, 0 is unstressed

# example: neanderthal = (nē-ăn′dər-thôl′, -tôl′, nā-än′dər-täl′)
#  for simplicity use the #1 first pronunciation, delimited by commas -> nē-ăn′dər-thôl′
#  the syllables are delimited by hyphens -> nē     ăn′dər      thôl′
#  convert apostrophes to delimit PLUS stress on previous syllable ->   nē     AN    dər   THOL

#  actually, screw all of this. the easier way is to go from left to right and:
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

	def handle_data(self, data):
		if self.title_enabled:
			result = data
			for i in range(len(result)):
				if result[i] == '(':
					result = result[:i]
					break

			result = result.strip()
			self.title += result
		if self.description_enabled:
			self.description += " " + data
		#print "Encountered some data :", data
	def handle_starttag(self, tag, attrs):
		if tag == 'a':
			attrs_dict = dict(attrs)
			if "class" in attrs_dict:
				return
			# print attrs_dict['href']
			if re.search('/index.php\\?term=.*&allowed_in_frame=0', attrs_dict['href']):
				self.title_enabled = True
		elif tag == 'dd':
			self.description_enabled = True
	def handle_endtag(self, tag):
		if tag == 'a' and self.title_enabled == True:
			self.title_enabled = False
			sys.stdout.write(self.title + ",")
			self.title = ""
		if tag == 'dd':
			self.description_enabled = False
			words = self.description.split()
			# for word in words:
			# 	if word in etymologies:
			# 		print word
			# 		break
			cur_start = 999999
			cur_root = ""
			for root in etymologies:
				m = re.search(root, self.description)
				if not m:
					continue
				if m.start() != -1 and m.start() < cur_start:
					cur_start = m.start()
					cur_root = root
			if cur_root == "":
				cur_root = "none"
			sys.stdout.write(cur_root + "\n")
			self.description = ""

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




