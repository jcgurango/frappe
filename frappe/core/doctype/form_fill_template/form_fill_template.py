# Copyright (c) 2022, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

import json
import frappe
import html
from frappe.model.document import Document
#from pdf2image import convert_from_bytes
from io import BytesIO
import base64
#import pikepdf
#import pdfkit

class FormFillTemplate(Document):
#	def __init__(self, *args, **kwargs):
#		Document.__init__(self, *args, **kwargs)
#
#		if self.get('file_data'):
#			page_images = ''
#			data_bytes = base64.b64decode(self.get('file_data').split(',')[1].encode('ascii'))
#			pages = convert_from_bytes(data_bytes)
#			
#			for page in pages:
#				buffered = BytesIO()
#				page.save(buffered, format="PNG")
#				page_images = page_images + 'data:image/png;base64,' + base64.b64encode(buffered.getvalue()).decode('ascii') + '\n'
#
#			self.image_data = page_images
#
#	@frappe.whitelist()
#	def fill_document(self, data):
#		data_bytes = BytesIO(base64.b64decode(self.get('file_data').split(',')[1].encode('ascii')))
#		saved_bytes_io = BytesIO()
#		region_definition = json.loads(self.region_definition)
#		boxes_by_id = { }
#
#		with pikepdf.Pdf.open(data_bytes) as pdf:
#			for box in region_definition.get('boxes'):
#				boxes_by_id[box.get('id')] = box
#				
#				# Convert screen coordinates to page coordinates
#				page = pdf.pages[box.get('pageIndex')]
#				box['x'] = box.get('x') / 200 * 72
#				box['y'] = ((page.mediabox[3] / 72 * 200) - box.get('y')) / 200 * 72
#				box['width'] = box.get('width') / 200 * 72
#				box['height'] = box.get('height') / 200 * 72
#				box['page'] = page
#
#			for key in data.keys():
#				value = str(data[key])
#
#				# Find the name for this.
#				for name in region_definition.get('names'):
#					if name.get('name') == key:
#						boxes = name.get('boxes')
#
#						for i in range(len(boxes)):
#							box_id = boxes[i]
#							boxes[i] = boxes_by_id.get(box_id)
#
#						if len(boxes) > 1:
#							# One character per box
#							for i, box in enumerate(boxes):
#								if i < len(value):
#									render_box_text(box, value[i])
#						else:
#							render_box_text(boxes[0], value)
#
#			pdf.save(saved_bytes_io)
#
#		saved_bytes_io.seek(0)
#		saved_bytes = saved_bytes_io.read()
#		return saved_bytes
#
#def render_box_text(box, text):
#	bytes = BytesIO(pdfkit.from_string('<style>html, body { padding: 0px; margin: 0px; }</style><div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 29px;">'
#		+ text.encode('ascii', 'xmlcharrefreplace').decode('ascii')
#		+ '</div>',
#		False,
#		{
#			'page-width': box.get('width'),
#			'page-height': box.get('height'),
#			'margin-bottom': '0in',
#			'margin-top': '0in',
#			'margin-left': '0in',
#			'margin-right': '0in',
#			'no-background': '',
#		})
#	)
#
#	with pikepdf.Pdf.open(bytes) as rendered_text:
#		text_page = pikepdf.Page(rendered_text.pages[0])
#
#		# Remove BG from page
#		commands = []
#
#		for operands, operator in pikepdf.parse_content_stream(text_page):
#			commands.append([operands, operator])
#
#		for command in commands:
#			if str(command[1]) == 're':
#				commands.remove(command)
#				break
#
#		text_page.Contents = rendered_text.make_stream(pikepdf.unparse_content_stream(commands))
#
#		box.get('page').add_overlay(
#			text_page,
#			pikepdf.Rectangle(
#				box.get('x'),
#				box.get('y') - box.get('height'),
#				box.get('x') + box.get('width'),
#				box.get('y'),
#			)
#		)
#
#	bytes.close()
#
	pass
