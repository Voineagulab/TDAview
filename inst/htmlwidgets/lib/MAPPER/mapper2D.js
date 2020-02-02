// mapper2D function
//
// This function uses a filter function f: X -> R^2 on a data set X that has n rows (observations) and k columns (variables).
//
// @param distance_matrix an n x n matrix of pairwise dissimilarities
// @param filter_values a list of two length n vector of real numbers
// @param num_intervals a vector of two positive integers
// @param percent_overlap a number between 0 and 100 specifying how much adjacent intervals should overlap
// @param num_bins_when_clustering a positive integer that controls whether points in the same level set end up in the same cluster
//
// @return An object of class \code{TDAmapper} which is a list of items named \code{adjacency} (adjacency matrix for the edges), \code{num_vertices} (integer number of vertices), \code{level_of_vertex} (vector with \code{level_of_vertex[i]} = index of the level set for vertex i), \code{points_in_vertex} (list with \code{points_in_vertex[[i]]} = vector of indices of points in vertex i), \code{points_in_level} (list with \code{points_in_level[[i]]} = vector of indices of points in level set i, and \code{vertices_in_level} (list with \code{vertices_in_level[[i]]} = vector of indices of vertices in level set i.
//
// @author Paul Pearson, \email{pearsonp@@hope.edu}
// @references \url{https://github.com/paultpearson/TDAmapper}
// @seealso \code{\link{mapper1D}}
// @keywords mapper2D
//
// @examples
// m2 <- mapper2D(
//        distance_matrix = dist(data.frame( x=2*cos(1:100), y=sin(1:100) )),
//        filter_values = list( 2*cos(1:100), sin(1:100) ),
//        num_intervals = c(5,5),
//        percent_overlap = 50,
//        num_bins_when_clustering = 10)
// \dontrun{
// library(igraph)
// g2 <- graph.adjacency(m2$adjacency, mode="undirected")
// plot(g2, layout = layout.auto(g2) )
// }
// @export
//

//Notes: ML.HClust.agnes requires conversion of the matrix to 2D array and back every time

function mapper2D(distance_matrix, filter_values, num_intervals=[10, 10], percent_overlap=50, num_bins_when_clustering=10) {
// initialize variables
    let vertex_index = 0;

    // indexed from 1 to the number of vertices
    let level_of_vertex = [];
    let points_in_vertex = [];

    // indexed from 1 to the number of levels
    let points_in_level = [];
    let vertices_in_level = [];

    let filter_min_1 = Math.min(...filter_values[0]);
    let filter_max_1 = Math.max(...filter_values[0]);
    let filter_min_2 = Math.min(...filter_values[1]);
    let filter_max_2 = Math.max(...filter_values[1]);
    let interval_length_1 = (filter_max_1 - filter_min_1) / (num_intervals[0] - (num_intervals[0]-1) * percent_overlap/100.0 );
    let interval_length_2 = (filter_max_2 - filter_min_2) / (num_intervals[1] - (num_intervals[1]-1) * percent_overlap/100.0 );
    let step_size_1 = interval_length_1 * (1 - percent_overlap/100.0);
    let step_size_2 = interval_length_2 * (1 - percent_overlap/100.0);

    let num_levels = num_intervals[0] * num_intervals[1];

    //rep(1:num_intervals[1], num_intervals[2])
    let level_indices_1 = new Array(num_levels);
    for(let i=0, k=0; i<num_intervals[1]; ++i, k+=num_intervals[0]) {
        for(let j=0; j<=num_intervals[0]; ++j) {
            level_indices_1[k + j] = j + 1;
        }
    }

    //rep(1:num_intervals[2], each=num_intervals[1])
    let level_indices_2 = new Array(num_levels);
    for(let i=0, k=0; i<num_intervals[1]; ++i, k+=num_intervals[0]) {
        for(let j=0; j<num_intervals[0]; ++j) {
            level_indices_2[k + j] = i + 1;
        }
    }

    // begin mapper main loop
    for(let level=0; level<num_levels; ++level) {
        let level_1 = level_indices_1[level];
        let level_2 = level_indices_2[level];

        let min_value_in_level_1 = filter_min_1 + level_1 * step_size_1;
        let min_value_in_level_2 = filter_min_2 + level_2 * step_size_2;
        let max_value_in_level_1 = min_value_in_level_1 + interval_length_1;
        let max_value_in_level_2 = min_value_in_level_2 + interval_length_2;

        // create a logical vector of indices
        let points_in_level_logical = filter_values[0].map((v, i) => (min_value_in_level_1 <= v) && (v <= max_value_in_level_1) && (min_value_in_level_2 <= filter_values[1][i]) && (filter_values[1][i] <= max_value_in_level_2));
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
    
    for(let i=1; i<num_intervals[0]; ++i) { //for all adjacent intervals
        for(let j=1; j<num_intervals[1]; ++j) {

            let k1 = vertices_in_level.filter((value, index) => level_indices_1[index] == i && level_indices_2[index] == j);
            let k2 = vertices_in_level.filter((value, index) => level_indices_1[index] == i && level_indices_2[index] == j-1);

            if(k1.length && k1[0].length && k2.length && k2[0].length) {
                for(let v1Array of k1) {
                    for(let v1 of v1Array) {
                        for(let v2Array of k2) {
                            for(v2 of v2Array) {
                                if(v2 <= v1 && points_in_vertex[v1].some(val=> points_in_vertex[v2].includes(val))) { //add symmetric edge if any points intersect
                                    adja[v1][v2] = adja[v2][v1] = 1;
                                }
                            }
                        }
                    }
                }
            }
        }
    } // end part 1 of constructing adjacency matrix

    
    for(let j=1; j<num_intervals[1]; ++j) { //for all adjacent intervals
        for(let i=1; i<num_intervals[0]; ++i) {

            let k1 = vertices_in_level.filter((value, index) => level_indices_1[index] == i && level_indices_2[index] == j);
            let k2 = vertices_in_level.filter((value, index) => level_indices_1[index] == i-1 && level_indices_2[index] == j);

            if(k1.length && k1[0].length && k2.length && k2[0].length) {
                for(let v1Array of k1) {
                    for(let v1 of v1Array) {
                        for(let v2Array of k2) {
                            for(v2 of v2Array) {
                                if(v2 <= v1 && points_in_vertex[v1].some(val=> points_in_vertex[v2].includes(val))) { //add symmetric edge if any points intersect
                                    adja[v1][v2] = adja[v2][v1] = 1;
                                }
                            }
                        }
                    }
                }
            }
        }
    } // end part 2 of constructing adjacency matrix
    

  return {
      adjacency: adja,
      num_vertices: vertex_index,
      level_of_vertex: level_of_vertex,
      points_in_vertex: points_in_vertex,
      points_in_level: points_in_level,
      vertices_in_level: vertices_in_level,
  }
} // end mapper1D function