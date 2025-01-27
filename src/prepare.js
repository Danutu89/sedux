import * as fs from "fs";
import * as path from "path";
import { exit } from "process";

const distFolder = "dist";

// get the list of subfolders in the src folder
//go through each subfolder and create an exports object based on the name of the subfolder and the imports and types based on the name of the files in the subfolder

const subfolders = fs
	.readdirSync(distFolder, { withFileTypes: true })
	.filter((dirent) => dirent.isDirectory())
	.map((dirent) => dirent.name);

const exportsObject = {};

subfolders.forEach((folder) => {
	const subfolderPath = path.join(distFolder, folder);
	const files = fs
		.readdirSync(subfolderPath, { withFileTypes: true })
		.filter((dirent) => dirent.isFile())
		.map((dirent) => dirent.name);
	const subFolders = fs
		.readdirSync(subfolderPath, { withFileTypes: true })
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);

	//module
	const modules = [];
	// module: {import: '', types: ''}
	const moduleObject = { import: "", types: "", svelte: "", name: "" };
	//if there are submodules, create another module like this "module/submodule" and so on, and take only the index.js file
	//if there are no submodules, take only the index.js file
	const indexFiles = files.filter((file) => file === "index.js");
	if (indexFiles.length > 1) {
		throw new Error(`More than one index.js file in ${subfolderPath}`);
	}

	if (indexFiles.length === 1) {
		moduleObject.import = `${folder}/index.js`;
		moduleObject.types = `${folder}/index.d.ts`;
		moduleObject.name = folder;
		modules.push(moduleObject);
	}

	//submodules
	const submodules = files.filter(
		(file) =>
			file.split(".")[0] !== "index" &&
			file.split(".")[0] !== "story" &&
			file.split(".")[0] !== "types"
	);
	submodules.forEach((submodule) => {
		const submoduleObject = { import: "", types: "", svelte: "", name: "" };
		if (submodule.split(".")[1] === "svelte") {
			submoduleObject.types = `${folder}/${
				submodule.split(".")[0]
			}.svelte.d.ts`;
			submoduleObject.import = `${folder}/${submodule.split(".")[0]}.svelte`;
			submoduleObject.svelte = `${folder}/${submodule.split(".")[0]}.svelte`;
		} else {
			submoduleObject.types = `${folder}/${submodule.split(".")[0]}.d.ts`;
			submoduleObject.import = `${folder}/${submodule}`;
		}
		submoduleObject.name = `${folder}/${submodule.split(".")[0]}`;
		modules.push(submoduleObject);
	});
	//subfolders
	const subModules = [];
	subFolders.forEach((subfolder) => {
		const subfolderPath = path.join(distFolder, folder, subfolder);
		const files = fs
			.readdirSync(subfolderPath, { withFileTypes: true })
			.filter((dirent) => dirent.isFile())
			.map((dirent) => dirent.name);

		const indexFiles = files.filter((file) => file === "index.js");
		if (indexFiles.length > 1) {
			throw new Error(`More than one index.js file in ${subfolderPath}`);
		}

		if (indexFiles.length === 1) {
			const submoduleObject = {
				import: "",
				types: "",
				svelte: "",
				name: "",
			};
			submoduleObject.import = `${folder}/${subfolder}/index.js`;
			submoduleObject.types = `${folder}/${subfolder}/index.d.ts`;
			submoduleObject.name = `${folder}/${subfolder}`;
			subModules.push(submoduleObject);
		}

		//submodules
		const _submodules = files.filter(
			(file) =>
				file.split(".")[0] !== "index" &&
				file.split(".")[0] !== "story" &&
				file.split(".")[0] !== "types"
		);
		_submodules.forEach((submodule) => {
			const submoduleObject = {
				import: "",
				types: "",
				svelte: "",
				name: "",
			};
			if (submodule.split(".")[1] === "svelte") {
				submoduleObject.types = `${folder}/${subfolder}/${
					submodule.split(".")[0]
				}.svelte.d.ts`;
				submoduleObject.import = `${folder}/${subfolder}/${
					submodule.split(".")[0]
				}.svelte`;
				submoduleObject.svelte = `${folder}/${subfolder}/${
					submodule.split(".")[0]
				}.svelte`;
			} else {
				submoduleObject.types = `${folder}/${subfolder}/${
					submodule.split(".")[0]
				}.d.ts`;
				submoduleObject.import = `${folder}/${subfolder}/${submodule}`;
			}
			submoduleObject.name = `${folder}/${subfolder}/${
				submodule.split(".")[0]
			}`;
			subModules.push(submoduleObject);
		});
	});
	exportsObject[folder] = { modules: [...modules, ...subModules] };
});
//now flatten the exports object
const flattenedExportsObject = {};
const typesObject = {};
Object.keys(exportsObject).forEach((key) => {
	const module = exportsObject[key];
	module.modules.forEach((module) => {
		flattenedExportsObject[`./${module.name}`] = {
			types: `./${distFolder}/${module.types}`,
			import: `./${distFolder}/${module.import}`,
		};
		if (module.svelte) {
			flattenedExportsObject[`./${module.name}`][
				"svelte"
			] = `./${distFolder}/${module.svelte}`;
		}
		typesObject[`${module.name}`] = [`./${distFolder}/${module.types}`];
	});
});

const packageJsonPath = "./package.json";
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
packageJson.exports = flattenedExportsObject;
packageJson.typesVersions = {
	">4.0": typesObject,
};
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
exit(0);
