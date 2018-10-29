# TDAView

TDAView is a graph visualisation tool targeted at persistent homology applications, focusing on:

  - Compatibility with R viewer for seamless workflow
  - Efficient display of large force graph networks in WebGL
  - Powerful control over color, size and width variables for nodes and edges with real-time updates
  - Legend and selection information to interpret results

# Getting Started
### Installation
TDAView can be set up and ready to use in two lines. Devtools will install all the necessary files and
dependencies, and the library can be loaded as per usual.
```{r}
> devtools::install_github("ktaouk/BINF6111-Project")
> library(tdaview)
```
Once everything is installed, TDAView can be run with the command
```{r}
> tdaview( [mapper object] , [metadata] , [batch labels] )
```
[mapper object] - 
[metadata] - 
[batch labels] - 
### Examples
TDAView is designed to accept TDAmapper output as input. The following examples will outline the type of data required, as well as any formatting issues.
Executing the command 'options(viewer = NULL)' before running tdaview(...) will display the widget in the default web browser rather than the RStudio plot viewer.

This example create random trigonometric data, feeds it into TDAmapper, and then feeds the output to TDAView. No formatting is required for this.
```{r}
> devtools::install()
> library(tdaview)
> 
> First.Example.data = data.frame( x=2*cos(0.5*(1:100)), y=sin(1:100) )
> First.Example.dist = dist(First.Example.data)
> First.Example.mapper <- mapper(dist_object = First.Example.dist,
+                                filter_values = First.Example.data$x,
+                                num_intervals = 6,
+                                percent_overlap = 50,
+                                num_bins_when_clustering = 10)
> devtools::install()
> tdaview(First.Example.mapper, First.Example.data, data.frame(z=tan(1:100)))
```
This example is based on data about gene expression in autism and control samples in a study.
The data (a .csv file of size ~7mb) required some custom formatting before being run through TDAmapper and TDAView.

> #Custom autism data
> read.tcsv = function(file, header=TRUE, sep=",", ...) {
+   n = max(count.fields(file, sep=sep), na.rm=TRUE)
+   x = readLines(file)
+
+   .splitvar = function(x, sep, n) {
+     var = unlist(strsplit(x, split=sep))
+     length(var) = n
+     return(var)
+   }
+
+   x = do.call(cbind, lapply(x, .splitvar, sep=sep, n=n))
+   x = apply(x, 1, paste, collapse=sep)
+   out = read.csv(text=x, sep=sep, header=header, ...)
+   return(out)
+
+ }
> Autism.data = read.tcsv("data_norm.csv")
> Autism.numeric = Autism.data[, 2:ncol(Autism.data)]
> Autism.dist <- dist(Autism.numeric)
>
> Autism.mapper <- mapper(dist_object = Autism.dist,
+                         filter_values = Autism.numeric[,1],
+                         num_intervals = 10,
+                         percent_overlap = 50,
+                         num_bins_when_clustering = 10)
> tdaview(mapper=Autism.mapper, 
+		  metadata=Autism.data[, 1], 
+ 		  labels=sprintf("Node [%s]", seq(1:Autism.mapper$num_vertices)))

```{r}

```
### The Menu
The sidebar enables real-time customisation of graphs and is divided into a series of submenus.

# License
----
MIT