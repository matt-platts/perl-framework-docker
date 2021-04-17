#!/usr/bin/perl -w
package my_html;
use strict;

#my $HTML_FOLDER = "register/";

# my_html object has following hash tables:
# my_html->{SESSION}        => hash containing all session variables
# my_html->{COOKIES}        => hash containing all cookies sent by client
# my_html->{SEND_HEADERS}   => hash with all headers that will be sent with print_headers sub
# my_html->{SUBSTITUTE}     => hash for substitutions used by show_html sub
# my_html->{DELETE_BETWEEN} => hash for deleting everything between 2 patterns
#   : my_html->{DELETE_BETWEEN}->{START_PATTERN} = "END_PATTERN";
#
# my_html->{QUERY} => hash with query string values
# my_html->{FORM}  => hash with form values

############################################################
###
### my_html->new ()
###
### Creates new instance of my_html object with cookie session
### and basic HTML headers (to avoid caching)
###
############################################################

sub new($$) {
    my ($proto, $html_folder) = @_;
    my $self = {};
    #
    # read/set headers
    #
    $self->{HTML_FOLDER} = $html_folder;
    $self->{SEND_HEADERS}->{"Content-type"} = "text/html";
    $self->{SEND_HEADERS}->{"Cache-Control"} = "no-cache";
    $self->{SEND_HEADERS}->{"Expires"} = "Mon, 26 Jul 1997 05:00:00 GMT";
    my $class = ref($proto) || $proto;
    bless($self, $class);
    $self->parse_input();

    return $self;
}

#sub DESTROY {
#    my ($self) = @_;
#}

sub get_html_folder($) {
    my ($self) = @_;
    return $self->{HTML_FOLDER};
}

###########################################################
###
### my_html->set_cookie ($name, $content, $life)
### $name    = cookie name
### $content = cookie value
### $life    = expiration. If undefined, cookie is session-only
###
### Creates cookie header to be sent to browser.
###
############################################################

sub set_cookie($$$$) {
    my ($self, $name, $content, $life) = @_;
    my $add = "";
    if($life) {
        my $fut_time=gmtime(time()+$life)." GMT";
        $add = " expires=$fut_time;";
    }    
    $self->{SEND_HEADERS}->{"Set-Cookie"} = "$name=$content; path=/;" . $add;
}

############################################################
###
### my_html->print_headers ()
###
### Prints out content of SEND_HEADERS hash in form of 
### HTML header
###
############################################################

sub print_headers($) {
    my ($self) = @_;
    foreach my $header (keys(%{$self->{SEND_HEADERS}})) {
        print $header.": ".$self->{SEND_HEADERS}->{$header}."\n";
    }
    print "\n";
}

############################################################
###
### my_html->load_html ($file_name)
### $file_name = file to load
###
### Loads $file_name file into HTML variable
###
############################################################

sub load_html($$) {
    my ($self, $file_name) = @_;
    local(*FILE);
    open(FILE, "<".$self->{HTML_FOLDER}.$file_name) or return;
    my @lines = <FILE>;
    close(FILE);
    $self->{HTML} = join("", @lines);
}

############################################################
###
### my_html->load_html ($pattern, $file_name)
### $pattern   = where to add file
### $file_name = file to add
###
### Loads file and replaces $pattern within HTML variable with
### this file
###
############################################################

sub add_html($$$) {
    my ($self, $pattern, $file_name) = @_;
    local(*FILE);
    open(FILE, "<".$self->{HTML_FOLDER}.$file_name) or return;
    my @lines = <FILE>;
    close(FILE);
    my $file = join("", @lines);
    $self->{HTML} =~ s/$pattern/$file/g;
}

############################################################
###
### my_html->show_html ()
###
### 1. prints HTML headers
### 2. deletes content according to DELETE_BETWEEN hash
### 3. substitutes content according to SUBSTITUTE hash
### 4. prints the result
###
############################################################

