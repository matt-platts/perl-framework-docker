Perl MVC Framework V1.0
-----------------------

A lightweight perl framework for building service based apis and application back ends. 

Influenced by the ideals behind MVC and REST services made popular by the PHP community, this perl framework is designed to promote code separation and a modular approach, entirely separate from any front end, whereby any front ends can simply call this api. It will return both JSON and pre-formatted HTML as well as text, XML or anything else. It is purposefully extremely lightweight and easy to use, but this document should be fully read before starting.

It is also designed to keep back end code modular, re-usable, and readable, buy splitting it into controllers for program flow, models for data access, views for rendering/presentation and library functions for everything else.

A brief introduction to MVC can be found on wikipedia at https://en.wikipedia.org/wiki/Model-view-controller or a google search.

Introduction
------------

The code is based on 'URL-to-function' mapping. This mapping takes the initial path of the url and uses this to route to a controller module and a specific function in that controller. Eg. /auth/login will load the 'auth' controller and call the 'login' function in tha controller. The auth controller can be found at /controllers/auth.pm. Then, any further parts to the URL will automatically be turned into key value pairs (so user/matt replaces ?user=matt or its POST equivilent) and these params are passed by default into any controller function which is called. Thus auth/login/user/matt translates to auth.pm in the controllers folder, and the function 'login' in this file, which will have access to the value of the variable 'user' with the value of 'matt' without any further coding required to get the data there. This means that new controllers and functions can be added as required with no further coding required to make them accessible as this is all actioned in the core. There should be no need to touch the core code at all for day to day, unless modifying the framework. The core code itself can be found in api.cgi which serves as an entry point to every call, and in the /core folder off the root. api.cgi is automatically called for all web requests as per the rules in the .htaccess file which use Apache Mod Rewrite, regardless of the url path that is received. No other files in the containing folder are accessible by a web browser.

The architecture promotes an MVC approach with code to be placed in the ready-made /controllers, /views and /models directories. New controllers must always follow the naming convention - if the first part of the url is 'example' then this will load exampleController.pm. All you need to do is create this file and add the boilerplate code to it (see below) and it will work immediately. 

Controllers should be kept fairly lightweight, dealing with program flow, and should call on models for business logic. A model should gather all the required data (via databases or calls to external apis) and return its response to the controller. The controller should then return this to the entry point (which is always api.cgi), simply by returning the data from the function, and the view will then be dynamically populated with the response. The default view is set in /core/base.pm, and this value can be overwritten if required by individual controllers for different types of output (eg. HTML, Json, XML, text). Code which doesn't fit into program flow (controllers) or business logic (models) could go into the library as a library function (you can load any further modules you like from the controller or model), or can be tagged onto the end of the controller or model as a private function. This is always debatable but the idea is to keep things clean and readable. 


Writing code
------------

The default entry point is api.cgi and is found in the root directory. An .htaccess file routes all requests to the api folder to this script, so in the url you only call the folder - eg /api/. The api.cgi script calls /core/route.pm to parse the url and return the required functions and parameters which are required for that api call. api.cgi will route the flow to the controller where you write your code, and you pass the response back which it will pass into the view for rendering, before returning this as a response.

Adding a new feature requires a new subroutine to be written to deal with it - either in a new controller, or added to an existing controller. Controllers should be placed in the /controllers folder as perl modules with their own package namespace (named after the filename), and ideally should be named after the section of the app that they deal with, with get/add/update/search etc functions written into the controller as required.

Existing controllers are search, license, component, frs etc. These can be found in the controllers folder, named searchController, licenseController etc. Each deals with the input, calls a corresponding model module in /models (eg. The search controller loads the search model) for data access and manipulation, receives the response, does what it needs to and returns the final response. 

Example URLS might be:

/user/get/userid/12345 - to get data for a user with id 12345 from a function called 'get' in /controllers/userController.pm
/user/update/userid/12345 - to update data for a user from a sub called 'update' in /controllers/userController.pm. Alternatively, the simpler path of just user/update could be used here with the important params passed in as POST variables. 
/products/search/?query=productName - This format would find the 'search' sub in /controllers/productsController.pm.

The framework does not dictate how to structure the rest of your code, but it is recommended to use a model or library function for business logic, and keep the controller fairly lightweight - dealing with program flow rather than business specific logic. Models or libraries can simply be required using perl's 'require' funciton by your controller as and when you need them.

The controller should return a hash of data you wish to be placed into the view, and this should ALWAYS be returned as a HASH REFERENCE (conventionally \%response). The keys which are required in the hash are outlined below. These are passed into the view the hashref $response. For JSON views, the 'content' key should contain key=>value pairs, which will be used exactly as is in a JSON view and sent to the front end, or parsed into a template using a standard template view. Template variables are specified in templates using {=variable_name}, and will be swapped out with the variable value as the template is parsed. See the documentation in lib/stl_parser for more information on 'simple template language' including writing basic 'if' statements directly into the view in case further data parsing is required. Template files themselves should be placed in /view/templates.


Example: Create a new controller called data, and a function in it called get (therefore accessible by calling 'api/data/get')
------------------------------------------------------------------------------------------------------------------------------

The first part of the url path is 'data', so you first need to create a perl module called dataController.pm, and place it in the controllers folder. Using the boilerplate code below, this package should be an instance of masterController, and should contain a function called 'get'. Note that if just api/data is specified on the url, the framework will try and run a function called defaultAction() which you may also use as a default. If you don't create this function then the one in masterController.pm will automatically be used instead. Currently this just displays a default error message. You can also use the defaultAction to return a custom error message or usage information for the controller if you wish, such as how the module should be used, which functions can be called, what data is expected etc. The default action in the master controller (which is called by default anyway) returns a 404 error response, simply to look better than a blank response and proves tha the controller is working.

