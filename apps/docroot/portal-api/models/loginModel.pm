#!/usr/bin/perl
use strict;
use warnings;
package loginModel;

use JSON;
use CGI qw/:standard/;
use CGI::Cookie;
use Net::LDAP;
use Net::LDAP::Filter;


use lib ("../lib/");
use lib ("../lib/AD/lib/");

use BRCM_LDAP qw(ldap_authenticate ldapSafeName  GetbDistinguishedNameFromUserName); # LDAP authentication
use BC_AUTH qw (authenticate get_user_name); # portal authentication

require("config.cgi");

my $debug_login=0;

sub login {

	my $cgi = new CGI;
	if ($cgi->url_param('action') && $cgi->url_param eq "logout"){ &logout; exit;}

	my %login_result;
	my %vals = (
		username => $cgi->param('username'),
		password=> $cgi->param('password'),
	);

	my @required_fields = ("username","password");
	foreach my $rf (@required_fields){
		if (!$vals{$rf}){
			return &login_error;
		}
	}

	my $auth_response = BC_AUTH::authenticate($vals{'username'},$vals{'password'},"");
	
	if ($debug_login){
		print "Content-type:text/html\n\n";
		print "OK here";
		print Dumper \$auth_response;
		print Dumper $auth_response;
		print $auth_response->{'content'}->{'memberOf'};
		print $auth_response->{'memberOf'};
		print ${auth_response};
		print ref(${auth_response});
		my %hash = %$auth_response;
		foreach my $key (keys %hash){
			print $key . " : " . $hash{$key} . " ----- \n<br />";
			if ($key eq "content"){
				print "ITS CONTENT<br />\n";
			my %content = $hash{$key};
			foreach my $key2 (keys %content){
					print $key2 . " : " . $content{$key2} . " ***<br />\n";;
			}
			}
		}
		print "Nothing?";
		exit;
	}
	my $auth_token = $auth_response->{'token'};
	my $memberOf = $auth_response->{'memberOf'};
	my $memberOf_array = $auth_response->{'memberOf_array'};
	if ($auth_token){
		#my $user_cookie = CGI::Cookie->new(-name=>'user',-value=>$auth_token,-expires=>'+1h');
		#print header(-cookie=>[$user_cookie], -redirect=>'/');

		my %content = (
			message => "Login ok",
			username => $vals{'username'},
			token => $auth_token, # only for debugging - we don't need this value in the content that is returned at all
			memberOf => $memberOf,
			memberOf_array => $memberOf_array,
		);
	
		%login_result=(
			error => 0,
			success => 1,
			#username => BC_AUTH::get_user_name($auth_token),
			username => $cgi->param("username"),
			auth_token => $auth_token,
			memberOf => $memberOf,
			memberOf_array => $memberOf_array,
			content => \%content, 
		);

	} else {
		
		%login_result=(
			error => 1,
			success => 0,
			username => "",
			auth_token => "",
			errorMessage => "Unable to authenticate user credentials: " . $auth_response->{'errorMsg'},
		);

	}

	return %login_result;
}

sub logout {

	my $user_cookie = CGI::Cookie->new(-name=>'user',-value=>'',-expires=>'-1h');
	my $groups_cookie = CGI::Cookie->new(-name=>'memberOf',-value=>'',-expires=>'-1h');
	my @cookies=($user_cookie,$groups_cookie);
	print header (-cookie=>[@cookies], -location=>"/np-portal/");
	return 1;
}

sub login_error {
	my %login_result=(
		error => 1,
		success => 0,
		errorMessage => "Username and/or password not specified"
	);
	return %login_result;	
}

1;
