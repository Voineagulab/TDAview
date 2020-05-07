# TDAview

TDAview is a visualisation tool for topological data analysis, focusing on:
  - Ease of use
  - Compatibility with R workflows
  - Efficient display of large force networks in WebGL
  - Control over node and edge formatting
  - Publishing results
#
TDAview can be used as either:
  - a visualisation tool, by importing a Mapper object generated using the TDAmapper R package: https://cran.r-project.org/web/packages/TDAmapper/index.html
  - a TDA analysis and visualization tool, by importing the data and metadata, and choosing the Mapper parameters. For this option, TDAview implements the TDAmapper algorithm in JavaScript.

## Getting Started
### Launch TDAview:
https://walshkieran.github.io/tdaview

### Importing data and generating the graph

TDAview requires as input files the DATA and METADATA in .CSV format, with the following formatting requirements:
  - DATA: Data matrix with columns specifying data points (eg. samples for inter-sample graphs or genes for co-expression graphs) and rows specifying measured features. The first column should contain feature names and the first row should contain data-point names. 
  - METADATA: The first column should contain the data-point names identical to the colum names of DATA. The order doesn't need to be identical, as TDAview will match the column names of DATA with the first column in METADATA. However, the number of datapoints should be the same in DATA and METADATA. 
  - MAPPER object: If using TDAview only for visulisation, a MAPPER object can be generated with the TDAmapper R package, and exported as a .json file using the write_json function in the jsonlite R library. This .jason file can then be uploaded in TDAview. Note that the DATA and METADATA files need to be imported even if the MAPPER object is upoaded, for the visualisation component of TDAview.
Example datasets are available in the EXAMPLES folder, and can also be loaded from TDAview's drop-down menu.

#
TDAview implements TDAmapper, which requires the following parameters for generating the graph. Further details explaining these parameters are available in the TDAview publication (Walsh et al. Bioinformatics 2020) and TDAmapper documentation:https://cran.r-project.org/web/packages/TDAmapper/index.html
- Filter dimensions: Mapper1D or Mapper2D
- Number of intervals
- Percent overlap
- Number of bins when clustering

#

### Read the wiki https://github.com/walshkieran/tdaview/wiki for further details on:
#### - (1) Example datasets
#### - (2) Formatting nodes and edges 
###3 - (3) Saving the data

![alt-text](https://raw.githubusercontent.com/WalshKieran/tdaview/master/resources/images/example.png "RNA-Seq Differentiation Example")

