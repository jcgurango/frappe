import { Chart } from "frappe-charts/dist/frappe-charts.esm";

frappe.provide("frappe.ui");
frappe.Chart = Chart;

frappe.ui.RealtimeChart = class RealtimeChart extends frappe.Chart {
	constructor(element, socketEvent, maxLabelPoints = 8, data) {
		super(element, data);
		if (data.data.datasets[0].values.length > maxLabelPoints) {
			frappe.throw(
				__(
					"Length of passed data array is greater than value of maximum allowed label points!"
				)
			);
		}
		this.currentSize = data.data.datasets[0].values.length;
		this.socketEvent = socketEvent;
		this.maxLabelPoints = maxLabelPoints;

		this.start_updating = function () {
			frappe.realtime.on(this.socketEvent, (data) => {
				this.update_chart(data.label, data.points);
			});
		};

		this.stop_updating = function () {
			frappe.realtime.off(this.socketEvent);
		};

		this.update_chart = function (label, data) {
			if (this.currentSize >= this.maxLabelPoints) {
				this.removeDataPoint(0);
			} else {
				this.currentSize++;
			}
			this.addDataPoint(label, data);
		};
	}
};

frappe.HeadingsChart = class HeadingsChart {
	constructor(element, args) {
		this.options = args;
		this.data = this.options.data;
		this.$wrapper = $(element);
		this.$headings = null;
		this.render();
	}

	render() {
		if (this.$headings) {
			this.$headings.remove();
			this.$headings = null;
		}

		this.$headings = $(`
			<div style="display: flex; flex-direction: column; height: 240px; justify-content: center;">
				<div style="display: flex; flex-direction: row; width: 100%;" class="headings-container">
				</div>
			</div>
		`);

		for (let i = 0; i < this.data.labels.length; i++) {
			const label = this.data.labels[i];
			const datasets = this.data.datasets;

			this.$headings.find('.headings-container').append(`
				<div style="flex: 1; text-align: right;">
					${datasets.map((ds) => {
						return `
							<div>
								<h4>${datasets.length > 1 ? `${ds.name}: ` : ''}${ds.values[i]}</h4>
							</div>
						`
					})}
					<div>
						<h3>${label}</h3>
					</div>
				</div>
			`);
		}

		this.$wrapper.append(this.$headings);
	}

	update(data) {
		this.data = data;
		this.render();
	}
}
