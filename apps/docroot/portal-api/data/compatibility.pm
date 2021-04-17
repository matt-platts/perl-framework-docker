#!/usr/bin/perl

package compatibility;

# SG (Proxy SG)
my %sg_spare_swap_matrix = (
        'SG300-0-SU'=> {'SG300-5' => '1', 'SG300-10' => '1'},
        'SG300-25-SU'=> {'SG300-25' => '1'},

        'SG600-0-SU'=> {'SG600-20' => '1', 'SG600-35' => '1'},
        'SG600-10-SU'=> {'SG600-10' => '1'},

        'SG900-0-SU'=> {'SG900-10B' => '1', 'SG900-20' => '1'},
        'SG900-10-SU'=> {'SG900-10' => '1'},
        'SG900-30-SU'=> {'SG900-30' => '1'},
        'SG900-45-SU'=> {'SG900-45' => '1'},
        'SG900-55-SU'=> {'SG900-55' => '1'},

        'SG9000-5-SU'=> {'SG9000-5' => '1'},
        'SG9000-10-SU'=> {'SG9000-10' => '1'},
        'SG9000-20B-SU'=> {'SG9000-20B' => '1', 'SG9000-20' => '1'},
        'SG9000-20-SU'=> {'SG9000-20' => '1'},
        'SG9000-30-SU'=> {'SG9000-30' => '1'},
        'SG9000-40-SU'=> {'SG9000-40' => '1'},

        'SG-S400-20-SU'=> {'SG-S400-20' => '1'},
        'SG-S400-30-SU'=> {'SG-S400-30' => '1'},
        'SG-S400-40-SU'=> {'SG-S400-40' => '1'},

        'SG-S500-10-SU'=> {'SG-S500-10' => '1'},
        'SG-S500-20-SU'=> {'SG-S500-20' => '1'},
        'SG-S500-30-SU'=> {'SG-S500-30' => '1'},

        'SG-S200-20-CS'=> {'SG-S200-20-PR' => '1', 'SG-S200-20' => '1'},
        'SG-S200-20-SU'=> {'SG-S200-20-PR' => '1', 'SG-S200-20' => '1'},

        'SG900-0-CRU' => {'SG900-10B' => '1', 'SG900-10' => '1', 'SG900-20B' => '1', 'SG900-20' => '1', 'SG900-5' => '1', 'SG900-30' => '1', 'SG900-40' => '1'},

        'SG210-10/25-CS'=> {'SG210-10' => '1', 'SG210-25' => '1'},

        'SG510-10/20/25-CS'=> {'SG510-10' => '1', 'SG510-20' => '1', 'SG510-25' => '1'},

        'SG810-20/25-CS'=> {'SG810-20' => '1', 'SG810-25' => '1'},
        'SG810-10-CS'=> {'SG810-10' => '1'},
);

#ASG (Advanced Secure Gateway)
my %asg_spare_swap_matrix = (
        'ASG-S200-30-CS'=> {'ASG-S200-30-U250' => '1', 'ASG-S200-30-U500' => '1', 'ASG-S200-30-U1000' => '1', 'ASG-S200-30-U2500' => '1'},
        'ASG-S200-40-CS'=> {'ASG-S200-40-U500' => '1', 'ASG-S200-40-U1000' => '1', 'ASG-S200-40-U2500' => '1'},
        'ASG-S200-30/40-CS'=> {'ASG-S200-40-U500' => '1', 'ASG-S200-40-U1000' => '1', 'ASG-S200-40-U2500' => '1',
                               'ASG-S200-30-U250' => '1', 'ASG-S200-30-U500' => '1', 'ASG-S200-30-U1000' => '1', 'ASG-S200-30-U2500' => '1'},

        'ASG-S400-20-CS'=> {'ASG-S400-20-U1000' => '1', 'ASG-S400-20-U2500' => '1', 'ASG-S400-20-U5000' => '1'},
        'ASG-S400-30-CS'=> {'ASG-S400-30-U2500' => '1', 'ASG-S400-30-U5000' => '1', 'ASG-S400-30-U10K' => '1', 'ASG-S400-30-U15K' => '1'},
        'ASG-S400-40-CS'=> {'ASG-S400-40-U5000' => '1', 'ASG-S400-40-U10K' => '1', 'ASG-S400-40-U15K' => '1', 'ASG-S400-40-U25K' => '1'},
        'ASG-S500-10-CS'=> {'ASG-S500-10-U5000' => '1', 'ASG-S500-10-U10K' => '1', 'ASG-S500-10-U15K' => '1', 'ASG-S500-10-U25K' => '1'},
        'ASG-S500-20-CS'=> {'ASG-S500-20-U15K' => '1', 'ASG-S500-20-U25K' => '1', 'ASG-S500-20-U35K' => '1', 'ASG-S500-20-U50K' => '1'},

        'ASG-S200-30-SU'=> {'ASG-S200-30-U250' => '1', 'ASG-S200-30-U500' => '1', 'ASG-S200-30-U1000' => '1', 'ASG-S200-30-U2500' => '1'},
        'ASG-S200-40-SU'=> {'ASG-S200-40-U500' => '1', 'ASG-S200-40-U1000' => '1', 'ASG-S200-40-U2500' => '1'},
        'ASG-S400-20-SU'=> {'ASG-S400-20-U1000' => '1', 'ASG-S400-20-U2500' => '1', 'ASG-S400-20-U5000' => '1'},
        'ASG-S400-30-SU'=> {'ASG-S400-30-U2500' => '1', 'ASG-S400-30-U5000' => '1', 'ASG-S400-30-U10K' => '1', 'ASG-S400-30-U15K' => '1'},
        'ASG-S400-40-SU'=> {'ASG-S400-40-U5000' => '1', 'ASG-S400-40-U10K' => '1', 'ASG-S400-40-U15K' => '1', 'ASG-S400-40-U25K' => '1'},
        'ASG-S500-10-SU'=> {'ASG-S500-10-U5000' => '1', 'ASG-S500-10-U10K' => '1', 'ASG-S500-10-U15K' => '1', 'ASG-S500-10-U25K' => '1'},
        'ASG-S500-20-SU'=> {'ASG-S500-20-U15K' => '1', 'ASG-S500-20-U25K' => '1', 'ASG-S500-20-U35K' => '1', 'ASG-S500-20-U50K' => '1'},

);

