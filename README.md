This is my most ambitious After Effects script so far.

It is intended to let users on a team initialize a new After Effects project according to the team standards in terms of folder structures, and to set up various specified common project elements.

The directives are pulled from an external XML file, which I ultimately intend to generate from a web app, or possibly from within an After Efects project. At the moment the script is in a very preliminary form, and uses a static XML file I have set up for testing the code at this point in development.

The primary imagined use-case is that an creative director will establish the various protocols, and then generate the XML file using whatever system is appropriate (website, app, or After Effects). Users would then run the script to set up their individual project files.

Another use case is individuals who have specific project structures they like to use, possibly with different setups for different clients or project types. By setting up different specifications in different XML files, a user could quickly set up a new project with a few clicks that would conform to their needs for the particular type of project.

I decided to develop this because I worked in a sutation where multiple users would copy a basic After Effects project file eith a set of blank folders from an archive to their local machines, then open the .aep and begin work. THis led to a lot of problems and confusion, as there were multiple different versions, some people would accidentally work in the original and save it instead of making a copy, etc.

It seemed to me that it would be useful to automate as much of that kind of project setup as possible, to save time and reduce the potential for errors.

Current Status: I started this project in 2016 and have not touched it since. I am now jumping back into scripting for After Effects, so I am going to get this working and then possibly try to recreate it in the newer UXP format.

