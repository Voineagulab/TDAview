# TDAView

A graph visualisation tool targeted at persistent homology applications, focusing on:

  - Compatibility with R viewer
  - Efficient display of large force networks in WebGL
  - Control over colour, size and width for nodes and edges with real-time updates
  - Publishing results

# Getting Started
### Installation
1. Download and build the library
```{r}
devtools::install_github("ktaouk1/TDAView")
```
2. Initialise a graph:
```{r}
tdaview( [mapper object] , [metadata] , [labels] )
```
Use ```set options(viewer = NULL)``` to open subsequent calls in default browser.

### Example
Trigonometric data is passed into TDAmapper and the result displayed in TDAView
```{r}
devtools::install_github("paultpearson/TDAmapper")
library(TDAmapper)

First.Example.data = data.frame(x = 2*cos(0.5*(1:100)), y=sin(1:100))
First.Example.meta = c(sprintf("Positive", 1:50), sprintf("Negative", 1:50))
First.Example.filter = First.Example.data$x
First.Example.dist = dist(First.Example.data)

First.Example.mapper <- mapper(dist_object = First.Example.dist,
                               filter_values = First.Example.filter,
                               num_intervals = 6,
                               percent_overlap = 50,
                               num_bins_when_clustering = 10)

First.Example.labels = sprintf("Node %s", seq(1:First.Example.mapper$num_vertices))

tdaview(First.Example.mapper, First.Example.meta, First.example.labels)
```
### The Menu
The sidebar enables real-time customisation of graphs and is divided into a series of sub-menus.

# License
MIT
