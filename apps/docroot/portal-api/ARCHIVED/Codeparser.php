<?php

/* 
 * Class: Codeparser.php
 * Meta: Parse custom tags and template code in content and templates
 *       See the documentation for a full list of which tags are parsed from where, and how they should be structured
 * 	 Also note that the order in which these functions are called should never be changed. Sometimes you need tags to be intact for other tags to work correctly.
*/

class Codeparser {

	/* 
	 * Function dbf_tag_parse
	 * Meta: Recursive function dealing with tags in {=variable} format, taking into account that they may be embedded.
	 * 	 Embed up to 5 levels deep, although more than 2 is extremely rare
	 *       Does not deal with the sql/endsql, each/endeach or other start/end formats
	*/
	static function dbf_tag_parse($string,$loop){
		if ($debug){print "\nOn Loop $loop with input of : $string\n";}
		if ($loop>5){die("String of embedded variables is more than 5 levels deep and too complex to be evaluated.");}
		$res=preg_match_all("/{=[^}^{]+?}/",$string,$matches);
		foreach ($matches[0] as $thismatch){
			//print "GOT A MATCH AND ITS " . $thismatch . "\n";
			$original_match=$thismatch;
			$replace=preg_replace("/{=([\w| |_|-|:|=]+)}/","$1",$thismatch);
			$replace=Codeparser::get_value_for_dbf_tag($replace,"");
			$string=str_replace($thismatch,$replace,$string);
		}
		if (stristr($string,"{=")){ $loop++; $string = Codeparser::dbf_tag_parse($string,$loop); $loop--; }
		return $string;
	}

	/*
	 * Function: get_value_for_dbf_tag
	 * Meta: Should not be called directly, called by dbf_tag_parse above ONLY
	 * Dev note: Make private when fully OO as embedded tags can get destroyed if this is called directly. 
	 * Any code calling this should be set to dbf_tag_parse above instead to make it future proof.
	*/
	static function get_value_for_dbf_tag($string,$data){
		$return=$string;
		if (isset($_REQUEST[$string])){
			$return=$_REQUEST[$string];
		}
		
		if (isset($data[$string])){
			$return=$data[$string];
		}	
		
		if (stristr($string,"user_data_from_cookie('id')")){
			global $user;
			$return = str_replace("user_data_from_cookie('id')",$user->value('id'),$string);
		}

		if (stristr($string,"SQL:")){$string=preg_replace("/^SQL:/","",$string); $return=Codeparser::evaluate_sql($string);}
		if (stristr($string,"FORM:")){$return=Codeparser::evaluate_form_in_content($string);}
		
		return $return;
	}

	/* 
	 * Function: code_tags
	 * Meta: run all the checks for different types of code tags and replace with content as required
	 * Dev note: It is important that the tags are parsed in the correct order
	 * Dev note: This is a major entry point, called from many files
	*/
	static function code_tags($content){

		if (array_key_exists("pageEdit",$_GET) && $_GET['pageEdit']){ return Codeparser::internal_edit_links($content); } // if inline editing, insert edit links for SQL instead

		if ($debug){print "<hr><h1>Reached eval_sql_in_content_function</h1><hr>";}

		$content = Codeparser::evaluate_form_in_content($content);
		$content = Codeparser::evaluate_recordset_in_content($content);
		$content = Codeparser::parse_request_vars($content);
		$content = Codeparser::parse_string_for_system_functions($content);
		$content = Codeparser::get_file_manager_instances($content);

		global $page;
		$content = $page->load_template_widgets($content);

		// check for custom PHP scripts (works by calling ob_start, running the script, loading the ob into a variable and replacing the code with the variable)
		if (strpos($content,"{=PHP:")){
			$content=Codeparser::php_in_content($content);
		}

		if (strpos($content,"{=sendtofunction:")){
			$content = Codeparser::evaluate_functions_in_content($content);
		}

		$content = Codeparser::evaluate_sql_in_content($content); // inline SQL
		return $content;
	}	


