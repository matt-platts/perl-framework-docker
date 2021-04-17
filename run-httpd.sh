#!/bin/bash

# First Make a newcerts directory in the right place if it doesn't exist
#mkdir -p /apps/apache/NPPL/cgi-bin/abrca_pki/CA/newcerts
#chmod 775 -R /apps/apache/NPPL/cgi-bin/abrca_pki
#chmod 777 -R /apps/apache/NPPL/cgi-bin/abrca_pki/CA
# The following line made Jenkins builds fail so we removed it and granted read/write on all the certs folder above.
#chown -R apache:apache /apps/apache/NPPL/cgi-bin/abrca_pki 

# Make sure we're not confused by old, incompletely-shutdown httpd
# context after restarting the container.  httpd won't start correctly
# if it thinks it is already running.
rm -rf /run/httpd/* /tmp/httpd*

exec /usr/sbin/apachectl -DFOREGROUND
