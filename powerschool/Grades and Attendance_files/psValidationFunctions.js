	// validation 'namespace'
	// public functions
	//  validationFunctions.parseJSONrules(jQuerySelection)
	//  validationFunctions.sendChangeNotification(jQueryElement)

define(['jquery','underscore'], function($j,_) {
	
	var _refObj = {};
	
	//Map{key,            Map}
	//Map.fields       -> Map{fieldName,Map{ruleDataName,RuleDataValue}}
	//Map.textMaskDefs -> Map{definitionName,Map{"textMaskRegex" or "textMaskMessageFormat",value}}
	//Map.textListDefs -> Map{definitionName,Map{"textListRegex" or "textListMessage",value}}
	//Stores a map of attributes for each field.
	var _textRuleMap = [];
	
		
    //	called by parseJSONrules, creates a sort of keyed hash of objects, where the key is the 
	//	name of the referenced key, and the value is an array of objects containing information
	//	about the dependent objects (those that care when the referenced value changes)
	
	// private within the validationFunctions module
	var addReferenceElement = function(dependentStrKey, referenceStrKey, relationshipStr, typeStr) {
		//	javascript object that contains the relational rule data
		//	param dependentKey	the key (ex: 'students.dob') to the field that has this relational dependency
		//	param relationship	the LDV attribute that describes how this dependent field relates to the dependency (ex: 'data-mindate')
		//	param type			the field type for the dependent field (ex: 'date' or 'number')
		var myRef = {dependentKey:dependentStrKey, relationship:relationshipStr, type:typeStr};
		
		if (_refObj[referenceStrKey] === undefined) {
			//no reference to this value yet
			_refObj[referenceStrKey] = [];
			_refObj[referenceStrKey][0] = myRef;
		}
		else {
			//we have a reference to this key already, append the comma-separated index
			var dependentSize = _refObj[referenceStrKey].length;
			_refObj[referenceStrKey][dependentSize] = myRef;
		}
	};
	
	//Public Functions
	var psValidationFunctions  =  {
		//	Parse data-validation JSON and handle for data types
		//	It would be nice to lazy load this code, but getScript seems to be acting asynchronously 
		//	and therefore preventing the loading of later scripts.
		//	Parses for the given selection.
			parseJSONrules : function(jQuerySelection){
				//function parseJSONrules(jQuerySelection){
		
				//if the selection is not valid, just return
				if (jQuerySelection === undefined || jQuerySelection.length === undefined || jQuerySelection.length === 0) {
					return;
				}
		
				//A place to hold the field keys as they are iterated over.
				//var fieldKeysList = [];
				var textAttributeRequest = {};
				
				//parse the selection
				jQuerySelection.each(function() {
					var data = $j.parseJSON($j(this).attr("data-validation"));
					if (data.type != null) {
						if (data.key != null) { //get the key first... references will need it
							$j(this).attr("data-key", data.key);
						}
						if (data.type == "number") { //add number type-specific cases 
							$j(this).addClass("psNumWidget");
							
							if (data.minValue != null) {
								$j(this).attr("data-minvalue", data.minValue);
							} 
							if (data.ref_minValue != null){
								$j(this).attr("data-ref_minvalue", data.ref_minValue);
								addReferenceElement(data.key, data.ref_minValue, "data-minvalue", data.type);
							}
							if (data.minValue_exclusive != null){
								$j(this).attr("data-minvalue_exclusive", data.minValue_exclusive);
								addReferenceElement(data.key, data.ref_minValue, "data-minvalue", data.type);
							}
							if (data.maxValue != null) {
								$j(this).attr("data-maxvalue", data.maxValue);
							}
							if (data.ref_maxValue != null){
								$j(this).attr("data-ref_maxvalue", data.ref_maxValue);
								addReferenceElement(data.key, data.ref_maxValue, "data-maxvalue", data.type);
							}
							if (data.maxValue_exclusive != null){
								$j(this).attr("data-maxvalue_exclusive", data.maxValue_exclusive);
								addReferenceElement(data.key, data.ref_maxValue, "data-maxvalue", data.type);
							}
							if (data.isinteger != null) {
								if (data.isinteger == "true") {
									$j(this).attr("data-isinteger", "true");
								}
							}
							if (data.minlength != null) {
                                $j(this).attr("minlength", data.minlength);
                            }
                            if (data.maxlength != null) {
                                $j(this).attr("maxlength", data.maxlength);
                            }
                            if (data.maxdecimals != null) {
                                $j(this).attr("data-maxdecimals", data.maxdecimals);
                            }
						} else if (data.type == "date") { //add date type-specific cases
							$j(this).addClass("psDateWidget");
							if (data.minValue != null){
								$j(this).attr("data-mindate", data.minValue);
							}
							if (data.ref_minValue != null){
								$j(this).attr("data-ref_mindate", data.ref_minValue);
								addReferenceElement(data.key, data.ref_minValue, "data-mindate", data.type);
							}
							if (data.maxValue != null) {
								$j(this).attr("data-maxdate", data.maxValue);
							}
							if (data.ref_maxValue != null){
								$j(this).attr("data-ref_maxdate", data.ref_maxValue);
								addReferenceElement(data.key, data.ref_maxValue, "data-maxdate", data.type);
							}
						} else if (data.type == "text") { //add text type-specific cases
							$j(this).addClass("psTextWidget");
    						if (data.minlength != null) {
    							$j(this).attr("minlength", data.minlength);
    						}
    						if (data.maxlength != null) {
                                $j(this).attr("maxlength", data.maxlength);
                            }
                            if (data.textMask != null && data.key != null) {
                            	
                            	if(typeof textAttributeRequest.textMaskDefs == "undefined"){
                            		textAttributeRequest.textMaskDefs = [];
                            	}
                                
                            	//Add to the list of fields that need to retrieve special text strings
                            	if($j.inArray(data.textMask, textAttributeRequest.textMaskDefs) == -1){
                            		textAttributeRequest.textMaskDefs.push(data.textMask);
                            	}
                            	//puts the text mask definition name on the page.
                                $j(this).attr("data-textmask", data.textMask);
                            }
                            //if ((data.includechars != null || data.excludechars != null) && data.key != null) {
                            //uncomment the previous and comment the following to enable includeChars rule
                            if (data.excludechars != null && data.key != null) {
                                
                                if(typeof textAttributeRequest.fields == "undefined"){
                                    textAttributeRequest.fields = [];
                                }
                                
                                //Add to the list of fields that need to retrieve special text strings
                                if($j.inArray(data.key, textAttributeRequest.fields) == -1){
                                    textAttributeRequest.fields.push(data.key);
                                }
                                
                                //Uncomment the following to enable includeChars rule. Also, uncomment code in psTextWidget, add ruleTypeBean to pluginContext.xml in psimpl and add database row to DV_RULETYPES
                                //puts the includechars on the page.
                                //if(data.includechars != null){
                                //    $j(this).attr("data-includechars", "true");
                                //}
                                
                                //puts the excludechars on the page.
                                if(data.excludechars != null){
                                    $j(this).attr("data-excludechars", "true");
                                }
                            }
						}
						
						if (data.required == "true") { //add required flag
							$j(this).addClass("required");
						}
					}
				});
				
				//if one or more fields needs special text attributes, 
				//make the ajax call to get them.
				if(_.keys(textAttributeRequest).length > 0){
    				//Turn the list of field names into a JSON String.
    				var textAttributeRequestJSON = JSON.stringify(textAttributeRequest);
    				
    				//Send the JSON String to the action and get back
    				//a MAP of stuff that we want.
    		        jQuery.ajax ({async: false, 
                        url:'/getValidationTextMap.action', 
                        data:{jsonString: textAttributeRequestJSON},
                        dataType:'json',
                        cache: false,
                        success: function (returnedMap) {
                            _textRuleMap = returnedMap;
                        }
                    });
				}
			},
			//Gets the special text attribute.
			//attributeKey: "fields","textMaskDefs", or "textListDefs"
			//attributeType: "fields"       -> use field name
			//               "textMaskDefs" -> name of the text mask definition
			//               "textListDefs" -> name of the text list definition
			//attributeName: "fields"       -> "includeChars", "includeCharsEscaped", "excludeChars", or "excludeCharsEscaped"
            //               "textMaskDefs" -> "textMaskRegex", or "textMaskMessageFormat"
            //               "textListDefs" -> "textListRegex", or "textListMessageFormat"
			getTextDataMapAttribute: function(attributeKey, attributeType, attributeName){
				//Null checks
				if(typeof attributeKey == "undefined" ||
				   typeof attributeType == "undefined" ||
				   typeof attributeName == "undefined" ||
				   attributeKey == null ||
                   attributeType == null ||
                   attributeName == null ||
				   typeof _textRuleMap[attributeKey] == "undefined" ||
				   typeof _textRuleMap[attributeKey] == null ||
				   typeof _textRuleMap[attributeKey][attributeType.toLowerCase()] == "undefined" || 
				   typeof _textRuleMap[attributeKey][attributeType.toLowerCase()] == null || 
				   typeof _textRuleMap[attributeKey][attributeType.toLowerCase()][attributeName] == null ||
				   typeof _textRuleMap[attributeKey][attributeType.toLowerCase()][attributeName] == "undefined"){
                    return null;
                }
                
                //all passed. Return the data
				return _textRuleMap[attributeKey][attributeType.toLowerCase()][attributeName];
			},
			// when a value changes, lets check if this is something anyone else cares about.
		    // utilizes the _refObj 'object' to find any dependents that care about 
		    // the change, push the change to them and re-evaluate them
		    sendChangeNotification: function(jQueryElement) {
	    		var referenceStrKey = jQueryElement.attr("data-key");
	    		if (referenceStrKey === undefined || _refObj[referenceStrKey] === undefined) {
	    			return; //no reference key, or no one cares if this key changes
	    		}
	    		else {
	    			//contains an array of objects, one object per dependency
	    			var numDependencies = _refObj[referenceStrKey].length;
	    			var referencedValue = jQueryElement.val();
	    			var removeRef = false;
	    			//if the referenced value is now empty, the dependency is (at least temporarily) removed
	    			if (referencedValue === ""){
	    				removeRef = true;
	    			}
	    			// another gem for zero-dates
	    			// zero-date is a valid 'date' but cannot be used for an upper or lower limit.
	    			// If a referenced date has been updated to a zero date, dependent fields should
	    			// behave the same as if the reference was removed.
	    			if (_refObj[referenceStrKey][0].type === "date" && typeof psDateValidate.isZeroDate == "function" && psDateValidate.isZeroDate(referencedValue)) {
	    				removeRef = true;
	    			}
	    			//for each dependency, go update and revalidate if necessary
	    			var i=0;
	    			for (i = 0; i < numDependencies; i++){
	    				//find the element(s) by dependentKey attr
	    				var dependentKey = _refObj[referenceStrKey][i].dependentKey;
	    				var jQuerySelection = $j('[data-key="' + dependentKey + '"]');
	    				var relationship = _refObj[referenceStrKey][i].relationship;

	    				//there should only ever be one element with this key, but better safe than sorry
	    				jQuerySelection.each(function() {

	    					if (removeRef) { //the dependency has been removed, yank the attribute
	    						$j(this).removeAttr(relationship);
	    					}
	    					else {
	    						//otherwise update to the new value
	    						//value in the attribute is always system default locale format, referencedValue comes from the UI so it is in the current locale format
	    						//need to convert the current locale format to system before doing any comparisons or pushing of data
	    						var delocalizedReferencedValue;
	    						if (_refObj[referenceStrKey][i].type === "date"){
	    							var d = i18nStringToDate(referencedValue);
	    							delocalizedReferencedValue = "" + (d.getMonth()+1) + "/" + d.getDate() + "/" + d.getFullYear() + "";
	    						}
	    						else if (_refObj[referenceStrKey][i].type === "number"){
	    							delocalizedReferencedValue = deLocalizeNumber(referencedValue);
	    						}

	    						$j(this).attr(relationship, delocalizedReferencedValue); //value changed, update

	    					}
	    					
	    					if (_refObj[referenceStrKey][i].type === "date"){
	    						psDateValidate.validateDate($j(this));
	    					}
	    					if (_refObj[referenceStrKey][i].type === "number"){
	    						psNumWidget.validateNumber($j(this));
	    					}
	    					//else other stuff
	    					

	    				}); //end jquery each

	    			}//end for
	    		}
		    }
		};
		return psValidationFunctions;
});
