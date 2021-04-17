#!/bin/perl

package LDAPPORTAL;

use strict;
use warnings;

use Net::LDAP;
use Net::LDAP::Util qw(ldap_error_text);
use Net::LDAP::LDIF;
use Data::Dumper;

use lib("lib");
use LDAP_CONFIG;

# Usage:
#
# Simple for everyday use:
#
# use LDAPPORTAL;
# my $ldap = new LDAPPORTAL;
# my $result = $ldap->authenticate($user,$pass); # Returns hash with 2 values: status (bool) 1/0 and message (string) Success/[Error Message]
#
# or split into component functions:
#
# my $ldap = new LDAPPORTAL;
# $ldap->_connect(); # make connection to LDAP server
# my $bind_result = $ldap->_bind(); # bind
# my $result = $ldap->_bind_user($user,$pass); # attempt to bind user to authenticate  - returns same result as the simple 'authenticate' function aovve.



sub new {
        my $class = shift;
        my $self = {};

	$self->{ldap_hostname} = $LDAP_CONFIG::ldap_hostname;
	$self->{ldap_port} = $LDAP_CONFIG::ldap_port;
	$self->{binddn} = $LDAP_CONFIG::binddn;
	$self->{password} = $LDAP_CONFIG::password;

        bless $self, $class;
        return $self;
}


# This is the only required public function (other than 'new'), which simply does the lot
sub authenticate {

	my $self = shift;
	my $user = shift;
	my $pass = shift;

	my $ldap = $self->_connect();
	my $bind = $self->_bind();
	#print "DONE BIND\n";
	#print Dumper $bind;
	#print "\n";
	my $result = $self->_bind_user($user,$pass);

	#print "Content-type:text/html\n\n";
	#print Dumper $result; 
	#exit;
	return $result;
}

# Make LDAP connnection
sub _connect {

	my $self = shift;

	#my $ldap_connection = LDAP_CONFIG::connect(); 
	my $ldap_connection = Net::LDAP->new($self->{ldap_hostname}, port => $self->{'ldap_port'}) or die "Unable to connect to LDAP server $self->{ldap_hostname}: $@\n";
	$self->{'ldap_connection'} = $ldap_connection;

	return $ldap_connection;
}

# Bind
sub _bind {

	my $self = shift;
	my $ldap = shift;

	#my $bind_result = LDAP_CONFIG::bind($self->{ldap_connection}); 
	my $bind_result = $self->{ldap_connection}->bind(dn => $self->{binddn}, password => $self->{password});
	#print Dumper $bind_result;
	return $bind_result;
}

# Attempt to bind user to authenticate
sub _bind_user {

	my $self = shift;
	my $used_login_id = shift;
	my $used_pass = shift;
	
        my $filter = "mail=$used_login_id";
        my $base = "[enter base here]";

	my %result = ();

        # Which attributes should be returned?
        #my $attr = "sn, givenname, telephonenumber, mail, pwdLastSet";
        my @attrs = ('' ); # all
        my $results = $self->{ldap_connection}->search(base=>$base,filter=>$filter,attrs=>\@attrs);
	if (!$results->entries){

		$result{'message'}="No entry for $filter";
		$result{'sstatus'}=0;
		return \%result;
		exit;

	}

	#print "We have a result?!";
	#print Dumper $results->entries;
	#print "Now to bind with user data:\n";

        # Get the user's dn and try to bind:
        my $user_dn = $results->entry->dn;
	#print "UDN: ";
	#print Dumper $user_dn;
	#print ".\n";
	
	# This is the user bind now:
        my $user_bind_results = $self->{ldap_connection}->bind( $user_dn, password => $used_pass );

	# Search
	my $mesg = $self->{'ldap_connection'}->search(
	    base   => $user_dn,
	    filter => "[Enter filter here]",
	) or die($@);

	$mesg->code; # && { print "Login Failed. " . $mesg->error; exit;}

	my ($e) = $mesg->entries;
	my ($more) = $mesg;

	if (!$e){ 
		
		$result{'message'}=$mesg->{'errorMessage'};
		$result{'status'}=0;
		return \%result;

	}


	#print "Dumping all data in \$e:";
	#print Dumper $e;

	my %return;
	$return{'display_name'} = $e->get_value('displayname');
	$return{'mail'} = $e->get_value('mail');
	$return{'mobile'} = $e->get_value('mobile');
	#print "Groups!\n\n";
	#print join(",", $e->get_value('memberOf'));
	my $group_string="";
	my @ad_groups=();
	foreach my $x ($e->get_value('memberOf')){
		my (@items) = split(",",$x);
		my $group = $items[0];
		$group =~ s/CN=//;
		#print $group;
		#print "\n";
		push(@ad_groups,$group);
	
	}
	#$return{'memberOf'} = join(",", $e->get_value('memberOf'));
	$return{'memberOf'} = join(",", @ad_groups);
	$return{'memberOf_array'} = \@ad_groups;
	#$return{'memberOf'} = join(",",@{$e->get_value('memberOf')});

	my $ld = Net::LDAP::LDIF->new("-","w");
	#$ld->write($e);

	$return{'message'}=$user_bind_results->error;
	$return{'status'}=1;
	
        $self->{ldap_connection}->unbind;

	return \%return;

}

1;