	/*
	 * Function: evaluate_sql_in_content
	 * Param: $content
	 * Parser function for embedded SQL, which runs the query and replaces the inline template vars with the results
	 */
	static function evaluate_sql_in_content($content){
		global $user;
		global $db;
		global $page;

		// Grab the whole SQL block - opening tag, closing tag, content block in between
		$sql_matches=preg_match_all("/{=SQL:.*?end_sql}/ims",$content,$matches);
		
		foreach ($matches[0] as $each_match){
			if ($debug){print "matched $each_match END MATCH<br cleal=\"all\"><br /><br /><br /><hr size=1>";}
			// initialise variables
			$sql_query=""; $rowdata=""; $original_match=$each_match; $field_matches=""; $each_iterators=""; $each_iterator_match=""; $get_number_from_string=""; $iteration_count_val=""; $iteration_count_value=""; $each_iterator_html = ""; $replacewith="";

			// get query out of string - load into $sql_query
			$get_query=preg_match("/{=SQL:.*?}/mis",$each_match,$querymatches); // REmoved U modifier - un-necessary
			$sql_query=$querymatches[0];
			$dbf_query_bit = $sql_query;
			$sql_query=preg_replace("/{=SQL:/i","",$sql_query);
			$sql_query=preg_replace("/}$/","",$sql_query);
			$user_id_for_query=$user->value("id");
			if (!$user_id_for_query){ $user_id_for_query=0; }
			$sql_query=str_replace("user_data_from_cookie('id')",$user_id_for_query,$sql_query);
			$sql_query=str_replace("current_user()",$user_id_for_query,$sql_query);
			$sql_query=str_replace("current_user()",$user_id_for_query,$sql_query);
			$sql_query = str_replace("&gt;",">",$sql_query); // this and the line below are because tinyMCE converts these brackets to html entities
			$sql_query = str_replace("&lt;","<",$sql_query);
			if ($debug){print "<p>query is $sql_query</p>";}
			$table_from_query = preg_match("/.* from (\w+) ?/i",$sql_query,$tableresults);
			if (!$tableresults[1]){ print "Error: No table found for table results in code parser.<p>"; exit;}
			$pk=get_primary_key($tableresults[1]);

			// get inner template as $sub_template
			$get_inner_template = str_replace($dbf_query_bit,"",$each_match);
			$sub_template= preg_replace("/{=end_?sql}/","",$get_inner_template);

			if ($debug){print "Sub Template is: '$sub_template'<br>";}
			if ($debug){ print "<p>Running query of $sql_query"; }

			// now run the query and load the results into $rowdata;
			if (preg_match("/SELECT /i",$sql_query)){
				$querytables=query_functions::list_tables_in_query($sql_query);
				if ($querytables != "permissions"){
					$querytables=explode(",",$querytables);
					foreach ($querytables as $querytable){
						$perm_res=database_functions::check_dbf_permissions($querytable,"view") or format_error("515: Unknown Error",1);
						if ($perm_res['Status']==0){
							format_error("Error 55215J ($querytable)",1,"","No permissions found on $querytable",1);
						}
					}
				}
			} else { format_error("Error 59EEE",1,"","Cannot run this type of SQL Query here");}

			$result=$db->user_content_query($sql_query) or format_error("ERROR 9287B",0,"","Query:$sql_query<br />".$db->db_error());
			$rows_returned=$db->num_rows($result);
			if ($rows_returned==0){
				$sub_template=str_replace("{=no_results_message}","No results",$sub_template);
			}
			if ($debug){print "<p>Got $rows_returned rows back from query</p>";}
			while ($row=$db->fetch_array($result)){
				if (!$row[$pk]){ 
					if (!preg_match("/SELECT count ?\(\*\)/i",$sql_query)){
						//print format_error("In an SQL in content block, the primary key field is not present in the query - hence an array using the key $pk as the key cannot be generated. The first item only has been taken.",0,$sql_query); 
					}
				}
				$rowdata[$row[$pk]]=$row;
			}

			// Do we have an iterator variable in there? Pull it out if so..
			$each_iterators = (preg_match("/\{=each:\d+\}.*?{=end_?each}/is",$sub_template,$each_iterator_matches));
			$each_iterator_match_array=$each_iterator_matches[0];
			foreach ($each_iterator_matches  as $each_iterator_match){
				$each_iterator_match = preg_replace("/{=each:/","",$each_iterator_match);
				$get_number_from_string=preg_match_all("/^\d+/",$each_iterator_match,$iteration_count_value);
				$iteration_count_val=$iteration_count_value[0][0];
				// got the number from the string, now delete it
				$each_iterator_match = str_replace("$iteration_count_val}","",$each_iterator_match);
				$each_iterator_match = preg_replace("/{=end_?each}/i","",$each_iterator_match);
				$each_iterator_html = $each_iterator_match;
				$each_iterator_match = str_replace($each_iterator_html,"",$each_iterator_match);
				$sub_template=preg_replace("~{=each:$iteration_count_val}$each_iterator_html{=end_?each}~eis","",$sub_template);
			}

			// now get the vars for the table fields within the sub template and load into $fieldnames
			$fieldnames=array();
			$field_matches=preg_match_all("/{=[^}]*}/",$sub_template,$field_matches_array);
			$field_matches_array=$field_matches_array[0];
		
			foreach ($field_matches_array as $field_match){
				$field_match =str_replace("{=","",$field_match);
				$field_match =str_replace("}","",$field_match);
				array_push($fieldnames,$field_match); 
			}

			$store_sub_template=$sub_template;
			$row_incrementor=1;
			foreach($rowdata as $returned_record_header => $returned_record_data){
				if ($debug){print "on line of rowdata $returned_record_header";}
				$sub_template=$store_sub_template;
				// NEW IF TEMPLATE CODE
				$s=$sub_template;
				$r = preg_match_all("/{=if ((?:!?\w+,?)+ ?=? ?\w+)}(.*?){=end[ _]?if}/ims",$s,$or_results); // remove the ? after the , to stop capturing single if 
				$no_of_or_templates=sizeof($or_results[0])-1;
				for ($or_template_no=0; $or_template_no<=$no_of_or_templates; $or_template_no++){
					$or_template=$or_results[0][$or_template_no];
					$or_inner_template=$or_results[2][$or_template_no];

					$or_field_results=$or_results[1][$or_template_no];
					$or_fields=explode(",",$or_field_results);
					$expression_evaluates=false;
					foreach ($or_fields as $or_field){
						if ($expression_evaluates){continue;}
						@list($if_var,$if_val)=explode(" = ",$or_field);// does the or field have a value? if so store it in $if_val and rewrite $or_field to be the var only
						if ($if_val){$or_field=$if_var;}
						if (preg_match("/^!\w+$/",$or_field)){$positive_check=0; $or_field=str_replace("!","",$or_field);} else {$positive_check=1;}
							if ($positive_check && array_key_exists($or_field,$returned_record_data)) {
								if ($returned_record_data[$or_field] && strlen($returned_record_data[$or_field])>=1 && $returned_record_data[$or_field]!="0") {// quotes put on BECAUSE it was evaluating web addresses with / in them!!
									// There is likely to be another section below where this is repeated and needs to be quoted, although I can't see it at the moment, and it seems to be done with strlen instead, which WOULD accept a numeric zero..
									if (($if_val && $returned_record_data[$or_field]==$if_val) || !$if_val){
										$expression_evaluates=true;
									}
								 }
							} else if (!$positive_check){
								if (!array_key_exists($or_field,$returned_record_data) || (array_key_exists($or_field,$returned_record_data) && ($returned_record_data[$or_field]=="" || $returned_record_data[$or_field]=="0"))){
									$expression_evaluates=true;
								} else if ($if_val){
									if ($if_val != $returned_record_data[$or_field]){
										$expression_evaluates=true;
									}
								}
							}
					}
					if ($expression_evaluates){
						$s = str_replace($or_template,$or_inner_template,$s);
					} else {
						$s = str_replace($or_template,"",$s);
					}
				}

				$r = preg_match_all("/{=if ([!?\w\=\ \++]+\w+)}(.*?){=end[ _]?if}/ims",$s,$and_results);
				$no_of_and_templates=sizeof($and_results[0])-1;
				for ($and_template_no=0; $and_template_no<=$no_of_and_templates; $and_template_no++){
					$and_template=$and_results[0][$and_template_no];
					$and_inner_template=$and_results[2][$and_template_no];
					$and_field_results=$and_results[1][$and_template_no];
					$and_fields=explode("+",$and_field_results);
					$expression_evaluates=false;
					foreach ($and_fields as $and_field){

						@list($if_var,$if_val)=explode("=",$and_field);// does the or field have a value? if so store it in $if_val and rewrite $or_field to be the var only
						if ($if_val){$if_val=trim($if_val); $if_var=trim($if_var); $and_field=$if_var;}

						if (preg_match("/^!\w+[=?\w?]+$/",$and_field)){$positive_check=0; $and_field=str_replace("!","",$and_field);} else {$positive_check=1;}

						if ($positive_check && array_key_exists($and_field,$returned_record_data)){

							if ($returned_record_data[$and_field] && strlen($returned_record_data[$and_field]>=1) && $returned_record_data[$and_field]!="0"){
								if (($if_val && $returned_record_data[$and_field]==$if_val) || !$if_val){
									$expression_evaluates=true;
								}
							} else {
								if ($returned_record_data[$and_field]=="0.00"){
									$expression_evaluates=false; break; 
								}
								
							}
						} else if (!$positive_check){
								if (!array_key_exists($and_field,$returned_record_data) || (array_key_exists($and_field,$returned_record_data) && ($returned_record_data[$and_field]=="" || $returned_record_data[$and_field]=="0"))){
									if ($if_val){
										//print "ooh";
									}
									$expression_evaluates=true;
								} else if ($if_val){
									if ($if_val != $returned_record_data[$and_field]){
										$expression_evaluates=true;
									} else {
										$expression_evaluates=false; break;
									}
								}
						} else { $expression_evaluates=false; break; }

					}

					if ($expression_evaluates){
						$s=str_replace($and_template,$and_inner_template,$s);
					} else {
						$s=str_replace($and_template,"",$s);
					}
				}
				$sub_template=$s;	

				$get_no_results = preg_match("/{=no_results}(.*){=end_no_results}/is",$sub_template,$no_results_matches);
				$sub_template=str_replace($no_results_matches[1],"",$sub_template);
				// im now going to re-arrange the $fieldnames array to display the if fields first. This is because if i try and remove the templates within the if after the variable have been swapped, they no longer match the sub template so the replace action doesnt work.
				foreach ($fieldnames as $fieldname){
				
				// This following code looks for {=PassSQLValueToFunction:function_name.php fieldname1 fieldname2}
				// it provides a way where values from SQL can be passed through extra code
				// NOTE: It is also possible to use this to just embed external code by simply passing no fieldnames through!
				// all output from the php script is embedded in the page at this point
				if ($debug){print "<p>ON FIELD $fieldname";}

					if (stristr($fieldname,"PassSQLValueToFunction:")){
						$string_to_function=""; $embed_external_output="";	
						$fields_to_function=preg_replace("/PassSQLValueToFunction: ?(\w+.php) /","",$fieldname);
						$functionname=preg_replace("/PassSQLValueToFunction: ?/","",$fieldname);
						$functionname = preg_replace("/ .*/","",$functionname);
						$functionname = "system/custom/" . $functionname;
						$fields_to_function_array=explode(" ",$fields_to_function);
						foreach ($fields_to_function_array as $functionfield){
							if ($returned_record_data[$functionfield]){
								$string_to_function .= "\"" . $returned_record_data[$functionfield] . "\"";
							} else {
								if ($functionfield=="user_type_current"){
									$string_to_function .= "\"" . $user->value("type") . "\"";
								} elseif ($functionfield=="current_user"){
									$string_to_function .= "\"" . $user->value("id") . "\"";
								} else {
									$string_to_function .= "\"\""; 
								}
							}
							$string_to_function .= " ";
						}
						$string_to_function=rtrim($string_to_function);
						$functionname=BASEPATH . "/" . $functionname;
						$sysresult = exec("php $functionname $string_to_function",$embed_external_output);
						$sysresult2 = include_once("$functionname $string_to_function");
						$returned_record_data[$fieldname]=join("\n",$embed_external_output);
					}
					if (stristr($fieldname,"PassSQLValueToImportedfunction")){
						$string_to_function=""; $embed_external_output="";	
						$fields_to_function=preg_replace("/PassSQLValueToImportedFunction: ?(\w+.php) /i","",$fieldname);
						$functionname=preg_replace("/PassSQLValueToImportedFunction: ?/","",$fieldname);
						$functionname = preg_replace("/ .*/","",$functionname);
						$functionname = "system/custom/" . $functionname;
						$fields_to_function_array=explode(" ",$fields_to_function);
						$user_function=array_shift($fields_to_function_array);
						foreach ($fields_to_function_array as $functionfield){
							if ($returned_record_data[$functionfield]){
								$string_to_function .= "" . $returned_record_data[$functionfield] . ",";
							} else {
								if ($functionfield=="user_type_current"){
									$string_to_function .= "\"" . $user->value("type") . "\",";
								} elseif ($functionfield=="current_user"){
									$string_to_function .= "\"" . $user->value("id") . "\",";
								} else {
									$string_to_function .= "\"$functionfield\","; 
								}
							}
						}
						$string_to_function=rtrim($string_to_function);
						$string_to_function=preg_replace("/,$/","",$string_to_function);
						$functionname=BASEPATH . "/" . $functionname;
						$sysresult2 = include_once($functionname);
						$evalStr="\$functionResult = " . $user_function . "($string_to_function);";
						$res=eval($evalStr);
						$returned_record_data[$fieldname]=$functionResult;
					}
					if (stristr($fieldname,"PassSQLValueToExistingfunction")){
						$string_to_function=""; $embed_external_output="";	
						$fields_to_function=preg_replace("/PassSQLValueToExistingfunction: ?/i","",$fieldname);
						$fields_to_function_array=explode(" ",$fields_to_function);
						$user_function=array_shift($fields_to_function_array);
						foreach ($fields_to_function_array as $functionfield){
							if ($returned_record_data[$functionfield]){
								$string_to_function .= "\"" . $returned_record_data[$functionfield] . "\",";
							} else {
								if ($functionfield=="user_type_current"){
									$string_to_function .= "\"" . $user->value("type") . "\",";
								} elseif ($functionfield=="current_user"){
									$string_to_function .= "\"" . $user->value("id") . "\",";
								} else {
									$string_to_function .= "\"$functionfield\","; 
								}
							}
						}
						$string_to_function=rtrim($string_to_function);
						$string_to_function=preg_replace("/,$/","",$string_to_function);
						$evalStr="\$functionResult = " . $user_function . "($string_to_function);";
						$res=eval($evalStr);
						$returned_record_data[$fieldname]=$functionResult;
						//print "" . $returned_record_data[$fieldname];
					}
					$sub_template=str_replace("{=$fieldname}",$returned_record_data[$fieldname],$sub_template);
				}
					$replacewith .= $sub_template;
					if ($row_incrementor==$iteration_count_val){
						$replacewith .= $each_iterator_html;
						$row_incrementor=0;
					}
					$row_incrementor++;
			}
			if ($debug){print "<b>Rep with $replacewith</b>";}
			if ($rows_returned==0){
				$get_no_results = preg_match("/{=no_results}(.*){=end_no_results}/is",$sub_template,$no_results_matches);
				$replacewith = $no_results_matches[1];
				if (stristr($replacewith,"{=action:dbf_cancel_page}")){
				$cancelme=1;
				$replacewith=str_replace("{=action:dbf_cancel_page}","",$replacewith);
				}
			}
			if (!$cancelrest){
				$content=str_replace($each_match,$replacewith,$content);
			} else {
				$content=str_replace($each_match,"",$content);
			}
			if ($cancelme){
				$cancelrest=1;
				$cancelme=0;
				$content=preg_replace("/\<\!--begin cancel page ?\/\/--\>.*\<\!--end cancel page ?\/\/--\>/is","",$content);
			}
		}

	$sent_content = Codeparser::parse_template_code($content);
	return $content;
	}

