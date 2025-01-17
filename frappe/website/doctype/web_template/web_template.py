# Copyright (c) 2020, Frappe Technologies and contributors
# License: MIT. See LICENSE

import os
from shutil import rmtree

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.modules.utils import get_doc_module
from frappe.modules.export_file import get_module_path, scrub_dt_dn, write_document_file
from frappe.website.utils import clear_cache


class WebTemplate(Document):
	def validate(self):
		if self.standard and not (frappe.conf.developer_mode or frappe.flags.in_patch):
			frappe.throw(_("Enable developer mode to create a standard Web Template"))

		for field in self.fields:
			if not field.fieldname:
				field.fieldname = frappe.scrub(field.label)

	def before_save(self):
		if frappe.conf.developer_mode:
			# custom to standard
			if self.standard:
				self.export_to_files()

			# standard to custom
			was_standard = (self.get_doc_before_save() or {}).get("standard")
			if was_standard and not self.standard:
				self.import_from_files()

	def on_update(self):
		"""Clear cache for all Web Pages in which this template is used"""
		routes = frappe.get_all(
			"Web Page",
			filters=[
				["Web Page Block", "web_template", "=", self.name],
				["Web Page", "published", "=", 1],
			],
			pluck="route",
		)
		for route in routes:
			clear_cache(route)

	def on_trash(self):
		if frappe.conf.developer_mode and self.standard:
			# delete template html and json files
			rmtree(self.get_template_folder())

	def export_to_files(self):
		"""Export Web Template to a new folder.

		Doc is exported as JSON. The content of the `template` field gets
		written into a separate HTML file. The template should not be contained
		in the JSON.
		"""
		html, self.template = self.template, ""
		write_document_file(self, create_init=True)
		self.create_template_file(html)

	def import_from_files(self):
		self.template = self.get_template(standard=True)
		rmtree(self.get_template_folder())

	def create_template_file(self, html=None):
		"""Touch a HTML file for the Web Template and add existing content, if any."""
		if self.standard:
			path = self.get_template_path()
			if not os.path.exists(path):
				with open(path, "w") as template_file:
					if html:
						template_file.write(html)

	def get_template_folder(self):
		"""Return the absolute path to the template's folder."""
		module = self.module or "Website"
		module_path = get_module_path(module)
		doctype, docname = scrub_dt_dn(self.doctype, self.name)

		return os.path.join(module_path, doctype, docname)

	def get_template_path(self):
		"""Return the absolute path to the template's HTML file."""
		folder = self.get_template_folder()
		file_name = frappe.scrub(self.name) + ".html"

		return os.path.join(folder, file_name)

	def get_template(self, standard=False):
		"""Get the jinja template string.

		Params:
		standard - if True, look on the disk instead of in the database.
		"""
		if standard:
			template = self.get_template_path()
			with open(template) as template_file:
				template = template_file.read()
		else:
			template = self.template

		return template

	def get_module(self):
		if self.standard:
			try:
				return get_doc_module(self.module or 'Website', self.doctype, self.name)
			except ModuleNotFoundError:
				return None

	def render(self, values=None, block=None, page=None):
		if not values:
			values = {}
		template_module = self.get_module()

		values = frappe.parse_json(values)

		if template_module:
			template_module.on_render({
				'template': self,
				'block': block,
				'page': page,
			}, values)

		values.update({"values": values})
		template = self.get_template(self.standard)

		return frappe.render_template(template, values)
