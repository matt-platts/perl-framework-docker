#!/usr/bin/perl
# dataController.pm

package dataController;
@ISA = (masterController);

# Function: get
# Call as /api/data/get/exampleParam/1/
sub get {
	my $self = shift;
	my $inputs = shift;
	my $my_value = $inputs->{'pairs'}->{'exampleParam'};

	my $responseText;
	if (!$my_value){
		$responseText = "No paramater was set";
	} else {
		$responseText = "You sent in a param called exampleParam with a value of $my_value";
	}

	# build a hash to return to the entry point
	my %return = (
		success         => "true",
		error           => "false",
		errorMessage    => 0,
		content         => $responseText,
	);

	return \%return;
}


# Function: get2
# Meta: a better version using the build_response function in masterController to turn the response into the correct hash. Use 0 as a second param to specify it is an error.
# Call as /api/data/get2/exampleParam/1/
sub get2 {
	my $self = shift;
	my $inputs = shift;
	my $my_value = $inputs->{'pairs'}->{'exampleParam'};

	my %response; 
	if (!$my_value){
		%response = $self->build_response("No paramater was set",0) # The 0 at the end automatically puts this response into the errorMessage key;
	} else {
		%response = $self->build_response("You sent in a param called exampleParam with a value of $my_value");
	}

	return \%response;
}

1;