	/* 
	 * Function: internal_edit_links
	 * Param: sent_content
	 * Used by the inline cms (front end) for providing edit links to the content. In this case most tags should be left intact, not evaluated
	*/
	static function internal_edit_links($sent_content){
		return $sent_content;
		global $db;
		$debug=0;
		if ($debug){print "<hr><h1>Reached internal_edit_links function </h1><hr>";}
		$sql_matches=preg_match_all("/{=[^}]*}/",$sent_content,$matches);

		foreach ($matches[0] as $each_match){
			$sql_query="";
			$rowdata="";
			if ($debug){print "<p><li>ON MATCH:" . $each_match;}
			$original_match = $each_match;
			if (preg_match("/=SQL/i",$each_match)){ // means we have SQL to evaluate
				$original_query=$each_match;
				$sql_query="";
				$field_matches="";
				if (preg_match("/=\s?\{=\w+}/",$each_match)){ // means we have an embedded {=} that needs to be evalutated. In this context (ie in a {=SQL:} block, it means swap the name for the $_REQUEST with the same name. This is used for adding var=value to the url and picking it up
					$new_sql_matches = preg_match_all("/\s+\w+\s?=\s?{=[^}]*}/",$each_match,$field_matches);
					foreach ($field_matches[0] as $each_field_match) {
						$field_match=str_replace("{=","",$each_field_match);
						$field_match=str_replace("}","",$field_match);
						$field_match=preg_replace("/[^=]+=/","",$field_match);
						$field_match_string=$field_match;
						$field_match=preg_replace("/$field_match/",$_REQUEST[$field_match],$field_match);
						if ($debug){print " - replacing $field_match_string with " . $field_match;}
					} // bracket:close:foreach $field_matches[0]
					// now do the final replace
					$each_match = preg_replace("/\{=$field_match_string\}/",$field_match,$each_match);
					$each_match .= "}";
				} // by this point, we have replaced an inner =$_REQUEST['name'] with its actual value from the query string	
				$each_match=str_replace("{=SQL:","",$each_match);
				$each_match=str_replace("}","",$each_match);
				$sql_query=$each_match;	
			} // by this point, we have an sql query which we can evaluate
			if ($sql_query){
				$result=$db->query($sql_query);
				if ($debug){print "<br>Running sql query of " . $sql_query;}
				while ($row=$db->fetch_array($result)){
					$rowdata[$row['id']]=$row;
				}

			// get sub template out of main template and do replace
			// however make sure we only get the sub template we want
			$sub_template=preg_match_all("/{=SQL.+?{=end_?sql}/is",$sent_content,$sub_template_matches);	
				$matched_sub_template=$sub_template_matches[0];
				foreach ($matched_sub_template as $sub_template){ // actually we only need to evaluate the first each time
					if (preg_match("~$original_match~",$sent_content)){ // only if it's the sub template we want

						// reset variables as im currently debugging 
						$each_iterators="";
						$each_iterator_match=""; $get_number_from_string="";
						$iteration_count_val=""; $iteration_count_value="";
						$each_iterator_html = "";
						$fieldnames="";
						$replacewith="";

						// remove the initialiser and end identifier so sub_template contains just the template for each sql result
						$sub_template=str_replace("{=SQL:$sql_query}","",$sub_template);}
						// actually if we've parsed the sql it wont be the same will it..
						$regex_to_remove=$original_query . "}";
						$sub_template=preg_replace("/$regex_to_remove/i","",$sub_template);
						$sub_template=preg_replace("/{=end_?sql}/i","",$sub_template);
						// Do we have an iterator variable in there? Pull it out if so..
						//if (preg_match("/\{=each:\d+\}*\{end_?each\}/is",$sub_template))
						$each_iterators = (preg_match("/\{=each:\d+\}.*{=end_?each}/is",$sub_template,$each_iterator_matches));
						$each_iterator_match_array=$each_iterator_matches[0];
						foreach ($each_iterator_matches  as $each_iterator_match){
							$each_iterator_match = preg_replace("/{=each:/","",$each_iterator_match);
							$get_number_from_string=preg_match_all("/^\d+/",$each_iterator_match,$iteration_count_value);
							$iteration_count_val=$iteration_count_value[0][0];
							// got the number from the string, now delete it
							$each_iterator_match = str_replace("$iteration_count_val}","",$each_iterator_match);
							$each_iterator_match = preg_replace("/{=end_?each}/i","",$each_iterator_match);
							$each_iterator_html = $each_iterator_match;
							$each_iterator_match = str_replace($each_iterator_html,"",$each_iterator_match);
							$sub_template=preg_replace("~{=each:$iteration_count_val}$each_iterator_html{=end_?each}~eis","",$sub_template);
						}
						// now get the variables within the sub template:
						if (!$fieldnames){
							$fieldnames=array();
							$field_matches=preg_match_all("/{=[^}]*}/",$sub_template,$field_matches_array);
							$field_matches_array=$field_matches_array[0];
						
							foreach ($field_matches_array as $field_match){
								$field_match =str_replace("{=","",$field_match);
								$field_match =str_replace("}","",$field_match);
								array_push($fieldnames,$field_match); // fieldnames is now a list of fields that appear in the sub template that need replacing
							}
						}
						$store_sub_template=$sub_template;
						$row_incrementor=1;
						foreach($rowdata as $returned_record_header => $returned_record_data){
							$sub_template=$store_sub_template;
							foreach ($fieldnames as $fieldname){
								$sub_template=str_replace("{=$fieldname}",$returned_record_data[$fieldname],$sub_template);
							}
								$replacewith .= $sub_template;
								//$replacewith .= $sub_template . "<span class=\"dbf_editrow\" style=\"font-size:8px; font-weight:normal\">(EDIT ITEM)</span>";
								if ($row_incrementor==$iteration_count_val){
									$replacewith .= $each_iterator_html;
									$row_incrementor=0;
								}
								$row_incrementor++;
						}
						$sent_content=str_replace($matched_sub_template[0],$replacewith,$sent_content);
					}	
			}// end if $sql_query
				
		}	
		// final check - remove any {=SQL.+} variables that are left
		$sent_content=preg_replace("/{=SQL.+}/i","",$sent_content);	
		return $sent_content;
	}

