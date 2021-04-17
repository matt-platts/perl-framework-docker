# SYMC_LDAP.pm
# LDAP authentication
# Run this module through the perl interpreter on the command line for usage information
 
package BRCM_LDAP;

use lib ("/apps/docroot/portal-api/lib/AD/lib");
use LDAPPORTAL;

chdir ('/apps/docroot/portal-api/');
require("config.cgi") || die("Can't require config.cgi");

__PACKAGE__->run unless caller;

sub run {
	use Data::Dumper;
	print "hello from the command line runner\n";
	my %response = ldap_authenticate("matt.platts\@broadcom.com","[pssword]");
	print "hello again from the command line runner\n";
	foreach my $key (keys %response){
		print $key . " - " . $response{$key} . "\n";
	}
}

use Net::LDAP;
use Net::LDAP::Util qw(ldap_error_text);
use Data::Dumper;


sub ldap_authenticate {

	my $user_login		= shift;
	my $user_password	= shift;

	if (!$CONFIG::ldap_auth) { return 0; } # ldap authentication can be turned on in the configuration file

	my %resp = (); # Init response hash

	$used_login_id 	= $user_login;
	$used_pass 	= $user_password;


	my $ldap = new LDAPPORTAL;
	my $result = $ldap->authenticate($user_login,$user_password);


	# Response
	if ($result->{'message'} eq "Success" && $result->{'status'}==1){
		$resp{'success'} = 'true';
		$resp{'admin'} = 'true';
		$resp{'errorMsg'} = 'no error';
		$resp{'memberOf'} = $result->{'memberOf'}; 
		$resp{'memberOf_array'} = $result->{'memberOf_array'}; 
	} else {
		$resp{'success'} = 'false';
		$resp{'errorMsg'}= "Error: unable to authenticate $user_login and $user_password with LDAP.: " . $result->{'message'};
	}
        
	return %resp;
}
