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
        var projFolderString = my.dat.meta.rootFolder + "ScriptProjects/" + my.dflts.titles.cTitle
        var dskPath = projFolderString + "/";
        writeFolder(dskPath);

        var myPath;
        var diskFolders = my.dat.folders.descendants().(@disk == "yes");
        // Do the disk folders
        for (var s = 0; s < diskFolders.length(); s++) {
            var finalPath;
            myPath = "";
            var currLmnt = diskFolders.child(s);
            var topLev = "";
            if (currLmnt.parent().name() == "folders") {
                topLev = currLmnt.@name + "/";      // Previously, topLev had been defined here. I moved the declaration out above.
            }
            while(currLmnt.parent().name() != "folders") {
                myPath = currLmnt.@name + "/" + myPath;
                currLmnt = currLmnt.parent();
            }
            finalPath = dskPath + topLev + myPath;      // This was messed up, with erroneous slashes.
            writeFolder(finalPath);
        }    
    } catch(err){ alert("Oops. On line " + err.line + " of \"makeFolders()\" you got " + err.message);}
    }
//~    
    // GET PROJECT FOLDER STRUCTURE FROM SOURCE DATA AND CREATE IT IN THE PROJECT
    function makeProjectFolders() {    
    try {
        var projFolders = my.dat.folders.descendants().(@proj == "yes");
        var folderList = {};

        for (var j = 0; j < projFolders.length(); j++) {
            var currLmnt = projFolders.child(j);
            var fldrName = currLmnt.@name.toString();
            var fldrParent = currLmnt.parent().@name.toString();
            fldrParent = (fldrParent == "") ? "root" : fldrParent;
            var fldrObj = app.project.items.addFolder(fldrName);
            folderList[fldrName] = { name: fldrName, parent: fldrParent, fldrOb: fldrObj };
        }
        for (var folder in folderList) {
            var thisFolder = folderList[folder];
            if (thisFolder.parent != "root") {
            thisFolder.fldrOb.parentFolder = folderList[thisFolder.parent].fldrOb;
            }
        }
        return folderList;
    } catch(err){ alert("Oops. On line " + err.line + " of \"[function]()\" you got " + err.message);}
    }
//~  
    // ADD THE MAIN COMP
    function addNewComp(){//     ADD A NEW COMP 
    try {
        var cs = my.dflts.comp;
         var mainComp =  app.project.items.addComp(cs[0], cs[1], cs[2], cs[3], cs[4], cs[5]);
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