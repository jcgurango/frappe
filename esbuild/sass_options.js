let path = require("path");
let fs = require("fs");
let { get_app_path, app_list, apps_path } = require("./utils");
const randomString = require('random-string');
const glob = require("fast-glob");

let node_modules_path = path.resolve(get_app_path("frappe"), "..", "node_modules");
let app_paths = app_list.map(get_app_path).map((app_path) => path.resolve(app_path, ".."));

module.exports = {
	includePaths: [node_modules_path, ...app_paths],
	quietDeps: true,
	importer: function(url, prev) {
		if (url.startsWith('overrideable:')) {
			url = url.slice(13);
			const dir = path.dirname(prev);
			const fullPath = path.resolve(dir, url).slice(apps_path.length);

			for (let i = 0; i < app_paths.length; i++) {
				const app_path = app_paths[i];

				const accept = function(p) {
					// Copy the file over.
					const dir = path.join(apps_path, path.dirname(fullPath));
					const ext = path.extname(p);
					const newPath = path.join(dir, randomString({ length: 12 }) + '.generated' + ext);
					fs.copyFileSync(p, newPath);
					return {
						file: newPath,
					};
				};

				if (fs.existsSync(path.join(app_path, 'overrides', fullPath + '.css'))) {
					return accept(path.join(app_path, 'overrides', fullPath + '.css'));
				}
				
				if (fs.existsSync(path.join(app_path, 'overrides', fullPath + '.scss'))) {
					return accept(path.join(app_path, 'overrides', fullPath + '.scss'));
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
			file: url,
		};
	},
	cleanup: function() {
		glob.sync(path.join(apps_path, '**/*.generated.*')).forEach(function(file) {
			if (fs.existsSync(file)) {
				fs.unlinkSync(file);
			}
		});
	},
};
