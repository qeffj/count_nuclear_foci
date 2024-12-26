// Input: Microscopy images stained for nuclear foci, e.g., RAD51, RPA, etc. This script enables the counting of cells that are GFP positive.
// Output: 1) .csv files summarizing the number of foci and GFP positive cells; 2) A zip file containing the segmented ROIs for each image is also output.

// Instructions
// Open the Macro tool in Fiji.
// Copy the code below into the the code box.
// Press run. Type input and output directory. Type the file suffix for your microscope. The code below assumes the Olympus .oir extension. 
// If you have a different file format, replace your file format for .oir in the code below.
// You may need to adjust the particle sizes detected depending on your foci.

// Open Issues
// Figure out how to merge the data in each csv file and then highlight the rows that are GFP = 1. I decided to do this in Python instead.
// Figure out how to close the results tables, because after running > 10 files, there are 30 windows open.
// Refactor the code since there is a lot of repetition.

/*
 * Macro template to process multiple .oir images in a folder
 */

#@ File (label = "Input directory", style = "directory") input
#@ File (label = "Output directory", style = "directory") output
#@ String (label = "File suffix", value = ".oir") suffix

// Scan folders/subfolders/files to find files with the correct suffix
processFolder(input);

// function to scan folders/subfolders/files to find files with correct suffix
function processFolder(input) {
	list = getFileList(input);
	list = Array.sort(list);
	for (i = 0; i < list.length; i++) {
		if (File.isDirectory(input + File.separator + list[i])) {
			processFolder(input + File.separator + list[i]);
		}
		if (endsWith(list[i], suffix)) {
			processFile(input, output, list[i]);
		}
	}
}

function processFile(input, output, file) {
	// Construct the file path
	filePath = input + File.separator + file;
	print("Processing: " + filePath);

	// Open the .oir file
	open(filePath);

	// Replace backslashes with forward slashes (for consistent path handling)
	filePath = filePath.replace("\\", "/");

	// Extract the base name of the file (without extension and channel number)
	baseName = File.getName(filePath);
	baseName = baseName.replace(".oir", "");

	// Process nuclei (C=0)
	selectImage(baseName + ".oir - C=0");
	run("Duplicate...", "title=nuclei");
	selectImage(baseName + ".oir - C=0");
	close();

	// Process GFP (C=1)
	selectImage(baseName + ".oir - C=1");
	run("Duplicate...", "title=GFP");
	selectImage(baseName + ".oir - C=1");
	close();

	// Process RPA (C=2)
	selectImage(baseName + ".oir - C=2");
	run("Duplicate...", "title=RPA");
	selectImage(baseName + ".oir - C=2");
	close();

	// Process RAD51 (C=3)
	selectImage(baseName + ".oir - C=3");
	run("Duplicate...", "title=RAD51");
	selectImage(baseName + ".oir - C=3");
	close();

	// Processing steps for each channel follow here...
	// Process nuclei
	selectImage("nuclei");
	setAutoThreshold("Huang dark");
	setOption("BlackBackground", true);
	run("Convert to Mask");
	run("Fill Holes");
	run("Watershed");
	run("Set Measurements...", "area bounding area_fraction limit display add redirect=None decimal=3");
	run("Analyze Particles...", "size=100.00-Infinity show=Overlay exclude clear overlay summarize add");
	Table.rename("Summary", "Nuclei");
	saveAs("Results", output + File.separator + baseName + "_nuclei_results.csv");

	// Process RPA
	selectImage("RPA");
	run("Top Hat...", "radius=2");
	setAutoThreshold("RenyiEntropy dark");
	run("Convert to Mask");
	run("Watershed");

	// Loop through the ROI Manager for RPA
	selectImage("RPA");
	n = roiManager("count");
	for (i = 0; i < n; i++) {
		roiManager("Select", i);
		//Change pixel size threshold to capture only large foci
		run("Analyze Particles...", "size=3-Infinity pixel summarize");
		roiManager("show all with labels");
	}
	Table.rename("Summary", "RPA Foci results");
	saveAs("Results", output + File.separator + baseName + "_RPA_foci_results.csv");
	roiManager("save", output + File.separator + baseName + "_RPA_RoiSet.zip");

	// Process RAD51
	selectImage("RAD51");
	run("Top Hat...", "radius=2");
	setAutoThreshold("RenyiEntropy dark");
	run("Convert to Mask");
	run("Watershed");

	// Loop through the ROI Manager for RAD51
	selectImage("RAD51");
	n = roiManager("count");
	for (i = 0; i < n; i++) {
		roiManager("Select", i);
		run("Analyze Particles...", "size=7-Infinity pixel summarize");
		roiManager("show all with labels");
	}
	Table.rename("Summary", "RAD51 Foci results");
	saveAs("Results", output + File.separator + baseName + "_RAD51_foci_results.csv");
	roiManager("save", output + File.separator + baseName + "_RAD51_RoiSet.zip");

	// Process GFP
	selectImage("GFP");
	setAutoThreshold("Li dark");
	run("Convert to Mask");
	run("Median", "radius=10");
	run("Fill Holes");
	run("Watershed");

	// Loop through the ROI Manager for GFP
	selectImage("GFP");
	n = roiManager("count");
	for (i = 0; i < n; i++) {
		roiManager("Select", i);
		run("Analyze Particles...", "size=100-Infinity summarize");
		roiManager("show all with labels");
	}
	Table.rename("Summary", "GFP Positive Cells results");
	saveAs("Results", output + File.separator + baseName + "_GFP_Status_results.csv");
	roiManager("save", output + File.separator + baseName + "_GFP_Status_RoiSet.zip");

	// Close all images before processing the next file
	run("Close All");
}