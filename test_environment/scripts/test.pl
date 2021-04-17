$url="http://here.com?gclid=98734095873405987345&action=1";

$url =~ s/\?gclid=[a-zA-Z0-9]*&/\?/;

print $url;

$curUrl = $params['currenturl'];
$pattern = "/\?gclid=[a-zA-Z0-9]*&/";
$curUrl = preg_replace($pattern, "?", $curUrlr);
