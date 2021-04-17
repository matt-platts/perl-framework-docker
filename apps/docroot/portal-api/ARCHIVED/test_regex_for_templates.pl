use Data::Dumper;

my $output= "Here is a string of text here is a string with text {=if something} We have something {=end_if} and that was that {=if that} thatness {=end_if}";

my @matches = $output =~ /^(Here is a string ((?!with).)* text)/g;
my @matches = $output =~ /({=if ((?:!?\w+[|+,;]?)+ ?=? ?[\w ]+)}((?!{=end_if).).*?{=end[ _]?if})/g;

foreach $match (@matches){
	print "Got $match\n";
}

