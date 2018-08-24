#' <Add Title>
#'
#' <Add Description>
#'
#' @import htmlwidgets
#'
#' @export
tdaview <- function(mapper , width = NULL, height = NULL, elementId = NULL) {
  # create widget
  htmlwidgets::createWidget(
    name = 'tdaview',
    x = list(nodes = tbl_df_strip(mapperVertices(mapper, 1:100)), links = tbl_df_strip(mapperEdges(mapper))),
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

tbl_df_strip <- function(x) {
    if('tbl_df' %in% class(x)) {
        message(paste(deparse(substitute(x)),
                      'is a tbl_df. Converting to a plain data frame.'))
        x <- base::as.data.frame(x)
    }
    return(x)
}
