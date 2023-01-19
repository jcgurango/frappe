// Copyright (c) 2022, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Form Fill Template', {
	refresh: function(frm) {
		const regionDefinition = (frm.doc.region_definition && JSON.parse(frm.doc.region_definition)) || {
			boxes: [],
		};
		regionDefinition.boxes = regionDefinition.boxes || [];
		regionDefinition.names = regionDefinition.names || [];

		if (frm.doc.__islocal) {
			const editor = frm.$wrapper.find('.form-fill-editor');
			editor.html(`
				<div class="form-group">
					<div class="clearfix"> <label class="control-label reqd" style="padding-right: 0px;">File Data</label> </div>
					<div class="control-input-wrapper">
						<div class="control-input"><input type="file" /></div>
						<p class="help-box small text-muted"></p>
					</div>
				</div>
			`);

			const file = editor.find('input[type=file]');
			file.change(function() {
				if (this.files[0]) {
					var reader = new FileReader();
					reader.readAsDataURL(this.files[0]);
					reader.onload = function () {
						frm.set_value('file_data', reader.result);
					};
				} else {
					frm.set_value('file_data', null);
				}
			});
		} else {
			const editor = frm.$wrapper.find('.form-fill-editor');
			const page_images = frm.doc.image_data.split('\n').filter(Boolean);
			let selectedItems = [];
			let selection = [];

			editor.html(`
				<div class="form-group">
					<div class="clearfix"> <label class="control-label reqd" style="padding-right: 0px;">Editor</label> </div>
					<div class="control-input-wrapper">
						<div class="control-input">
							<div class="main-container" style="position: relative;">
								<div class="pages-container" style="width: 100%; height: 75vh; overflow: auto;"></div>
								<div class="actions-container" style="border-radius: 8px; position: absolute; bottom: 12px; left: 12px; right: 12px; background-color: white; box-shadow: 0px 0px 12px 0px rgba(0,0,0,0.5); display: flex; flex-direction: row; align-items: center; justify-content: flex-start;">
									<div style="padding: 8px;" class="selection-container"></div>
									<input type="text" class="name-container" style="padding: 4px;" />
								</div>
							</div>
						</div>
						<p class="help-box small text-muted"></p>
					</div>
				</div>
			`);

			editor.find('.actions-container').hide();

			function findNameFor(boxIds) {
				const name = regionDefinition.names.find(({ boxes }) => {
					return boxes.join('|') === boxIds.join('|');
				});

				return name;
			}

			function save() {
				frm.set_value('region_definition', JSON.stringify({
					...regionDefinition,
					boxes: regionDefinition.boxes.map(({ selected, ...box }) => box),
				}));
				frm.region_definition = regionDefinition;
			}

			editor.find('.name-container').keyup(function() {
				const newName = $(this).val();
				let name = findNameFor(selectedItems);

				if (!name) {
					name = {
						name: newName,
						boxes: [...selectedItems],
					};
					regionDefinition.names.push(name);
				}

				name.name = newName;
				save();
			});

			function actionButton(text, callback) {
				return $('<a />').css('padding', '8px').attr('href', '/#').text(text).click(function(e) {
					e.preventDefault();
					e.stopPropagation();
					callback(e)
				});
			}

			const pagesContainer = editor.find('.pages-container');
			page_images.forEach(function(page, pageIndex) {
				let currentBox = null;
				let currentBoxElement = null;
				let boxOverlay;

				pagesContainer.append(
					$('<div />')
						.css({
							position: 'relative',
							display: 'inline-block',
						})
						.append(
							$('<img />')
								.attr('src', page)
								.css({
									maxWidth: 'initial',
								})
						)
						.append(
							boxOverlay = $('<div />')
								.css({
									position: 'absolute',
									inset: 0,
								})
						)
				);

				function rebox(element = currentBoxElement, box = currentBox) {
					element.css({
						left: box.x,
						top: box.y,
						width: box.width,
						height: box.height,
					});
				}
	
				function createBoxElement() {
					return $('<div />')
						.css({
							position: 'absolute',
							border: '1px solid rgb(0, 0, 255)',
							backgroundColor: 'rgba(0, 0, 255, 0.75)',
							opacity: 0.5,
						})
						.appendTo(boxOverlay);
				}

				function findBoxElement(id) {
					return editor.find('[data-id="' + id + '"]');
				}

				function refreshSelection() {
					regionDefinition.boxes.forEach(function(box) {
						findBoxElement(box.id).css({
							opacity: selectedItems.includes(box.id) ? 0.75 : 0.5,
						});
					});

					selection = selectedItems.map((id) => regionDefinition.boxes.find(({ id: bid }) => bid === id));

					if (selection.length === 0) {
						editor.find('.actions-container').hide();
					} else {
						editor.find('.actions-container').show();
						editor.find('.selection-container').text(selection.length + ' boxes selected');
					}

					// Look for a name for this selection.
					const name = findNameFor(selectedItems);

					if (name) {
						editor.find('.name-container').val(name.name);
					} else {
						editor.find('.name-container').val('');
					}

					frm.region_definition = regionDefinition;
				}

				function onBoxClick(e) {
					e.preventDefault();
					e.stopPropagation();
					selectedItems.includes(e.data.box.id)
						? selectedItems.splice(selectedItems.indexOf(e.data.box.id), 1)
						: selectedItems.push(e.data.box.id);
					refreshSelection();
				}

				boxOverlay.click(function(e) {
					if (e.which === 1) {
						if (currentBox) {
							delete currentBox.x0;
							delete currentBox.y0;
							delete currentBox.x1;
							delete currentBox.y1;

							currentBox.id = frappe.utils.get_random(16);
							currentBoxElement.click({ box: currentBox }, onBoxClick);
							currentBoxElement.attr('data-id', currentBox.id);
							regionDefinition.boxes.push(currentBox);
							save();
							currentBoxElement = null;
							currentBox = null;
						} else {
							const x = e.pageX - boxOverlay.offset().left;
							const y = e.pageY - boxOverlay.offset().top;

							currentBox = {
								x: x,
								y: y,
								width: 1,
								height: 1,
								x0: x,
								y0: y,
								x1: x,
								y1: y,
								pageIndex,
							};
							currentBoxElement = createBoxElement();
							rebox();
						}
					}
				});

				boxOverlay.mousemove(function(e) {
					if (currentBox) {
						const x = e.pageX - boxOverlay.offset().left;
						const y = e.pageY - boxOverlay.offset().top;
						currentBox.x1 = x;
						currentBox.y1 = y;
						currentBox.x = Math.min(currentBox.x0, currentBox.x1);
						currentBox.y = Math.min(currentBox.y0, currentBox.y1);
						currentBox.width = Math.max(currentBox.x0, currentBox.x1) - currentBox.x;
						currentBox.height = Math.max(currentBox.y0, currentBox.y1) - currentBox.y;
						rebox();
					}
				});

				regionDefinition.boxes.forEach(function (box) {
					if (box.pageIndex === pageIndex) {
						const boxElement = createBoxElement();
						boxElement.attr('data-id', box.id);
						boxElement.click({ box }, onBoxClick);
						currentBox = box;
						currentBoxElement = boxElement;
						rebox();

						currentBox = null;
						currentBoxElement = null;
					}
				});

				editor
					.find('.actions-container')
					.append(
						actionButton(
							'Align Horizontally',
							function (e) {
								selection.forEach(function(box) {
									box.y = selection[0].y;
									box.height = selection[0].height;
									rebox(findBoxElement(box.id), box);
								});

								save();
							},
						)
					)
					.append(
						actionButton(
							'Align Vertically',
							function (e) {
								selection.forEach(function(box) {
									box.x = selection[0].x;
									box.width = selection[0].width;
									rebox(findBoxElement(box.id), box);
								});

								save();
							},
						)
					)
					.append(
						actionButton(
							'Delete',
							function (e) {
								selection.forEach(function(box) {
									regionDefinition.names.forEach((name) => {
										if (name.boxes.includes(box.id)) {
											regionDefinition.names.splice(regionDefinition.names.indexOf(name), 1);
										}
									});

									regionDefinition.boxes.splice(regionDefinition.boxes.indexOf(box), 1);
									findBoxElement(box.id).remove();
								});

								save();
								selectedItems = [];
								refreshSelection();
							},
						)
					)
					.append(
						actionButton(
							'Cancel',
							function (e) {
								selectedItems = [];
								refreshSelection();
							},
						)
					);
			});
		}
	}
});
