# TDAView

A graph visualisation tool targeted at persistent homology applications, focusing on:

  - Compatibility with R viewer
  - Efficient display of large force networks in WebGL
  - Control over colour, size and width for nodes and edges with real-time updates
  - Publishing results

![alt-text](https://github.com/ktaouk1/TDAView/raw/master/src/TDAViewExample.PNG "Example Pic")


# Getting Started
### Installation
1. Download and build the library
```{r}
devtools::install_github("ktaouk1/TDAView")
```
2. Initialise a graph:
```{r}
tdaview( mapper, metadata, labels)
```
where *mapper* is the return value of TDAMapper and *metadata* is a 2D array of string or numeric values, with the first entry being variable name and each subsequent entry pertaining to a row in the original data. Finally, *labels* is an array of strings whose length coincides with TDAMapper's calculated vertex count. 

Use `options(viewer = NULL)` to open subsequent calls in default browser.

### Example
Trigonometric data is passed into TDAmapper and the result is displayed in TDAView
```{r}
devtools::install_github("paultpearson/TDAmapper")
library(TDAmapper)

First.Example.data = data.frame(x = 2*cos(0.5*(1:100)), y=sin(1:100))
First.Example.meta = c(c("Treatment", sprintf("Positive", 1:50), sprintf("Negative", 1:50)))
First.Example.filter = First.Example.data$x
First.Example.dist = dist(First.Example.data)

First.Example.mapper <- mapper(dist_object = First.Example.dist,
                               filter_values = First.Example.filter,
                               num_intervals = 6,
                               percent_overlap = 50,
                               num_bins_when_clustering = 10)

First.Example.labels = sprintf("Node %s", seq(1:First.Example.mapper$num_vertices))

tdaview(First.Example.mapper, First.Example.meta, First.Example.labels)
```
### The Menu
The sidebar enables real-time customisation of graphs and is divided into a series of sub-menus.
`Selected` displays all the relevant data for the selected node. This includes the mean value of each of the metadata variables in the selected node, as well as the amount of data present.
`Node Radius` sets the size of the nodes based on the categorical metadata variables, the node content or a predefined constant.
`Node Colour` sets the colour of nodes based on no variables (for constant shading), a single variable (for an overall gradient) or multiple variables to produce pie charts. For variable shading, the colour picker determines the value of the selected step. Drag steps to reposition them, double click to add or remove them.
`Node Label` switches between displaying the given names of the nodes, the size of their content, or nothing at all.
`Edge Width` changes the width of the edges to a percentage of the neighbouring nodes' radii. A reset button reverts any changes back to the default value of 50% width.
`Edge Colour` sets the colour of edges based on constant or single variable shading. For variable shading, the colour picker determines the value of the selected step. Drag steps to reposition them, double click to add or remove them.
`Legend` hides or displays legends relating to node size and colour. The legends contain information about the distribution and importance of each metadata variable.
`Export` captures the present state of the graph and allows download in either PNG or JPEG format.
# License
MIT
