#' Launch graph tool with Mapper input
#'
#' Call this as an addin with required parameters to 
#'
#' @export

visualizeMapper <- function(mapper, metadata, labels = NULL) {

    ui <- fillPage(
        suppressDependencies("bootstrap"),
        tdaview::tdaviewOutput('mygraph'),
        downloadButton('downloadData','Save my file!')
    )

    server <- function(input, output, session) {
        context <- rstudioapi::getActiveDocumentContext()
        original <- context$contents

        output$mygraph <- tdaview::rendertdaview(expr=tdaview::tdaview(mapper=mapper, metadata=metadata, labels=labels))

        output$downloadData <- downloadHandler(
            filename = function() {
                paste("dataset-", Sys.Date(), ".pdf", sep="")
            },
            content = function(file) {
                pdf(file)
                #widgetframe::frameWidget(output$mygraph)
                dev.off();
            }
        )
    }
    runGadget(ui, server, viewer = paneViewer(minHeight = 500))
}