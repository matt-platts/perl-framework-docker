#!/usr/bin/perl 

use Data::Dumper;

use lib ('lib');
use LDAPPORTAL;

print "Content-type:text/html\n\n";

my $user =  get_user();
my $pass =  get_pass();

my $ldap = new LDAPPORTAL;
#$ldap->_connect();
#my $bind_result = $ldap->_bind();
#my $result = $ldap->_bind_user($user,$pass);
my $result = $ldap->authenticate($user,$pass);

print Dumper $result;

if ($result->{'message'} eq "Success" && $result->{'status'}==1){
	print "Logged in successfully";
} else {
	print "Log in error";
}


sub get_user {
	print "Enter email address: ";
        my $used_login_id= <>;
        print "\n";
        $used_login_id =~ s/\s*$//;
        #my $used_login_id="matt.platts\@broadcom.com";
	return $used_login_id;
}

sub get_pass {
	print "enter users password:";
        system('stty -echo');
        my $password = <>;
        system('stty -echo');
        print "\n";
        $password =~ s/\s*$//;
        $used_pass=$password;
	#my $used_pass="Test";
	return $used_pass;
}
