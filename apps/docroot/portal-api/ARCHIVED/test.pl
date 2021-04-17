package Test;
use strict;
use warnings;

our (@EXPORT_OK);
use base qw(Exporter);
@EXPORT_OK = qw(make_file);

sub make_file {
  print qq{Hello from the make_file sub\n};
}

sub delete_file {
  print qq{Hello from the delete_file sub\n};
}


package Main;

use Test qw(make_file);
make_file();