	/* 
	 * Function: evaluate_form_in_content
	 * Place a form in place of the placeholder
	*/
	static function evaluate_form_in_content($sent_content){
		// If a form has been embedded in a content page, this will insert the form
		global $user;
		//if ($_GET['pageEdit']){return internal_edit_links_for_form($sent_content);} // if inline editing, insert edit links for SQL instead
		$debug=0;
		if ($debug){print "<hr><h1>Reached eval_form_in_content_function</h1><hr>";}
		$sql_matches=preg_match_all("/{=FORM.*}/",$sent_content,$matches);
		// foreach match that starts {= and ends }, sort it out
		foreach ($matches[0] as $each_match){
			$sql_query="";
			$rowdata="";
			if ($debug){print "<p><li>ON MATCH:" . $each_match;}
			$original_match = $each_match;
			if (preg_match("/=FORM/i",$each_match)){ // means we have SQL to evaluate
				$original_query=$each_match;
				$sql_query="";
				$field_matches="";
				if (preg_match("/=\s?\{=\w+}/",$each_match)){ // means we have an embedded {=} that needs to be evalutated. In this context (ie in a {=SQL:} block, it means swap the name for the $_REQUEST with the same name. This is used for adding var=value to the url and picking it up
					$new_sql_matches = preg_match_all("/\w+\s?=\s?{=[^}]*}/",$each_match,$field_matches);
					foreach ($field_matches[0] as $each_field_match) {
						$field_match=str_replace("{=","",$each_field_match);
						$field_match=str_replace("}","",$field_match);
						$field_match=preg_replace("/[^=]+=/","",$field_match);
						$field_match_string=$field_match;
						$field_match=preg_replace("/$field_match/",$_REQUEST[$field_match],$field_match);
						if ($debug){print " - replacing $field_match_string with " . $field_match;}
						$each_match = preg_replace("/\{=$field_match_string\}/",$field_match,$each_match);
					} // bracket:close:foreach $field_matches[0]
					// now do the final replace
				} // by this point, we have replaced an inner =$_REQUEST['name'] with its actual value from the query string	
				$each_match=str_replace("{=FORM:","",$each_match);
				$each_match=preg_replace("/}$/","",$each_match);
				$form_query=$each_match;	
			} // by this point, we have an sql query which we can evaluate
			if ($debug){print "FQ is " . $form_query . "\n\n<p>";}
			if ($form_query){
				$form_query_params=preg_split("/&|&amp;/",$form_query); // tinymce has a habit of doing this annoying stuff so we check for both	
				foreach ($form_query_params as $form_query_pair){
					$form_query_pair=str_replace("amp;","",$form_query_pair);
					if ($debug){print $form_query_pair . "<p>";}
					$form_query_pairs=explode("=",$form_query_pair,2);

					if ($form_query_pairs[0]=="table"){$form_table=$form_query_pairs[1];}
					if ($form_query_pairs[0]=="filter"){$form_filter=$form_query_pairs[1];}
					if ($form_query_pairs[0]=="formtype"){$form_type=$form_query_pairs[1];}
					if ($form_query_pairs[0]=="rowid"){$form_rowid=$form_query_pairs[1];}
					if ($form_rowid=="user_data_from_cookie('id')"){$form_rowid=$user->value('id');}
					if ($form_rowid=="current_user()"){$form_rowid=$user->value('id');}
				}

				$form_rowid=Codeparser::dbf_tag_parse($form_rowid,0);		

				$form_add_data=0;
				$form_options=array();
				if ($form_table && $form_type){

					// MATT PLATTS new code redirecting to filters november 2011
					require_once(LIBPATH."/classes/core/filters.php");
					$new_form_filter=new filter();

					if (database_functions::filter_registered_on_table($form_table)){
						$load_filter_options=$new_form_filter->load_filter(database_functions::filter_registered_on_table($form_table));
						$form_options['filter']=$new_form_filter->all_filter_keys();
						//$form_options['filter']=load_dbforms_filter(filter_registered_on_table($form_table));
					}
					if ($form_filter){
						if (!array_key_exists("filter","form_options")){ $form_options['filter']=null;}
						$new_form_filter->load_filter($form_filter,$form_options['filter']);
						$form_options['filter']=$new_form_filter->all_filter_keys();
						//$form_options['filter']=load_dbforms_filter($form_filter,$form_options['filter']);
					}
					$form_options['filter']['export']="html"; // has to be for this section
					if (!$form_options['filter']['after_update']){$form_options['filter']['after_update']="continue";} // again has to be for this section (so far)
					$form_options['filter']['pass_keys_as_hidden_fields']="after_update,export";
					if ($form_options['filter']['add_string_to_form_post_query']){
						$form_options['filter']['add_string_to_form_post_query'].="&content=".$_REQUEST['content'];
					} else {
						$form_options['filter']['add_string_to_form_post_query']="content=".$_REQUEST['content'];
					}
					$embedded_form=database_functions::form_from_table($form_table,$form_type,$form_rowid,$form_add_data,$form_options);
					if ($embedded_form['Status']=="0"){// unable to print form for some reason 
						$sent_content = str_replace($original_match,$embedded_form['Message'],$sent_content); 
					} else {
						global $content_repeat_form;
						global $content_repeat_form_filter_id;
						global $content_repeat_form_table;
						// print the line below indicates that BOTH the filter and table cannot match to display the form.
						if (!$content_repeat_form || ($content_repeat_form_filter_id != $form_filter && $content_repeat_form_table != $form_table)){
							if ($debug){print "NO RF";}
							$sent_content=str_replace($original_match,$embedded_form,$sent_content);
						} else {
							if ($debug){print "GOT RF";}
							$sent_content=str_replace($original_match,$content_repeat_form,$sent_content);
						}
					}

				}
				
			}// end if $form_query
				
		}	
		if (sizeof($matches[0])>0){
			// final check - remove any {=SQL.+} variables that are left
			$sent_content=preg_replace("/{=FORM:.+}/i","",$sent_content);	
			$form_post_url="site.php?s=".$_REQUEST['s']."&action";
			$sent_content=preg_replace("/site\.php\?action/",$form_post_url,$sent_content);
		}
		return $sent_content;
	}

