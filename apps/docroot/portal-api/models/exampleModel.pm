#!/usr/bin/perl
#exampleModel.pm

package exampleModel;

# Sub: doSomethingTechnical
# Meta: technical stuff and business logic should go into model files. 
sub doSomethingTechnical {

	my $value = shift;

	my $response;
	my $error;
	my $success;
	my $error_message;
	my $error_code;

	# code here to connect to db, service etc. Below is just example playing with the data. Very basic data checking could arguably sit within the controller or a library function.
	
	if (!$value){
		$success=0;
		$error=1;
		$error_code="001";
		$error_message = "No value for example_value was specified in the input.";

	} elsif ($value =~ /^[a-zA-X0-9]+$/){
		$success=1;
		$error=0;
		$response = "This is the response from the model for the input value of $value";
		# $response may also contain hash keys (which are auto-converted to json in a json view, or replaced in a template in template view)
	} else {
		$success=0;
		$error = 1;
		$error_code="002";
		$response = "Illegal input";
		$error_message = "You can only use letters and numbers in your input to the 'example_value' paramater.";
	}
	
	my %response = (
		response=>$response,
		error=>$error,
		success=>$success,
		errorMessage=>$error_message,
		errorCode=>$error_code,
	);
	return \%response;

}

1;
