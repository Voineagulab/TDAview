// cluster_cutoff_at_first_empty_bin function
// 
// This function decides where to cut the hierarchical clustering tree to define clusters within a level set.
//
// @param heights Height values in hierarchical clustering.
// @param diam Maximum distance between points in a level set.
// @param num_bins_when_clustering Controls how many bins there are in the histogram used to determine cutoff. values
// 
// @return Numerical value for cutoff point of hierarchical cluster diagram.
//
// @author Paul Pearson, \email{pearsonp@@hope.edu}
// @references \url{https://github.com/paultpearson/TDAmapper}
// @seealso \code{\link{mapper1D}}, \code{\link{mapper2D}}
//

function cluster_cutoff_at_first_empty_bin(heights, diam, num_bins_when_clustering) {
    //if there are only two points (one height value), then we have a single cluster
    if (heights.length == 1) {
        if (heights == diam) {
            return Infinity;
        }
    }

    //Determine bin breaks
    
    let bins_start = Math.min(...heights);
    let bins_end = diam;
    let bin_size = (bins_end - bins_start)/num_bins_when_clustering;

    let bin_breaks = new Array(num_bins_when_clustering+1);
    for(let i=0, j=bins_start; i<num_bins_when_clustering+1; i++, j+=bin_size) {
        bin_breaks[i] = j;
    }

    //Initiallize bins
    let bins = new Array(num_bins_when_clustering).fill(0);

    //Populate bins (could be improved using binary search - also heights could be non-decreasing)
    for(let i=0; i<heights.length; i++) {
        for(let j=1; j<bin_breaks.length; j++) {
            if(heights[i] <= bin_breaks[j]) {
                bins[j-1]++;
                break;
            }
        }
    }

    //Get first empty bin (last is excluded - in original code this is done by including diam in heights)
    for(let i=0; i<bins.length-1; i++) {
        if(bins[i] == 0) {
            let val = (bin_breaks[i] + bin_breaks[i+1]) / 2.0;
            return val;
        }
    }
    return Infinity;
}