	/*
	 * Function: evaluate_recodset_in_content
	 * Param rs_content string
	 * Places a dynamic recordset into the content, as specified by the paramaters sent:
	 * * table (string) - table to query for the recordset
	 * * filter (int)- filter to apply, which should contain all the filtering options on the data
	 * * 
	*/
	static function evaluate_recordset_in_content($rs_content){

		$rs_matches=preg_match_all("/{=RECORDSET.*}/",$rs_content,$matches);
		foreach ($matches[0] as $each_recordset_match){
			$entire_rs_match=$each_recordset_match;	
			$recordset_filter="";
			$recordset_source="";
			// 1 - Embedded {=} to request vars
			if (preg_match("/=\s?\{=\w+}/",$each_recordset_match)){ // means we have an embedded {=} that needs to be evalutated. In this context (ie in a {=SQL:} block, it means swap the name for the $_REQUEST with the same name. This is used for adding var=value to the url and picking it up
				$new_sql_matches = preg_match_all("/\w+\s?=\s?{=[^}]*}/",$each_recordset_match,$field_matches);
				foreach ($field_matches[0] as $each_field_match) {
					$field_match=str_replace("{=","",$each_field_match);
					$field_match=str_replace("}","",$field_match);
					$field_match=preg_replace("/[^=]+=/","",$field_match);
					$field_match_string=$field_match;
					$field_match=preg_replace("/$field_match/",$_REQUEST[$field_match],$field_match);
					if ($debug){print " - replacing $field_match_string with " . $field_match;}
					$each_recordset_match = preg_replace("/\{=$field_match_string\}/",$field_match,$each_recordset_match);
				} // bracket:close:foreach $field_matches[0]
				// now do the final replace
			} // by this point, we have replaced an inner =$_REQUEST['name'] with its actual value from the query string	
			
			// 2 -Get pairs only
			$each_recordset_match=str_replace("{=RECORDSET:","",$each_recordset_match);
			$each_recordset_match=str_replace("}","",$each_recordset_match);
			$match_pairs=explode("&",$each_recordset_match);
			
			foreach ($match_pairs as $match_pair){
				$match_pair=str_replace("amp;","",$match_pair);
				@list($match_var,$match_val)=explode("=",$match_pair);
				if ($match_var=="filter_id" || $match_var=="filter"){
					$recordset_filter=$match_val;
				}
				if ($match_var=="t" || $match_var=="table"){
					$recordset_source=$match_val;
				}
			}
		
			if ($recordset_filter && $recordset_source){
				global $libpath;
				require_once("$libpath/classes/core/filters.php");
				$db_filter=new filter();
				$dbforms_options=$db_filter->load_options("","",$recordset_filter); // NB this now loads filter as well
				$tablename=$recordset_source;
				if (stristr($_SERVER['SCRIPT_NAME'],"administrator.php")){
					$inner_content = database_functions::list_table($tablename,$dbforms_options);
				} else {
					if (!$dbforms_options['filter']['display_in_template'] && !$dbforms_options['filter']['export'] && !$dbforms_options['filter']['display_raw']){
						$inner_content = "Nothing to display (2)";
						//$title = "Access Denied";
					} else {
						$inner_content = database_functions::list_table($tablename,$dbforms_options);
					}
				}
			}
			$rs_content=str_replace($entire_rs_match,$inner_content,$rs_content);
		}

		return $rs_content;
	}

	/*
	 * For running system functions
	 * Meta: Not to be called externally - needs to be made private when converted to full OO, however it is called by form.php, so a wrapper could be made
	*/
	static function parse_string_for_system_functions($stringin){
		$matches=preg_match("/{=system_function:[^}]+}/",$stringin,$allmatches);
		foreach ($allmatches as $amatch){
			$get_sys_function=str_replace("{=system_function:","",$amatch);
			$get_sys_function=str_replace("}","",$get_sys_function);
			$get_sys_function = "\$returncode = " . $get_sys_function . ";";
			$result=eval($get_sys_function); 
			$stringin=str_replace($amatch,$returncode,$stringin);
		}
		return $stringin;
	}

