/*
LICENSE: GNU General Public License v3.0.
YEAR: 2020
COPYRIGHT HOLDER: Kieran Walsh

GNU General Public License v3.0. The mapper 1d, 2d and cutoff functions by
Kieran Walsh are direct JavaScript translations of Paul Pearson's R code versions -
the following was included in this R code.

    LICENSE: GNU General Public License v3.0.
    YEAR: 2015
    COPYRIGHT HOLDER: Paul Pearson

    GNU General Public License v3.0.  The mapper1D function by Paul
    Pearson is a cleaned-up, modified, and ported version of the Mapper 
    code by Daniel Muellner and Gurjeet Singh originally written for Matlab.
    What follows is the copyright notice included in the Matlab code written 
    by Muellner, based on code written by Singh.

        This is a cleaned-up and modified version of the Mapper code by
        Gurjeet Singh. It also corrects two bugs which are present in the
        original Mapper code.
        (c) 2010 Daniel Muellner, muellner@math.stanford.edu
        Copyright: As far as Daniel Muellner's contributions are concerned,
        this code is published under the GNU General Public License v3.0
        (see http://www.gnu.org/licenses/gpl.html). For scientific citations,
        please refer to my home page http://math.stanford.edu/~muellner. If
        you visit this page in the future, chances are high that you will find
        a Python library with improved, largely extended and freely
        distributable Mapper code there.
        Since the present code is based on Gurjeet Singh's original code,
        please also respect his copyright message.
        Below is the original copyright message:
        Mapper code -- (c) 2007-2009 Gurjeet Singh
        This code is provided as is, with no guarantees except that
        bugs are almost surely present.  Published reports of research
        using this code (or a modified version) should cite the
        article that describes the algorithm:
        G. Singh, F. Memoli, G. Carlsson (2007).  Topological Methods for
        the Analysis of High Dimensional Data Sets and 3D Object
        Recognition, Point Based Graphics 2007, Prague, September 2007.
        Comments and bug reports are welcome.  Email to
        gurjeet@stanford.edu.
        I would also appreciate hearing about how you used this code,
        improvements that you have made to it, or translations into other
        languages.
        You are free to modify, extend or distribute this code, as long
        as this copyright notice is included whole and unchanged.
*/

//TODO: ML.HClust.agnes requires conversion of the matrix to 2D array and back every time
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

        let min_value_in_level_1 = filter_min_1 + (level_1-1) * step_size_1;
        let min_value_in_level_2 = filter_min_2 + (level_2-1) * step_size_2;
        let max_value_in_level_1 = min_value_in_level_1 + interval_length_1;
        let max_value_in_level_2 = min_value_in_level_2 + interval_length_2;

        // create a logical vector of indices
        let points_in_level_logical = filter_values[0].map((v, i) => (min_value_in_level_1 <= v) && (v <= max_value_in_level_1) && (min_value_in_level_2 <= filter_values[1][i]) && (filter_values[1][i] <= max_value_in_level_2));
        let num_points_in_level = points_in_level_logical.reduce((count, v) => count + (v==true), 0);
        let points_in_level_current = points_in_level_logical.map((v, index) => index).filter(i => (points_in_level_logical[i]==true));
        points_in_level.push(points_in_level_current.map(p => p+1));

        /*
        precision comparison
        let temp = points_in_level[points_in_level.length-1];
        if(temp[0]==1&&temp[1]==3&&temp[2]==16&&temp[3]==17) { //3 should not be in this level
          console.log(min_value_in_level_1, min_value_in_level_2, max_value_in_level_1, max_value_in_level_2);
          console.log(filter_values[0][3-1], filter_values[1][3-1]);
          //console.log(level);
        }*/

        if (num_points_in_level == 0) {
            console.log('Level set is empty');
            vertices_in_level.push([-1]);
        } else if (num_points_in_level == 1) {
            console.log('Level set has only one point')
            points_in_vertex.push([points_in_level_current[0] + 1]);
            vertices_in_level.push([vertex_index + 1]);
            level_of_vertex.push(level+1);
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

            heights.sort((a, b) => a-b);

            let cutoff = cluster_cutoff_at_first_empty_bin(heights, level_max_distance, num_bins_when_clustering);

            let n = level_hcluster_output.size;

            let maxI = (n<=2) ? 0 : heights.length;
            for(let i=0; i<heights.length; ++i) {
                if(heights[i] > cutoff) {
                    maxI = i;
                    break;
                }
            }

            let k = n - maxI; // n + 1 - apply(outer(c(tree$height, Inf), h, ">"), 2, which.max)

            let group_result = level_hcluster_output.group(k)
            let num_vertices_in_level = group_result.children.length;

            let points_in_vertex_curr = [];
            for(let i=0; i<num_vertices_in_level; ++i) {
                points_in_vertex_curr.push(group_result.children[i].indices().map(i => points_in_level_current[i]+1).sort((a, b) => a-b));
            }
            points_in_vertex_curr.sort((a, b) => !a.length || !b.length || a[0] - b[0]);
            points_in_vertex.push(...points_in_vertex_curr);

            let vertex_ids = new Array(num_vertices_in_level);
            for(let i=0; i<vertex_ids.length; ++i) {
                vertex_ids[i] = vertex_index + i + 1;
            }

            vertices_in_level.push(vertex_ids);
            level_of_vertex = level_of_vertex.concat(new Array(num_vertices_in_level).fill(level+1));
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

            for(let v1Array of k1) {
                if(v1Array[0] == -1) continue;
                for(let v1 of v1Array) {
                    v1 -= 1;
                    for(let v2Array of k2) {
                        if(v2Array[0] == -1) continue;
                        for(v2 of v2Array) {
                            v2 -= 1;
                            if(v2 <= v1 && points_in_vertex[v1].some(val=> points_in_vertex[v2].includes(val))) { //add symmetric edge if any points intersect
                                adja[v1][v2] = adja[v2][v1] = 1;
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

            for(let v1Array of k1) {
                if(v1Array[0] == -1) continue;
                for(let v1 of v1Array) {
                    v1 -= 1;
                    for(let v2Array of k2) {
                        if(v2Array[0] == -1) continue;
                        for(v2 of v2Array) {
                            v2 -= 1;
                            if(v2 <= v1 && points_in_vertex[v1].some(val=> points_in_vertex[v2].includes(val))) { //add symmetric edge if any points intersect
                                adja[v1][v2] = adja[v2][v1] = 1;
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
