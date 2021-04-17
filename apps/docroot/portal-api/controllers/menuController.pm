#!/usr/bin/perl
# menuController.pm
# Meta: shows different types of returning data.

package menuController;
@ISA = (masterController);

use Data::Dumper;


sub draw {

        use BC_AUTH;
	use lib ("lib");
	use permissions;
	my $groups_from_permissions = &permissions::load_groups;
        my $username = BC_AUTH::get_user_name_from_session();
	my $groups = BC_AUTH::get_groups_from_session();
	my @groups = split(",",$groups);
	my $frs_entitled = 0;
	foreach my $group (@groups){
		if ($group eq "Security-Analytics-Licesning-Group"){
			$frs_entitled=1;
		}
	}

	my $menu = <<EOF;
Go to:
                <a class="header_menu_item" rel="examples" href="Javascript:void(0)">Examples 1</a> |
                <a class="header_menu_item" rel="examples2" href="Javascript:void(0)">Examples 2</a> |
                <a class="header_menu_item" rel="data_controller" href="Javascript:void(0)">Data Controller</a> |
EOF
	#if ($CONFIG::frs_editors{$username} && $frs_entitled){
	if ($frs_entitled){
	}
	
	my $frs_perm = $CONFIG::frs_editors{$username};
	$menu .= <<EOF;
                <a class="header_menu_item" rel="../portal-api/search/history/" href="Javascript:void(0)">My search history</a>

EOF
;

	return $menu;
}

sub auth {

        use BC_AUTH;
        my $username = BC_AUTH::get_user_name_from_session();

	if ($CONFIG::frs_editors{$username}){
		return "Yes";
	} else {
		return "No";
	}


}