	/* Function : get_file_manager_instances
	 * Replaces {=file_manager:[string]} instances with an actual file manager instance
	*/
	static function get_file_manager_instances($content){
		global $db;
		$matches=preg_match_all("/{=file_manager:(.*)?}/",$content,$allmatches);
		foreach ($allmatches[0] as $amatch){
			$file_manager_data="";
			$pairs=preg_split("/&|&amp;/",$allmatches[1][0]);
			foreach ($pairs as $pair){
				$pair=str_replace("amp;","",$pair);
				$var_and_value=explode("=",$pair);
				$var=$var_and_value[0];
				$value=$var_and_value[1];
				$file_manager_options[$var]=$value;
				if ($var=="directory" || $var == "d"){$file_manager_data['directory']=$value;}
				if ($var=="list_type"){$file_manager_data['list_type']=$value;}
				if ($var=="fileint"){
					$sql = "SELECT * from file_manager_options where interface = '" . $value . "'";
					$res=$db->query($sql);
					while ($h=$db->fetch_array($res)){
						$file_manager_options[$h['file_manager_option']] = $h['value'];
					}
				}
			}
		if (!$file_manager_data['list_type']){$file_manager_data['list_type']='list';}
		$display_options="";
		$options_position="";
		$list_dir_options['display_uploader']=0;
		$list_dir_options['thumbnail_directory']=$file_manager_data['directory'] . "_thumbs";
		$list_dir_options['thumbnail_width']=200;
		$list_dir_options['next_page']="<img src='images/next_page.gif' border=0>";
		$list_dir_options['previous_page']="<img src='images/previous_page.gif' border=0>";

		ob_start();
		file_manager_main($file_manager_data['directory'],$file_manager_data['list_type'],$display_options,$options_position,$dpp,$file_manager_options);
		$file_manager=ob_get_contents();
		ob_end_clean();
		$content=str_replace($amatch,$file_manager,$content);
		}	
		return $content;
	}


	/* 
	 * Function: parse_request_vars
	 * Meta: Parse a string for {=$_REQUEST['var']}, {=$_GET['var']} or {=$_COOKIE} and replace it with it's actual value
	 *       This is an entry point called from many files
	*/
	static function parse_request_vars($str){
		$result=preg_match_all("/_(GET|COOKIE|REQUEST)\['\w+'\]/",$str,$matches);
		$m=0;
		foreach ($matches[0] as $match){
			$matchType=$matches[1][$m];
			$match = str_replace("_" . $matchType . "['","",$match);
			$match = str_replace("']","",$match);
			$match_result = $db->db_escape($matchType=="GET" ? $_GET[$match] : ($matchType=="COOKIE" ? $_COOKIE[$match] : $_REQUEST[$match])); 
			$string_to_match = "{=$" . "_" . $matchType . "['" . $match . "']}";
			$str = str_replace($string_to_match,$match_result,$str);
			$string_to_match = "$" . "_" . $matchType . "['" . $match . "']";
			$match_result = str_replace("\\'","'",$match_result);
			$str = str_replace($string_to_match,$match_result,$str);
			$m++;
		}
		return $str;
	}

	/*
	 * Function : evaluate_sql
	 *
	*/
	static function evaluate_sql($sql){
		global $db;
		$sql_to_run=$sql;
		$sql = str_replace("&gt;",">",$sql);
		$sql = str_replace("&lt;","<",$sql);
		$sql = preg_replace("/SELECT /i","",$sql);
		$get_fields=preg_split("/[from|FROM]/",$sql);
		$field_list=trim($get_fields[0]);
		if (stristr($field_list,",")){$field_array=implode(",",trim($get_fields));} else {$field_array=array($field_list);}
		$result=$db->query($sql_to_run);
		$return_array=array();
		$row_array=array();
		while ($row = $db->fetch_array($result)){
			foreach ($field_array as $each_field_to_return){
				if ($db->num_rows($result)==1){
					array_push($row_array,$row[$each_field_to_return]);
				} else {
					array_push($row_array,$row[$each_field_to_return]);
				}
			}
			array_push($return_array,$row_array);

		}
		if (sizeof($return_array)==0){return "";}
		if (sizeof($row_array)==1 && sizeof($return_array)==1){return $row_array[0];} else {return $return_array;}
	}

	/* 
	 * Function : global_vars
	 * replaces variables which have previously been exported via a filter key - picked up with {=global:varname}
	*/
	static function global_vars($data){
		// replace global vars with values
		$current_page=$_SERVER['SCRIPT_FILENAME'] . "!" . $_SERVER['script_name'] . "!" . $_SERVER['PATH_INFO'];
		$data=str_replace("{=current_page}",$current_page,$data);	
		//global vars array
		$global_matches=preg_match_all("/{=global:\w+}/",$data,$matches);
		foreach ($matches[0] as $thismatch){
			$original_match=$thismatch;
			$thismatch=str_replace("{=global:","",$thismatch);
			$thismatch=str_replace("}","",$thismatch);
			global $page;
			$var_value=$page->get_global_var($thismatch);
			$data=str_replace($original_match,$var_value,$data);
		}
		return $data;
	}

	/* Function: php_in_content
	 * Param: $input string
	 * Finds dynamic php embedded by {=PHP:filename} and replaces it with the contents of the server parsed file 
	 */
	static function php_in_content($input){
		global $db;
		global $user;
		$split_content=explode("{=PHP:",$input);
		$second_split=explode("}",$split_content[1]);
		$php_script=$second_split[0];
		if ($php_script){
			$php_script="system/custom/".$php_script;
			$original_php="{=PHP:".$second_split[0]."}";
			ob_start();
			require_once($php_script);
			$embed_external_output=ob_get_contents();
			ob_end_clean();
			$input=str_replace($original_php,$embed_external_output,$input);
			if (strpos($input,"{=PHP:")){
				$input=Codeparser::php_in_content($input);
			}
		}
		return $input;
	}

	/* 
	 * Function: evaluate_functions_in_content
	 * Meta: Calls functions embedded with {=sendtofunction: scriptname.php functionName param1, param2 [etc]}
	 * Param: $content string
	*/
	function evaluate_functions_in_content($content){
		$split_content=explode("{=sendtofunction:",$content);
		$second_split=explode("}",$split_content[1]);
		$php_script=trim($second_split[0]);
		$script_parts=explode(" ",$php_script);
		$php_script="system/custom/" . array_shift($script_parts);
		$user_function=array_shift($script_parts);
		$string_to_function=join(",",$script_parts);
		$original_php="{=sendtofunction:".$second_split[0]."}";
		$functionname=BASEPATH . "/" . trim($php_script);
		include_once($php_script);
		$evalStr="\$functionResult = " . $user_function . "($string_to_function);";
		$res=eval($evalStr);
		$embed_external_output=$functionResult;
		$content=str_replace($original_php,$embed_external_output,$content);
	}

