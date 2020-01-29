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

        sidebar.menuNodes.OnNodeSizeDegree = function() {
            self.graph.forEachNode(n => self.graph.setNodeScale(n, n.countNeighbors()/self.maxDegree));
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
            legendBar.setLabels(self.data.getContinuousMin("mean"), self.data.getContinuousMax("mean"));
            legendBar.setTitle(value);
            legendBar.setVisibility(true);
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
            legendPie.setTitle(value);
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
                legendBar.setColors(steps);
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

        sidebar.menuNodes.OnLabelSizeChange = function(value) {
            self.graph.setFontScale(value);
        };

        sidebar.menuNodes.OnLabelColorFromBackground = function() {
            isLabelFromBackground = true;
            let colString = getHighContrastColor(backgroundColor, tempColor).getHexString();
            self.graph.setLabelColors(colString);
            self.graph.setSelectColor(colString);
        };

        sidebar.menuNodes.OnLabelColorUniform = function() {
            isLabelFromBackground = false;
        };

        sidebar.menuNodes.OnLabelColorChange = function(value) {
            self.graph.setLabelColors(value);
        };

        sidebar.menuNodes.OnLabelTextPoints = function() {
            self.graph.forEachNode(n => self.graph.setLabelText(n, n.userData.getPointCount()));
            self.graph.setLabelVisibilities(true);
        };

        sidebar.menuNodes.OnLabelTextNone = function() {
            self.graph.setLabelVisibilities(false);
        };

        sidebar.menuNodes.OnLabelTextDegree = function() {
            self.graph.forEachNode(n => self.graph.setLabelText(n, n.countNeighbors()));
            self.graph.setLabelVisibilities(true);
        };

        sidebar.menuNodes.OnLabelTextContinuous = function(value) {
          self.data.loadVariable(value);
          self.graph.forEachNode(n => self.graph.setLabelText(n, n.userData.getContinuous().mean.toFixed(2)));
          self.graph.setLabelVisibilities(true);
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
        };

        function saveAs(blob, filename) {
            if (window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(blob, filename);
            } else {
                const a = document.createElement('a');
                document.body.appendChild(a);
                const url = window.URL.createObjectURL(blob);
                a.href = url;
                a.download = filename;
                a.click();
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                }, 0);
            }
        }

        sidebar.menuSave.OnExportGraph = function(value) {
            if(value == "pdf") {
                let bottomLeft = new THREE.Vector3(-1, -1, -1).unproject(self.graph.camera);
                let topRight = new THREE.Vector3(1, 1, -1).unproject(self.graph.camera);

                const doc = new PDFDocument({size: [self.graph.width, self.graph.height], margin: 0});
                const stream = doc.pipe(blobStream());

                //Background color
                doc.rect(0, 0, self.graph.width, self.graph.height);
                doc.fillColor('#' + backgroundColor.getHexString().toUpperCase());
                doc.fill();

                //TODO fix slightly incorrect zoom/pan behaviour
                //Viewport transformation, draws nodes links and labels
                doc.save();
                doc.translate(self.graph.width/2 - self.graph.camera.position.x * (topRight.x - bottomLeft.x)/self.graph.width, self.graph.height/2 + self.graph.camera.position.y * (topRight.y - bottomLeft.y)/self.graph.height);
                doc.scale(self.graph.width/(topRight.x - bottomLeft.x), self.graph.height/(topRight.y - bottomLeft.y));

                self.graph.fillContext(doc);
                doc.restore();

                //Canvas transformation, draws legends
                doc.save();

                console.log(self.graph.width);

                //doc.fillColor("blue");
                //doc.rect(0, 0, 10, 10);
                //doc.fill();

                legendBar.fillContext(doc);
                legendPie.fillContext(doc);
                doc.restore();

                //Download result
                doc.end();
                stream.on('finish', function() {
                    saveAs(stream.toBlob('application/pdf'), "graph.pdf");
                });

            } else {
                html2canvas(self.graph.domElement).then(function(canvas) {
                    canvas.toBlob(function(blob){
                        saveAs(blob.slice(0, blob.size, "image/" + value), "graph." + value);
                    });
                }
            );
            }
        };

        sidebar.OnZoom = function(value) {
            self.graph.setZoom(value);
            self.graph.update();
        };

        var dataname, datauri;

        self.graph.OnNodeSelect = function(node) {
            var names =  self.data.getPointNames(node.userData);
            dataname = "Node " + node.id;
            datauri = dataname + "\r\n" + names.join('\r\n');
            sidebar.menuSelect.Open(dataname + " (" + names.length + " rows)", names);
        };

        self.graph.OnLinkSelect = function(link) {
            let i1 = self.data.getPointNames(link.source.userData);
            let i2 = self.data.getPointNames(link.target.userData);
            let names = i1.filter(i => i2.includes(i));
            dataname = "Link " + link.link_id;
            datauri = dataname + "\r\n" + names.join('\r\n');
            sidebar.menuSelect.Open(dataname + " (" + names.length + " rows)", names);
        }

        self.graph.OnNodeDeselect = self.graph.OnLinkDeselect = function() {
            sidebar.menuSelect.Close();
        };

        sidebar.menuSelect.OnExportData = function() {
            saveAs(new Blob(['\ufeff' + datauri], {type: 'text/csv;charset=utf-8'}), dataname + ".csv");
        }

        sidebar.menuSave.OnSettingsFileChange = function(settingsObj) {
            self.setSettings(settingsObj);
        }

        sidebar.menuSave.OnSettingsExport = function() {
            saveAs(new Blob([JSON.stringify(self.getSettings(), null, 2)], {type: "application/octet-stream"}), "settings.json");

        }

        sidebar.menuSave.OnMapperExport = function() {
            saveAs(new Blob([JSON.stringify(self.data.getMapper())], {type: "application/octet-stream"}), "mapper.json");
        }

        this.sidebar = sidebar;

        sidebar.menuLoadMapper.OnMapperFileChange = sidebar.menuRunMapper.OnMapperFileChange = function(mapperObj, metaObj, rowNames) {
            //Save settings
            var settingsObj = self.getSettings();

            self.data = new Data(mapperObj, metaObj, rowNames);

            var nodes = new Array(self.data.bins.length);
            for(let i=0; i<nodes.length; i++) {
                nodes[i] = new NodeInstance(i, self.data.bins[i], element);
            }

            var links = [];
            self.maxDegree = -1;
            let adjacency = self.data.getAdjacency();
            for(let i=0, curr=0; i<adjacency.length; i++) {
                let row = adjacency[i];
                for(let j=0; j<i; j++) {
                    if(row[j]) {
                        links.push(new LinkInstance(curr++, nodes[i], nodes[j]));
                        nodes[i].addNeighbor(nodes[j]);
                        nodes[j].addNeighbor(nodes[i]);
                    }
                }
            }

            for(let i=0; i<nodes.length; ++i) self.maxDegree = Math.max(self.maxDegree, nodes[i].countNeighbors());

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

    setSettings(obj) {
        this.sidebar.setSettings(obj.menu);
    }

    getSettings() {
        return {
            menu: this.sidebar.getSettings()
        }
    }
}
