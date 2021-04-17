#!/bin/perl
package LDAP_CONFIG;

use strict;
use Net::LDAP;
use Net::LDAP::Util qw(ldap_error_text);

our $ldap_hostname = "MY.LDAP.SERVER";
our $ldap_port = '389';
our $binddn = "[Enter Bind DN Here]";
our $password = '[Enter password to access LDAP]';

# Probably don't need the 2 below any longer
our $filter = "(mail=)";
our $userbase = ""; 


1;
