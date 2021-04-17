#!/usr/bin/perl
# exampleController.pm
# Meta: shows different ways of returning data to the entry point.

package exampleController;
@ISA = (masterController);

use Data::Dumper;

# Example of basic return, without specifying success and error params. Any basic output will be put directly into the view as it is.
# Usage: example/test1/
sub test1 {

	my $self = shift;
	return "This is some content";
}

# Example of return with a success key in the response
# Meta: This is because front ends tend to check for success keys by default in JSON responses.
# Usage: example/test2/
sub test2 {

	my $self = shift;

	$return{'content'}="this";	
	$return{'success'}=1;

	return \%return; 
}

# Returning a hash with success and error vars set
# Meta: In fact, front ends tend to check for success AND error keys by default in JSON responses, and is the preferred way to return data.
# Usage: example/test3/
sub test3 {

	my $self = shift;
	$return{'content'}="this";	
	$return{'error'}=0;
	$return{'success'}=1;
	return \%return; 
}

# Using the masterController to return a hash automatically
sub test4 {

	my $self = shift;

	my %response = $self->build_response("Some content to send back"); # automatically sends success=1 and error=0 response 

	return \%response;
}


# Using the masterController to return a hash automatically with an error set
sub test5 {

	my $self = shift;

	my %response = $self->build_response("Some content to send back",0);  # Just set a second param to 0

	return \%response;
}

# Another method of returning an error
sub test6 {

	my $self = shift;

	my %response = $self->errorResponse("Some content to send back","Code1"); # Call the errorResponse function instead, with an *optional* second value of a custom error code that the front end will look for as the JSON key 'errorCode'. 

	return \%response;
}

