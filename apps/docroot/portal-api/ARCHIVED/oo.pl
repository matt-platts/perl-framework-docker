#!/usr/bin/perl

# Just some testing stuff

##################################

package Person;
sub new {
	my $class = shift;
	my $self = {
		_firstName => shift,
		_lastName  => shift,
		_ssn       => shift,
	};
	# Print all the values just for clarification.
	$self->{'testval'}="12345";
	bless $self, $class;
	return $self;
}

sub printDetails {
	my $self = shift;	
	print "First Name is $self->{_firstName}\n";
	print "Last Name is $self->{_lastName}\n";
	print "SSN is $self->{_ssn}\n";
	print "Testval is $self->{testval}\n";
	print "\n";
}

##################################

package Dog;

my $inc; # my is private to package, but can be accessed with an accessor method
our $incrementor; # our is not private to the package

sub bark {
	$inc++;
	$incrementor++;
	print "woof $inc $incrementor!\n";
}

sub getInc {
	return $inc;
}

##################################

package Main;

print "ok!\n\n";
my $matt = new Person("Matt","Platts","u82356478");

$matt->printDetails();
print "Calling &Dog::bark:\n";
&Dog::bark;
print "Calling Dog::bark():\n";
Dog::bark();
print "\n---------\nInc is " . $Dog::inc . " or " . $Dog::incrementor . " or " . &Dog::getInc;

##################################

package Lower;
@ISA = qw(Person);

$self->printDetails();

