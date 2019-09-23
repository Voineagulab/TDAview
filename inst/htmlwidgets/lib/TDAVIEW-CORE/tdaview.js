class tdaview { 
    constructor(element) {/*, distance, filtration, dataArrays, metaArrays) {*/
        var self = this;

        //Check browser
        if (!Compatibility.isWebGLAvailable() ) {
            console.warn("Webgl not available - please use a newer browser.");
            return;
        } else if(!Compatibility.isES6Available()) {
            console.warn("ES6 not available - please use a newer browser.");
            return;
        }

        var shouldShareMap = true;

        var isLabelFromBackground = false;
        var backgroundColor = new THREE.Color();
        var tempColor = new THREE.Color();
        function getHighContrastColor(inColor, outColor) {
            var targetObject = {};
            let lightness = inColor.getHSL(targetObject).l;
            if(lightness < 0.1833) {
                outColor.set("white");
            } else if(lightness > 0.175) {
                outColor.set("black");
            }
            return outColor;
        }
        
        var nodeMap = new ColorMap();
        var edgeMap = new ColorMap(1);

        self.graph = new Graph(element, nodeMap, nodeMap);

        var legendBar = new LegendBar(self.graph.domElement);
        var legendPie = new LegendPie(self.graph.domElement);
        legendBar.setVisibility(false);
        legendPie.setVisibility(false);


        var sidebar = new Menu(element);
        sidebar.setSubmenusEnabled(false);

        sidebar.menuNodes.OnNodeSizeUniform = function() {
            self.graph.forEachNode(n => self.graph.setNodeScale(n, 0.5));
            self.graph.updateNodeScales();
            self.graph.applyLinkPositions();
            self.graph.forEachNode(n => self.graph.setLabelPosition(n));
            self.graph.update();
        };

        

        sidebar.menuNodes.OnNodeSizePoints = function() {
            self.graph.forEachNode(n => self.graph.setNodeScale(n, self.data.getPointsNormalised(n.userData)));
            self.graph.updateNodeScales();
            self.graph.applyLinkPositions();
            self.graph.forEachNode(n => self.graph.setLabelPosition(n));
            self.graph.update();
        };

        

        sidebar.menuNodes.OnNodeSizeContinuous = function(value) {
            self.data.loadVariable(value);
            self.graph.forEachNode(n => self.graph.setNodeScale(n, self.data.getContinuousNormalised(n.userData, "mean")));
            self.graph.updateNodeScales();
            self.graph.applyLinkPositions();
            self.graph.update();
        };

        sidebar.menuNodes.OnNodeColorUniform = function() {
            legendBar.setVisibility(false);
            legendPie.setVisibility(false);
        };

        

        sidebar.menuNodes.OnNodeColorContinuous = function(value) {
            self.data.loadVariable(value);
            self.graph.forEachNode(n => self.graph.setNodeColor(n, self.data.getContinuousNormalised(n.userData, "mean")));
            if(shouldShareMap) {
                self.graph.setLinkGradientsFromNodes();
                self.graph.updateLinkColors()
            }
            self.graph.updateNodeColors();
            self.graph.update();

            legendPie.setVisibility(false);
            legendBar.setVisibility(true);
            legendBar.setLabels(self.data.getContinuousMin("mean"), self.data.getContinuousMax("mean"));
        };
        
        //TODO this is now correct (colors=[0.2, 0.4, 0.6, 0.8] for 4 categories - steps[x].percentage and hence the underlyig texture is slightly wrong
        sidebar.menuNodes.OnNodeColorCategorical = function(value) {
            self.data.loadVariable(value);
            let categories = self.data.getVariable().getCategorical().getCategories();
            for(let i=0; i<self.graph.nodes.length; i++) {
                let percentages = [];
                let colors = [];
                for(let j=0; j<categories.length; j++) {
                    let categorical = self.graph.nodes[i].userData.getCategorical();
                    let sum = categorical.getSum();
                    let count = categorical.getCount(categories[j]);

                    if(count > 0) {
                        percentages.push(count / sum);
                        colors.push((j+1) / (categories.length+1));
                    }
                }

                self.graph.setNodePie(self.graph.nodes[i], percentages, colors);
            }
            if(shouldShareMap) {
                self.graph.setLinkGradientsFromNodes();
                self.graph.updateLinkColors()
            }

            self.graph.updateNodeColors();
            self.graph.update();
            legendBar.setVisibility(false);
            legendPie.createEntries(categories);
            legendPie.setVisibility(true);
            return categories.length;
        };

        
        

        sidebar.menuNodes.OnNodeColorChange = function(value) {
            var color = new THREE.Color("#" + value);
            nodeMap.setColor(color);
            self.graph.updateNodeColors();
            if(shouldShareMap) self.graph.updateLinkColors();
            self.graph.update();
        };

        
        

        sidebar.menuNodes.OnNodeGradientChange = function(steps) {
            nodeMap.setGradient(steps);
            self.graph.updateNodeColors();
            self.graph.update();

            if(legendBar.getVisibility()) {
                legendBar.setGradientCSS(sidebar.menuNodes.nodeGradPicker.getGradientCSS());
            } else {
                legendPie.setColors(steps.map(s => s.color.getHexString()));
            }
        };

        

        

        
        sidebar.menuEdges.OnEdgeAlphaChange = function(alpha) {
            self.graph.setLinkAlpha(alpha);
            self.graph.update();
        };

        

        sidebar.menuEdges.OnEdgeWidthChange = function(width) {
            self.graph.setLinkScale(width);
            self.graph.applyLinkPositions();
            self.graph.update();
        };

        

        sidebar.menuEdges.OnEdgeColorUniform = function() {
            self.graph.setLinkColorMap(edgeMap);
            self.graph.updateLinkColors();
            self.graph.update();
        };

        
        sidebar.menuEdges.OnEdgeColorFromNodes = function() {
            self.graph.setLinkColorMap(nodeMap);
            self.graph.applyLinkPositions();
            self.graph.setLinkGradientsFromNodes();
            self.graph.updateLinkColors();
            self.graph.update();
            shouldShareMap = true;
        };

        sidebar.menuEdges.OnEdgeColorChange = function(value) {
            var color = new THREE.Color("#" + value);
            edgeMap.setColor(color);
            self.graph.updateLinkColors();
            self.graph.update();
        };

        sidebar.menuLabels.OnLabelSizeChange = function(value) {
            self.graph.setFontScale(value);
        };
        
        sidebar.menuLabels.OnLabelColorFromBackground = function() {
            isLabelFromBackground = true;
            let colString = getHighContrastColor(backgroundColor, tempColor).getHexString();
            self.graph.setLabelColors(colString);
            self.graph.setSelectColor(colString);
        };
        
        sidebar.menuLabels.OnLabelColorUniform = function() {
            isLabelFromBackground = false;
        };

        sidebar.menuLabels.OnLabelColorChange = function(value) {
            self.graph.setLabelColors(value);
        };

        sidebar.menuLabels.OnLabelTextName = function() {
            self.graph.forEachNode(n => self.graph.setLabelText(n, n.userData.getName()));
            self.graph.setLabelVisibilities(true);
        };

        sidebar.menuLabels.OnLabelTextPoints = function() {
            self.graph.forEachNode(n => self.graph.setLabelText(n, n.userData.getPointCount()));
            self.graph.setLabelVisibilities(true);
        };

        sidebar.menuLabels.OnLabelTextNone = function() {
            self.graph.setLabelVisibilities(false);
        };
        
        sidebar.menuSave.OnBackgroundColorChange = function(value) {
            backgroundColor.set("#" + value);
            self.graph.setBackgroundColor(backgroundColor);
            let colString = getHighContrastColor(backgroundColor, tempColor).getHexString();
            self.graph.setSelectColor(colString);
            legendBar.setLabelColor(colString);
            legendPie.setLabelColor(colString);
            if(isLabelFromBackground) {
                self.graph.setLabelColors(colString);
            }
            self.graph.update();
        }

        function saveAs(uri, filename) {
            var link = document.createElement('a');
            if (typeof link.download === 'string') {
                link.href = uri;
                link.download = filename;
                document.body.appendChild(link); //Firefox requires the link to be in the body
                link.click();
                document.body.removeChild(link); //remove the link when done
            } else {
                window.open(uri);
            }
        }

        sidebar.menuSave.OnExportGraph = function(value) {
            html2canvas(self.graph.domElement).then(function(canvas) {
                    var imgtype = value.toLowerCase();
                    saveAs(canvas.toDataURL("image/" + imgtype.toLowerCase()), "graph." + imgtype);
                }
            );
        };

        sidebar.OnZoom = function(value) {
            self.graph.setZoom(value);
            self.graph.update();
        };

        var dataname, datauri;

        self.graph.OnNodeSelect = function(node) {
            var names = node.userData.getPointNames();
            dataname = "Node " + node.id;
            datauri = "data:text/csv;charset=utf-8," + encodeURI(dataname + "\r\n" + names.join('\r\n'));
            sidebar.menuSelect.Open(dataname + " (" + names.length + " rows)", names);
        };

        self.graph.OnLinkSelect = function(link) {
            let i1 = link.source.userData.getPointNames();
            let i2 = link.target.userData.getPointNames();
            let names = i1.filter(i => i2.includes(i));
            dataname = "Link " + link.link_id;
            datauri = "data:text/csv;charset=utf-8," + encodeURI(dataname + "\r\n" + names.join('\r\n'));
            sidebar.menuSelect.Open(dataname + " (" + names.length + " rows)", names);
        }

        self.graph.OnNodeDeselect = self.graph.OnLinkDeselect = function() {
            sidebar.menuSelect.Close();
        };

        sidebar.menuSelect.OnExportData = function() {
            saveAs(datauri, dataname + ".csv" )
        }

        sidebar.menuSave.OnSettingsExport = function() {
            let uri = "data:text/json;charset=utf-8," + encodeURI(JSON.stringify(self.getSettings(), null, 2));
            saveAs(uri, "settings.json");

        }

        sidebar.menuLoad.OnSettingsFileChange = function(settingsObj) {
            self.setSettings(settingsObj);
        }

        this.sidebar = sidebar;

        sidebar.menuLoad.OnMapperFileChange = function(mapperObj, metaObj) {
            //Save settings
            var settingsObj = self.getSettings();

            self.data = new Data(mapperObj, metaObj);

            var nodes = new Array(self.data.bins.length);
            for(let i=0; i<nodes.length; i++) {
                nodes[i] = new NodeInstance(i, self.data.bins[i], element);
            }

            var links = [];
            for(let i=0, curr=0; i<self.data.adjacency.length; i++) {
                let row = self.data.adjacency[i];
                for(let j=0; j<i; j++) {
                    if(row[j]) {
                        links.push(new LinkInstance(curr++, nodes[i], nodes[j]));
                        nodes[i].addNeighbor(nodes[j]);
                        nodes[j].addNeighbor(nodes[i]);
                    }
                }
            }
            self.graph.set(nodes, links);
            self.graph.forEachNode(n => self.graph.setNodeScale(n, 0.5));
            self.graph.updateNodeScales();

            self.sidebar.update(self.data.getContinuousNames(), self.data.getCategoricalNames(), self.data.getHasNodeLabels());

            //Attempt to reapply settings
            self.setSettings(settingsObj);
            self.sidebar.setSubmenusEnabled(true);
        }
    }   

    resize() {
        this.graph.resize();
    }
    
    setMapper(obj) {

    }

    getMapper() {

    }

    setSettings(obj) {
        this.sidebar.setSettings(obj.menu);
    }

    getSettings() {
        return {
            menu: this.sidebar.getSettings()
        }
    }
}
