#!/usr/bin/perl
# example2Controller.pm

package example2Controller;
@ISA = (masterController);

use strict;
use warnings;
use CGI;
use Data::Dumper;

# Sub defaultAction 
# Usage: /example/
# Meta: Called as a default if no second param is specified. You can't pass any params to the default action
#       If you omit this function from the controller, the defaultAction of masterController will be used instead (which is a default 404 page)
sub defaultAction {

	my $inputs = shift; 
	my $cgi = new CGI;

	#my $result = $cgi->param("example_value"); // doesn't work
	my %response = (
		success => 1,
		error => 0,
		content => "This is the default action if no function is specified.",
	);
	return \%response;

}

# Sub modelExample
# Usage: /example/modelExample/example_value/1000480381
# Meta: Go to a model function to get data from a database. There is nothing happening in this model, but this shows the concept of keeping the controller clean.
#       You can (optionally) pass your success and error flags back from the model as is done here. You don't have to but if you have an error code it is good to have it bubble up from where it happened.
sub modelExample {

	my $self = shift;
	my $inputs = shift;

	use exampleModel;
	my $cgi = new CGI;

	my $result = &exampleModel::doSomethingTechnical($inputs->{'pairs'}->{'example_value'}); # Business logic should be in the model, controllers should be about program flow

	my %response = (
		success => $result->{'success'},
		error => $result->{'error'},
		content => "Your example response is: " . $result->{'response'},
		errorCode => $result->{'errorCode'},
		errorMessage => $result->{'errorMessage'},
	);

	return \%response;
}

1;
