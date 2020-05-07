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

### Read the wiki for details on (1) 

## Importing data and generating the graph
TDAview requires as input files the DATA and METADATA in .CSV format, with the following formatting requirements:
  - DATA: Data matrix with columns specifying data points (eg. samples for inter-sample graphs or genes for co-expression graphs) and rows specifying measured features. The first column should contain feature names and the first row should contain data-point names. 
  - METADATA: The first column should contain the data-point names identical to the colum names of DATA. The order doesn't need to be identical, as TDAview will match the column names of DATA with the first column in METADATA. However, the number of datapoints should be the same in DATA and METADATA. 
  - MAPPER object: If using TDAview only for visulalsation, a MAPPER object can be generated with the TDAmapper R package, and exported as a .json file using the jsonlite library:
    library(jsonlite)
    write_json(mapper_object, outfile_path, force=TRUE)

1. Importing a 
The mapper algorithm can be run in browser or an existing mapper object can be loaded from a previous tdaview or R session. All workflows require the original data and metadata CSV files in order to match sample names, since the metadata row names may be an unordered subset of the original data column names. Points within the mapper object refer to row names within this data file.

Both CSV files should be:

Rectangular
Include both column and row names
See the example files for further clarification.

Alternatively, examples can be selected from the dropdown to overwrite all file fields. Example files may be large, but are cached after the first graph generation. Raw files can be found in /Resources/Data/.

(2) Mapper algorithm parameters (3) Formatting nodes and edges and (4) Saving the data. 
https://github.com/walshkieran/tdaview/wiki

![alt-text](https://raw.githubusercontent.com/WalshKieran/tdaview/master/resources/images/example.png "RNA-Seq Differentiation Example")