#AC (not sure what product name this is, starts PS - not packetshaper?)
my %ac_spare_swap_matrix = (
	'PS-S200B-SU'=> {'PS-S200B-10ML' => '1', 'PS-S200B-50ML' => '1', 'PS-S200B-100ML' => '1', 'PS-S200B-100MH' => '1', 'PS-S200B-250MH' => '1', 'PS-S200B-500MH' => '1'},
	'PS-S400B-SU'=> {'PS-S400B-100MH' => '1', 'PS-S400B-500MH' => '1', 'PS-S400B-250MH' => '1', 'PS-S400B-500MH' => '1', 'PS-S400B-1GH' => '1', 'PS-S400B-2GH' => '1'},
	'PS-S500B-SU'=> {'PS-S500B-2GH' => '1', 'PS-S500B-5GH' => '1', 'PS-S500B-10GH' => '1'},
	# Swap a revison A with revison B
	'PS-S200-SU'=> {'PS-S200-10ML' => '1', 'PS-S200-50ML' => '1', 'PS-S200-100ML' => '1', 'PS-S200-100MH' => '1', 'PS-S200-250MH' => '1', 'PS-S200-500MH' => '1', 'PS-S200B-10ML' => '1', 'PS-S200B-50ML' => '1', 'PS-S200B-100ML' => '1', 'PS-S200B-100MH' => '1', 'PS-S200B-250MH' => '1', 'PS-S200B-500MH' => '1'},
	'PS-S400-SU'=> {'PS-S400B-100MH' => '1', 'PS-S400B-500MH' => '1', 'PS-S400B-250MH' => '1', 'PS-S400B-500MH' => '1', 'PS-S400B-1GH' => '1', 'PS-S400B-2GH' => '1', 'PS-S400-100MH' => '1', 'PS-S400-500MH' => '1', 'PS-S400-250MH' => '1', 'PS-S400-500MH' => '1', 'PS-S400-1GH' => '1', 'PS-S400-2GH' => '1'},
	'PS-S500-SU'=> {'PS-S500B-2GH' => '1', 'PS-S500B-5GH' => '1', 'PS-S500B-10GH' => '1', 'PS-S500-2GH' => '1', 'PS-S500-5GH' => '1', 'PS-S500-10GH' => '1'},
);

#PKTR (packetshaper)
my %ps_spare_swap_matrix = (
	'PS900LT-L010M'=> {'PS900-L010M' => '1'},
	'PS900-L010M'=> {'PS900LT-L010M' => '1'},

	# Spare Units
	'PS10000-SU'=> {'PS10000G-L310M-2000' => '1'},
	'PS10000-L000-SU'=> {'PS10000G-L001G-2000' => '1', 'PS10000G-L310M-2000' => '1', 'PS10000G-L200M-2000' => '1'},
	'PS10000-L000-SX-SU'=> {'PS10000G-L310M-2000-SX' => '1', 'PS10000G-L001G-2000-SX' => '1'},
);
        
        
#SSLV (SSL Visibility)
my %sslv_spare_swap_matrix = (
        'SV800-C-CS'=> {'SV800-250M-C' => '1', 'SV800-500M-C' => '1'},
        'SV800-C-SU'=> {'SV800-250M-C' => '1', 'SV800-500M-C' => '1'},

        'SV2800-SU'=> {'SV2800' => '1', 'SV2800B' => '1'},
        'SV2800-CS'=> {'SV2800' => '1', 'SV2800B' => '1'},
        'SV2800B-SU'=> {'SV2800' => '1', 'SV2800B' => '1'},
        'SV2800B-CS'=> {'SV2800' => '1', 'SV2800B' => '1'},

        'SV3800-SU'=> {'SV3800' => '1', 'SV3800B' => '1'},
        'SV3800-CS'=> {'SV3800' => '1', 'SV3800B' => '1'},
        'SV3800B-SU'=> {'SV3800' => '1', 'SV3800B' => '1'},
        'SV3800B-CS'=> {'SV3800' => '1', 'SV3800B' => '1'},

        'SV1800-C-CS'=> {'SV1800-C' => '1', 'SV1800B-C' => '1'},
        'SV1800B-C-CS'=> {'SV1800-C' => '1', 'SV1800B-C' => '1'},
        'SV1800-C-SU'=> {'SV1800-C' => '1', 'SV1800B-C' => '1'},
        'SV1800B-C-SU'=> {'SV1800-C' => '1', 'SV1800B-C' => '1'},

        'SV1800-F-CS'=> {'SV1800-F' => '1', 'SV1800B-F' => '1'},
        'SV1800B-F-CS'=> {'SV1800-F' => '1', 'SV1800B-F' => '1'},
        'SV1800-F-SU'=> {'SV1800-F' => '1', 'SV1800B-F' => '1'},
        'SV1800B-F-SU'=> {'SV1800-F' => '1', 'SV1800B-F' => '1'},

);

# CAS, REPORTER, OTHERS - seems to just remove the -CS, -SU or -CRU and check..

