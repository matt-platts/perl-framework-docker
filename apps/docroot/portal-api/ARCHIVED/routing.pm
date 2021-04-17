#!/usr/bin/perl
#		print "params";
# routing.pm
# routing methods for framework
package routing;
require Exporter;
use Cwd;
use strict;

#######################################################################################################################################
# The route is determined from the url itself, which is split at forward slashes to get parameters.
# The first value is the controller filename, found in the controllers folder.
# The second value is the function to call, found in the controller file itself.
# Eg. /auth/login/ - calls the login function in the auth controller.
#     /auth/login/goto/homepage/ - calls the login function in the auth controller, and passes in goto=homepage as a key/value pair.
# Further url paramaters are used as key/value pairs and are not for the route itself, 
# but are stored in @$params and %pairs in this module along with accessor methods
# Regular query strings / post data can still be picked up in your code in the usual ways
#######################################################################################################################################


sub new {

	my $class = shift;
	my $request = shift;

	my $self = {
		_params => "",
		_pairs => "",
	};

	my @parts = split(/\//g,$request);
	foreach my $key (@parts){
		if ($key eq "framework" || !$key){ shift (@parts)}
	}

	$self->{'module'} = $parts[1];
	$self->{'function'} = $parts[2];

	if (!$self->{'function'} || $self->{'function'} =~ /^\?.*/){ # if no second paramater or it's a query string
		$self->{'function'} = "defaultAction"; # call a sub called defaultAction if nothing specified
	}

	my $file = getcwd . "/controllers/".$self->{'module'};
	if (-e "$file.pm"){
		my $res = eval("use " . $self->{'module'}); # use the controller specified in the url
	} else {
		# File does not exist - need to raise an error message
	}

	$self->{'route'} = $self->{'module'}."::".$self->{'function'}; # the function we want to call in the specified module
	my %response;
	my $checkRoute = $self->{'route'};

	# check validity of function. Private classes start with _ we don't allow these thruogh the url.
	if (defined(&$checkRoute) && ref(\&$checkRoute) == "CODE" && $checkRoute !~ /^_/){

		shift (@parts); shift (@parts); shift (@parts); # lop 3 off to get to further parameters only

		$self->{'params'} = \@parts;
 		my %pairs = &set_key_pairs(@{$self->{'params'}});
		$self->{'pairs'} = \%pairs;
		#&get_key_pairs;

		%response = (
			route => $self->{'route'},
			function => $self->{'function'},
			module => $self->{'module'},
			error => 0,
			success => 1,
			params => \@parts,
			pairs => $self->{'pairs'},
		);
	} else {
		%response = (
			error => 1,
			success => 0,
			errorMessage => "Could not find route (route definition error)",
			function => 0, 
			route => 0,
			module => $self->{'module'},
			parts => \@parts,
			pairs => $self->{'pairs'},
		);

	}

	$self->{'response'} = \%response;
	#return \%response;


	bless $self,$class;
	return $self;

}

sub get_response {
	my $self = shift;

	return $self->{'response'};
}

# initialize vars - there are two global to this package - @params (all url paramaters) and %pairs (url params split into key/value pairs)
my $params; # array ref of url paramaters
my %pairs; # url paramaters split into pairs

# Function: get_route
# Param $request (string) - full request string (eg. /auth/login/, /auth/logout/, etc)
# Returns: hash, including the function we need to call by splitting the url at /, or 0 if no function was found.
sub get_route {

	my $request = shift; 

	my @parts = split(/\//g,$request);
	foreach my $key (@parts){
		if ($key eq "framework" || !$key){ shift (@parts)}
	}

	my $module = $parts[1];
	my $function = $parts[2];
	if (!$function || $function =~ /^\?.*/){ # if no second paramater or it's a query string
		$function = "defaultAction"; # call a sub called defaultAction if nothing specified
	}
	my $file = getcwd . "/controllers/".$module;
	if (-e "$file.pm"){
		eval("use $module"); # use the controller specified in the url
	}
	my $route= $module."::".$function; # the function we want to call in the specified module
	my %response;

	# check validity of function. Private classes start with _ we don't allow these thruogh the url.
	if (defined(&$route) && ref(\&$route) == "CODE" && $route!~ /^_/){

		shift (@parts); shift (@parts); shift (@parts); # lop 3 off to get to further parameters only

		$params = \@parts;
		%pairs = &set_key_pairs(@$params);
		#&get_key_pairs;

		%response = (
			route => $route,
			function => $function,
			module => $module,
			error => 0,
			success => 1,
			params => \@parts,
		);
	} else {
		%response = (
			error => 1,
			success => 0,
			errorMessage => "Could not find route (route definition error)",
			function => 0, 
			route => 0,
			module => $module,
			parts => \@parts,
		);

	}
	return \%response;
}

# Sub: params
# Return: array (list of url params sent as part of the url and not the query string
sub params {
	return @$params;
}

# Sub: set_key_pairs
# Meta: Go through the url paramaters that makes up the route, and store alternately as keys and values in %pairs hash
# Return: hash (key/value pairs from the url)
sub set_key_pairs {
	my @params = @_; 
	my %pairs;
	my $keyname;
	my $param;
	foreach $param (@params){
		if ($keyname){
			$pairs{$keyname} = $param;
			$keyname="";
		} else {
			$keyname=$param;
		}
	}
	#base::setPairs(%pairs);
	return %pairs;
}

# Sub: get_key_pairs
# Meta: return all key pairs from the url paramaters (route)
# Return: hash (all route pairs)
sub get_key_pairs {
	return %pairs;
	foreach my $key (keys %pairs){
		#print "$key - " . $pairs{$key} . "<br />";
	}
}

# Sub: get_route_value
# Meta: look up the value of an url paramater by it's key
# Param $key (string) - single key to return the resposne from the %pairs hash which is taken from url params
sub get_route_value {
	my $key = shift;
	return $pairs{$key};
}
1;
