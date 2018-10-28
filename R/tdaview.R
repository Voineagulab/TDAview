#' <TDAView>
#'
#' <Displays topological data as graph from TDAMapper or pHom>
#'
#' @import htmlwidgets htmltools shiny
#' @param mapper data frame containing adjacency matrix and vertices, formatted to match TDAMapper output
#' @param metadata single list of ordered categorical variables as strings
#' @param labels single list of ordered node labels as strings
#' @export
tdaview <- function(mapper, metadata, labels, width = NULL, height = NULL, elementId = NULL) {
  # create widget
  htmlwidgets::createWidget(
    name = 'tdaview',
    x = list(mapper = mapper, metadata = metadata, labels = labels),
    width = width,
    height = height,
    package = 'tdaview',
    elementId = elementId,
    sizingPolicy = htmlwidgets::sizingPolicy(
      browser.padding = 0,
      viewer.padding = 0,
      browser.fill = TRUE,
      viewer.fill = TRUE
    )
  )
}

#' Shiny bindings for tdaview
#'
#' Output and render functions for using tdaview within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit
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