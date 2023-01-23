/* eslint-disable no-console */
const path = require("path");
const fs = require("fs");
const glob = require("fast-glob");
const sass_options = require("./sass_options");

module.exports = {
	name: "build_cleanup",
	setup(build) {
		build.onEnd((result) => {
			if (result.errors.length) return;
			clean_dist_files(Object.keys(result.metafile.outputs));
			sass_options.cleanup();
		});
	},
};

function clean_dist_files(new_files) {
	new_files.forEach((file) => {
		if (file.endsWith(".map")) return;

		const pattern = file.split(".").slice(0, -2).join(".") + "*";
		glob.sync(pattern).forEach((file_to_delete) => {
			if (file_to_delete.startsWith(file)) return;

			fs.unlink(path.resolve(file_to_delete), (err) => {
				if (!err) return;

				console.error(`Error deleting ${file.split(path.sep).pop()}`);
			});
		});
	});
}
