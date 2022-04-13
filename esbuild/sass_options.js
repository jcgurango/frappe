let path = require("path");
let fs = require("fs");
let { get_app_path, app_list, apps_path } = require("./utils");

let node_modules_path = path.resolve(
	get_app_path("frappe"),
	"..",
	"node_modules"
);
let app_paths = app_list
	.map(get_app_path)
	.map(app_path => path.resolve(app_path, ".."));

module.exports = {
	includePaths: [node_modules_path, ...app_paths],
	importer: function(url, prev) {
		if (url.startsWith('overrideable:')) {
			url = url.slice(13);
			const fullPath = path.resolve(path.dirname(prev), url).slice(apps_path.length);

			for (let i = 0; i < app_paths.length; i++) {
				const app_path = app_paths[i];

				if (fs.existsSync(path.join(app_path, 'overrides', fullPath + '.css')) || fs.existsSync(path.join(app_path, 'overrides', fullPath + '.scss'))) {
					url = path.join(app_path, 'overrides', fullPath);
				}
			}
		}

		if (url.startsWith("~")) {
			// strip ~ so that it can resolve from node_modules
			url = url.slice(1);
		}
		if (url.endsWith(".css")) {
			// strip .css from end of path
			url = url.slice(0, -4);
		}
		// normal file, let it go
		return {
			file: url
		};
	}
};
