#' Launch graph tool with Mapper input
#'
#' Call this as an addin with required parameters to 
#' @import shiny
#' @param mapper data frame containing adjacency matrix and vertices, formatted to match TDAMapper output
#' @param metadata single list of ordered categorical variables as strings
#' @param keys single list of ordered row names as strings from original data
#' @param labels single list of ordered node labels as strings
#' @export

visualizeMapper <- function(mapper, metadata, keys, labels = NULL) {

    ui <- fillPage(
        suppressDependencies("bootstrap"),
        tdaview::tdaviewOutput('mygraph')
    )

    server <- function(input, output, session) {
        context <- rstudioapi::getActiveDocumentContext()
        original <- context$contents

        #if(keys) {
            #TODO: Match is not very robust, must have ALL entries with no duplicates
            #(Keyed metadata)       (keys)
            #gene_id3   MILD        gene_id1
            #gene_id1   SEVERE      gene_id3
            #gene_id7   SEVERE      gene_id7
            #metadata[match(keys, metadata$keys),]
        #}

        output$mygraph <- tdaview::rendertdaview(expr=tdaview::tdaview(mapper=mapper, metadata=metadata, labels=labels))

        observeEvent(input$NamesFromJs, {
            names <- keys[input$NamesFromJs]
            session$sendCustomMessage("NamesToJs", names)
        })
    }
    runGadget(ui, server, viewer = paneViewer(minHeight = 500))
}
