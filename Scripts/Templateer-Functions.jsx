function myProject(){
try {
    var my = my || {};
    my.deBug = 0;       // turns off annoying alerts
    my.proj = app.newProject();
    my.dat = getMyXML();        // create XML object from file
    my.dflts = getSetupData();      // get the needed setup default data
    buildProject();     // run functions to assemble project

    // GATHER SETUP DATA
    function getSetupData(){     // Get the default presets for comp and title text. Returns JavaScript objects (arrays)
    try {
        var output = {};        // Create an output object
        output.titles = assembleTitles();
        output.paths = assemblePaths(output.titles.cTitle);
        output.comp = parseCompPreset(output.titles.mainCompName);        // Get the JSON comp preset object
        output.text = parseTextPreset();        // Get the JSON text preset object
        return output;      // return the object to the namespaced pseudo-global object
    } catch(err){ alert("Oops. On line " + err.line + " of \"getSetupData()\" you got " + err.message);}
    }
//~  
    // BUILD PROJECT
    function buildProject() {
    try {
        makeFolders();
        
        app.beginUndoGroup("Create Project Folders");
        my.folders = makeProjectFolders();
        app.endUndoGroup();    

        app.beginUndoGroup("Add Main Composition");
        my.mainComp = addNewComp();
        app.endUndoGroup();    

        app.beginUndoGroup("Add Title Text Layer");
        my.titleTextLayer = addTextLayer("title", my.dflts.titles.screen);
        app.endUndoGroup();    

         app.beginUndoGroup("Import Background Footage");
         my.bgFootage = importFootage("bg");
         app.endUndoGroup();    

         app.beginUndoGroup("Place Background");
         my.bgLayer = my.mainComp.layers.add(my.bgFootage, 10);
         app.endUndoGroup();    

        return true;
    } catch(err){ alert("Oops. On line " + err.line + " of \"buildProject()\" you got " + err.message);}
    }
//~    
    // CREATE A NEW DISK FOLDER
    function writeFolder(path) {
    try {
        var diskFolder = new Folder(path);
        if (!diskFolder.exists) {
            diskFolder.create();
        } else { if(my.deBug == 1){alert(path + "\r" + "Folder already exists.");}}
    } catch(err){ alert("Oops. On line " + err.line + " of \"writeFolderPath()\" you got " + err.message);}
    }
//~    
    // GET FOLDER STRUCTURE FROM XML AND MAKE DISK FOLDERS
    function makeFolders(){
    try {
        var projFolderString = my.dat.meta.rootFolder + "ScriptProjects/" + my.dflts.titles.cTitle // assemble the project folder path
        var dskPath = projFolderString + "/"; // add a slash to ake it a folder ?? Not sure why this doesn't just get added above ??
        writeFolder(dskPath); // write the folder to disk

        var myPath; // create variable to hold path part for subfolders
        var diskFolders = my.dat.folders.descendants().(@disk == "yes"); // get all folders (at any level) that are specified for disk into xml collection 
        // Do the disk folders
        // We don't create a folder, then put all the subfolders into it. Rather each folder, at any level, gets written with its full path.
        // That's why the while loop doesn't create redundant folders.
        for (var s = 0; s < diskFolders.length(); s++) { // Start looping folders
            var finalPath; // Container variable for final string
            myPath = ""; // Blanking mypath for each loop iteration ?? Why not just create it here ??
            var currLmnt = diskFolders.child(s); // gets all child elements at index s
            var topLev = ""; // initialize topLv variable to hold name of top-level folder's path part
            if (currLmnt.parent().name() == "folders") { // if the first parent element is the folders container, it is a top-level folder
                topLev = currLmnt.@name + "/";      // Put the top level folder's name in here with a slash.
            }
            while(currLmnt.parent().name() != "folders") { // Invokes only on iterations where s is a sub-folder
                myPath = currLmnt.@name + "/" + myPath; // prepend this folder's name and slash to myPath
                currLmnt = currLmnt.parent(); // stops the loop once it gets up to top level
            }
            finalPath = dskPath + topLev + myPath;      // Assemble the final path
            writeFolder(finalPath); // write each folder as the name is finally assembled
        }    
    } catch(err){ alert("Oops. On line " + err.line + " of \"makeFolders()\" you got " + err.message);}
    }
//~    
    // GET PROJECT FOLDER STRUCTURE FROM SOURCE DATA AND CREATE IT IN THE PROJECT
    function makeProjectFolders() {    
    try {
        var projFolders = my.dat.folders.descendants().(@proj == "yes"); // collect all folders specified for project
        var folderList = {}; // empty object

        for (var j = 0; j < projFolders.length(); j++) { // loop the collection
            var currLmnt = projFolders.child(j); // get folder at index j
            var fldrName = currLmnt.@name.toString(); // stringify name
            var fldrParent = currLmnt.parent().@name.toString();  // stringify parent folder name
            fldrParent = (fldrParent == "") ? "root" : fldrParent; // if there is no name, call it root
            var fldrObj = app.project.items.addFolder(fldrName); // add the folder to the project
            folderList[fldrName] = { name: fldrName, parent: fldrParent, fldrOb: fldrObj }; // push new this folder object into fldrList object
        }
        for (var folder in folderList) { // iterate the folder list object
            var thisFolder = folderList[folder]; // pull one fldr obj out for processing
            if (thisFolder.parent != "root") { // if it's a subfolder
            thisFolder.fldrOb.parentFolder = folderList[thisFolder.parent].fldrOb; // set the parent
            }
        }
        return folderList;
    } catch(err){ alert("Oops. On line " + err.line + " of \"[function]()\" you got " + err.message);}
    }
//~  
    // ADD THE MAIN COMP
    function addNewComp(){//     ADD A NEW COMP 
    try {
        var cs = my.dflts.comp; // this should be an array, parsed as JSON
         var mainComp =  app.project.items.addComp(cs[0], cs[1], cs[2], cs[3], cs[4], cs[5]); // values from assembled preset
         writeLn("New comp created.");
         mainComp.openInViewer();// OPEN IN VIEWER, DUH
         return mainComp;//HAND THE OBJECT BACK TO THE CALLING FUNCTION
    } catch(err){ alert("Oops. On line " + err.line + " of \"addNewComp()\" you got " + err.message);}
    }
//~  
    // ADD THE TITLE TEXT LAYER TO THE MAIN COMP
    function addTextLayer(style, content) {//   ADD TEXT LAYERS WITH PARAMETERS
    try {
        var ts = my.dflts.text;
        var myTextLayer = my.mainComp.layers.addText("Initial Text");
        var textProp = myTextLayer.property("Source Text");
        var textDocument = textProp.value;
        textDocument.resetCharStyle();
        textDocument.fontSize = ts[0];
        textDocument.applyFill = ts[1];
        textDocument.fillColor = ts[2];
        textDocument.applyStroke = ts[3];
        textDocument.strokeColor = ts[4];
        textDocument.strokeWidth = ts[5];
        textDocument.font = ts[6];
        textDocument.strokeOverFill = ts[7];
        textDocument.tracking = ts[9];
        textDocument.text = content;
       switch (ts[8]) {
            case "right":
                textDocument.justification = ParagraphJustification.RIGHT_JUSTIFY;
                break;
            case "left":
                textDocument.justification = ParagraphJustification.LEFT_JUSTIFY;
                break;
            case "center":
                textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
               break;
            default:
                textDocument.justification = ParagraphJustification.LEFT_JUSTIFY;
        }
        textProp.setValue(textDocument);
        
        return true;
    } catch(err){ alert("Oops. On line " + err.line + " of \"addTextLayer()\" you got " + err.message);}
    }
//~
    // ADD THE BACKGROUND IMAGE OR MOVIE
    function importFootage(type){
    try {
        if (type = "bg"){
                var path = my.dflts.paths.externalPath + "backgrounds/";
                var fileName = my.dat.assets.background.(@type1 == "Banter").(@default == "on").toString();//.replace(/ /g, "%20");
                var bgFile = new File(path + fileName);
                var myImport = new ImportOptions(bgFile);
                var bgFootage = my.proj.importFile(myImport);
                bgFootage.name = "Gib Standard bg";     //FIX THIS BULLSHIT//
                bgFootage.parentFolder = my.folders["Backgrounds"].fldrOb;
                return bgFootage;
        } else {
            alert("Oops. Import footage no bueno.");
        }
    } catch(err){ alert("Oops. On line " + err.line + " of \"importFootage()\" you got " + err.message);}
    }
//~
//  HELPER FUNCTIONS
    // GET XML DATA
    function getMyXML(){        // Open an XML file and read it in, return XML Object.
    try {
        var myFile = File.openDialog("Choose Config File","XML:*.xml");  
        if (myFile) {
            myFile.open("r");   // open file read-only
            var fileContent = myFile.read();      // read file contents and store in variable
            myFile.close();     // close the file
            return new XML(fileContent); // make and return a new XML object out of the data read from file
        } else {
            alert("No file.");
            return false;
        }
    } catch(err){ alert("Oops. On line " + err.line + " of \"getMyXML()\" you got " + err.message);}
    }
//~  
    // ASSEMBLE TITLES
    function assembleTitles() {     // Data fetching and string mainpulation. Returns object.
    try {
        var titles = {};
        var xmlTitle =  my.dat.projects.project.(@default == "on").title;
        var pjType = xmlTitle.parent().@type.toString();
        var pjSubType = xmlTitle.parent().@subType.toString(); //////DOESN'T CHECK IF SUBTYPE EXISTS
        pjSubType = (pjSubType == "") ? "" : "-" + pjSubType;

        titles.screen = xmlTitle.toString();
        titles.cTitle = pjType + pjSubType + "_" + titles.screen.replace(/ /g, "-");
        titles.mainCompName = titles.cTitle + "_" + my.dat.meta.artist.toString() + "_" + "v01";    
        return titles;
    } catch(err){ alert("Oops. On line " + err.line + " of \"assembleTitles()\" you got " + err.message);}
    }
//~  
    // ASSEMBLE FILE PATHS
    function assemblePaths(cTitle) {        // Data fetching and path string concatentaion. Returns object.
    try {
        var pths = {};
        var root = my.dat.meta.rootFolder.toString();
        pths.projectPath = root + cTitle; //Concatenate path and filename to save project as
        pths.externalPath = my.dat.meta.extPath.toString();
        return pths;
    } catch(err){ alert("Oops. On line " + err.line + " of \"assemblePaths()\" you got " + err.message);}
    }
//~  
    // PARSE THE COMP PRESET FROM XML
    function parseCompPreset(compName){     // Data fetching and string manipulation. Returns a JSON object.
    try {
        var parsed = JSON.parse("[\"" + compName + "\"," + verifyDefaults("comp").toString() + "," + verifyDefaults("fps").toString() + "]");
        return parsed;
    } catch(err){ alert("Oops. On line " + err.line + " of \"parseCompPreset()\" you got " + err.message);}
    }
//~  
    // PARSE THE TEXT STYLE PRESET FROM XML    
    function parseTextPreset() {      // Data fetching and string manipulation. Returns a JSON object.
    try {
        var pt = JSON.parse("[" + verifyDefaults("text").toString() + "]");     // Parse the whole string once to separate numbers and strings. Arrays will come through as strings on the first pass.
        for (var i = 0; i < pt.length; i++) {      // loop the array elements looking for strings so we can parse arrays
            if (typeof pt[i] == "string" && pt[i][0] == "[") {        // if an element is a string, and its first character is a left square bracket, parse it again to convert it to an array object.
                pt[i] = JSON.parse(pt[i]);      // Rewrite the string contents of the element with the resulting array
            }
        }
        return pt;      // Here's your sandwich.
    } catch(err){ alert("Oops. On line " + err.line + " of \"parseTextPreset()\" you got " + err.message);}
    }
//~  
    // VERIFY DEFAULTS EXIST AND RETURN THE COLLECTION TO THE CALLING FUNCTION
    function verifyDefaults(dType) {        // Fetch the data using from the XML Object and verify it is not undefined or zero value. Issue various alerts if things get out of bounds.
    try {
        var presetXML;
        var defaultsList = my.dat.presets.preset.(@type == dType).(@default == "on");
    } catch(err){ alert("Aw dang! " + err.line + " of \"verifyDefaults()\" " + dType  + " got " + err.message);}
        if (defaultsList == undefined) {
            alert("No records returned. Result is undefined");
        } else {
            if (defaultsList.length() >= 1) {
                presetXML = defaultsList[0];
                if (defaultsList.length() > 1) {
                    alert("Multiple defaults found. Using the first one.");
                }
            } else {
                alert("No defaults have been for " + dType + ".");
            }
        }
        return presetXML;
    }
    return true;
    } catch(err){ alert("Oops. On line " + err.line + " of \"verifyDefaults()\" you got " + err.message);}
}