	/* 
	 * Function many_to_many_subform
	*/
	static function many_to_many_subform($template){
		if (stristr($template,"{=many_to_many_subform:")){
			$m2m_subform=preg_match_all("/{=many_to_many_subform:.*}/",$template,$matches);
			foreach ($matches[0] as $thismatch){
				$original_match=$thismatch;
				$thismatch=str_replace("{=many_to_many_subform:","",$thismatch);
				$thismatch=str_replace("}","",$thismatch);
				$pairs=preg_split("/&|&amp;/",$thismatch);
				foreach ($pairs as $pair){
					$pair=str_replace("amp;","",$pair);
					list ($var,$val)=explode("=",$pair);
					if ($var && $val){
						if ($var=="master_id"){ $master_id=$val;}
						if ($var=="master_table"){ $master_table=$val;}
						if ($var=="many_table"){ $many_table=$val;}
						if ($var=="through_table"){ $through_table=$val;}
						if ($var=="key_field"){ $key_field=$val;}
						if ($var=="value_field"){ $value_field=$val;}
						if ($var=="name_field"){ $name_field=$val;}
						if ($var=="type"){ $subform_type=$val;}
					}
				}
				if ($many_table && $master_id && $subform_type && $key_field && $value_field && $through_table){
					$thismatch=database_functions::many_to_many_subform($master_table,$many_table,$through_table,$master_id,$key_field,$value_field,$name_field,$subform_type);
				}
				$template=str_replace($original_match,$thismatch,$template);
			}
		}
		return $template;
	}

	/*
	 * Function parse_php_in_query
	 * Meta: Called from the recordset constructor function, allows php functionality to be embedded in a database query
	 * Example: {=SQL:SELECT {=PHP:select_field_list} FROM products WHERE title LIKE "%{=PHP:search}%" ORDER BY {=PHP:set_order_field} LIMIT {=PHP:getPageLimit}}
	*/
	static function parse_php_in_query($input){
		$phps_in_input=preg_match_all("/{=PHP:.*}/",$input,$matches);
		foreach ($matches[0] as $eachmatch){
			$original_match=$eachmatch;
			$eachmatch=str_replace("{","",$eachmatch);
			$eachmatch=str_replace("}","",$eachmatch);
			$string_to_function=""; $embed_external_output="";	
			$fields_to_function=preg_replace("/=PHP: ?(\w+.php) /","",$eachmatch);
			$functionname=preg_replace("/=PHP: ?/","",$eachmatch);
			$functionname = preg_replace("/ .*/","",$functionname);
			$functionname = "system/custom/" . $functionname;
			$fields_to_function_array=explode(" ",$fields_to_function);
			$user_function=array_shift($fields_to_function_array);
			foreach ($fields_to_function_array as $functionfield){
				if ($returned_record_data[$functionfield]){
					$string_to_function .= "" . $returned_record_data[$functionfield] . ",";
				} else {
					if ($functionfield=="user_type_current"){
						$string_to_function .= "\"" . $user->value("type") . "\",";
					} elseif ($functionfield=="current_user"){
						$string_to_function .= "\"" . $user->value("id") . "\",";
					} else {
						$string_to_function .= "\"$functionfield\","; 
					}
				}
			}
			$string_to_function=rtrim($string_to_function);
			$string_to_function=preg_replace("/,$/","",$string_to_function);
			$functionname=BASEPATH . "/" . $functionname;
			$sysresult2 = include_once($functionname);
			$evalStr="\$functionResult = " . $user_function . "($string_to_function);";
			$res=eval($evalStr);
			$input=str_replace($original_match,$functionResult,$input);
		}
		return $input;
	}

	/*
	 * Function parse_template_code
	 * Param $input (string)
	 * Return String (parsed template code!) 
	*/
	static function parse_template_code($input){

		global $dbf_global_content_variables;
		global $user;

		// Inject global variables for user - needs to be moved to it's own function, but where?
		if ($user){
			$dbf_global_content_variables['sysUserType']=$user->value("type");
			$dbf_global_content_variables['sysUserName']=$user->value("full_name");
			$dbf_global_content_variables['sysUserFirstName']=$user->value("first_name");
		}

		// Inject global variables for shopping cart - this needs to me moved into function outside of here too
		$dbf_global_content_variables['sysCartItemsQty']="0";
		$dbf_global_content_variables['sysCartItemsText']="0 ITEMS";

		if (array_key_exists("cart",$_SESSION) && $_SESSION['cart']){
			foreach ($_SESSION['cart'] as $item => $itemdata){
				$cart_count++;
			}
			$dbf_global_content_variables['sysCartItemsQty']=$cart_count;
			$dbf_global_content_variables['sysCartItemsText']=$cart_count;
			if ($cart_count>0){
				if ($cart_count>1){$plural="S";}
				$dbf_global_content_variables['sysCartItemsText'] .= "ITEM" . $plural; 
			}
		}
		// End inject global variables for shopping cart 

		if (stristr($input,"{=if")){

			// First we do straight up existence matches (boolean), also value matches on these, and the ability to join with an OR operator (pipe (|) symbol)
			// The following regex matches single boolean var existences or those joined with a pipe for an or operator, and takes into acount basic = functionality:
			// Examples...
			// {=if this}    {=if this|that}   {=if that = VALUE OF THAT} {=if that = VALUE OF THAT|this}
			// Note that all {=if..} must termintate with {=end_if}
	
			// NB: OLD:$r = preg_match_all("/{=if ((?:!? \w+     ,?)+ ?=? ?[\w ]+)}(.*?){=end[ _]?if}/ims",$input,$or_results); 
			// New version below allows \w! = as a set in the first part, and also allows for spaces in the return value 
			$r = preg_match_all("/{=if ((?:!?[\w! =]+\|?)+ ?=? ?[^\+]*?)}(.+?){=end[ _]?if}/ims",$input,$or_results); // remove the ? after the , to stop capturing single if 
			$no_of_or_templates=sizeof($or_results[0])-1;
			for ($or_template_no=0; $or_template_no<=$no_of_or_templates; $or_template_no++){
				$or_template=$or_results[0][$or_template_no];
				$or_inner_template=$or_results[2][$or_template_no];

				$or_field_results=$or_results[1][$or_template_no];
				$or_fields=explode(",",$or_field_results);
				$expression_evaluates=false;
				foreach ($or_fields as $or_field){
					if ($expression_evaluates){continue;}
					$original_or_field = $or_field; // we might need this. Bad idea to rewrite the variable
					@list($if_var,$if_val)=explode("=",$or_field);// does the or field have a value? if so store it in $if_val and rewrite $or_field to be the var only
					$if_var=trim($if_var);
					$if_val=trim($if_val);
					if ($if_val){$or_field=$if_var;}
					if (preg_match("/^![\w ]+$/",$or_field)){$positive_check=0; $or_field=str_replace("!","",$or_field);} else {$positive_check=1;}
						if ($positive_check && array_key_exists($or_field,$dbf_global_content_variables)) {
							if ($dbf_global_content_variables[$or_field] && strlen($dbf_global_content_variables[$or_field])>=1) {
								if (($if_val && $dbf_global_content_variables[$or_field]==$if_val) || !$if_val){
									$expression_evaluates=true;
								}
							 }
						} else if (!$positive_check){
							if (!array_key_exists($or_field,$dbf_global_content_variables) || (array_key_exists($or_field,$dbf_global_content_variables) && ($dbf_global_content_variables[$or_field]=="" || $dbf_global_content_variables[$or_field]=="0"))){
								$expression_evaluates=true;
							}
						}
				}
				if ($expression_evaluates){
					$input = str_replace($or_template,$or_inner_template,$input);
				} else {
					$input = str_replace($or_template,"",$input);
				}
			}

			// AND matches
			// This specifically searches for values with a + in them Eg. {=if this+that+other}..{=end_if} as we have already got single values and 'or' conditions out 
			// Also supports negative matching: eg. {=if this+|that+!other}..{=end if}
			$r = preg_match_all("/{=if ([!?\w\++]+\w+)}(.*?){=end[ _]?if}/ims",$input,$and_results);
			$no_of_and_templates=sizeof($and_results[0])-1;
			for ($and_template_no=0; $and_template_no<=$no_of_and_templates; $and_template_no++){
				$and_template=$and_results[0][$and_template_no];
				$and_inner_template=$and_results[2][$and_template_no];
				$and_field_results=$and_results[1][$and_template_no];
				$and_fields=explode("+",$and_field_results);
				$expression_evaluates=false;
				foreach ($and_fields as $and_field){
					if (preg_match("/^!\w+$/",$and_field)){$positive_check=0; $and_field=str_replace("!","",$and_field);} else {$positive_check=1;}
					if ($positive_check && array_key_exists($and_field,$dbf_global_content_variables) && strlen($dbf_global_content_variables[$and_field])){
						$expression_evaluates=true;
					} else if (!$positive_check && (!array_key_exists($and_field,$dbf_global_content_variables) || !$dbf_global_content_variables[$and_field])){
						$expression_evaluates=true;
					} else {$expression_evaluates=false; break;}

				}

				if ($expression_evaluates){
					$input=str_replace($and_template,$and_inner_template,$input);
				} else {
					$input=str_replace($and_template,"",$input);
				}
			}
		}
		$global_matches=preg_match_all("/{=content_var:[\w:]+}/",$input,$matches);
		foreach ($matches[0] as $thismatch){
			$original_match=$thismatch;
			$thismatch=str_replace("{=content_var:","",$thismatch);
			$thismatch=str_replace("}","",$thismatch);
			$var_extra="";
			if (stristr($thismatch,":")){
				$second_match=$thismatch;
				list($thismatch,$var_extra)=explode(":",$thismatch);
			}
			$var_value=$dbf_global_content_variables[$thismatch];
			if ($var_extra){
				// special case for shopping cart items
				if ($thismatch=="sysCartItemsQty" && $var_extra){
					if ($dbf_global_content_variables['sysCartItemsQty'] == "1"){
						$var_extra=preg_replace("/s$/i","",$var_extra);
					}
				}
				$var_value .= " ". $var_extra;
			}
			$input=str_replace($original_match,$var_value,$input);
		}
		return $input;
	}

