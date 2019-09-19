//Don't store layout in URL - (2000 character limit)
//Save/load preferences json object?
//Only gradient save?


//TODO move tdaview construction outside widget since it no longer requires arguments (line 43 only line that uses x)
//Make data.js take in list of headings rather than extract them from points (not sure which version of mapper that is? Inefficient)

//Initially just replace entire tda but it'd be good to keep UI intact
HTMLWidgets.widget({ 
	name: 'tdaview',
	type: 'output',
	
	factory: function(element, width, height) {
		var view;
		

		return {
			renderValue: function(x) {
				view = new tdaview(element);
				view.setMapper(x.mapper);
				if(x.settings) {
					view.setSettings(x.settings);
				}
			},
			
			resize: function(width, height) {
				view.resize();
			}
		};
	}
});