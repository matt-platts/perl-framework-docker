#!/usr/bin/perl
# frsModel.pm

package frsModel;
use DBI;

my $response_text;

#sub getComponent
# param frs_id (string) - serial no of frs
sub getFrs {

	my $serial = shift;
	my $aid = shift;


	if ($serial){

		do_print("<p style='font-weight:bold'>FRS Search results:</p>");

		my $dbh_handler = DBI->connect('dbi:mysql:npl_subsc_db:host=10.85.34.11; port=3306','Npldb_produser','pRoN#LUs3r@0!9') or die "Connection Error: $DBI::errstr\n";

		my $print_me; my $filter_on; my $check_for;
		if ($serial){ $print_me=$serial; $filter_on = "serial_number"; $check_for=$serial;}
		if ($aid){ $print_me=$aid; $filter_on = "serial_number"; $check_for=$aid;}


		my $sql = "
			SELECT features.ft_user_login as AccountID, features.feature_name, features.ft_user_password as LicenseKey, features.ft_exp_date as ExpiryDate, entitlements.end_user_account AS User  
			FROM features 
			INNER JOIN entitlements 
			ON features.serial_number = entitlements.serial_number 
			WHERE 
			(entitlements.serial_number = '$check_for' OR features.ft_user_password = '$check_for') 
			AND features.ft_user_password IS NOT NULL AND features.ft_user_password != \"\" AND features.ft_user_password != \"NULL\" 
			";

		my $sth = $dbh_handler->prepare($sql);
		$sth->execute;

		#do_print($sql);
		my $countrows=0;
		while (my $row = $sth->fetchrow_hashref){
			do_print("<u>Subscription: " . $row->{feature_name} . "</u><br />");
			do_print("Account Id: " . $row->{AccountID} . "<br />");
			do_print("License Key: " . $row->{LicenseKey} . "<br />");
			do_print("Expiry Date: " . $row->{ExpiryDate} . "<br />");
			do_print("User: " . $row->{User} . "<br /><br />");
			$countrows++;
		}

		if (!$countrows){
			do_print("<p style='color:#cc0000'>NO SA Credentials found for $check_for</p>");
			my %response = (
				success => 1,
				error=> 0,
				found => 0,
				content => $response_text,
			);
			return \%response;

		} else {
			my $plural="s";
			if ($countrows==1){ $plural="";}
			do_print("<p style='color:green'>Found $countrows SA credential$plural that matched your criterea.</p>");
			my %response = (
				success => 1,
				error=> 0,
				found => 1,
				content => $response_text,
			);
			return \%response;

		}

		do_print("<hr size=1 /><div style='font-weight:11px !important; background-color:#f1f1f1; margin:5px; padding:5px;'>");

		#######################################################################
		do_print("<h4 style='font-weight:bold'>Entitlement overview for $print_me</h4>");
		do_print("<pre>");


		my @fields=();
		my $desc_query = "DESC entitlements";
		my $sth = $dbh_handler->prepare($desc_query);
		$sth->execute;
		while (my $row = $sth->fetchrow_hashref){
			push (@fields, $row->{Field});
		}   

		#Check it 
	       
		#my $sql_query = "SELECT features.ft_user_login FROM features INNER JOIN entitlements ON features.ft_user_login = entitlements.serial_number WHERE features.serial_number = '$check_for'";
		my $sql_query = "SELECT * FROM entitlements WHERE " . $filter_on . " = '$check_for'";
		#print "Entitlements data: " . $sql_query . "\n";
		$sth = $dbh_handler->prepare($sql_query);
		$sth->execute or die "SQL Error: $DBI::errstr\n";

		my $lencounter;
		my $out;

		do {
	    
			local *STDOUT; # save output from query in a buffer for formatting later in order to do similar column spacing per record
			open STDOUT, ">>", \$out;

			if (1==0){
				foreach my $field(@fields){
					do_print($field);
					do_print("count_$field");
					if ($lencounter->{$field} && length($field) > $lencounter->{$field}) {    
						$lencounter->{$field} = length($field);
					} elsif (!$lencounter->{$field} && !length($field)){
						$lencounter->{$field}='0';
					} elsif (!$lencounter->{$field}){
						$lencounter->{$field} = length($field);
					}
				}
			}

			do_print("\n");

			while (my $row = $sth->fetchrow_hashref){
				foreach my $field (@fields){
					if ($row->{$field}){    
						do_print($row->{$field});
						do print("\t | ");
						if ($lencounter->{$field} && length($row->{$field}) > $lencounter->{$field}) {    
							$lencounter->{$field} = length($row->{$field});
						} elsif (!$lencounter->{$field} && !length($row->{$field})){
							$lencounter->{$field}='0';
						} elsif (!$lencounter->{$field}){
							$lencounter->{$field} = length($row->{$field});
						}
					} else {
						do_print("count_$field | "); # This text is replaced later with the appropriate number of spaces in the formatting section below 
						if ($lencounter->{$field} && length($row->{$field}) > $lencounter->{$field}) {    
							$lencounter->{$field} = length($row->{$field});
						} elsif (!$lencounter->{$field} && !length($row->{$field})){
							$lencounter->{$field}='0';
						} elsif (!$lencounter->{$field}){
							$lencounter->{$field} = length($row->{$field});
						}
						# instead: $lencounter->{$field} && length($row->{$field}) > $lencounter->{$field} ? $lencoutner->{$field} = length($row->{$field} : length($row->{$field}
					}
				}
				do_print("\n");
			}
		};

		# format headers
		my $headers="";
		foreach my $field (@fields){
			my $spaces = $lencounter->{$field}-length($field);
			if (length($field) > $spaces){
				$field = substr($field,0,$lencounter->{$field});
			}

			my $notab = "";
			if ($field eq "device_ser"){ $field="serial no.";}
			if ($field eq "g"){ $field="cntr";}
			if ($field eq "i"){ $field="gree";}
			if ($field eq "l"){ $field="last";}
			if ($field eq "s"){ $field="secd";}
			if ($field eq ""){ $field=""; $notab=1}
			
			$headers .= $field;
			$headers .= " " x $spaces;
			if (!$notab){
				$headers .= "\t | ";
			} else {
				$headers .= "  | ";
			}
		}
		my $out = $headers . $out;

		# formatting the output 
		foreach my $key (keys %$lencounter){
			my $varname = "count_" . $key . "";
			if ($lencounter->{$key}){
				$out =~ s/$varname/&rep($lencounter->{$key})/ge;
			}
			$out =~ s/count_cookie/ /g;
		}



		# print formatted output
		do_print("\n");
		do_print($out);

		##################################################################################################################################
		#print $q->param('serial');

		my $print_me; my $filter_on; my $check_for;
		if ($serial){ $print_me=$serial; $filter_on = "serial_number"; $check_for=$serial;}
		if ($aid){ $print_me=$aid; $filter_on = "serial_number"; $check_for=$aid;}

		do_print("</pre>");
		do_print("<br /><h4 style='font-weight:bold'>Feature overview for $print_me</h4>");
		do_print("<pre>");

		my $dbh_handler = DBI->connect('dbi:mysql:npl_subsc_db:host=10.85.34.11; port=3306','Npldb_produser','pRoN#LUs3r@0!9') or die "Connection Error: $DBI::errstr\n";

		do_print("<pre>");
		my @fields=();
		my $desc_query = "DESC features";
		my $sth = $dbh_handler->prepare($desc_query);
		$sth->execute;
		while (my $row = $sth->fetchrow_hashref){
			push (@fields, $row->{Field});
		}   

		#Check it 
	       
		#my $sql_query = "SELECT features.ft_user_login FROM features INNER JOIN entitlements ON features.ft_user_login = entitlements.serial_number WHERE features.serial_number = '$check_for'";
		my $sql_query = "SELECT * FROM features WHERE " . $filter_on . " = '$check_for'";
		#print "Features data: " . $sql_query . "\n";
		$sth = $dbh_handler->prepare($sql_query);
		$sth->execute or die "SQL Error: $DBI::errstr\n";

		$lencounter = ();
		$out = "";

		do {
	    
			local *STDOUT; # save output from query in a buffer for formatting later in order to do similar column spacing per record
			open STDOUT, ">>", \$out;

			if (1==0){
				foreach my $field(@fields){
					do_print($field);
					do_print("count_$field");
					if ($lencounter->{$field} && length($field) > $lencounter->{$field}) {    
						$lencounter->{$field} = length($field);
					} elsif (!$lencounter->{$field} && !length($field)){
						$lencounter->{$field}='0';
					} elsif (!$lencounter->{$field}){
						$lencounter->{$field} = length($field);
					}
				}
			}

			do_print("\n");

			while (my $row = $sth->fetchrow_hashref){
				foreach my $field (@fields){
					if ($row->{$field}){    
						do_print($row->{$field});
						do_print("\t | ");
						if ($lencounter->{$field} && length($row->{$field}) > $lencounter->{$field}) {    
							$lencounter->{$field} = length($row->{$field});
						} elsif (!$lencounter->{$field} && !length($row->{$field})){
							$lencounter->{$field}='0';
						} elsif (!$lencounter->{$field}){
							$lencounter->{$field} = length($row->{$field});
						}
					} else {
						do_print("count_$field | "); # This text is replaced later with the appropriate number of spaces in the formatting section below 
						if ($lencounter->{$field} && length($row->{$field}) > $lencounter->{$field}) {    
							$lencounter->{$field} = length($row->{$field});
						} elsif (!$lencounter->{$field} && !length($row->{$field})){
							$lencounter->{$field}='0';
						} elsif (!$lencounter->{$field}){
							$lencounter->{$field} = length($row->{$field});
						}
						# instead: $lencounter->{$field} && length($row->{$field}) > $lencounter->{$field} ? $lencoutner->{$field} = length($row->{$field} : length($row->{$field}
					}
				}
				do_print("\n");
			}
		};

		# format headers
		my $headers="";
		foreach my $field (@fields){
			my $spaces = $lencounter->{$field}-length($field);
			if (length($field) > $spaces){
				$field = substr($field,0,$lencounter->{$field});
			}

			my $notab = "";
			if ($field eq "device_ser"){ $field="serial no.";}
			if ($field eq "g"){ $field="cntr";}
			if ($field eq "i"){ $field="gree";}
			if ($field eq "l"){ $field="last";}
			if ($field eq "s"){ $field="secd";}
			if ($field eq ""){ $field=""; $notab=1}
			
			$headers .= $field;
			$headers .= " " x $spaces;
			if (!$notab){
				$headers .= "\t | ";
			} else {
				$headers .= "  | ";
			}
		}
		my $out = $headers . $out;

		# formatting the output 
		foreach my $key (keys %$lencounter){
			my $varname = "count_" . $key . "";
			if ($lencounter->{$key}){
				$out =~ s/$varname/&rep($lencounter->{$key})/ge;
			}
			$out =~ s/count_cookie/ /g;
		}



		# print formatted output
		do_print("\n");
		do_print($out);

		#####################################################################################################################

		do_print("</pre><br /><hr size=1></div>");

		my %response = (
			success => 1,
			error=> 1,
			content => $response_text,
		);
		return \%response;
	} else {
		my %response = (
			success => 1,
			error=> 1,
			content => "No serial entered",
		);
	}

}

