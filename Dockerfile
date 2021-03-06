ARG DOCKER_REGISTRY=abrca-docker-support-local.artifactory-ren.broadcom.net
FROM ${DOCKER_REGISTRY}/centos7:200501

MAINTAINER The CentOS Project <cloud-ops@centos.org>
LABEL Vendor="CentOS" \
License=GPLv2 \
Version=2.4.6-40

RUN yum -y --setopt=tsflags=nodocs update && \
yum -y --setopt=tsflags=nodocs install gcc httpd openssl openssl-devel perl perl-App-cpanminus mod_ssl glibc.i686 \
perl-CGI perl-DBI perl-URI perl-XML-Simple perl-File-Slurp perl-DateTime perl-Carp perl-Data-Dumper perl-IO-Compress \
perl-Socket perl-Crypt-OpenSSL-Random perl-Crypt-OpenSSL-RSA libxml2-devel screen curl vim "perl(DBD::mysql)" && \
yum clean all 

RUN cpanm --install Moose MooseX MooseX::Types::URI Crypt::OpenSSL::X509 Class::Accessor; 
RUN cpanm --install LWP::UserAgent Crypt::OpenSSL::VerifyX509 WWW::Mechanize Net::SAML2 --force; rm -fr root/.cpanm; exit 0
RUN cpanm --install JSON Net::LDAP

EXPOSE 80
EXPOSE 8080/tcp
EXPOSE 443/tcp
EXPOSE 444/tcp

ADD apps /apps
RUN rm -fr /etc/httpd/conf/httpd.conf
ADD conf/httpd.conf /etc/httpd/conf/httpd.conf

# Permissions not being set properly on Jenkins, so force them:
RUN chmod -R 755 /apps/docroot/portal-api
RUN chmod -R 777 /apps/docroot/portal-api/log/ && chmod -R 777 /apps/docroot/portal-api/data/

# Modify /etc/rsyslog.conf to point to the proper server
ADD run-httpd.sh /run-httpd.sh
RUN chmod -v +rx /run-httpd.sh

#ADD bootstrap /bootstrap
#RUN chmod -v +rx /bootstrap

# Add scripts for running docker containers to be transferred during bootstrap step
#ADD scripts /scripts
#RUN chmod -v +rx /scripts


CMD ["/run-httpd.sh"]
