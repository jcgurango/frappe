import './frappe/form/formatters.js';
import './frappe/ui/field_group.js';

class WebsiteForm extends frappe.ui.FieldGroup {
  addButton(text, action, type = 'default') {
    const form = this;

    $(this.wrapper).find('form')
      .append(
        $(
          `<button type="submit" class="btn btn-${type} pull-right ml-2" />`
        )
        .text(text)
        .click(
          function(...args) {
            const result = action.call(this, form, ...args);
            $(this).attr('disabled', true);

            if (result instanceof Promise) {
              result
                .catch((e) => {
                  console.error(e);
                  frappe.msgprint({
                    title: __('Error', null, 'Title of error message in web form'),
                    message: e.message,
                    indicator: 'orange'
                  });
                })
                .finally(() => {
                  $(this).attr('disabled', false);
                });
            }
          }
        )
      );
  }
}

frappe.ui.form.generate_website_form = (parent, fields, values = { }) => {
  const form = new WebsiteForm({
    fields,
    parent,
  });

  form.make();

  return form;
}
