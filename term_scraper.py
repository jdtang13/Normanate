from HTMLParser import HTMLParser
import urllib2 
import re
import string
import sys

etymologies = ["Abnaki", "Afrikaans", "Akkadian", "Algonquian", "American English", 
"American Spanish", "Anglican", "Anglo-French", "Anglo-Latin", "Anglo-Norm", "Arabic", "Aramaic", "Arawakan", "Armenian", "Assyrian",
"Attic", "Basque", "Breton", "Cantonese", "Carib", "Catalan", "Cherokee", "Chinook", "Church Latin", "Coptic", "Cornish",
"Croatian", "Czech", "Danish", "Dravidian", "Dutch", "Ecclesiastical Greek", "East Frisian", "Egypt", "English", "Estonian", "Etruscan",
"Finnish", "Flemish", "Frankish", "French", "Frisian", "Fulani", "Gallo-Romance", "Gaelic", "Gaulish", "German", "Gothic", "Greek", "Germanic",
"Guarani", "Hawaiian", "Hebrew", "Hung", "Ibo", "Indo-European", "Irish", "Iran", "Iroquoian", "Italian", "Kentish", "Japanese", "Kurdish", "Kwa",
"Latin", "Lithuanian", "Late Latin", "Low German", "Malay", "Mandarin", "Mandingo", "Middle Dutch", "Middle English", "Mercian", "Mexican Spanish",
"Micmac", "Middle French", "Middle High German", "Middle Irish", "Medieval Latin", "Middle Low German", "Mod.Eng.", "Modern Greek", "Modern Latin", 
"Muskogean", "Nahuatl", "N.E", "North Germanic", "North Sea Germanic", "Northumbrian", "O.Celt.", "O.Fr.", "Ojibwa", "Old Church Slavonic",
"Old Danish", "Old Dutch", "Old English", "Old Frisian", "Old High German", "Old Irish", "Old Italian", "Old Low German", "Old Norse", 
"Old North French", "Old Persian", "Old Provencal", "Old Prussian", "Old Saxon", "O.Slav.", "O.Sp.", "Old Swedish", "Pashto", "Pennsylvania Dutch",
"Persian", "P.Gmc.", "Phoenician", "Phrygian", "Piman", "Polish", "Portuguese", "Proto-Italic", "Provencal", "Quechua", "Russian", "Sanskrit", "Scand",
"Scot.", "Serbo-Croatian", "Semitic", "Serb.", "Sinhalese", "Siouan", "Slav.", "Slovak", "Spanish","Sumerican", "Swedish", "Tamil","Telugu",
"Thai", "Tibetan", "Tupi", "Turk", "Turkic", "Twi", "Ukrainian", "Urdu", "Uto-Aztecan", "Vulgar Latin", "W.Afr.", "West Frisian", "West Germanic",
"Wolof", "West Saxon", "Xhosa", "Yoruba", "none"]

# 1 is high prestige, 0 is low prestige
# if a word has multiple prestige values, just use the highest one
# general rules:
# high prestige -- latin, french
# mid prestige -- greek, semitic languages, spanish, slavic, scandinavian germanic, other exotic languages
# low prestige -- germanic, celtic, native american languages, siberian/mongol/uralic languages
prestige = [ 0, 0, 0.5, 0, 0,
0.5, 0, 1, 1, 1, 0.5, 0.5, 0.5, 0.5, 0.5,
0.5, 0.5, 0, 0, 0, 1, 0, 0, 1, 0.5, 0,
0.5, 0.5, 0, 0.5, 0, 0, 0, 0.5, 0, 0, 0.5,
0, 0, 0, 1, 0, 0.5, 1, 0, 1, 0, 0, 0.5, 0,
0.5, 0.5, 0.5, 0.5, 0.5, 0, 0, 0.5, 0, 1, 0, 0.5, 0.5, 0.5,
1, 0.5, 1, 0, 0.5, 0.5, 0.5, 0, 0, 0.5, 0,
0, 1, 0, 0, 1, 0, 0, 0.5, 1, 
0.5, 0.5, 0.5, 0, 0, 0, 0, 1, 0.5, 0.5,
0, 0, 0, 0, 0, 0, 1, 0, 0, 
1, 0.5, 1, 0, 0, 0.5, 1, 0, 0.5, 0,
0.5, 0, 0.5, 0.5, 0.5, 0.5, 1, 1, 1, 0, 0.5, 0.5, 0,
0, 0.5, 0.5, 0.5, 0, 0.5, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5,
0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1, 0.5, 0, 0,
0.5, 0, 0.5, 0.5, 0.5]

pages = [60, 53, 84, 46,38, 42,34,36,37,10,9,31,56,20,22,81,6,46,108,46,24,15,22,1,4,3]

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
	def handle_starttag(self, tag, attrs):
		if tag == 'a':
			attrs_dict = dict(attrs)
			if "class" in attrs_dict:
				return
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
			sys.stdout.write(cur_root + ",")
			self.description = ""


for i in range(26):
	c = chr(i + 97)
	for j in range(pages[i]):
		string = 'http://www.etymonline.com/index.php?l=' + str(c) + '&p=' + str(j) + '&allowed_in_frame=0'
		response = urllib2.urlopen(string)
		html = response.read()

		parser = MyHTMLParser()
		parser.feed(html)
		parser.close()




