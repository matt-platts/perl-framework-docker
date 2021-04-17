#!/usr/bin/perl
$|=1;
use lib("lib");
use CGI;
use sessions;
use my_html;
use Data::Dumper;

#use constant INTERNAL_EMPLOYEE_SERVER => '10.200.104.151'; #internal LDAP server
use constant HTML_FOLDER=> "";
use constant SESSIONS_FOLDER  => "/tmp/register_ra_sessions_ldap/";
use constant SESSIONS_TIMEOUT => 60;      #30 minute timeout for session files

my $html    = my_html->new(HTML_FOLDER);
my $session   = sessions->new($html->{COOKIES}->{SESSION}, SESSIONS_FOLDER, SESSIONS_TIMEOUT);
my $life = 1000;
my $fut_time=gmtime(time()+$life)." GMT";
$q = new CGI;
if ($q->param('logout')){
	$session->{'USER'}="";
}
print "Set-Cookie: SESSION=" . $session->{ID} . "; path=/; expires=" . $fut_time . "\r\n";
print "Content-type:text/html\n\n";

my $filename = "index_template.html";
if (!$session->{'USER'}){
	$filename = "login_template.html";
}

open(my $fh, "<", "templates/$filename") or die("Cant read $filename");
$/ = undef;
my $text = <$fh>;
close($fh);

my $signed_out = ''; # this is a sign in page by default for LDAP so nothing is required
my $signed_in = '<a id="sign_in_link" class="sign_in_link" href="index.cgi?logout=1"><i class="fa fa-lock"></i>Sign Out</a>';
if ($q->param('logout')){
	$text =~ s/%link%/$signed_out/g;
} else {
	$text =~ s/%link%/$signed_in/g;
}
$text =~ s/%link%//g;
$text =~ s/%success_url%/index.cgi/g;
$text =~ s/%fail_url%/fail.html/g;

# TAB PRINT LOGIC - based on user permissions from config file
my $show_tabs_script="<script>\n";
my $permissions = $config::users{$session->{'USER'}->{'EMAIL'}}; 
foreach my $tab (keys %config::tabs){
	if ($config::tabs{$tab} & $permissions) { # binary math to see if user is allowed to access tab
		$show_tabs_script .= "document.getElementById('$tab').style.display='inline';\n";
	} else {
		$show_tabs_script .= "document.getElementById('$tab').style.display='none';\n";
	}
}
$show_tabs_script .= "</script>\n";

# START CONTENT SECTIONS #

############################################################
# Tab 1 - Main content depends on if we have a file or not #
############################################################
my $content;

$content .= "Here is some content!";
$text =~ s/%content%/$content/;
print $text;
exit;


