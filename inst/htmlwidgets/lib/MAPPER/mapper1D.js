// mapper1D function
//
// This function uses a filter function f: X -> R on a data set X that has n rows (observations) and k columns (variables).
//
// @param distance_matrix An n x n matrix of pairwise dissimilarities.
// @param filter_values A length n vector of real numbers.
// @param num_intervals A positive integer.
// @param percent_overlap A number between 0 and 100 specifying how much adjacent intervals should overlap.
// @param num_bins_when_clustering A positive integer that controls whether points in the same level set end up in the same cluster.
//
// @return An object of class \code{TDAmapper} which is a list of items named \code{adjacency} (adjacency matrix for the edges), \code{num_vertices} (integer number of vertices), \code{level_of_vertex} (vector with \code{level_of_vertex[i]} = index of the level set for vertex i), \code{points_in_vertex} (list with \code{points_in_vertex[[i]]} = vector of indices of points in vertex i), \code{points_in_level} (list with \code{points_in_level[[i]]} = vector of indices of points in level set i, and \code{vertices_in_level} (list with \code{vertices_in_level[[i]]} = vector of indices of vertices in level set i.
//
// @author Paul Pearson, \email{pearsonp@@hope.edu}
// @references \url{https://github.com/paultpearson/TDAmapper}
// @seealso \code{\link{mapper2D}}
// @keywords mapper1D
//
// @examples
// m1 <- mapper1D(
//        distance_matrix = dist(data.frame( x=2*cos(0.5*(1:100)), y=sin(1:100) )),
//        filter_values = 2*cos(0.5*(1:100)),
//        num_intervals = 10,
//        percent_overlap = 50,
//        num_bins_when_clustering = 10)
// \dontrun{
// //install.packages("igraph") 
// library(igraph)
// g1 <- graph.adjacency(m1$adjacency, mode="undirected")
// plot(g1, layout = layout.auto(g1) )
// }
// @export
//

//Notes: ML.HClust.agnes requires conversion of the matrix to 2D array and back every time

function mapper1D(distance_matrix, filter_values, num_intervals=10, percent_overlap=50, num_bins_when_clustering=10) {
// initialize variables
    let vertex_index = 0;

    // indexed from 1 to the number of vertices
    let level_of_vertex = [];
    let points_in_vertex = [];

    // indexed from 1 to the number of levels
    let points_in_level = [];
    let vertices_in_level = [];

    let filter_min = Math.min(...filter_values);
    let filter_max = Math.max(...filter_values);
    let interval_length = (filter_max - filter_min) / (num_intervals - (num_intervals-1) * percent_overlap/100.0 );
    let step_size = interval_length * (1 - percent_overlap/100.0);

    // begin mapper main loop
    for(let level=0; level<num_intervals; ++level) {
        let min_value_in_level = filter_min + level * step_size;
        let max_value_in_level = min_value_in_level + interval_length;

        // create a logical vector of indices
        let points_in_level_logical = filter_values.map(v => (min_value_in_level <= v) && (v <= max_value_in_level));
        let num_points_in_level = points_in_level_logical.reduce((count, v) => count + (v==true), 0);
        let points_in_level_current = points_in_level_logical.map((v, index) => index).filter(i => (points_in_level_logical[i]==true));
        points_in_level.push(points_in_level_current);

        if (num_points_in_level == 0) {
            console.log('Level set is empty');
            vertices_in_level.push([]);
        } else if (num_points_in_level == 1) {
            console.log('Level set has only one point')
            points_in_vertex.push(points_in_level_current);
            vertices_in_level.push([vertex_index]);
            level_of_vertex.push(level);
            vertex_index += 1;
        } else {
            let level_distance_matrix = new ML.MatrixLib.MatrixSelectionView(distance_matrix, points_in_level_current, points_in_level_current);
            let level_max_distance = level_distance_matrix.max();;

            let level_hcluster_output = new ML.HClust.agnes(level_distance_matrix.to2DArray(), {method: "single", isDistanceMatrix: true});

            //Determine cutoff
            let heights = [];
            level_hcluster_output.traverse((cluster) => {
                if (!cluster.isLeaf) {
                    heights.push(cluster.height);
                }
            });

            let cutoff = cluster_cutoff_at_first_empty_bin(heights, level_max_distance, num_bins_when_clustering);

            //Apply cut 
            let cut_result = level_hcluster_output.cut(cutoff);
            let num_vertices_in_level = cut_result.length;

            for(let i=0; i<num_vertices_in_level; ++i) {
                points_in_vertex.push(cut_result[i].indices().map(i => points_in_level_current[i]+1).sort((a, b) => a - b)); //console.log(cut_result[0].indices()); //all in 1st group so R produces 1 1 1 1 ... 
            }

            let vertex_ids = new Array(num_vertices_in_level);
            for(let i=0; i<vertex_ids.length; ++i) {
                vertex_ids[i] = vertex_index + i;
            }
            vertices_in_level.push(vertex_ids);
            level_of_vertex = level_of_vertex.concat(new Array(num_vertices_in_level).fill(level));
            vertex_index += num_vertices_in_level;
        }
    } // end mapper main loop
  
    let num_vertices = vertex_index;

     // Create the adjacency matrix for the graph, starting with a matrix of zeros
    var adja = new Array(num_vertices);
    for(let i=0; i<num_vertices; ++i) {
        adja[i] = new Array(num_vertices).fill(0);
    }
    
    for(let i=1; i<num_intervals; ++i) { //for all adjacent intervals
        for(let l1=0; l1<vertices_in_level[i].length; ++l1)  {
            let v1 = vertices_in_level[i][l1];
            for(let l2=0; l2<vertices_in_level[i-1].length; ++l2)  {
                let v2 = vertices_in_level[i-1][l2];
                if(v2 <= v1 && points_in_vertex[v1].some(val=> points_in_vertex[v2].includes(val))) { //add symmetric edge if any points intersect
                    adja[v1][v2] = adja[v2][v1] = 1;
                }
            }
        }
    } // end constructing adjacency matrix

    
  return {
      adjacency: adja,
      num_vertices: vertex_index,
      level_of_vertex: level_of_vertex,
      points_in_vertex: points_in_vertex,
      points_in_level: points_in_level,
      vertices_in_level: vertices_in_level,
  }
} // end mapper1D function