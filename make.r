# Set working directory

# Install necessary packages
install.packages("htmlwidgets")
install.packages("devtools")

# Display graph in browser (OPTIONAL)
options(viewer = NULL)

# Build library
devtools::install()
library(tdaview)

# TEST DATA
devtools::install_github("paultpearson/TDAmapper")
library(TDAmapper)
First.Example.data = data.frame( x=2*cos(0.5*(1:100)), y=sin(1:100) )
First.Example.dist = dist(First.Example.data)
First.Example.mapper <- mapper(dist_object = First.Example.dist,
                               filter_values = First.Example.data$x,
                               num_intervals = 6,
                               percent_overlap = 50,
                               num_bins_when_clustering = 10)
MapperNodes <- mapperVertices(First.Example.mapper, 1:100 )
MapperLinks <- mapperEdges(First.Example.mapper)

tdaview(First.Example.mapper, First.Example.data)
