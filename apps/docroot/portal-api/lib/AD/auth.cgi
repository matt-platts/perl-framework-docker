#!/usr/bin/perl 

use CGI;
use Data::Dumper;

use lib ('lib');
use LDAPPORTAL;
use my_html;
use sessions;

my $cgi = new CGI;
my $user = $cgi->param('username');
my $pass  = $cgi->param('userpass');

my $use_redirect = $cgi->param('use_redirect');
my $success_url = $cgi->param('success_url');
my $fail_url = $cgi->param('fail_url');

my $ldap = new LDAPPORTAL;
my $result = $ldap->authenticate($user,$pass);

if ($result->{'message'} eq "Success" && $result->{'status'}==1){
	log_user_in($result->{'display_name'},$result->{'mail'});
	$message = "Logged in successfully";

	if ($use_redirect){
		print "Location:$success_url\n\n";
		exit;
	}

} else {
	$mesage = "Log in error";

	if ($use_redirect){
		print "Location:$fail_url\n\n";
		exit;
	}
}



print "Content-type:text/html\n\n";
print Dumper $result;
print "<br />\n";
print $message;
print "<a href=\"index.cgi\">Return to home page</a>\n";





# sub log_user_in
sub log_user_in {

	my $name = shift;
	my $email = shift;
	use constant HTML_FOLDER=> "";
	use constant SESSIONS_FOLDER  => "/tmp/register_ra_sessions_ldap/";
	use constant SESSIONS_TIMEOUT => 60;      #30 minute timeout for session files
	my $html      = my_html->new(HTML_FOLDER);
	my $session   = sessions->new($html->{COOKIES}->{SESSION}, SESSIONS_FOLDER, SESSIONS_TIMEOUT);

	$session->{'USER'} = ();	
	$session->{'USER'}->{'NAME'} = $name;
	$session->{'USER'}->{'EMAIL'} = $email;
	$session->Save_Session;

	my $life = 1000;
	my $fut_time=gmtime(time()+$life)." GMT";

	print "Set-Cookie: SESSION=" . $session->{ID} . "; path=/; expires=" . $fut_time . "\r\n";
	#print "Content-type:text/html\n\n";
	#print "Set that session!";
}
exit;