Start the controller file with the boilerplate code as follows:

  1 #!/usr/bin/perl
  2 # dataController.pm
  3 
  4 package dataController;
  5 @ISA = (masterController);

Using @ISA in this way will automatically add functions called new and defaultAction so technically this should work as it is and return the custom 404 response from masterController. An AUTOLOAD function in the masterController will return a default 404 error for any non-existent functions which are called too. 

Accessing url params and request variables 
------------------------------------------

Data can be picked up anywhere in your code but only by following the framework. 

Params sent in as part of the URL are stored in a hash (by route.pm) as the url is parsed, and can be accessed from the built in accessor methods 'route::get_key_pairs' (returns all params) and route::get_route_value(keyName) (returns single value for a single key). 

They are also passed into any top level controller fuction (one which is called from the url) by default as a hashref called 'pairs',which can be 'shifted' off the calling arguments as follows:

Boilerplate code for beginning a function and accessing the params:
-------------------------------------------------------------------

sub myFunction(){
 	my $self = shift; 
	my $inputs = shift; 
	my $parameter_value = $inputs->{'pairs'}->{'parameter_name'};
}

The function should ideally return a hash to the caller in api.cgi with the following keys set: 

	error 		(bool 0/1), 
	success 	(bool 0/1), 
	errorMessage 	(string if populated, or 0), 
	errorCode	(string if populated, or 0), 
	content 	(This can be either a further hash of values which will be sent as json to a json view by the main controller automatically, or free text/html which can be placed in a template using the 
			default template view to return preformatted HTML)

or you can return just a string which will autoatically be put into the default view. The reason for the extra keys is that the front end expects and tests on success/error/errorMessage and errorCode in most places.


To change the default view
--------------------------
The default view is JOSN.

Add one of the following lines in your function in the controller to set the view: 

viewController::setContentType("text/html"); viewController::setView("view_template");    - to turn on a the default simple templated view, or 
viewController::setContentType("application/json"); viewController::setView("view_json"); - to turn on a json view. 

Either of these may be set as default in /config.cgi however. The default view is currently JSON. 


Final boilerplate code for our example module:
----------------------------------------------

  1 #!/usr/bin/perl
  2 # dataController.pm
  3 
  4 package dataController;
  5 @ISA = (masterController);
  6 
  7 # Function: get
  8 # Call as /api/data/get/exampleParam/1/
  9 # Remove this function to see the default 404 message
 10 sub get {
 11         my $self = shift;
 12         my $inputs = shift;
 13         my $my_value = $inputs->{'pairs'}->{'exampleParam'};
 14 
 15         my $responseText;
 16         if (!$my_value){
 17                 $responseText = "No paramater was set";
 18         } else {
 19                 $responseText = "You sent in a param called exampleParam with a value of $my_value";
 20         }
 21 
 22         # build a hash to return to the entry point
 23         my %return = (
 24                 success         => "true",
 25                 error           => "false",
 26                 errorMessage    => 0,
 27                 content         => $responseText,
 28         );
 29 
 30         return \%return;
 31 }
 32 1;

There is an example of this in /controllers/dataController.pm
See also controllers/exampleController.pm and controllers/example2Controller.


Using JSON for creating API / Service based apis
------------------------------------------------

JSON is supported by the view_json.pm file in /views. This will convert any data you throw at it into json format, wrapped in a key called 'content' which can be queried by the front end.
If you are displaying json data, the content-type of the output must be set to application/json - this is done by default in the initial api.cgi script. 

The json view will return the following params by default (which is why we send them back from the controller, otherwise it will use defaults):

error: 		Bool (1/0)
success: 	Bool (1/0) - Both error and success can be set and should always be opposite to each other.
errorMessage: 	String. This should contain any error message returned by your code. 
content: 	JSON. The content key will contain the json that you actually want to return.



Initial configuration
---------------------
Configuration settings should all go into /config.cgi (specified using 'our' rather than 'my' so they can be shared with your code. There are very few required configuration settings, but two are notable:
	$path (string) - The path by which your api is called. This could simply be "api" which would relate to /api, here it is 'portal-api' with the auth->login controller function found at portal-api/controllers/authController.pm in function login(), and called by /portal-api/auth/login/.  
	$login_required (bool) - forces a login message if the user is not logged in irrespective of what controller is called.
	$default_content_type (string) - should be application/json for JSON based APIs, and standard text/html for traditional web use. 

Database settings and your own configurations can be placed into this file as well if you wish, however it is advisable to create an application_config.file specific to your application and use this just for the api configuration.


Folder structure
----------------
/controllers - All user defined controller functions should be in here, in the root directory. Controller functions should call library functions or models and be extremely lightweight.
/core - core framework files, inc base, that you shouldn't need to touch.
/data - data storage eg. text files as you require.
/lib - library functions. Anything that doesn't fit in the controller or the model. Keeping the controller and the model lightweight keeps code easily understandable.
/models - model functions, which should be related to gathering and setting data only.
/views - perl scripts for rendering a view. These will take the output from the controller, render, and finally print.
/views/templates - templates in which to render a view (should perl code not be enough). These may be HTML templates with placeholders in which to insert dynamic data.

