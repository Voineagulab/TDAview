#' <TDAView>
#'
#' <Displays topological data as graph from TDAMapper or pHom>
#'
#' @import htmlwidgets htmltools shiny
#'
#' @export
tdaview <- function(mapper, data = NULL, width = NULL, height = NULL, elementId = NULL) {
  # create widget
  htmlwidgets::createWidget(
    name = 'tdaview',
    x = list(mapper = mapper, data = data),
    width = width,
    height = height,
    package = 'tdaview',
    elementId = elementId
  )
}

#' Shiny bindings for tdaview
#'
#' Output and render functions for using tdaview within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a tdaview
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name tdaview-shiny
#'
#' @export
tdaviewOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'tdaview', width, height, package = 'tdaview')
}

#' @rdname tdaview-shiny
#' @export
renderTdaview <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, tdaviewOutput, env, quoted = TRUE)
}

tdaview_html <- function(id, style, class, ...){
  # Define UI for application that draws a histogram
  fluidPage(

    # App title ----
    titlePanel("TDAView"),

    # Sidebar layout with input and output definitions ----
    sidebarLayout(

      # Sidebar panel for inputs ----
      sidebarPanel(id = "sidebar-controls",

        # adding the new div tag to the sidebar            
        tags$div(class="header", checked=NA,
                tags$p("Select the metadata variable by which you want the graph coloured."),
                tags$a(href="shiny.rstudio.com/tutorial", "")
        )
      ),

      # Main panel for displaying outputs ----
      mainPanel(
        # adding the new div tag to the sidebar            
        tags$div(class=class, id=id, style=style)
      )
    )
  )
}
