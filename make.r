#1. Set working directory to source file location
#2. (Optional) if browser wanted for this session
options("viewer"=NULL)

#3. Rebuild each time (should automatically call devtools::build())
devtools::install()
library(tdaview)

#4. Run
tdaview("hello, world")
