#!/usr/bin/perl
# masterController.pm

package masterController;

sub new {
	
	my $class = shift;
	my $self = {};
	bless $self,$class;
	return $self;
}

sub defaultAction {

	my %response = (
		errorMessage => "A default action is not available for this controller.",
		success => 0,
		error => 1,
		errorCode => "404",
	);
	return \%response;
}

sub errorResponse {

	my $self = shift;
	my $errorMessage = shift;
	my $errorCode = shift;

	my %response = (
		error => 1,
		success => 0,
		errorMessage => $errorMessage,
		errorCode => $errorCode,
	);
	return %response;
}

# Function: return_content
# Status: deprecated - use $self->build_response below rather than this &masterController::return_content static call
# Meta: format a string of content so you don't need to build an entire hash to return a quick message.
# Param: content (required) (string)
# Param: success (optional) (bool) - Return a success or fail boolean. If omitted defaults to a positive "success" flag (1).
#
sub return_content {

	my $error = 0;
	my $content = shift;
	my $success = shift;

	if (defined($success) && !$success){ $error=1;} elsif (!defined($success)){ $success=1;}

	my %return = (
		success => $success,
		error => $error,
		content => $content,
	);

	if ($error){
		$return{'errorMessage'}=$content;
	}

	return %return;
}

# Function: build_response 
# Meta: format a string of content so you don't need to build an entire hash to return a quick message.
# Param: content (required) (string)
# Param: success (optional) (bool) - Return a success or fail boolean. If omitted defaults to a positive "success" flag (1).
#
sub build_response {

	my $self = shift;
	my $error = 0;
	my $content = shift;
	my $success = shift;

	if (defined($success) && !$success){ $error=1;} elsif (!defined($success)){ $success=1;}

	my %return = (
		success => $success,
		error => $error,
		content => $content,
	);

	if ($error){
		$return{'errorMessage'}=$content;
	}

	return %return;
}

# function AUTOLOAD
# meta: simply having this function exist at all stops the undefined subroutine error and gives a default 404 error message instead.
sub AUTOLOAD {
	my %response = (
		error => 1,
		success => 0,
		errorMessage => "Error 404",
		errorCode => "404",
	);
	return \%response;
}

1;