	/* 
	 * Function: parse_form_template_code
	 * Meta: Called from form.php and used when templating a dynamic form
	 * Param: $input string
	 * Param: $data
	*/
	static function parse_form_template_code($input,$data){

		global $dbf_global_content_variables;
		global $user;
		if ($user){
			$dbf_global_content_variables['sysUserType']=$user->value("type");
			$dbf_global_content_variables['sysUserName']=$user->value("full_name");
			$dbf_global_content_variables['sysUserFirstName']=$user->value("first_name");
		}
		$dbf_global_content_variables['sysCartItemsQty']="0";
		$dbf_global_content_variables['sysCartItemsText']="0 ITEMS";
		if (array_key_exists("cart",$_SESSION) && $_SESSION['cart']){
			foreach ($_SESSION['cart'] as $item => $itemdata){
				$cart_count++;
			}
			$dbf_global_content_variables['sysCartItemsQty']=$cart_count;
			$dbf_global_content_variables['sysCartItemsText']=$cart_count;
			if ($cart_count>0){
				if ($cart_count>1){$plural="S";}
				$dbf_global_content_variables['sysCartItemsText'] .= "ITEM" . $plural; 
			}
		}
		if (stristr($input,"{=if")){

			// Single vars and or vars
			$r = preg_match_all("/{=if ((?:!?\w+,?)+ ?=? ?[\w ]+)}(.*?){=end[ _]?if}/ims",$input,$or_results); // remove the ? after the , to stop capturing single if statements
			$no_of_or_templates=sizeof($or_results[0])-1;
			for ($or_template_no=0; $or_template_no<=$no_of_or_templates; $or_template_no++){
				$or_template=$or_results[0][$or_template_no];
				$or_inner_template=$or_results[2][$or_template_no];

				$or_field_results=$or_results[1][$or_template_no];
				$or_fields=explode(",",$or_field_results);
				$expression_evaluates=false;
				foreach ($or_fields as $or_field){
					if ($expression_evaluates){continue;}
					@list($if_var,$if_val)=explode("=",$or_field);// does the or field have a value? if so store it in $if_val and rewrite $or_field to be the var only
					$if_var=trim($if_var);
					$if_val=trim($if_val);
					if ($if_val){$or_field=$if_var;}
					if (preg_match("/^!\w+$/",$or_field)){$positive_check=0; $or_field=str_replace("!","",$or_field);} else {$positive_check=1;}
						if ($positive_check && array_key_exists($or_field,$data)) {
							if ($data[$or_field] && strlen($data[$or_field])>=1) {
								if (($if_val && $data[$or_field]==$if_val) || !$if_val){
									$expression_evaluates=true;
								}
							 }
						} else if (!$positive_check){
							if (!array_key_exists($or_field,$data) || (array_key_exists($or_field,$data) && ($data[$or_field]=="" || $data[$or_field]=="0"))){
								$expression_evaluates=true;
							}
						}
				}
				if ($expression_evaluates){
					$input = str_replace($or_template,$or_inner_template,$input);
				} else {
					$input = str_replace($or_template,"",$input);
				}
			}

			// AND matches
			$er = preg_match_all("/{=if ([!?\w\++]+\w+)}(.*?){=end[ _]?if}/ims",$input,$and_results) 
			$no_of_and_templates=sizeof($and_results[0])-1;
			for ($and_template_no=0; $and_template_no<=$no_of_and_templates; $and_template_no++){
				$and_template=$and_results[0][$and_template_no];
				$and_inner_template=$and_results[2][$and_template_no];
				$and_field_results=$and_results[1][$and_template_no];
				$and_fields=explode("+",$and_field_results);
				$expression_evaluates=false;
				foreach ($and_fields as $and_field){
					if (preg_match("/^!\w+$/",$and_field)){$positive_check=0; $and_field=str_replace("!","",$and_field);} else {$positive_check=1;}
					if ($positive_check && array_key_exists($and_field,$data) && strlen($data[$and_field])){
						$expression_evaluates=true;
					} else if (!$positive_check && (!array_key_exists($and_field,$data) || !$data[$and_field])){
						$expression_evaluates=true;
					} else {$expression_evaluates=false; break;}

				}

				if ($expression_evaluates){
					$input=str_replace($and_template,$and_inner_template,$input);
				} else {
					$input=str_replace($and_template,"",$input);
				}
			}
		}

		$global_matches=preg_match_all("/{=content_var:[\w:]+}/",$input,$matches);
		foreach ($matches[0] as $thismatch){
			$original_match=$thismatch;
			$thismatch=str_replace("{=content_var:","",$thismatch);
			$thismatch=str_replace("}","",$thismatch);
			$var_extra="";
			if (stristr($thismatch,":")){
				$second_match=$thismatch;
				list($thismatch,$var_extra)=explode(":",$thismatch);
			}
			$var_value=$dbf_global_content_variables[$thismatch];
			if ($var_extra){
				// special case for shopping cart items
				if ($thismatch=="sysCartItemsQty" && $var_extra){
					if ($dbf_global_content_variables['sysCartItemsQty'] == "1"){
						$var_extra=preg_replace("/s$/i","",$var_extra);
					}
				}
				$var_value .= " ". $var_extra;
			}
			$input=str_replace($original_match,$var_value,$input);
		}
		return $input;
	}

}

?>
