#!/usr/bin/perl
# searchController.pm
# example call: http://localhost/framework/search/search_for/serial_no/1000480381/
# example call with query string: http://localhost/framework/search/search_for/?search_for=1000480381 

package searchController;
@ISA = (masterController);

use CGI qw/:standard/;
use CGI::Cookie;

use strict;
use warnings;
use lib("lib"); # custom code library
use lib("model"); # data for the application - may be hard coded in .pm files rather than in a database, and includes accessor methods
use dbrs;
use CGI;
use Data::Dumper;
#use XML::Simple;
#use XML::LibXML qw( );
use Fcntl qw(:flock SEEK_END);
use BC_AUTH;

sub new {

	my $class = shift;
	my $self = {};
	bless $self,$class;
	return $self;
}

# Sub: defaultAction
# Meta: A sub called defaultAction is automatically run if no accessor method is specified in the url
sub defaultAction {
	my $self = shift;

	my %response = (
		content => "default action is not available - please use /search/search_for/ api with added params serial_no/[serial number] to search",
		success => 0,
		error => 1,
	);
	return \%response;
}

# Sub: search_for
# Meta: search TalendAPI and Entitlements/Subscription for an appliance serial number 
# Param $inputs (hash) - should contain a key search_for with a 10 digit serial number
# Usage: search/search_for/serial_no/100031001
sub search_for {

	my $self = shift;
	my $inputs = shift; 
	my $cgi = new CGI;
	my $search_for = $cgi->param("search_for");
	if (!$search_for){
		$search_for = $inputs->{'pairs'}->{'serial_no'};
	}

	if ($search_for && ($search_for !~ /^\d{10}$/ && $search_for !~ /[A-Z0-9]{5}[_-][A-Z0-9]{5}/ && $search_for !~ /[0-9]{8}-[0-9]-[0-9]/)){
		my %response = $self->errorResponse("Serial number supplied is not 10 digits long","SEARCH2");
		return \%response;
	}
	if (!BC_AUTH::get_user_name_from_session() && $search_for){
		my %response = $self->errorResponse('User not logged in',"SEARCH1");
		return \%response;
	}

	if (!$search_for){
		my %response = $self->errorResponse('Serial number not supplied',"SEARCH3");
		return \%response;
	}

	# Error checking
	if (!$search_for || $search_for =~ /[\<\>\!\[\]\"\'\&\%\$]/){
		&_printError('Invalid input - only letters, numbers, spaces, underscores and hyphens are allowed in search.',3);
	}

	_log_search($search_for); 

	use searchModel;
	my $response = searchModel::search($search_for); 

	return $response;
}

# Sub: history
# Meta: return user history for a search
# Returns: string (full html page)
sub history {

	my $self = shift;
	my $output = '<link rel="stylesheet" type="text/css" href="css/portal.css">' . "\n";
	$output .= "<style>\nbody {font-size:12px; font-family:verdana,arial,helvetica; }\n a:text-decoration:none; color:#1b2c68;}\n a:hover {text-decoration:underline;}\n</style>";

	# check that authentication means this is no longer required.
	#my %cookies = CGI::Cookie->fetch;
	#if (!$cookies{'user'}){
	#        exit;
	#}


	$output .= "<p><div style=\"float:right\"> <a class=\"reloadTab\" href=\"Javascript: void location.reload();\" style=\"font-size:2em; color:gray; text-decoration:none;\">&#8635;</a> </div><b>Your recent searches:</b><br /></p><ul class=\"introtext2\"><table>";
	use Cwd;
	my $input_file= getcwd() . "/data/latest_searches.txt";

	my $current_user = BC_AUTH::get_user_name();
	my %error_response=();
	if (-e $input_file){

		open( my $inp, "<", $input_file ) or %error_response = $self->errorResponse("Can't open $input_file for reading: $!","SEARCH4");
		my @lines=(<$inp>);
		my @had=();
		my $line;
		foreach $line (@lines){
			chomp $line;
			if (!grep {$_ eq $line} @had) {
				push (@had,$line);
				my ($search_user,$search_string,$when,$note) = split(/\|/,$line);
				if (!$when){ $when=""; } # This line stops errors for searches which were logged before I started adding the time to the logs.
				if ($search_user eq $current_user){
					$output .= "<tr><td><a class=\"searchlink\" rel=\"$search_string\" onClick=\"top.searchFor('$search_string')\" href=\"#\">" . $search_string. "</a></td><td>" . $when . "</td><td>";
					if ($note){
						$output .= " &nbsp; <span class=\"searchnote\">" . $note . "</span>";
					} else {

					}
					$output .= "</td></tr>\n";
				}
			}
		}
		close($inp);
		$output .= "</table>";

		if (!@had){
			$output .= "<p class='success'>You have no serial numbers in your search history.</p>";
		}

		$output .= "</p>";

	}

	if (%error_response){
		return \%error_response;
	} else {

		viewController::setContentType("text/html");
		viewController::setView("view_template");

		my %response = (
			error => 0,
			success => 1,
			content => $output,
		);
		return \%response;

	}
}

# Function: _log_search
# Param: $search_for (string) - the serial number being searched
#
# Meta: 
# log the search so it appears in latest search lists at the top (most recent first)
sub _log_search {
	my $search_for = shift;

	open (INF, "data/latest_searches.txt") || die("Can't open data/latest_searches for writing: $!");
	my @filedata = <INF>;
	close(INF);

	my @rewrite_lines;
	my $datestring = localtime();
	my $username = BC_AUTH::get_user_name() || "No logged in user";
	my $firstline = $username . "|" . $search_for . "|" . $datestring . "|"; # the new search - may be a note attached so don't add to the array just yet
	foreach my $line (@filedata){
		chomp $line;
		my (@linedata) = split(/\|/,$line);
		if ($linedata[1] ne $search_for || $username ne $linedata[0]){
			# rewrite if serial doesn't match OR name doesn't match.. if both match we don't need to repeat it
			push (@rewrite_lines, $line);
		} elsif ($linedata[1] eq $search_for && $username eq $linedata[0]){
			if ($linedata[3]){ # have a note
				$firstline .= $linedata[3];
			}
		}
	}
	my $output_file="data/latest_searches.txt";
	open( OUTPUT, ">", $output_file ) or die "Perl script error - I can't write to the output file of '$output_file': $!";
	flock(OUTPUT, LOCK_EX);
	my @slice = @rewrite_lines[0 .. 500]; # max of 500 entries. Note this is multi-user, would be far better to do database log
	unshift(@slice,$firstline);
	foreach my $loop(@slice){
		if ($loop){
			print OUTPUT $loop . "\n";
		}
	} 
	flock(OUTPUT, LOCK_UN);
	close(OUTPUT);
}

# Function: get_note
# Meta: retrieve a note from the serial number history file
# Usage: portal-api/search/get_note/serial/2615320015/
sub get_note {

	my $self = shift;
	my $inputs = shift;
	my $serial = $inputs->{'pairs'}->{'serial'};

	open (INF, "data/latest_searches.txt") || die("Can't open data/latest_searches for writing: $!");
	my @filedata = <INF>;
	close(INF);

	my @rewrite_lines;
	my $username = BC_AUTH::get_user_name() || "No logged in user";

	my $note;
	foreach my $line (@filedata){
		chomp $line;
		my (@linedata) = split(/\|/,$line);
		if ($linedata[1] eq $serial && $linedata[0] eq $username){
			$note = $linedata[3];
		}
	}

	my %response;
	if (!$note){
		%response = $self->build_response("");
	} else {
		%response = $self->build_response($note);
	}

	print "Content-type:text/html\n\n";
	print Dumper \%response;
	exit;
	return \%response;

}

# Function: add_note
# Meta: add a note to a particular search - useful for finding it again if you can't remember the serial number
# 	call: http://localhost/api2/search/add_note/serial/2615320015/note/this%20is%20a%20note/
sub add_note {

	my $self = shift;
	my $inputs = shift;
	my $note = $inputs->{'pairs'}->{'note'};
	$note =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C", hex($1))/eg; # remove url encoding

	$note =~ s/[\"\'<\>]//g; # remove HTML tags and quotes (for security)

	if (length($note) > 300){
		return "The note entered is too long to be stored - max 300 chars please!";
		exit;
	}

	my $serial = $inputs->{'pairs'}->{'serial'};

	open (INF, "data/latest_searches.txt") || die("Can't open data/latest_searches for writing: $!");
	my @filedata = <INF>;
	close(INF);

	my @rewrite_lines;
	my $username = BC_AUTH::get_user_name() || "No logged in user";

	my $response_success=0;
	my $response_error=1;

	foreach my $line (@filedata){
		chomp $line;
		my (@linedata) = split(/\|/,$line);
		if ($linedata[1] ne $serial || $username ne $linedata[0]){
			# rewrite if serial doesn't match OR name doesn't match.
			push (@rewrite_lines, $line);
		} elsif ($linedata[1] eq $serial && $linedata[0] eq $username) {
			my $newline = $linedata[0] . "|" . $linedata[1] . "|" . $linedata[2] . "|" . $note;
			push (@rewrite_lines, $newline);
			$response_success=1;
			$response_error=0;
		}
	}

	# rewrite the text file
	my $output_file="data/latest_searches.txt";
	open( OUTPUT, ">", $output_file ) or die "Perl script error - I can't write to the output file of '$output_file': $!";
	flock(OUTPUT, LOCK_EX);
	my @slice = @rewrite_lines[0 .. 500]; # max of 500 entries. Note this is multi-user, would be far better to do database log
	foreach my $loop(@slice){
		if ($loop){
			print OUTPUT $loop . "\n";
		}
	} 
	flock(OUTPUT, LOCK_UN);
	close(OUTPUT);

	my %response = (
		content => \@rewrite_lines,
		success => $response_success,
		error => $response_error,
	);
	return \%response;
}

# Function: _unique_array
# Param @_ (array)
#


# Meta:
# Return unique items from the incoming array @_
sub _unique_array{
    my %seen;
    grep !$seen{$_}++, @_;
}