sub updateFrs {

	my $account_id = shift;
	my $license_key = shift;
	my $account_name = shift;
	my $exp_date = shift;

	if (!$account_id || !$exp_date || !$license_key || !$account_name){
		return 0;
	}
	

	# db handler
	my $dbh_handler = DBI->connect('dbi:mysql:npl_subsc_db:host=10.85.34.11; port=3306','Npldb_produser','pRoN#LUs3r@0!9') or die "Connection Error: $DBI::errstr\n";

	# Update features table
	$sql_query = "UPDATE features SET ft_exp_date = '$exp_date', ft_user_password = '$license_key' WHERE serial_number = '$account_id'"; 
	$sth = $dbh_handler->prepare($sql_query);
	$sth->execute or return "SQL Error: $DBI::errstr\n";

	# Update entitlements table
	$sql_query = "UPDATE entitlements SET end_user_account = '$account_name' WHERE serial_number = '$account_id' LIMIT 1";
	$sth = $dbh_handler->prepare($sql_query);
	$sth->execute or die "SQL Error: $DBI::errstr\n";


	my %response = (
		status => "success",
		message => "Updated",
	);	

	return \%response;
}

sub addFrs {

	my $account_id = shift;
	my $license_key = shift;
	my $account_name = shift;
	my $exp_date = shift;

	if (!$account_id || !$license_key || !$account_name || !$exp_date){
		return 0;
	}

	#Add handler
	my $dbh_handler = DBI->connect('dbi:mysql:npl_subsc_db:host=10.85.34.11; port=3306','Npldb_produser','pRoN#LUs3r@0!9') or die "Connection Error: $DBI::errstr\n";

	# Adding to features table
	$sql_query = "INSERT INTO features(serial_number,feature_name,ft_exp_date,ft_exp_type,ft_user_password,ft_user_login, ft_user_bc_legacy_login) VALUES ('$account_id','standard_sa','$exp_date','Subscription','$license_key','$account_id', '')";
	$sth = $dbh_handler->prepare($sql_query);
	$sth->execute or die "SQL Error: $DBI::errstr\n";

	# Adding to entitlements table
	$sql_query = "INSERT INTO entitlements(serial_number,hardware_model,product_name,product_descrition,account_type,end_user_account) VALUES ('$account_id','DSA-10G-26T','DSA-10G-26T','DeepSee 10G Appliance','Customer','$account_name')";  
	$sth = $dbh_handler->prepare($sql_query);
	$sth->execute or die "SQL Error: $DBI::errstr\n";

	my %response = (
		status => "success",
		message => "Added",
	);	


	return \%response;
}

sub do_print {

	my $line = shift;
	$response_text .= $line;
}

1;
