#!/usr/bin/perl
#searchModel.pm

package searchModel;

use es_data_access;
use trial_licenses; # example of data with accessor methods in model directory

sub search {

	my $search_for = shift;

	# get file log
	my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(time);
	my $timestamp = sprintf("%04d-%02d-%02d %02d:%02d:%02d", $year+1900, $mon+1, $mday, $hour, $min, $sec);
	my $log_filename = sprintf("logs/ESLG_%04d-%02d-%02d.log", $year+1900, $mon+1, $mday);

	# make asset info request
	my %asset_info_request = ();
        $asset_info_request{'SerialNumber'} = $search_for;
        $asset_info_request{'UserLogin'} = '';
        $asset_info_request{'api_key'} = '';
        $asset_info_request{'bcert_pass_phrase'} = '';
        my $asset_data = es_data_access::get_asset_data($log_filename, %asset_info_request);

	my $ent_data = "";
	my $component_data = "";

	my $i=0;
	my @entitlement_data;
	foreach my $comp (@{$component_data->{'ListOfComponents'}}){
		#print Dumper "Serial is " . $comp->{'SerialNumber'};
		
		my $entitlement_result = $dbrs_handler->DBRS_GetEntitlement($comp->{'SerialNumber'});
		my $component_asset_result = $dbrs_handler->DBRS_GetAssetForSerialNumber($comp->{'SerialNumber'});

		#print Dumper $entitlement_result;
		if (trial_licenses::is_trial_license($component_data->{'ListOfComponents'}[$i]{'ProductPartNumber'})){
			$component_data->{'ListOfComponents'}[$i]{'TrialLicense'}="Trial License";
		} else {
			$component_data->{'ListOfComponents'}[$i]{'TrialLicense'}="";
		}
		$component_data->{'ListOfComponents'}[$i]{'Entitlements'} = $entitlement_result;
		$component_data->{'ListOfComponents'}[$i]{'ComponentAssets'} = $component_asset_result;
		$entitlement_data[$i]=$entitlement_result;
		$i++;
	}

	my %results = (
		Asset => $asset_data,
		Entitlement => $ent_data,
		Components => $component_data,
	);

	my %response = (
		content => \%results,
		success => 1,
		error => 0,
		errorMessage => "",
	);
	return \%response;
}

1;