sub show_html($) {
    my ($self) = @_;
    print_headers($self);
    foreach my $match (keys(%{$self->{DELETE_BETWEEN}})) {
        my $a=index($self->{HTML}, $match);
        while($a>=0) {
           my $b = index($self->{HTML}, $self->{DELETE_BETWEEN}->{$match});
           if($b>=0) {
             $self->{HTML} = substr($self->{HTML}, 0, $a) . substr($self->{HTML}, $b+length($self->{DELETE_BETWEEN}->{$match}));

           } else {
             $self->{HTML} =~ s/$match//;
           }
           $a=index($self->{HTML}, $match);
        }
#        $self->{HTML} =~ s/$match(.|\n)*$self->{DELETE_BETWEEN}->{$match}//;
    }
    foreach my $match (keys(%{$self->{SUBSTITUTE}})) {
        $self->{HTML} =~ s/$match/$self->{SUBSTITUTE}->{$match}/g;
    }
    print($self->{HTML});
}

############################################################
###
### my_html->parse_input_without_cgi_pm ()
### Backed up old parse_input function - did not handle file
### uploads.
###
### 1. Parses query string and saves result in QUERY hash
### 2. Parses cookies and saves result in COOKIES hash
### 3. Parses form data and saves result in FORM hash
###
############################################################

sub parse_input_without_cgi_pm($) {
    my ($self) = @_;

    if ($ENV{'QUERY_STRING'}){
         my $buffer = $ENV{'QUERY_STRING'};
         my @pairs = split(/&/, $buffer);
         foreach my $pair (@pairs){
              my ($name, $value) = split(/=/, $pair);
	            $value =~ tr/+/ /;
              $value =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C", hex($1))/eg;
              $self->{QUERY}->{$name} = $value; 
         }
    }
    
    if($ENV{HTTP_COOKIE}) {
        my @cookies = split(/;\s/,$ENV{HTTP_COOKIE});
        foreach my $cookie (@cookies) {
            my ($cook, $val) = split(/=/, $cookie);
            $self->{COOKIES}->{$cook} = $val;
        }
    }
    my ($buffer, @pairs);
    unless(defined $ENV{'CONTENT_LENGTH'}) {
        $ENV{'CONTENT_LENGTH'} = 0;
    }
    read(STDIN, $buffer, $ENV{'CONTENT_LENGTH'});

#$self->print_headers();
#print("\n:\n");
#print($buffer);
#exit;

    @pairs = split(/&/, $buffer);
    foreach my $pair (@pairs) {
        my ($name, $value) = split(/=/, $pair);
        $value =~ tr/+/ /;
        $value =~ s/%([a-fA-F0-9][a-fA-F0-9])/pack("C",hex($1))/eg;
        $self->{FORM}->{$name} = $value;
    }

}

############################################################
###
### my_html->parse_input ()
###
### 1. Parses query string and saves result in QUERY hash
### 2. Parses cookies and saves result in COOKIES hash
### 3. Parses form data and saves result in FORM hash
###
############################################################

sub parse_input($) {
        my ($self) = @_;

        if($ENV{HTTP_COOKIE}) {
                my @cookies = split(/;\s/,$ENV{HTTP_COOKIE});
                foreach my $cookie (@cookies) {
                    my ($cook, $val) = split(/=/, $cookie);
                    $self->{COOKIES}->{$cook} = $val;
                }
        }

        use CGI;
        $CGI::POST_MAX = 1024 * 1000; # 1mb file upload limit
        my $q = CGI->new();

        my @post_params = $q->param;
        foreach my $field($q->param){
                $self->{FORM}->{$field} = $q->param($field);
        }

        my @url_params = $q->url_param;
        foreach my $field(@url_params){
                $self->{QUERY}->{$field} = $q->url_param($field);
        }

        if ($q->upload('casosd_csv')){
                $self->{UPLOAD}->{'casosd_csv'}->{'filename'} = $q->upload('casosd_csv');
                my $fh = $q->upload("casosd_csv");
                local $/=undef;
                $self->{UPLOAD}->{'casosd_csv'}->{'data'} = <$fh>;
                if ($self->{UPLOAD}->{casosd_csv}->{data} !~ /^[\d\n\r_-]+$/){ # digitst, _, - and linebreaks/carriage returns ONLY
                        $self->{UPLOAD}->{'casosd_csv'}->{'error'}=1;
                }
        }
}


1;
