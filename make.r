# Install necessary packages (also call library)
install.packages("htmlwidgets")
install.packages("devtools")
install.packages("shiny")
library(shiny)

# Display graph in browser (OPTIONAL)
options(viewer = NULL)

devtools::install_github("paultpearson/TDAmapper")
library(TDAmapper)

#Example trig data
First.Example.data = data.frame( x=2*cos(0.5*(1:100)), y=sin(1:100) )
First.Example.dist = dist(First.Example.data)
First.Example.mapper <- mapper(dist_object = First.Example.dist,
                               filter_values = First.Example.data$x,
                               num_intervals = 6,
                               percent_overlap = 50,
                               num_bins_when_clustering = 10)
devtools::install()
tdaview(First.Example.mapper, First.Example.data, data.frame(z=tan(1:100)))

#Custom autism data
read.tcsv = function(file, header=TRUE, sep=",", ...) {
  n = max(count.fields(file, sep=sep), na.rm=TRUE)
  x = readLines(file)

  .splitvar = function(x, sep, n) {
    var = unlist(strsplit(x, split=sep))
    length(var) = n
    return(var)
  }

  x = do.call(cbind, lapply(x, .splitvar, sep=sep, n=n))
  x = apply(x, 1, paste, collapse=sep)
  out = read.csv(text=x, sep=sep, header=header, ...)
  return(out)

}
Autism.data = read.tcsv("data_norm.csv")
Autism.numeric = Autism.data[, 2:ncol(Autism.data)]
Autism.dist <- dist(Autism.numeric)

library(TDAmapper)
Autism.mapper <- mapper(dist_object = Autism.dist,
                        filter_values = Autism.numeric[,1],
                        num_intervals = 10,
                        percent_overlap = 50,
                        num_bins_when_clustering = 10)

#Build library each update
devtools::install()
library(tdaview) #only required once
tdaview(Autism.mapper, Autism.numeric, Autism.data[, 1], sprintf("Node [%s]",seq(1:Autism.mapper$num_vertices)))

#Save
library(htmlwidgets)
saveWidget(tdaview(First.Example.mapper, First.Example.data), file="tdaview.html", selfcontained = TRUE)


