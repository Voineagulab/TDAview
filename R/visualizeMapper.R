#' Launch graph tool with Mapper input
#'
#' Call this as an addin with required parameters to 
#'
#' @export

visualizeMapper <- function(mapper, metadata, labels = NULL, keys = NULL) {

    ui <- fillPage(
        suppressDependencies("bootstrap"),
        tdaview::tdaviewOutput('mygraph'),
    )

    server <- function(input, output, session) {
        context <- rstudioapi::getActiveDocumentContext()
        original <- context$contents

        if(keys) {
            #TODO: Match is not very robust, must have ALL entries with no duplicates
            #(Keyed metadata)       (keys)
            #gene_id3   MILD        gene_id1
            #gene_id1   SEVERE      gene_id3
            #gene_id7   SEVERE      gene_id7
            metadata[match(keys, metadata$keys),]
        }

        output$mygraph <- tdaview::rendertdaview(expr=tdaview::tdaview(mapper=mapper, metadata=metadata, labels=labels))
    }
    runGadget(ui, server, viewer = paneViewer(minHeight = 500))
}
